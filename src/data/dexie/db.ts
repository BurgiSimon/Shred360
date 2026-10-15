import Dexie, { type EntityTable } from 'dexie';
import type { Item, Outfit, Photo } from '@/domain/types';

export class ShredDb extends Dexie {
  items!: EntityTable<Item, 'id'>;
  outfits!: EntityTable<Outfit, 'id'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor(name = 'shred360') {
    super(name);
    this.version(1).stores({
      items: 'id, categoryId, brand, *tags, updatedAt',
      outfits: 'id, discipline, updatedAt',
      photos: 'id',
    });
  }
}
