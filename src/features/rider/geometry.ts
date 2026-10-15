import { BufferGeometry, LatheGeometry, Vector2 } from 'three';

/**
 * Shared, cached geometries for the rider. Everything is built from lathes so limbs and garments
 * are round, taper naturally, and a garment is just the same shape with a bigger radius.
 */
const cache = new Map<string, BufferGeometry>();

function cached(key: string, build: () => BufferGeometry): BufferGeometry {
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = build();
    cache.set(key, geometry);
  }
  return geometry;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Unit-length tapered capsule along +Y from y=0 (bottom, radius rBottom) to y=1 (top, rTop),
 * with rounded caps. Scale Y by the segment length when placing it — caps get stretched slightly,
 * which isn't noticeable at limb proportions. `capped=false` leaves the ends open (sleeves, cuffs).
 */
export function taperGeometry(
  rBottom: number,
  rTop: number,
  length: number,
  capped = true,
): BufferGeometry {
  const key = `taper:${round(rBottom)}:${round(rTop)}:${round(length)}:${capped}`;
  return cached(key, () => {
    const points: Vector2[] = [];
    const steps = 6;
    if (capped) {
      for (let i = 0; i <= steps; i++) {
        const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
        points.push(new Vector2(Math.max(1e-4, rBottom * Math.cos(a)), rBottom * Math.sin(a)));
      }
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * (Math.PI / 2);
        points.push(new Vector2(Math.max(1e-4, rTop * Math.cos(a)), length + rTop * Math.sin(a)));
      }
    } else {
      points.push(new Vector2(rBottom, 0), new Vector2(rTop, length));
    }
    // Normalise to unit length so the caller can scale by the actual joint distance.
    const geometry = new LatheGeometry(points, 20);
    geometry.scale(1, 1 / length, 1);
    return geometry;
  });
}

/** A lathe from an explicit (radius, y) profile, optionally restricted to a wedge of the circle. */
export function profileGeometry(
  key: string,
  profile: readonly (readonly [number, number])[],
  phiStart = 0,
  phiLength = Math.PI * 2,
  segments = 28,
): BufferGeometry {
  return cached(`profile:${key}:${round(phiStart)}:${round(phiLength)}:${segments}`, () => {
    const points = profile.map(([r, y]) => new Vector2(Math.max(1e-4, r), y));
    return new LatheGeometry(points, segments, phiStart, phiLength);
  });
}

/** Torso profile relative to the pelvis joint (y=0) up to the base of the neck. */
export const TORSO_PROFILE: readonly (readonly [number, number])[] = [
  [0.0, -0.07],
  [0.1, -0.065],
  [0.14, -0.02],
  [0.14, 0.08],
  [0.132, 0.18],
  [0.148, 0.28],
  [0.168, 0.37],
  [0.17, 0.43],
  [0.15, 0.49],
  [0.1, 0.525],
  [0.05, 0.54],
  [0.0, 0.545],
];

/** Front-to-back flattening of the torso. */
export const TORSO_DEPTH = 0.7;

/** The torso surface garments follow: the body profile without the crotch, extended down. */
const GARMENT_TORSO: readonly (readonly [number, number])[] = [
  [0.152, -0.3],
  [0.148, -0.06],
  [0.143, 0.08],
  ...TORSO_PROFILE.filter(([r, y]) => r > 0 && y >= 0.18),
];

function sampleTorso(y: number): number {
  for (let i = 1; i < GARMENT_TORSO.length; i++) {
    const [r0, y0] = GARMENT_TORSO[i - 1];
    const [r1, y1] = GARMENT_TORSO[i];
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return y < GARMENT_TORSO[0][1] ? GARMENT_TORSO[0][0] : GARMENT_TORSO[GARMENT_TORSO.length - 1][0];
}

/**
 * Torso profile grown by `offset`, cut to [bottom, top]. `flare` widens the hem (jackets),
 * `closeTop` caps the top towards the neck.
 */
export function torsoLayerProfile(
  offset: number,
  bottom: number,
  top: number,
  { flare = 0, closeTop = false }: { flare?: number; closeTop?: boolean } = {},
): [number, number][] {
  const inner = GARMENT_TORSO.filter(([, y]) => y > bottom && y < top);
  const points: [number, number][] = [
    [sampleTorso(bottom) + offset + flare, bottom],
    ...inner.map(([r, y]) => [r + offset, y] as [number, number]),
    [sampleTorso(top) + offset, top],
  ];
  if (closeTop) points.push([0, top + 0.012]);
  return points;
}
