import { CATEGORIES, getCategory, type CategoryGroup } from '@/domain/categories';
import { itemDisplayName } from '@/domain/items';
import type { Item } from '@/domain/types';
import { colorName } from '@/lib/color';

export interface ItemFilter {
  query: string;
  group: CategoryGroup | 'all';
  includeRetired: boolean;
}

export const DEFAULT_FILTER: ItemFilter = { query: '', group: 'all', includeRetired: false };

/** All the words an item can be found by: names, brand, tags, category, colour families. */
function searchText(item: Item): string {
  const category = getCategory(item.categoryId);
  const colors = [item.colors.primary, item.colors.secondary, item.colors.accent]
    .filter((c): c is string => Boolean(c))
    .map(colorName);
  return [
    itemDisplayName(item),
    item.brand,
    item.model,
    item.size,
    category?.label,
    ...item.tags,
    ...colors,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterItems(items: Item[], filter: ItemFilter): Item[] {
  const terms = filter.query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (!filter.includeRetired && item.condition === 'retired') return false;
    if (filter.group !== 'all' && getCategory(item.categoryId)?.group !== filter.group)
      return false;
    if (terms.length === 0) return true;
    const text = searchText(item);
    return terms.every((t) => text.includes(t));
  });
}

/** Items grouped by category, in registry order, skipping empty categories. */
export function groupByCategory(items: Item[]): { categoryId: string; items: Item[] }[] {
  return CATEGORIES.map((c) => ({
    categoryId: c.id as string,
    items: items.filter((i) => i.categoryId === c.id),
  })).filter((g) => g.items.length > 0);
}
