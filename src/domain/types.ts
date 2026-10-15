import type { CategoryId } from './categories';
import type { OutfitSlot } from './outfitSlots';

export type Discipline = 'ski' | 'snowboard';
export type Pattern = 'solid' | 'colorBlock' | 'camo' | 'print';
export type Finish = 'matte' | 'sheen';
export type ItemCondition = 'new' | 'good' | 'worn' | 'retired';
export type ConditionTag = 'powder' | 'bluebird' | 'cold' | 'spring' | 'storm' | 'park' | 'touring';

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'colorBlock', label: 'Colour-block' },
  { id: 'camo', label: 'Camo' },
  { id: 'print', label: 'Print / graphic' },
];

export const FINISHES: { id: Finish; label: string }[] = [
  { id: 'matte', label: 'Matte' },
  { id: 'sheen', label: 'Sheen / glossy' },
];

export const ITEM_CONDITIONS: { id: ItemCondition; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'good', label: 'Good' },
  { id: 'worn', label: 'Well-worn' },
  { id: 'retired', label: 'Retired' },
];

export const CONDITION_TAGS: { id: ConditionTag; label: string; icon: string }[] = [
  { id: 'powder', label: 'Powder', icon: '❄️' },
  { id: 'bluebird', label: 'Bluebird', icon: '☀️' },
  { id: 'cold', label: 'Cold', icon: '🥶' },
  { id: 'spring', label: 'Spring', icon: '🌤️' },
  { id: 'storm', label: 'Storm', icon: '🌨️' },
  { id: 'park', label: 'Park', icon: '🛹' },
  { id: 'touring', label: 'Touring', icon: '🥾' },
];

export const DISCIPLINES: { id: Discipline; label: string; icon: string }[] = [
  { id: 'snowboard', label: 'Snowboard', icon: '🏂' },
  { id: 'ski', label: 'Ski', icon: '⛷️' },
];

/** Hex colours, always `#rrggbb` lower-case. */
export interface ItemColors {
  primary: string;
  secondary?: string;
  accent?: string;
}

export type SpecValue = string | number | boolean;

export interface PurchaseInfo {
  date?: string;
  price?: number;
  currency?: string;
  store?: string;
}

export interface Item {
  id: string;
  categoryId: CategoryId;
  name: string;
  brand: string;
  model: string;
  size: string;
  colors: ItemColors;
  pattern: Pattern;
  finish: Finish;
  photoIds: string[];
  coverPhotoId?: string;
  specs: Record<string, SpecValue>;
  purchase: PurchaseInfo;
  condition: ItemCondition;
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Outfit {
  id: string;
  name: string;
  discipline: Discipline;
  slots: Partial<Record<OutfitSlot, string>>;
  conditions: ConditionTag[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  id: string;
  /** Resized original, longest side ≤ 1600px. */
  full: Blob;
  /** Square-ish thumbnail, longest side ≤ 512px; used in grids and 3D textures. */
  thumb: Blob;
  width: number;
  height: number;
  createdAt: number;
}

export type NewPhoto = Omit<Photo, 'id' | 'createdAt'>;
