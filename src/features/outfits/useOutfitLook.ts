import { useMemo } from 'react';
import { useItems } from '@/data/hooks';
import { lookFromResolved, type OutfitLook } from '@/domain/outfitLook';
import { resolveOutfit } from '@/domain/outfits';
import type { Outfit } from '@/domain/types';

export function useOutfitLook(outfit: Pick<Outfit, 'slots'> | undefined): OutfitLook {
  const { data: items } = useItems();
  return useMemo(
    () => (outfit && items ? lookFromResolved(resolveOutfit(outfit, items)) : {}),
    [outfit, items],
  );
}
