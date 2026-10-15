import { describe, expect, it } from 'vitest';
import { colorDistance, hexToRgb } from '@/lib/color';
import { extractPalette } from './colorExtract';

type Rgb = [number, number, number];

/** Builds an RGBA buffer by calling `paint(x, y)` for every pixel. */
function image(width: number, height: number, paint: (x: number, y: number) => Rgb | null) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = paint(x, y);
      const i = (y * width + x) * 4;
      if (px) {
        data.set(px, i);
        data[i + 3] = 255;
      }
    }
  }
  return data;
}

const near = (hex: string, rgb: Rgb) => colorDistance(hexToRgb(hex), rgb) < 25;

describe('extractPalette', () => {
  it('ignores a uniform background and finds the garment colours', () => {
    const W = 64;
    const H = 64;
    const white: Rgb = [245, 245, 245];
    const orange: Rgb = [255, 110, 30];
    const navy: Rgb = [20, 30, 90];
    // A white floor with an orange jacket body and navy sleeves in the middle.
    const data = image(W, H, (x, y) => {
      const inBody = x >= 22 && x < 42 && y >= 12 && y < 52;
      const inSleeves =
        (x >= 10 && x < 22 && y >= 14 && y < 40) || (x >= 42 && x < 54 && y >= 14 && y < 40);
      if (inBody) return orange;
      if (inSleeves) return navy;
      return white;
    });
    const palette = extractPalette(data, W, H, { count: 3 });
    expect(palette.length).toBeGreaterThanOrEqual(2);
    expect(near(palette[0].hex, orange)).toBe(true);
    expect(palette.some((p) => near(p.hex, navy))).toBe(true);
    expect(palette.some((p) => near(p.hex, white))).toBe(false);
  });

  it('keeps colours of a close-up with no clear background', () => {
    const red: Rgb = [200, 20, 30];
    const data = image(16, 16, () => red);
    const palette = extractPalette(data, 16, 16);
    expect(palette).toHaveLength(1);
    expect(near(palette[0].hex, red)).toBe(true);
    expect(palette[0].weight).toBeCloseTo(1);
  });

  it('treats transparent pixels as background', () => {
    const green: Rgb = [30, 160, 60];
    const data = image(20, 20, (x, y) => (x > 5 && x < 15 && y > 5 && y < 15 ? green : null));
    const palette = extractPalette(data, 20, 20);
    expect(palette).toHaveLength(1);
    expect(near(palette[0].hex, green)).toBe(true);
  });

  it('is deterministic', () => {
    const data = image(32, 32, (x, y) => [(x * 8) % 256, (y * 8) % 256, 120]);
    expect(extractPalette(data, 32, 32)).toEqual(extractPalette(data, 32, 32));
  });

  it('returns nothing for a fully transparent image', () => {
    expect(
      extractPalette(
        image(4, 4, () => null),
        4,
        4,
      ),
    ).toEqual([]);
  });
});
