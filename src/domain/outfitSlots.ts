/**
 * Outfit slots are the places on the rider an item can be worn. Each slot holds at most one item.
 * Order here is the order the outfit builder shows them, top of the body to bottom.
 */
export const OUTFIT_SLOTS = [
  'head',
  'eyes',
  'neck',
  'shellTop',
  'midTop',
  'baseTop',
  'hands',
  'shellBottom',
  'baseBottom',
  'socks',
] as const;

export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

/** How far from the skin a slot sits; drives the 3D layer-peel effect. */
export type LayerDepth = 'outer' | 'mid' | 'base' | 'accessory';

export interface SlotMeta {
  label: string;
  hint: string;
  depth: LayerDepth;
}

export const SLOT_META: Record<OutfitSlot, SlotMeta> = {
  head: { label: 'Head', hint: 'Helmet or beanie', depth: 'accessory' },
  eyes: { label: 'Eyes', hint: 'Goggles', depth: 'accessory' },
  neck: { label: 'Neck', hint: 'Gaiter or balaclava', depth: 'accessory' },
  shellTop: { label: 'Jacket', hint: 'Shell or insulated jacket', depth: 'outer' },
  midTop: { label: 'Mid-layer', hint: 'Fleece, puffy vest…', depth: 'mid' },
  baseTop: { label: 'Base top', hint: 'Merino or synthetic top', depth: 'base' },
  hands: { label: 'Hands', hint: 'Gloves or mittens', depth: 'accessory' },
  shellBottom: { label: 'Pants', hint: 'Pants or bibs', depth: 'outer' },
  baseBottom: { label: 'Base bottom', hint: 'Long johns', depth: 'base' },
  socks: { label: 'Socks', hint: 'Ski/snowboard socks', depth: 'base' },
};

export function isOutfitSlot(value: unknown): value is OutfitSlot {
  return typeof value === 'string' && (OUTFIT_SLOTS as readonly string[]).includes(value);
}
