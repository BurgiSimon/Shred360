// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createItem } from '@/domain/items';
import { createOutfit } from '@/domain/outfits';
import { newId } from '@/lib/id';
import { DexieRepository } from './DexieRepository';
import { ShredDb } from './db';

function photo() {
  return {
    full: new Blob(['full'], { type: 'image/webp' }),
    thumb: new Blob(['t'], { type: 'image/webp' }),
    width: 10,
    height: 10,
  };
}

describe('DexieRepository', () => {
  let repo: DexieRepository;

  beforeEach(() => {
    repo = new DexieRepository(new ShredDb(`test-${newId()}`));
  });

  it('saves, lists and gets items, newest first', async () => {
    const a = await repo.saveItem(createItem('helmet', { brand: 'A' }));
    await new Promise((r) => setTimeout(r, 2));
    const b = await repo.saveItem(createItem('goggles', { brand: 'B' }));
    expect((await repo.listItems()).map((i) => i.id)).toEqual([b.id, a.id]);
    expect((await repo.getItem(a.id))?.brand).toBe('A');
  });

  it('notifies subscribers on write and stops after unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = repo.subscribe(listener);
    await repo.saveItem(createItem('helmet', { brand: 'A' }));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await repo.saveItem(createItem('helmet', { brand: 'B' }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('deleting an item removes its photos and clears it from outfits', async () => {
    const p = await repo.addPhoto(photo());
    const jacket = await repo.saveItem(createItem('shellJacket', { brand: 'X', photoIds: [p.id] }));
    const helmet = await repo.saveItem(createItem('helmet', { brand: 'Y' }));
    const outfit = await repo.saveOutfit(
      createOutfit({ slots: { shellTop: jacket.id, head: helmet.id } }),
    );

    await repo.deleteItem(jacket.id);

    expect(await repo.getItem(jacket.id)).toBeUndefined();
    expect(await repo.getPhoto(p.id)).toBeUndefined();
    expect((await repo.getOutfit(outfit.id))?.slots).toEqual({ head: helmet.id });
  });

  it('stores photo blobs', async () => {
    const p = await repo.addPhoto(photo());
    const stored = await repo.getPhoto(p.id);
    expect(stored?.width).toBe(10);
    expect(await stored?.full.text()).toBe('full');
  });

  it('exports and re-imports everything (replace and merge)', async () => {
    const p = await repo.addPhoto(photo());
    const item = await repo.saveItem(createItem('gloves', { brand: 'Hestra', photoIds: [p.id] }));
    const outfit = await repo.saveOutfit(
      createOutfit({ name: 'Cold day', slots: { hands: item.id } }),
    );
    const snapshot = await repo.exportAll();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.photos).toHaveLength(1);

    const other = new DexieRepository(new ShredDb(`test-${newId()}`));
    const extra = await other.saveItem(createItem('beanie', { brand: 'Keep me' }));
    await other.importAll(snapshot, 'merge');
    expect((await other.listItems()).map((i) => i.id).sort()).toEqual([item.id, extra.id].sort());
    expect((await other.getOutfit(outfit.id))?.name).toBe('Cold day');

    await other.importAll(snapshot, 'replace');
    expect((await other.listItems()).map((i) => i.id)).toEqual([item.id]);
    expect(await (await other.getPhoto(p.id))?.thumb.text()).toBe('t');
  });
});
