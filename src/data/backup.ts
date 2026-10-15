import { strFromU8, strToU8, unzip, zip, type Unzipped } from 'fflate';
import type { Item, Outfit, Photo } from '@/domain/types';
import type { WardrobeRepository, WardrobeSnapshot } from './WardrobeRepository';

/**
 * Backup file: a zip with `shred360.json` (items, outfits, photo metadata) plus each photo's
 * full and thumbnail images as separate files. Readable by other tools and safe to re-import.
 */

const MANIFEST = 'shred360.json';
export const BACKUP_FORMAT = 'shred360-backup';
export const BACKUP_VERSION = 1;

interface PhotoEntry {
  id: string;
  width: number;
  height: number;
  createdAt: number;
  full: { path: string; type: string };
  thumb: { path: string; type: string };
}

interface Manifest {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  items: Item[];
  outfits: Outfit[];
  photos: PhotoEntry[];
}

export class BackupError extends Error {}

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function zipAsync(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    // Images are already compressed; only the JSON benefits from deflate.
    zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))),
  );
}

function unzipAsync(data: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) =>
    unzip(data, (err, files) => (err ? reject(err) : resolve(files))),
  );
}

export async function snapshotToZip(snapshot: WardrobeSnapshot): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const photos: PhotoEntry[] = [];
  for (const photo of snapshot.photos) {
    const fullType = photo.full.type || 'image/jpeg';
    const thumbType = photo.thumb.type || 'image/jpeg';
    const fullPath = `photos/${photo.id}.${EXT[fullType] ?? 'bin'}`;
    const thumbPath = `photos/${photo.id}.thumb.${EXT[thumbType] ?? 'bin'}`;
    files[fullPath] = new Uint8Array(await photo.full.arrayBuffer());
    files[thumbPath] = new Uint8Array(await photo.thumb.arrayBuffer());
    photos.push({
      id: photo.id,
      width: photo.width,
      height: photo.height,
      createdAt: photo.createdAt,
      full: { path: fullPath, type: fullType },
      thumb: { path: thumbPath, type: thumbType },
    });
  }
  const manifest: Manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: snapshot.exportedAt,
    items: snapshot.items,
    outfits: snapshot.outfits,
    photos,
  };
  files[MANIFEST] = strToU8(JSON.stringify(manifest, null, 2));
  const data = await zipAsync(files);
  return new Blob([data as BlobPart], { type: 'application/zip' });
}

export async function zipToSnapshot(file: Blob): Promise<WardrobeSnapshot> {
  let files: Unzipped;
  try {
    files = await unzipAsync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new BackupError('That file is not a Shred360 backup (not a zip).');
  }
  const manifestBytes = files[MANIFEST];
  if (!manifestBytes) throw new BackupError('That zip is not a Shred360 backup.');
  let manifest: Manifest;
  try {
    manifest = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new BackupError('The backup manifest is damaged.');
  }
  if (manifest.format !== BACKUP_FORMAT)
    throw new BackupError('That zip is not a Shred360 backup.');
  if (manifest.version !== BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of Shred360.');
  }
  if (
    !Array.isArray(manifest.items) ||
    !Array.isArray(manifest.outfits) ||
    !Array.isArray(manifest.photos)
  ) {
    throw new BackupError('The backup manifest is incomplete.');
  }
  const photos: Photo[] = manifest.photos.map((p) => {
    const full = files[p.full.path];
    const thumb = files[p.thumb.path];
    if (!full || !thumb) throw new BackupError(`Photo ${p.id} is missing from the backup.`);
    return {
      id: p.id,
      width: p.width,
      height: p.height,
      createdAt: p.createdAt,
      full: new Blob([full as BlobPart], { type: p.full.type }),
      thumb: new Blob([thumb as BlobPart], { type: p.thumb.type }),
    };
  });
  return {
    version: 1,
    exportedAt: manifest.exportedAt,
    items: manifest.items,
    outfits: manifest.outfits,
    photos,
  };
}

export async function exportBackup(repo: WardrobeRepository): Promise<Blob> {
  return snapshotToZip(await repo.exportAll());
}

export async function importBackup(
  repo: WardrobeRepository,
  file: Blob,
  mode: 'merge' | 'replace',
): Promise<{ items: number; outfits: number; photos: number }> {
  const snapshot = await zipToSnapshot(file);
  await repo.importAll(snapshot, mode);
  return {
    items: snapshot.items.length,
    outfits: snapshot.outfits.length,
    photos: snapshot.photos.length,
  };
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `shred360-wardrobe-${stamp}.zip`;
}
