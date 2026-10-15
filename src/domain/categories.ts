import type { OutfitSlot } from './outfitSlots';

/**
 * Category registry: the single place that says what kinds of gear exist, which outfit slot each
 * one fills, which spec fields it has, and how the 3D rider draws it. Adding a new kind of gear
 * (e.g. hardgoods later) means adding entries here plus a garment component, not changing the
 * stored data shape.
 */

export type CategoryGroup = 'clothing' | 'head' | 'hands' | 'hardgoods';

/** Area of the 3D locker an item hangs in. */
export type LockerZone = 'head' | 'hands' | 'tops' | 'bottoms';

/** Which 3D garment mesh renders the item on the rider. */
export type GarmentKind =
  | 'jacket'
  | 'puffy'
  | 'midTop'
  | 'baseTop'
  | 'pants'
  | 'bibs'
  | 'baseBottom'
  | 'socks'
  | 'neckwear'
  | 'helmet'
  | 'goggles'
  | 'beanie'
  | 'gloves'
  | 'mittens';

export type SpecField =
  | { key: string; label: string; type: 'number'; unit?: string; min?: number; max?: number }
  | { key: string; label: string; type: 'text'; placeholder?: string }
  | { key: string; label: string; type: 'select'; options: readonly string[] }
  | { key: string; label: string; type: 'boolean' };

export interface ColorRoles {
  primary: string;
  secondary: string;
  accent: string;
}

export interface CategoryDef {
  id: string;
  group: CategoryGroup;
  zone: LockerZone;
  label: string;
  icon: string;
  slot: OutfitSlot;
  garment: GarmentKind;
  colorRoles: ColorRoles;
  specs: readonly SpecField[];
}

const DEFAULT_ROLES: ColorRoles = { primary: 'Main', secondary: 'Secondary', accent: 'Accent' };

const waterproofing: SpecField = {
  key: 'waterproofing',
  label: 'Waterproofing',
  type: 'number',
  unit: 'mm',
  min: 0,
  max: 50000,
};
const breathability: SpecField = {
  key: 'breathability',
  label: 'Breathability',
  type: 'number',
  unit: 'g/m²/24h',
  min: 0,
  max: 50000,
};
const insulation: SpecField = {
  key: 'insulation',
  label: 'Insulation',
  type: 'number',
  unit: 'g',
  min: 0,
  max: 1000,
};
const membrane: SpecField = {
  key: 'membrane',
  label: 'Membrane',
  type: 'text',
  placeholder: 'e.g. GORE-TEX, Dermizax',
};
const baseMaterial: SpecField = {
  key: 'material',
  label: 'Material',
  type: 'select',
  options: ['Merino', 'Synthetic', 'Merino blend', 'Silk', 'Other'],
};
const fabricWeight: SpecField = {
  key: 'weight',
  label: 'Fabric weight',
  type: 'number',
  unit: 'g/m²',
  min: 0,
  max: 600,
};
const handSpecs: readonly SpecField[] = [
  insulation,
  membrane,
  { key: 'leather', label: 'Leather palm', type: 'boolean' },
  { key: 'liner', label: 'Removable liner', type: 'boolean' },
  { key: 'touchscreen', label: 'Touchscreen tips', type: 'boolean' },
];

