import { useEffect, useMemo, useState } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three';

/**
 * Text and wood textures drawn on a 2D canvas. Drawing text ourselves avoids 3D text libraries
 * that fetch fonts from a CDN, so the locker works offline.
 */

export function useCanvasTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): Texture {
  // `draw` is usually an inline closure; `key` identifies what it draws.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    draw(ctx, width, height);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export function drawLabel(title: string, subtitle: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#fbf7f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b2232';
    ctx.font = `800 ${Math.round(h * 0.36)}px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(fitText(ctx, title, w * 0.92), w * 0.04, h * 0.36);
    ctx.fillStyle = '#5b6578';
    ctx.font = `600 ${Math.round(h * 0.24)}px ${FONT}`;
    ctx.fillText(fitText(ctx, subtitle, w * 0.92), w * 0.04, h * 0.75);
  };
}

export function drawSign(text: string, count: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5a3b26');
    g.addColorStop(1, '#3d2718');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    for (let y = 8; y < h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 2);
      ctx.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + Math.cos(y) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe9c7';
    ctx.font = `900 ${Math.round(h * 0.46)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 170, 90, 0.8)';
    ctx.shadowBlur = 18;
    ctx.fillText(fitText(ctx, `${text.toUpperCase()}  ·  ${count}`, w * 0.9), w / 2, h / 2 + 2);
  };
}

export function drawPlanks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const colors = ['#7a5232', '#6d4829', '#845a37', '#734d2e', '#6a4527'];
  const plank = w / 8;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(i * plank, 0, plank, h);
    ctx.strokeStyle = 'rgba(30, 18, 10, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(i * plank, -2, plank, h + 4);
    ctx.strokeStyle = 'rgba(40, 24, 12, 0.25)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) {
      const x = i * plank + ((k + 1) * plank) / 8 + Math.sin(i * 3 + k) * 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.7, x + 3, h);
      ctx.stroke();
    }
    // Knots.
    ctx.fillStyle = 'rgba(45, 26, 14, 0.5)';
    ctx.beginPath();
    ctx.ellipse(i * plank + plank * 0.5, ((i * 97) % h) + 20, 6, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function repeatTexture(texture: Texture, x: number, y: number): Texture {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(x, y);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Loads a texture from an (object) URL and crops it to fill a square like CSS `object-fit:
 * cover`. Disposed when the URL changes or the component unmounts.
 */
export function useCoverTexture(url: string | undefined): Texture | null {
  const [entry, setEntry] = useState<{ url: string; texture: Texture } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let loaded: Texture | undefined;
    new TextureLoader().load(url, (texture) => {
      if (cancelled) {
        texture.dispose();
        return;
      }
      loaded = texture;
      texture.colorSpace = SRGBColorSpace;
      const image = texture.image as { width: number; height: number };
      const aspect = image.width / image.height;
      if (aspect > 1) {
        texture.repeat.set(1 / aspect, 1);
        texture.offset.set((1 - 1 / aspect) / 2, 0);
      } else {
        texture.repeat.set(1, aspect);
        texture.offset.set(0, (1 - aspect) / 2);
      }
      setEntry({ url, texture });
    });
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url]);
  return entry && entry.url === url ? entry.texture : null;
}
