import type { NewPhoto } from '@/domain/types';

export const FULL_MAX = 1600;
export const THUMB_MAX = 512;

/** Scales (w, h) down to fit inside a max×max box, never up. */
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

let webpSupport: boolean | undefined;
function supportsWebp(): boolean {
  if (webpSupport === undefined) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpSupport;
}

function encode(bitmap: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  const type = supportsWebp() ? 'image/webp' : 'image/jpeg';
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
      type,
      quality,
    ),
  );
}

/**
 * Turns a camera/gallery file into the two stored sizes. Phone photos are 3–12 MB, so we never
 * store the original: a 1600px version is plenty for the detail view and the share card.
 */
export async function processImageFile(file: Blob): Promise<NewPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const [full, thumb] = await Promise.all([
      encode(bitmap, FULL_MAX, 0.85),
      encode(bitmap, THUMB_MAX, 0.8),
    ]);
    const size = fitWithin(bitmap.width, bitmap.height, FULL_MAX);
    return { full, thumb, width: size.width, height: size.height };
  } finally {
    bitmap.close();
  }
}
