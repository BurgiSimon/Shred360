import { getCategory, type CategoryId, type GarmentKind } from './categories';
import { itemDisplayName } from './items';
import type { ResolvedOutfit } from './outfits';
import { OUTFIT_SLOTS, type OutfitSlot } from './outfitSlots';
import type { Finish, ItemColors, Pattern } from './types';

/** What one garment looks like, independent of where it came from (local item or share link). */
export interface GarmentLook {
  itemId?: string;
  categoryId: CategoryId;
  garment: GarmentKind;
  brand: string;
  colors: ItemColors;
  pattern: Pattern;
  finish: Finish;
  label: string;
}

export type OutfitLook = Partial<Record<OutfitSlot, GarmentLook>>;

export function lookFromResolved(resolved: ResolvedOutfit): OutfitLook {
  const look: OutfitLook = {};
  for (const slot of OUTFIT_SLOTS) {
    const item = resolved[slot];
    if (!item) continue;
    const category = getCategory(item.categoryId);
    if (!category) continue;
    look[slot] = {
      itemId: item.id,
      categoryId: item.categoryId,
      garment: category.garment,
      brand: item.brand,
      colors: item.colors,
      pattern: item.pattern,
      finish: item.finish,
      label: itemDisplayName(item),
    };
  }
  return look;
}

/** The outermost top/bottom that is actually visible, e.g. the base layer if no jacket. */
export function outermostTop(look: OutfitLook): GarmentLook | undefined {
  return look.shellTop ?? look.midTop ?? look.baseTop;
}

export function outermostBottom(look: OutfitLook): GarmentLook | undefined {
  return look.shellBottom ?? look.baseBottom;
}
