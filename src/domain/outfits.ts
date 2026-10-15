import { getCategory } from './categories';
import { OUTFIT_SLOTS, type OutfitSlot } from './outfitSlots';
import type { Discipline, Item, Outfit } from './types';
import { newId } from '@/lib/id';

export function createOutfit(overrides: Partial<Outfit> = {}): Outfit {
  const now = Date.now();
  return {
    id: newId(),
    name: '',
    discipline: 'snowboard',
    slots: {},
    conditions: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function canWearInSlot(item: Pick<Item, 'categoryId'>, slot: OutfitSlot): boolean {
  return getCategory(item.categoryId)?.slot === slot;
}

export type ResolvedOutfit = Partial<Record<OutfitSlot, Item>>;

/**
 * Maps an outfit's slot ids to actual items, dropping ids whose item was deleted or no longer
 * fits the slot (e.g. after a category change).
 */
export function resolveOutfit(
  outfit: Pick<Outfit, 'slots'>,
  items: Iterable<Item>,
): ResolvedOutfit {
  const byId = new Map<string, Item>();
  for (const item of items) byId.set(item.id, item);
  const resolved: ResolvedOutfit = {};
  for (const slot of OUTFIT_SLOTS) {
    const id = outfit.slots[slot];
    const item = id ? byId.get(id) : undefined;
    if (item && canWearInSlot(item, slot)) resolved[slot] = item;
  }
  return resolved;
}

export function outfitItemCount(outfit: Pick<Outfit, 'slots'>): number {
  return OUTFIT_SLOTS.filter((s) => outfit.slots[s]).length;
}

export function duplicateOutfit(outfit: Outfit): Outfit {
  const now = Date.now();
  return {
    ...outfit,
    id: newId(),
    name: outfit.name ? `${outfit.name} (copy)` : '',
    slots: { ...outfit.slots },
    conditions: [...outfit.conditions],
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultOutfitName(discipline: Discipline, count: number): string {
  return `${discipline === 'ski' ? 'Ski' : 'Snowboard'} fit #${count + 1}`;
}
