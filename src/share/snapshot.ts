/**
 * Snapshot + share helpers. The 3D canvases render with preserveDrawingBuffer so the last frame
 * can be copied into a 2D canvas, where we add a small branded caption.
 */

export interface Caption {
  title: string;
  subtitle?: string;
}

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Draws the brand mark and caption over whatever is already on the 2D context. */
export function drawCaption(ctx: CanvasRenderingContext2D, w: number, h: number, caption: Caption) {
  const unit = Math.max(w, h) / 100;
  const g = ctx.createLinearGradient(0, h * 0.7, 0, h);
  g.addColorStop(0, 'rgba(6, 10, 19, 0)');
  g.addColorStop(1, 'rgba(6, 10, 19, 0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${unit * 4.2}px ${FONT}`;
  ctx.fillText(caption.title, unit * 3.5, h - unit * (caption.subtitle ? 7 : 4));
  if (caption.subtitle) {
    ctx.fillStyle = '#c6d0e4';
    ctx.font = `600 ${unit * 2.4}px ${FONT}`;
    ctx.fillText(caption.subtitle, unit * 3.5, h - unit * 3.4);
  }

  // Brand mark in a pill at the top right, clear of the caption on tall phone images.
  ctx.font = `900 ${unit * 2.6}px ${FONT}`;
  const brand = 'Shred';
  const brandW = ctx.measureText(brand).width;
  const total = brandW + ctx.measureText('360').width;
  const padX = unit * 1.6;
  const pillH = unit * 4.4;
  const x = w - unit * 3 - total - padX * 2;
  const y = unit * 3;
  ctx.fillStyle = 'rgba(6, 10, 19, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x, y, total + padX * 2, pillH, pillH / 2);
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(brand, x + padX, y + pillH / 2);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('360', x + padX + brandW, y + pillH / 2);
}

/** Copies the current frame of a WebGL canvas and adds the caption. */
export function composeFrame(
  source: HTMLCanvasElement,
  caption: Caption,
  maxSize = 2048,
): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  drawCaption(ctx, canvas.width, canvas.height, caption);
  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not encode image'))),
      type,
      quality,
    ),
  );
}

export async function snapshotCanvas(source: HTMLCanvasElement, caption: Caption): Promise<Blob> {
  return canvasToBlob(composeFrame(source, caption));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/** Opens the system share sheet with the file where supported (phones), else downloads it. */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  meta: { title: string; text?: string },
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: meta.title, text: meta.text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // Fall through to download (e.g. permission or size limits).
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

/** Shares a link via the share sheet, or copies it to the clipboard. */
export async function shareLink(
  url: string,
  meta: { title: string; text?: string },
): Promise<'shared' | 'copied' | 'cancelled'> {
  if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ url, title: meta.title, text: meta.text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  await copyText(url);
  return 'copied';
}

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers / insecure contexts: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'outfit'
  );
}
