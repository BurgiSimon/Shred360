import { describe, expect, it } from 'vitest';
import { colorName, contrastText, hexToRgb, rgbToHex } from './color';

describe('color utils', () => {
  it('round-trips hex and rgb', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0]);
    expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
    expect(rgbToHex([255, 128, 0])).toBe('#ff8000');
    expect(rgbToHex([300, -5, 12.6])).toBe('#ff000d');
  });

  it.each([
    ['#000000', 'black'],
    ['#ffffff', 'white'],
    ['#808080', 'grey'],
    ['#e53e3e', 'red'],
    ['#ff7a00', 'orange'],
    ['#f6e05e', 'yellow'],
    ['#38a169', 'green'],
    ['#14b8a6', 'teal'],
    ['#2b6cb0', 'blue'],
    ['#7c3aed', 'purple'],
    ['#ec4899', 'pink'],
    ['#6b4423', 'brown'],
    ['#d8c3a5', 'beige'],
  ])('names %s as %s', (hex, name) => {
    expect(colorName(hex)).toBe(name);
  });

  it('picks readable text colour', () => {
    expect(contrastText('#ffffff')).toBe('#000000');
    expect(contrastText('#0b1220')).toBe('#ffffff');
  });
});
