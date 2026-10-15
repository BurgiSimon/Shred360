import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoriesForSlot, getCategory } from './categories';
import { createItem, itemDisplayName, normalizeHex, parseTags, validateItem } from './items';
import { createOutfit, duplicateOutfit, outfitItemCount, resolveOutfit } from './outfits';
import { OUTFIT_SLOTS, SLOT_META } from './outfitSlots';

describe('category registry', () => {
  it('has unique ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps every category to a real outfit slot', () => {
    for (const c of CATEGORIES) expect(OUTFIT_SLOTS).toContain(c.slot);
  });

  it('lets every outfit slot be filled by at least one category', () => {
    for (const slot of OUTFIT_SLOTS) {
      expect(categoriesForSlot(slot).length, slot).toBeGreaterThan(0);
      expect(SLOT_META[slot].label).toBeTruthy();
    }
  });

  it('has unique spec keys per category', () => {
    for (const c of CATEGORIES) {
      const keys = c.specs.map((s) => s.key);
      expect(new Set(keys).size, c.id).toBe(keys.length);
    }
  });
});

describe('items', () => {
  it('normalizes hex colours', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('ff8800')).toBe('#ff8800');
    expect(normalizeHex(' #FF8800 ')).toBe('#ff8800');
    expect(normalizeHex('orange')).toBeUndefined();
    expect(normalizeHex(undefined)).toBeUndefined();
  });

  it('derives a display name', () => {
    const item = createItem('helmet');
    expect(itemDisplayName(item)).toBe('Helmet');
    expect(itemDisplayName({ ...item, brand: 'Smith', model: 'Vantage' })).toBe('Smith Vantage');
    expect(itemDisplayName({ ...item, name: 'Lucky lid', brand: 'Smith' })).toBe('Lucky lid');
  });

  it('validates required fields', () => {
    const item = createItem('gloves');
    expect(validateItem(item).ok).toBe(false);
    expect(validateItem({ ...item, brand: 'Hestra' }).ok).toBe(true);
    expect(
      validateItem({ ...item, brand: 'Hestra', colors: { primary: 'nope' } }).errors.colors,
    ).toBeTruthy();
  });

  it('parses tags', () => {
    expect(parseTags('Powder, #favourite,powder ,\nbackcountry')).toEqual([
      'powder',
      'favourite',
      'backcountry',
    ]);
    expect(parseTags('  ')).toEqual([]);
  });
});

describe('outfits', () => {
  const jacket = createItem('shellJacket', { brand: 'Volcom' });
  const helmet = createItem('helmet', { brand: 'Smith' });

  it('resolves slots to items and drops mismatches and missing items', () => {
    const outfit = createOutfit({
      slots: { shellTop: jacket.id, head: helmet.id, hands: 'deleted-id', eyes: jacket.id },
    });
    const resolved = resolveOutfit(outfit, [jacket, helmet]);
    expect(resolved.shellTop).toBe(jacket);
    expect(resolved.head).toBe(helmet);
    expect(resolved.hands).toBeUndefined();
    expect(resolved.eyes).toBeUndefined(); // a jacket can't be worn as goggles
  });

  it('duplicates with a new id and copied slots', () => {
    const outfit = createOutfit({ name: 'Pow day', slots: { shellTop: jacket.id } });
    const copy = duplicateOutfit(outfit);
    expect(copy.id).not.toBe(outfit.id);
    expect(copy.name).toBe('Pow day (copy)');
    copy.slots.head = helmet.id;
    expect(outfit.slots.head).toBeUndefined();
    expect(outfitItemCount(copy)).toBe(2);
  });

  it('knows category for goggles', () => {
    expect(getCategory('goggles')?.slot).toBe('eyes');
  });
});
