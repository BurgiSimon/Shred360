import { useEffect, useMemo } from 'react';
import type { Texture } from 'three';
import type { ItemColors, Pattern } from '@/domain/types';
import { createPatternTexture } from './patternTexture';

/** Canvas texture for camo/print garments, disposed when the pattern or colours change. */
export function usePatternTexture(pattern: Pattern, colors: ItemColors): Texture | null {
  const key = `${pattern}|${colors.primary}|${colors.secondary ?? ''}|${colors.accent ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texture = useMemo(() => createPatternTexture(pattern, colors), [key]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
