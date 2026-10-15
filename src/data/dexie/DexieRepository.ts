import type { Item, NewPhoto, Outfit, Photo } from '@/domain/types';
import { newId } from '@/lib/id';
import type { ChangeListener, WardrobeRepository, WardrobeSnapshot } from '../WardrobeRepository';
import { ShredDb } from './db';

export class DexieRepository implements WardrobeRepository {
  private readonly db: ShredDb;
  private readonly listeners = new Set<ChangeListener>();

  constructor(db: ShredDb = new ShredDb()) {
    this.db = db;
  }

  async listItems(): Promise<Item[]> {
    return this.db.items.orderBy('updatedAt').reverse().toArray();
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.db.items.get(id);
  }

  async saveItem(item: Item): Promise<Item> {
    const saved = { ...item, updatedAt: Date.now() };
    await this.db.items.put(saved);
    this.emit();
    return saved;
  }

  async deleteItem(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.items, this.db.outfits, this.db.photos, async () => {
      const item = await this.db.items.get(id);
      if (!item) return;
      await this.db.photos.bulkDelete(item.photoIds);
      await this.db.items.delete(id);
      const outfits = await this.db.outfits.toArray();
      for (const outfit of outfits) {
        const slots = Object.fromEntries(
          Object.entries(outfit.slots).filter(([, itemId]) => itemId !== id),
        );
        if (Object.keys(slots).length !== Object.keys(outfit.slots).length) {
          await this.db.outfits.put({ ...outfit, slots, updatedAt: Date.now() });
        }
      }
    });
    this.emit();
  }

  async listOutfits(): Promise<Outfit[]> {
    return this.db.outfits.orderBy('updatedAt').reverse().toArray();
  }

  async getOutfit(id: string): Promise<Outfit | undefined> {
    return this.db.outfits.get(id);
  }

  async saveOutfit(outfit: Outfit): Promise<Outfit> {
    const saved = { ...outfit, updatedAt: Date.now() };
    await this.db.outfits.put(saved);
    this.emit();
    return saved;
  }

  async deleteOutfit(id: string): Promise<void> {
    await this.db.outfits.delete(id);
    this.emit();
  }

  async addPhoto(photo: NewPhoto): Promise<Photo> {
    const saved: Photo = { ...photo, id: newId(), createdAt: Date.now() };
    await this.db.photos.add(saved);
    this.emit();
    return saved;
  }

  async getPhoto(id: string): Promise<Photo | undefined> {
    return this.db.photos.get(id);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.photos.delete(id);
    this.emit();
  }

  async exportAll(): Promise<WardrobeSnapshot> {
    const [items, outfits, photos] = await Promise.all([
      this.db.items.toArray(),
      this.db.outfits.toArray(),
      this.db.photos.toArray(),
    ]);
    return { version: 1, exportedAt: Date.now(), items, outfits, photos };
  }

  async importAll(snapshot: WardrobeSnapshot, mode: 'merge' | 'replace'): Promise<void> {
    await this.db.transaction('rw', this.db.items, this.db.outfits, this.db.photos, async () => {
      if (mode === 'replace') {
        await Promise.all([this.db.items.clear(), this.db.outfits.clear(), this.db.photos.clear()]);
      }
      await this.db.photos.bulkPut(snapshot.photos);
      await this.db.items.bulkPut(snapshot.items);
      await this.db.outfits.bulkPut(snapshot.outfits);
    });
    this.emit();
  }

  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}
