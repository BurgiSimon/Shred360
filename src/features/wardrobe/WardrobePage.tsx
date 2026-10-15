import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '@/data/hooks';
import { CATEGORY_GROUP_LABELS, getCategory, type CategoryGroup } from '@/domain/categories';
import { itemDisplayName } from '@/domain/items';
import type { Item } from '@/domain/types';
import { ButtonLink } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ColorDots } from '@/ui/ColorDots';
import { EmptyState } from '@/ui/EmptyState';
import { PlusIcon, SearchIcon } from '@/ui/icons';
import { ItemThumb } from '@/ui/ItemThumb';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { DEFAULT_FILTER, filterItems, groupByCategory, type ItemFilter } from './filterItems';

const GROUP_FILTERS: (CategoryGroup | 'all')[] = ['all', 'clothing', 'head', 'hands'];

export function WardrobePage() {
  const { data: items, loading } = useItems();
  const [filter, setFilter] = useState<ItemFilter>(DEFAULT_FILTER);
  const visible = useMemo(() => filterItems(items ?? [], filter), [items, filter]);
  const groups = useMemo(() => groupByCategory(visible), [visible]);

  if (loading) return <RouteFallback />;

  const total = items?.length ?? 0;
  return (
    <>
      <PageHeader
        title="Wardrobe"
        subtitle={
          total
            ? `${total} piece${total === 1 ? '' : 's'} of real gear`
            : 'Your real gear, digitised'
        }
        actions={
          <ButtonLink to="/wardrobe/new" variant="primary" aria-label="Add item">
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Add gear</span>
          </ButtonLink>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon="🏔️"
          title="Your locker is empty"
          action={
            <ButtonLink to="/wardrobe/new?category=shellJacket" variant="primary">
              <PlusIcon className="size-4" /> Add your first jacket
            </ButtonLink>
          }
        >
          Snap a photo of a jacket, helmet, goggles or gloves you own. Shred360 picks up the colours
          so your 3D rider can wear it.
        </EmptyState>
      ) : (
        <>
          <div className="space-y-3 px-4 sm:px-6">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
                placeholder="Search brand, colour, tag…"
                className="w-full pl-10"
              />
            </label>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {GROUP_FILTERS.map((g) => (
                <Chip
                  key={g}
                  active={filter.group === g}
                  onClick={() => setFilter({ ...filter, group: g })}
                >
                  {g === 'all' ? 'All' : CATEGORY_GROUP_LABELS[g]}
                </Chip>
              ))}
              <Chip
                active={filter.includeRetired}
                onClick={() => setFilter({ ...filter, includeRetired: !filter.includeRetired })}
              >
                Show retired
              </Chip>
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="px-6 py-10 text-center text-ink-400">Nothing matches that search.</p>
          ) : (
            <div className="mt-4 space-y-6 px-4 sm:px-6">
              {groups.map(({ categoryId, items: groupItems }) => {
                const category = getCategory(categoryId);
                return (
                  <section key={categoryId} aria-labelledby={`cat-${categoryId}`}>
                    <h2
                      id={`cat-${categoryId}`}
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-white"
                    >
                      <span>{category?.icon}</span>
                      {category?.label}
                      <span className="font-medium text-ink-400">{groupItems.length}</span>
                    </h2>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {groupItems.map((item) => (
                        <li key={item.id}>
                          <ItemCard item={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      to={`/wardrobe/${item.id}`}
      className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-ice/50"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-700">
        <ItemThumb
          item={item}
          className="size-full transition duration-300 group-hover:scale-105"
        />
        {item.condition === 'retired' && (
          <span className="absolute top-2 left-2 rounded-md bg-ink-950/80 px-2 py-0.5 text-[11px] font-semibold text-ink-200">
            Retired
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{itemDisplayName(item)}</p>
          <p className="truncate text-xs text-ink-400">
            {[item.brand, item.size].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <ColorDots colors={item.colors} />
      </div>
    </Link>
  );
}
