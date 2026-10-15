import { getCategory, type CategoryId } from './categories';
import type { Item } from './types';
import { newId } from '@/lib/id';

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns `#rrggbb` lower-case, or undefined if the input isn't a hex colour. */
export function normalizeHex(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const match = HEX_RE.exec(value.trim());
  if (!match) return undefined;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return `#${hex}`;
}

export const DEFAULT_ITEM_COLOR = '#2b6cb0';

export function createItem(categoryId: CategoryId, overrides: Partial<Item> = {}): Item {
  const now = Date.now();
  return {
    id: newId(),
    categoryId,
    name: '',
    brand: '',
    model: '',
    size: '',
    colors: { primary: DEFAULT_ITEM_COLOR },
    pattern: 'solid',
    finish: 'matte',
    photoIds: [],
    specs: {},
    purchase: {},
    condition: 'good',
    tags: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Best human label for an item: its own name, else brand + model, else the category. */
export function itemDisplayName(
  item: Pick<Item, 'name' | 'brand' | 'model' | 'categoryId'>,
): string {
  const name = item.name.trim();
  if (name) return name;
  const brandModel = [item.brand.trim(), item.model.trim()].filter(Boolean).join(' ');
  if (brandModel) return brandModel;
  return getCategory(item.categoryId)?.label ?? 'Item';
}

export function itemCoverPhotoId(
  item: Pick<Item, 'coverPhotoId' | 'photoIds'>,
): string | undefined {
  if (item.coverPhotoId && item.photoIds.includes(item.coverPhotoId)) return item.coverPhotoId;
  return item.photoIds[0];
}

export interface ItemValidation {
  ok: boolean;
  errors: Partial<Record<'name' | 'colors' | 'category', string>>;
}

export function validateItem(item: Item): ItemValidation {
  const errors: ItemValidation['errors'] = {};
  if (!getCategory(item.categoryId)) errors.category = 'Pick a category.';
  if (!item.name.trim() && !item.brand.trim() && !item.model.trim()) {
    errors.name = 'Give it a name, or at least a brand or model.';
  }
  if (!normalizeHex(item.colors.primary)) errors.colors = 'The main colour must be a hex colour.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Parses a comma/space separated tag string into unique, lower-case tags. */
export function parseTags(input: string): string[] {
  const tags = input
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean);
  return [...new Set(tags)];
}
