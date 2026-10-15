import type { LockerZone } from '@/domain/categories';
import type { Item } from '@/domain/types';

/** Physical layout of the gear wall, in metres. The wall faces +Z and is centred on x = 0. */
export const LOCKER = {
  rows: [2.0, 1.22, 0.44] as const,
  cardSize: 0.46,
  columnSpacing: 0.62,
  zoneGap: 0.5,
  signY: 2.7,
  wallHeight: 3.2,
} as const;

export interface CardSlot {
  item: Item;
  zone: LockerZone;
  x: number;
  y: number;
}

export interface ZoneSlot {
  zone: LockerZone;
  label: string;
  /** Centre of the zone. */
  x: number;
  width: number;
  count: number;
}

export interface LockerLayout {
  cards: CardSlot[];
  zones: ZoneSlot[];
  /** Total wall width including margins. */
  width: number;
}

/**
 * Lays zones out left to right; within a zone, items fill a column top to bottom before starting
 * the next column, so small zones stay compact.
 */
export function layoutLocker(
  groups: { zone: LockerZone; label: string; items: Item[] }[],
): LockerLayout {
  const rows = LOCKER.rows.length;
  const placed: { zone: ZoneSlot; cards: Omit<CardSlot, 'x'>[]; offsets: number[] }[] = [];
  let cursor = 0;
  for (const group of groups) {
    if (group.items.length === 0) continue;
    const columns = Math.ceil(group.items.length / rows);
    const width = columns * LOCKER.columnSpacing;
    const zone: ZoneSlot = {
      zone: group.zone,
      label: group.label,
      x: cursor + width / 2,
      width,
      count: group.items.length,
    };
    const cards = group.items.map((item, i) => ({
      item,
      zone: group.zone,
      y: LOCKER.rows[i % rows],
    }));
    const offsets = group.items.map(
      (_, i) => cursor + (Math.floor(i / rows) + 0.5) * LOCKER.columnSpacing,
    );
    placed.push({ zone, cards, offsets });
    cursor += width + LOCKER.zoneGap;
  }
  const contentWidth = Math.max(0, cursor - LOCKER.zoneGap);
  const shift = -contentWidth / 2;
  const cards: CardSlot[] = [];
  const zones: ZoneSlot[] = [];
  for (const p of placed) {
    zones.push({ ...p.zone, x: p.zone.x + shift });
    p.cards.forEach((c, i) => cards.push({ ...c, x: p.offsets[i] + shift }));
  }
  return { cards, zones, width: contentWidth + 1.2 };
}
