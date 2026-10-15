// @vitest-environment node
import 'fake-indexeddb/auto';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createItem } from '@/domain/items';
import { createOutfit } from '@/domain/outfits';
import { newId } from '@/lib/id';
import { BackupError, backupFileName, exportBackup, importBackup, zipToSnapshot } from './backup';
import { DexieRepository } from './dexie/DexieRepository';
import { ShredDb } from './dexie/db';

const repo = () => new DexieRepository(new ShredDb(`backup-${newId()}`));

describe('backup', () => {
  it('round-trips items, outfits and photo bytes through a zip', async () => {
    const source = repo();
    const photo = await source.addPhoto({
      full: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/webp' }),
      thumb: new Blob([new Uint8Array([9, 8])], { type: 'image/jpeg' }),
      width: 1600,
      height: 1200,
    });
    const item = await source.saveItem(
      createItem('shellJacket', { brand: 'Burton', photoIds: [photo.id] }),
    );
    await source.saveOutfit(createOutfit({ name: 'Pow', slots: { shellTop: item.id } }));

    const zip = await exportBackup(source);
    expect(zip.type).toBe('application/zip');

    const target = repo();
    const counts = await importBackup(target, zip, 'replace');
    expect(counts).toEqual({ items: 1, outfits: 1, photos: 1 });
    const restored = await target.getPhoto(photo.id);
    expect(restored?.width).toBe(1600);
    expect(restored?.full.type).toBe('image/webp');
    expect([...new Uint8Array(await restored!.full.arrayBuffer())]).toEqual([1, 2, 3, 4]);
    expect([...new Uint8Array(await restored!.thumb.arrayBuffer())]).toEqual([9, 8]);
    expect((await target.getItem(item.id))?.brand).toBe('Burton');
    expect((await target.listOutfits())[0].name).toBe('Pow');
  });

  it('rejects files that are not backups', async () => {
    await expect(zipToSnapshot(new Blob(['hello']))).rejects.toThrow(BackupError);
    const otherZip = zipSync({ 'readme.txt': strToU8('hi') });
    await expect(zipToSnapshot(new Blob([otherZip as BlobPart]))).rejects.toThrow(
      /not a Shred360 backup/,
    );
    const future = zipSync({
      'shred360.json': strToU8(
        JSON.stringify({
          format: 'shred360-backup',
          version: 9,
          items: [],
          outfits: [],
          photos: [],
        }),
      ),
    });
    await expect(zipToSnapshot(new Blob([future as BlobPart]))).rejects.toThrow(/newer version/);
  });

  it('names files by date', () => {
    expect(backupFileName(new Date('2026-12-24T10:00:00Z'))).toBe(
      'shred360-wardrobe-2026-12-24.zip',
    );
  });
});