export const CATEGORIES = [
  {
    id: 'shellJacket',
    group: 'clothing',
    zone: 'tops',
    label: 'Shell jacket',
    icon: '🧥',
    slot: 'shellTop',
    garment: 'jacket',
    colorRoles: { primary: 'Body', secondary: 'Sleeves / yoke', accent: 'Zips & trim' },
    specs: [
      waterproofing,
      breathability,
      membrane,
      {
        key: 'hood',
        label: 'Hood',
        type: 'select',
        options: ['Helmet-compatible', 'Standard', 'None'],
      },
      { key: 'powderSkirt', label: 'Powder skirt', type: 'boolean' },
      { key: 'pitZips', label: 'Pit zips', type: 'boolean' },
      { key: 'recco', label: 'RECCO reflector', type: 'boolean' },
    ],
  },
  {
    id: 'insulatedJacket',
    group: 'clothing',
    zone: 'tops',
    label: 'Insulated jacket',
    icon: '🧥',
    slot: 'shellTop',
    garment: 'puffy',
    colorRoles: { primary: 'Body', secondary: 'Sleeves / yoke', accent: 'Zips & trim' },
    specs: [
      insulation,
      { key: 'fill', label: 'Fill', type: 'select', options: ['Down', 'Synthetic', 'Hybrid'] },
      { key: 'fillPower', label: 'Fill power', type: 'number', unit: 'cuin', min: 0, max: 1000 },
      waterproofing,
      { key: 'powderSkirt', label: 'Powder skirt', type: 'boolean' },
      { key: 'recco', label: 'RECCO reflector', type: 'boolean' },
    ],
  },
  {
    id: 'midLayer',
    group: 'clothing',
    zone: 'tops',
    label: 'Mid-layer',
    icon: '🧶',
    slot: 'midTop',
    garment: 'midTop',
    colorRoles: DEFAULT_ROLES,
    specs: [
      {
        key: 'material',
        label: 'Material',
        type: 'select',
        options: ['Fleece', 'Synthetic insulation', 'Down', 'Wool', 'Softshell', 'Other'],
      },
      fabricWeight,
      { key: 'hood', label: 'Hood', type: 'boolean' },
    ],
  },
  {
    id: 'baseTop',
    group: 'clothing',
    zone: 'tops',
    label: 'Base-layer top',
    icon: '👕',
    slot: 'baseTop',
    garment: 'baseTop',
    colorRoles: DEFAULT_ROLES,
    specs: [baseMaterial, fabricWeight],
  },
  {
    id: 'pants',
    group: 'clothing',
    zone: 'bottoms',
    label: 'Pants',
    icon: '👖',
    slot: 'shellBottom',
    garment: 'pants',
    colorRoles: { primary: 'Body', secondary: 'Panels', accent: 'Zips & trim' },
    specs: [
      waterproofing,
      breathability,
      insulation,
      membrane,
      {
        key: 'fit',
        label: 'Fit',
        type: 'select',
        options: ['Slim', 'Regular', 'Relaxed', 'Baggy'],
      },
      { key: 'ventZips', label: 'Vent zips', type: 'boolean' },
    ],
  },
  {
    id: 'bibs',
    group: 'clothing',
    zone: 'bottoms',
    label: 'Bibs',
    icon: '🎽',
    slot: 'shellBottom',
    garment: 'bibs',
    colorRoles: { primary: 'Body', secondary: 'Panels', accent: 'Zips & straps' },
    specs: [
      waterproofing,
      breathability,
      insulation,
      membrane,
      {
        key: 'fit',
        label: 'Fit',
        type: 'select',
        options: ['Slim', 'Regular', 'Relaxed', 'Baggy'],
      },
      { key: 'dropSeat', label: 'Drop seat', type: 'boolean' },
    ],
  },
  {
    id: 'baseBottom',
    group: 'clothing',
    zone: 'bottoms',
    label: 'Base-layer bottom',
    icon: '🩲',
    slot: 'baseBottom',
    garment: 'baseBottom',
    colorRoles: DEFAULT_ROLES,
    specs: [baseMaterial, fabricWeight],
  },
  {
    id: 'socks',
    group: 'clothing',
    zone: 'bottoms',
    label: 'Socks',
    icon: '🧦',
    slot: 'socks',
    garment: 'socks',
    colorRoles: DEFAULT_ROLES,
    specs: [
      baseMaterial,
      {
        key: 'cushion',
        label: 'Cushion',
        type: 'select',
        options: ['Ultralight', 'Light', 'Medium', 'Heavy'],
      },
    ],
  },
  {
    id: 'neckwear',
    group: 'clothing',
    zone: 'head',
    label: 'Neck gaiter / balaclava',
    icon: '🧣',
    slot: 'neck',
    garment: 'neckwear',
    colorRoles: { primary: 'Main', secondary: 'Pattern', accent: 'Accent' },
    specs: [
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        options: ['Gaiter', 'Balaclava', 'Tube', 'Hood'],
      },
      baseMaterial,
    ],
  },
  {
    id: 'helmet',
    group: 'head',
    zone: 'head',
    label: 'Helmet',
    icon: '⛑️',
    slot: 'head',
    garment: 'helmet',
    colorRoles: { primary: 'Shell', secondary: 'Lower shell / trim', accent: 'Vents & logo' },
    specs: [
      { key: 'mips', label: 'MIPS / rotational protection', type: 'boolean' },
      { key: 'certification', label: 'Certification', type: 'text', placeholder: 'e.g. EN 1077 B' },
      { key: 'vents', label: 'Vents', type: 'number', min: 0, max: 40 },
      { key: 'audio', label: 'Audio-ready', type: 'boolean' },
      { key: 'fit', label: 'Fit system', type: 'text', placeholder: 'e.g. BOA dial' },
    ],
  },
  {
    id: 'goggles',
    group: 'head',
    zone: 'head',
    label: 'Goggles',
    icon: '🥽',
    slot: 'eyes',
    garment: 'goggles',
    colorRoles: { primary: 'Frame', secondary: 'Strap', accent: 'Lens tint' },
    specs: [
      { key: 'lens', label: 'Lens name', type: 'text', placeholder: 'e.g. Prizm Sapphire' },
      { key: 'vlt', label: 'VLT', type: 'number', unit: '%', min: 0, max: 100 },
      {
        key: 'lensShape',
        label: 'Lens shape',
        type: 'select',
        options: ['Cylindrical', 'Spherical', 'Toric'],
      },
      { key: 'magnetic', label: 'Magnetic lens swap', type: 'boolean' },
      { key: 'spareLens', label: 'Spare lens', type: 'text', placeholder: 'e.g. Low-light rose' },
      { key: 'otg', label: 'Fits over glasses (OTG)', type: 'boolean' },
    ],
  },
  {
    id: 'beanie',
    group: 'head',
    zone: 'head',
    label: 'Beanie',
    icon: '🧢',
    slot: 'head',
    garment: 'beanie',
    colorRoles: { primary: 'Main', secondary: 'Cuff / stripe', accent: 'Pom-pom' },
    specs: [
      { key: 'pompom', label: 'Pom-pom', type: 'boolean' },
      { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Merino' },
    ],
  },
  {
    id: 'gloves',
    group: 'hands',
    zone: 'hands',
    label: 'Gloves',
    icon: '🧤',
    slot: 'hands',
    garment: 'gloves',
    colorRoles: { primary: 'Back', secondary: 'Palm', accent: 'Cuff & trim' },
    specs: handSpecs,
  },
  {
    id: 'mittens',
    group: 'hands',
    zone: 'hands',
    label: 'Mittens',
    icon: '🧤',
    slot: 'hands',
    garment: 'mittens',
    colorRoles: { primary: 'Back', secondary: 'Palm', accent: 'Cuff & trim' },
    specs: handSpecs,
  },
] as const satisfies readonly CategoryDef[];

export type CategoryId = (typeof CATEGORIES)[number]['id'];

const BY_ID = new Map<string, CategoryDef>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): CategoryDef | undefined {
  return BY_ID.get(id);
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value);
}

export function categoriesForSlot(slot: OutfitSlot): CategoryDef[] {
  return CATEGORIES.filter((c) => c.slot === slot);
}

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  clothing: 'Clothing layers',
  head: 'Head',
  hands: 'Hands',
  hardgoods: 'Hardgoods',
};

export const LOCKER_ZONES: { id: LockerZone; label: string }[] = [
  { id: 'head', label: 'Head & neck' },
  { id: 'tops', label: 'Tops' },
  { id: 'hands', label: 'Hands' },
  { id: 'bottoms', label: 'Bottoms' },
];
