import { describe, expect, it } from 'vitest';
import { createItem } from '@/domain/items';
import { DEFAULT_FILTER, filterItems, groupByCategory } from './filterItems';

const jacket = createItem('shellJacket', {
  brand: 'Burton',
  colors: { primary: '#ff7a00' },
  tags: ['powder'],
});
const helmet = createItem('helmet', { brand: 'Smith', colors: { primary: '#111111' } });
const oldGloves = createItem('gloves', {
  brand: 'Hestra',
  condition: 'retired',
  colors: { primary: '#2b6cb0' },
});
const items = [jacket, helmet, oldGloves];

describe('filterItems', () => {
  it('hides retired items by default', () => {
    expect(filterItems(items, DEFAULT_FILTER)).toEqual([jacket, helmet]);
    expect(filterItems(items, { ...DEFAULT_FILTER, includeRetired: true })).toHaveLength(3);
  });

  it('searches brand, colour family, tag and category', () => {
    expect(filterItems(items, { ...DEFAULT_FILTER, query: 'burton' })).toEqual([jacket]);
    expect(filterItems(items, { ...DEFAULT_FILTER, query: 'orange' })).toEqual([jacket]);
    expect(filterItems(items, { ...DEFAULT_FILTER, query: 'powder jacket' })).toEqual([jacket]);
    expect(filterItems(items, { ...DEFAULT_FILTER, query: 'black helmet' })).toEqual([helmet]);
    expect(filterItems(items, { ...DEFAULT_FILTER, query: 'blue', includeRetired: true })).toEqual([
      oldGloves,
    ]);
  });

  it('filters by group', () => {
    expect(filterItems(items, { ...DEFAULT_FILTER, group: 'head' })).toEqual([helmet]);
    expect(filterItems(items, { ...DEFAULT_FILTER, group: 'clothing' })).toEqual([jacket]);
  });

  it('groups by category in registry order', () => {
    expect(groupByCategory([helmet, jacket]).map((g) => g.categoryId)).toEqual([
      'shellJacket',
      'helmet',
    ]);
  });
});
