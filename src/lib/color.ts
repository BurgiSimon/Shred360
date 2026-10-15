export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** HSL with h in [0, 360), s and l in [0, 1]. */
export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Black or white, whichever reads better on the given background. */
export function contrastText(hex: string): '#000000' | '#ffffff' {
  return relativeLuminance(hexToRgb(hex)) > 0.4 ? '#000000' : '#ffffff';
}

export function colorDistance(a: Rgb, b: Rgb): number {
  // "Redmean" weighted Euclidean distance: cheap and closer to perception than plain RGB.
  const rm = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

export type ColorName =
  | 'black'
  | 'white'
  | 'grey'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'beige';

/** Coarse colour family, used for "search by colour" in the wardrobe. */
export function colorName(hex: string): ColorName {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (l < 0.13) return 'black';
  if (l > 0.9 && s < 0.5) return 'white';
  if (s < 0.15) return l > 0.75 ? 'white' : l < 0.22 ? 'black' : 'grey';
  if (h >= 20 && h < 50 && l < 0.45) return 'brown';
  if (h >= 25 && h < 60 && s < 0.5 && l >= 0.6) return 'beige';
  if (h < 12 || h >= 345) return l > 0.7 ? 'pink' : 'red';
  if (h < 40) return 'orange';
  if (h < 68) return 'yellow';
  if (h < 160) return 'green';
  if (h < 195) return 'teal';
  if (h < 255) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}
