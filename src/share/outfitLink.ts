import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { getCategory, isCategoryId } from '@/domain/categories';
import { normalizeHex } from '@/domain/items';
import type { OutfitLook } from '@/domain/outfitLook';
import { OUTFIT_SLOTS, isOutfitSlot } from '@/domain/outfitSlots';
import {
  CONDITION_TAGS,
  FINISHES,
  PATTERNS,
  type ConditionTag,
  type Discipline,
  type Finish,
  type Pattern,
} from '@/domain/types';

/**
 * Share links carry the whole outfit in the URL fragment, so they work without any server and
 * nothing leaves the device until the user sends the link. Photos are not included (too big);
 * the receiver sees the 3D rider in the right colours with names and brands.
 *
 * Format v1 (compact tuples, then lz-string):
 *   { v: 1, n: name, d: 'ski'|'snowboard', c: [conditions], s: { slot: [categoryId, label, brand,
 *     primary, secondary|'', accent|'', pattern, finish] } }
 */

export const SHARE_VERSION = 1;
const MAX_TEXT = 80;

type GarmentTuple = [string, string, string, string, string, string, string, string];

interface PayloadV1 {
  v: 1;
  n: string;
  d: Discipline;
  c: string[];
  s: Record<string, GarmentTuple>;
}

export interface SharedOutfit {
  name: string;
  discipline: Discipline;
  conditions: ConditionTag[];
  look: OutfitLook;
}

export class ShareLinkError extends Error {}

const clip = (s: string) => s.slice(0, MAX_TEXT);

export function encodeOutfit(outfit: SharedOutfit): string {
  const slots: Record<string, GarmentTuple> = {};
  for (const slot of OUTFIT_SLOTS) {
    const g = outfit.look[slot];
    if (!g) continue;
    slots[slot] = [
      g.categoryId,
      clip(g.label),
      clip(g.brand),
      g.colors.primary,
      g.colors.secondary ?? '',
      g.colors.accent ?? '',
      g.pattern,
      g.finish,
    ];
  }
  const payload: PayloadV1 = {
    v: SHARE_VERSION,
    n: clip(outfit.name),
    d: outfit.discipline,
    c: outfit.conditions,
    s: slots,
  };
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

const isString = (v: unknown): v is string => typeof v === 'string';

/** Parses and strictly validates a share payload. Throws ShareLinkError on anything unexpected. */
export function decodeOutfit(encoded: string): SharedOutfit {
  let raw: unknown;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) throw new Error('empty');
    raw = JSON.parse(json);
  } catch {
    throw new ShareLinkError('This share link is damaged or incomplete.');
  }
  if (typeof raw !== 'object' || raw === null)
    throw new ShareLinkError('This share link is not an outfit.');
  const p = raw as Partial<PayloadV1>;
  if (p.v !== SHARE_VERSION) {
    throw new ShareLinkError('This link was made by a newer version of Shred360.');
  }
  if (p.d !== 'ski' && p.d !== 'snowboard') throw new ShareLinkError('Unknown discipline in link.');
  if (!isString(p.n)) throw new ShareLinkError('Missing outfit name.');
  if (typeof p.s !== 'object' || p.s === null) throw new ShareLinkError('Missing outfit items.');

  const look: OutfitLook = {};
  for (const [slot, tuple] of Object.entries(p.s)) {
    if (!isOutfitSlot(slot)) throw new ShareLinkError(`Unknown slot "${slot}".`);
    if (!Array.isArray(tuple) || tuple.length !== 8 || !tuple.every(isString)) {
      throw new ShareLinkError('Malformed item in link.');
    }
    const [categoryId, label, brand, primary, secondary, accent, pattern, finish] = tuple;
    if (!isCategoryId(categoryId)) throw new ShareLinkError(`Unknown gear type "${categoryId}".`);
    const category = getCategory(categoryId)!;
    if (category.slot !== slot) throw new ShareLinkError('Item does not fit its slot.');
    const primaryHex = normalizeHex(primary);
    if (!primaryHex) throw new ShareLinkError('Invalid colour in link.');
    if (!PATTERNS.some((x) => x.id === pattern))
      throw new ShareLinkError('Invalid pattern in link.');
    if (!FINISHES.some((x) => x.id === finish)) throw new ShareLinkError('Invalid finish in link.');
    const secondaryHex = secondary ? normalizeHex(secondary) : undefined;
    const accentHex = accent ? normalizeHex(accent) : undefined;
    look[slot] = {
      categoryId,
      garment: category.garment,
      label: clip(label) || category.label,
      brand: clip(brand),
      colors: {
        primary: primaryHex,
        ...(secondaryHex ? { secondary: secondaryHex } : {}),
        ...(accentHex ? { accent: accentHex } : {}),
      },
      pattern: pattern as Pattern,
      finish: finish as Finish,
    };
  }

  const conditions = Array.isArray(p.c)
    ? p.c.filter((c): c is ConditionTag => CONDITION_TAGS.some((t) => t.id === c))
    : [];
  return { name: clip(p.n), discipline: p.d, conditions, look };
}

/** Full URL for a payload, based on where the app is currently served from. */
export function shareUrl(
  encoded: string,
  location: Pick<Location, 'origin' | 'pathname'> = window.location,
): string {
  return `${location.origin}${location.pathname}#/share/${encoded}`;
}
