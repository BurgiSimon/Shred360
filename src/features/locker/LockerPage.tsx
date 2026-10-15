import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems, usePhotoUrls } from '@/data/hooks';
import { getCategory, type LockerZone } from '@/domain/categories';
import { itemCoverPhotoId, itemDisplayName } from '@/domain/items';
import type { Item } from '@/domain/types';
import { ButtonLink } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ColorDots } from '@/ui/ColorDots';
import { EmptyState } from '@/ui/EmptyState';
import { LayersIcon } from '@/ui/icons';
import { ItemThumb } from '@/ui/ItemThumb';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { DEFAULT_FILTER, filterItems, groupByZone } from '../wardrobe/filterItems';
import { layoutLocker } from './layout';
import { LockerScene } from './LockerScene';

export default function LockerPage() {
  const { data: items, loading } = useItems();
  const [selected, setSelected] = useState<Item>();
  const [zone, setZone] = useState<LockerZone>();

  const layout = useMemo(
    () => layoutLocker(groupByZone(filterItems(items ?? [], DEFAULT_FILTER))),
    [items],
  );
  const photoIds = useMemo(
    () => layout.cards.map((c) => itemCoverPhotoId(c.item)).filter((p): p is string => Boolean(p)),
    [layout],
  );
  const photoUrls = usePhotoUrls(photoIds);

  if (loading) return <RouteFallback />;
  if (layout.cards.length === 0) {
    return (
      <>
        <PageHeader title="Locker" subtitle="Your gear wall in 3D" />
        <EmptyState
          icon="🔒"
          title="Nothing hanging in the locker yet"
          action={
            <ButtonLink to="/wardrobe/new" variant="primary">
              Add gear
            </ButtonLink>
          }
        >
          Every item you add to your wardrobe gets a framed spot on your 3D gear wall.
        </EmptyState>
      </>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4.75rem)] overflow-hidden bg-[#1a120c] sm:h-dvh">
      <LockerScene
        layout={layout}
        photoUrls={photoUrls}
        photoIdFor={itemCoverPhotoId}
        selectedId={selected?.id}
        onSelect={setSelected}
        zoneFocus={zone}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-5">
        <h1 className="text-lg font-extrabold text-white drop-shadow sm:text-2xl">Locker</h1>
        <p className="text-xs text-ink-200">Drag to browse · tap a card to look closer</p>
        <div className="pointer-events-auto mt-2 -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
          <Chip
            active={!zone && !selected}
            onClick={() => {
              setSelected(undefined);
              setZone(undefined);
            }}
          >
            Whole wall
          </Chip>
          {layout.zones.map((z) => (
            <Chip
              key={z.zone}
              active={zone === z.zone && !selected}
              onClick={() => {
                setSelected(undefined);
                setZone(z.zone);
              }}
            >
              {z.label} <span className="text-ink-400">{z.count}</span>
            </Chip>
          ))}
        </div>
      </div>

      {selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-5">
          <div className="card pointer-events-auto w-full max-w-md p-3" role="status">
            <div className="flex items-center gap-3">
              <ItemThumb item={selected} className="size-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{itemDisplayName(selected)}</p>
                <p className="truncate text-xs text-ink-400">
                  {[getCategory(selected.categoryId)?.label, selected.brand, selected.size]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <ColorDots colors={selected.colors} size="md" />
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to={`/wardrobe/${selected.id}`}
                className="flex-1 rounded-xl bg-ink-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-ink-600"
              >
                Details
              </Link>
              <Link
                to={`/outfits/new?item=${selected.id}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ice px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-white"
              >
                <LayersIcon className="size-4" /> Use in outfit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
