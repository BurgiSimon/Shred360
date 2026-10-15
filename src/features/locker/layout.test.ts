import { describe, expect, it } from 'vitest';
import { createItem } from '@/domain/items';
import { layoutLocker, LOCKER } from './layout';

const many = (n: number) => Array.from({ length: n }, () => createItem('helmet', { brand: 'X' }));

describe('layoutLocker', () => {
  it('returns an empty layout for no items', () => {
    const layout = layoutLocker([{ zone: 'head', label: 'Head', items: [] }]);
    expect(layout.cards).toEqual([]);
    expect(layout.zones).toEqual([]);
  });

  it('fills columns top to bottom and centres the wall', () => {
    const layout = layoutLocker([
      { zone: 'head', label: 'Head', items: many(4) },
      { zone: 'tops', label: 'Tops', items: many(1) },
    ]);
    const head = layout.cards.filter((c) => c.zone === 'head');
    expect(head.map((c) => c.y)).toEqual([
      LOCKER.rows[0],
      LOCKER.rows[1],
      LOCKER.rows[2],
      LOCKER.rows[0],
    ]);
    expect(head[3].x - head[0].x).toBeCloseTo(LOCKER.columnSpacing);
    const xs = layout.cards.map((c) => c.x);
    // Symmetric around 0.
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(0, 5);
    expect(layout.zones.map((z) => z.zone)).toEqual(['head', 'tops']);
    expect(layout.zones[0].count).toBe(4);
  });

  it('keeps zones apart', () => {
    const layout = layoutLocker([
      { zone: 'head', label: 'Head', items: many(1) },
      { zone: 'hands', label: 'Hands', items: many(1) },
    ]);
    const [a, b] = layout.cards;
    expect(b.x - a.x).toBeCloseTo(LOCKER.columnSpacing + LOCKER.zoneGap);
  });
});
