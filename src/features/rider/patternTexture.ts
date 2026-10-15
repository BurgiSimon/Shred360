import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { ItemColors, Pattern } from '@/domain/types';
import { hexToRgb, rgbToHex } from '@/lib/color';

/** Small deterministic PRNG so a garment's camo looks the same every time it's drawn. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => (amount < 0 ? v * (1 + amount) : v + (255 - v) * amount);
  return rgbToHex([f(r), f(g), f(b)]);
}

function drawCamo(
  ctx: CanvasRenderingContext2D,
  size: number,
  colors: ItemColors,
  rand: () => number,
) {
  const palette = [
    colors.secondary ?? shade(colors.primary, -0.35),
    colors.accent ?? shade(colors.primary, 0.3),
    shade(colors.primary, -0.18),
  ];
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = palette[i % palette.length];
    const cx = rand() * size;
    const cy = rand() * size;
    const r = size * (0.05 + rand() * 0.09);
    // Draw each blob at the wrapped positions too so the texture tiles seamlessly.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        ctx.beginPath();
        const points = 7;
        for (let p = 0; p <= points; p++) {
          const a = (p / points) * Math.PI * 2;
          const rr = r * (0.6 + rand() * 0.6);
          const x = cx + dx + Math.cos(a) * rr * 1.4;
          const y = cy + dy + Math.sin(a) * rr;
          if (p === 0) ctx.moveTo(x, y);
          else
            ctx.quadraticCurveTo(
              cx + dx + Math.cos(a - 0.4) * rr * 1.6,
              cy + dy + Math.sin(a - 0.4) * rr * 1.2,
              x,
              y,
            );
        }
        ctx.fill();
      }
    }
  }
}

function drawPrint(ctx: CanvasRenderingContext2D, size: number, colors: ItemColors) {
  const a = colors.secondary ?? shade(colors.primary, -0.4);
  const b = colors.accent ?? shade(colors.primary, 0.45);
  const step = size / 8;
  ctx.lineWidth = step * 0.35;
  for (let i = -8; i < 16; i++) {
    ctx.strokeStyle = i % 2 === 0 ? a : b;
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step + size, size);
    ctx.stroke();
  }
  ctx.fillStyle = b;
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      const cx = (x + 0.5) * (size / 4);
      const cy = (y + 0.5) * (size / 4);
      ctx.beginPath();
      ctx.moveTo(cx, cy - step * 0.6);
      ctx.lineTo(cx + step * 0.5, cy + step * 0.4);
      ctx.lineTo(cx - step * 0.5, cy + step * 0.4);
      ctx.fill();
    }
  }
}

/** A tiling texture for camo/print garments, or null for solid/colour-block ones. */
export function createPatternTexture(pattern: Pattern, colors: ItemColors): Texture | null {
  if (pattern !== 'camo' && pattern !== 'print') return null;
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(
    hashString(`${pattern}${colors.primary}${colors.secondary}${colors.accent}`),
  );
  if (pattern === 'camo') drawCamo(ctx, size, colors, rand);
  else drawPrint(ctx, size, colors);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  return texture;
}
