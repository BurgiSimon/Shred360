import type { Item, NewPhoto, Outfit, Photo } from '@/domain/types';

/** Everything in a wardrobe, in a backend-neutral shape. Used for backup and future sync. */
export interface WardrobeSnapshot {
  version: 1;
  exportedAt: number;
  items: Item[];
  outfits: Outfit[];
  photos: Photo[];
}

export type ChangeListener = () => void;

/**
 * The only way the UI touches stored data. Today it's backed by IndexedDB (DexieRepository);
 * a cloud backend can implement the same interface later without UI changes.
 */
export interface WardrobeRepository {
  listItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  saveItem(item: Item): Promise<Item>;
  /** Deletes the item, its photos, and removes it from any outfit slots. */
  deleteItem(id: string): Promise<void>;

  listOutfits(): Promise<Outfit[]>;
  getOutfit(id: string): Promise<Outfit | undefined>;
  saveOutfit(outfit: Outfit): Promise<Outfit>;
  deleteOutfit(id: string): Promise<void>;

  addPhoto(photo: NewPhoto): Promise<Photo>;
  getPhoto(id: string): Promise<Photo | undefined>;
  deletePhoto(id: string): Promise<void>;

  exportAll(): Promise<WardrobeSnapshot>;
  /** `replace` wipes existing data first; `merge` upserts by id. */
  importAll(snapshot: WardrobeSnapshot, mode: 'merge' | 'replace'): Promise<void>;

  /** Called after any write. Returns an unsubscribe function. */
  subscribe(listener: ChangeListener): () => void;
}
