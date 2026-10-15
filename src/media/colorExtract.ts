import { colorDistance, rgbToHex, type Rgb } from '@/lib/color';

/**
 * Suggests the dominant garment colours in a photo.
 *
 * Gear photos are usually shot on a floor, bed or wall, so we estimate the background from the
 * image border and ignore pixels close to it before clustering. Clustering is a small k-means
 * with deterministic farthest-point seeding so the same photo always gives the same swatches.
 */
export interface PaletteOptions {
  /** Max colours returned. */
  count?: number;
  /** Distance below which a pixel is treated as background. */
  backgroundThreshold?: number;
  /** Clusters closer than this are merged. */
  mergeThreshold?: number;
}

export interface PaletteEntry {
  hex: string;
  /** Share of the non-background pixels in this cluster, 0..1. */
  weight: number;
}

const ITERATIONS = 12;

export function extractPalette(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: PaletteOptions = {},
): PaletteEntry[] {
  const { count = 3, backgroundThreshold = 60, mergeThreshold = 70 } = options;
  const pixels: Rgb[] = [];
  const border: Rgb[] = [];
  const edge = Math.max(1, Math.round(Math.min(width, height) * 0.06));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue; // transparent pixels are background by definition
      const px: Rgb = [data[i], data[i + 1], data[i + 2]];
      pixels.push(px);
      if (x < edge || y < edge || x >= width - edge || y >= height - edge) border.push(px);
    }
  }
  if (pixels.length === 0) return [];

  const background = dominantBorderColor(border);
  let foreground = background
    ? pixels.filter((p) => colorDistance(p, background) > backgroundThreshold)
    : pixels;
  // If "background" swallowed nearly everything the photo is probably a close-up of the fabric.
  if (foreground.length < pixels.length * 0.05) foreground = pixels;

  const k = Math.min(count + 2, foreground.length);
  const clusters = kMeans(foreground, k);
  const merged = mergeClose(clusters, mergeThreshold);
  const total = merged.reduce((sum, c) => sum + c.size, 0);
  return merged
    .sort((a, b) => b.size - a.size)
    .filter((c) => c.size / total >= 0.03)
    .slice(0, count)
    .map((c) => ({ hex: rgbToHex(c.center), weight: c.size / total }));
}

/** The border colour if one colour clearly dominates the border, else undefined. */
function dominantBorderColor(border: Rgb[]): Rgb | undefined {
  if (border.length === 0) return undefined;
  const [top] = mergeClose(kMeans(border, Math.min(3, border.length)), 50).sort(
    (a, b) => b.size - a.size,
  );
  return top && top.size / border.length >= 0.5 ? top.center : undefined;
}

interface Cluster {
  center: Rgb;
  size: number;
}

function kMeans(points: Rgb[], k: number): Cluster[] {
  if (k <= 0) return [];
  const centers: Rgb[] = [meanOf(points)];
  // Farthest-point seeding: deterministic and spreads seeds across distinct colours.
  while (centers.length < k) {
    let best = points[0];
    let bestDist = -1;
    for (const p of points) {
      let d = Infinity;
      for (const c of centers) d = Math.min(d, colorDistance(p, c));
      if (d > bestDist) {
        bestDist = d;
        best = p;
      }
    }
    if (bestDist <= 0) break;
    centers.push([...best] as Rgb);
  }

  const assignment = new Int32Array(points.length);
  for (let iter = 0; iter < ITERATIONS; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = colorDistance(points[i], centers[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best;
        changed = true;
      }
    }
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = sums[assignment[i]];
      s[0] += points[i][0];
      s[1] += points[i][1];
      s[2] += points[i][2];
      s[3] += 1;
    }
    sums.forEach((s, c) => {
      if (s[3] > 0) centers[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    });
    if (!changed && iter > 0) break;
  }

  const sizes = new Array<number>(centers.length).fill(0);
  for (let i = 0; i < points.length; i++) sizes[assignment[i]]++;
  return centers.map((center, c) => ({ center, size: sizes[c] })).filter((c) => c.size > 0);
}

function mergeClose(clusters: Cluster[], threshold: number): Cluster[] {
  const out: Cluster[] = [];
  for (const cluster of [...clusters].sort((a, b) => b.size - a.size)) {
    const target = out.find((o) => colorDistance(o.center, cluster.center) < threshold);
    if (!target) {
      out.push({ center: [...cluster.center] as Rgb, size: cluster.size });
      continue;
    }
    const total = target.size + cluster.size;
    target.center = [0, 1, 2].map(
      (j) => (target.center[j] * target.size + cluster.center[j] * cluster.size) / total,
    ) as Rgb;
    target.size = total;
  }
  return out;
}

function meanOf(points: Rgb[]): Rgb {
  const s = [0, 0, 0];
  for (const p of points) {
    s[0] += p[0];
    s[1] += p[1];
    s[2] += p[2];
  }
  return [s[0] / points.length, s[1] / points.length, s[2] / points.length];
}

/** Browser helper: downsample an image blob and extract its palette. */
export async function extractPaletteFromBlob(
  blob: Blob,
  options?: PaletteOptions,
): Promise<PaletteEntry[]> {
  const bitmap = await createImageBitmap(blob);
  const size = 64;
  const scale = size / Math.max(bitmap.width, bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is not available');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return extractPalette(ctx.getImageData(0, 0, w, h).data, w, h, options);
}
