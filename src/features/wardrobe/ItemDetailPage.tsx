import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useItem, useOutfits } from '@/data/hooks';
import { useRepository } from '@/data/RepositoryContext';
import { getCategory } from '@/domain/categories';
import { itemDisplayName } from '@/domain/items';
import { ITEM_CONDITIONS, type Item } from '@/domain/types';
import { colorName } from '@/lib/color';
import { Button, ButtonLink } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { EditIcon, LayersIcon, TrashIcon } from '@/ui/icons';
import { ItemThumb } from '@/ui/ItemThumb';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoImage } from '@/ui/PhotoImage';
import { RouteFallback } from '@/ui/RouteFallback';
import { formatSpec } from './formatSpec';

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const repo = useRepository();
  const { data: item, loading } = useItem(id);
  const { data: outfits } = useOutfits();
  const usedIn = useMemo(
    () => (outfits ?? []).filter((o) => item && Object.values(o.slots).includes(item.id)),
    [outfits, item],
  );

  if (loading) return <RouteFallback />;
  if (!item) {
    return (
      <>
        <PageHeader title="Not found" back="/wardrobe" />
        <EmptyState icon="🤷" title="That item doesn't exist anymore" />
      </>
    );
  }

  const category = getCategory(item.categoryId);
  const name = itemDisplayName(item);

  async function handleDelete() {
    const warning = usedIn.length
      ? `Delete "${name}"? It will also be removed from ${usedIn.length} outfit(s).`
      : `Delete "${name}"?`;
    if (!window.confirm(warning)) return;
    await repo.deleteItem(item!.id);
    navigate('/wardrobe', { replace: true });
  }

  return (
    <>
      <PageHeader
        title={name}
        subtitle={[category?.label, item.brand, item.model].filter(Boolean).join(' · ')}
        back="/wardrobe"
        actions={
          <ButtonLink to={`/wardrobe/${item.id}/edit`} aria-label="Edit item">
            <EditIcon className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </ButtonLink>
        }
      />
      <div className="grid gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Gallery item={item} />
        <div className="space-y-5">
          <Colors item={item} />
          <Facts item={item} />
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-ink-700 px-3 py-1 text-xs font-semibold text-ink-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          {item.notes && (
            <p className="card p-4 text-sm whitespace-pre-wrap text-ink-200">{item.notes}</p>
          )}

          <section className="card p-4">
            <h2 className="mb-2 text-xs font-bold tracking-widest text-ink-400 uppercase">
              In outfits
            </h2>
            {usedIn.length === 0 ? (
              <p className="text-sm text-ink-400">Not in any outfit yet.</p>
            ) : (
              <ul className="space-y-1">
                {usedIn.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/outfits/${o.id}`}
                      className="text-sm font-semibold text-ice hover:underline"
                    >
                      {o.name || 'Untitled outfit'}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink
              to={`/outfits/new?item=${item.id}`}
              variant="primary"
              className="mt-3 w-full"
            >
              <LayersIcon className="size-4" /> Build an outfit with this
            </ButtonLink>
          </section>

          <Button variant="danger" onClick={handleDelete} className="w-full">
            <TrashIcon className="size-4" /> Delete from wardrobe
          </Button>
          {category && (
            <p className="text-center text-xs text-ink-400">
              {category.icon} {category.label}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Gallery({ item }: { item: Item }) {
  if (item.photoIds.length === 0) {
    return <ItemThumb item={item} className="aspect-square w-full rounded-2xl" />;
  }
  const ordered = item.coverPhotoId
    ? [item.coverPhotoId, ...item.photoIds.filter((p) => p !== item.coverPhotoId)]
    : item.photoIds;
  const width = ordered.length > 1 ? 'w-[85%] sm:w-full' : 'w-full';
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {ordered.map((id) => (
        <PhotoImage
          key={id}
          photoId={id}
          variant="full"
          alt={itemDisplayName(item)}
          className={`aspect-square shrink-0 snap-center rounded-2xl bg-ink-800 object-contain ${width}`}
          fallback={
            <div
              className={`aspect-square shrink-0 animate-pulse rounded-2xl bg-ink-800 ${width}`}
            />
          }
        />
      ))}
    </div>
  );
}

function Colors({ item }: { item: Item }) {
  const roles = getCategory(item.categoryId)?.colorRoles;
  const entries = (['primary', 'secondary', 'accent'] as const)
    .map((role) => [roles?.[role] ?? role, item.colors[role]] as const)
    .filter((e): e is readonly [string, string] => Boolean(e[1]));
  return (
    <div className="flex flex-wrap gap-3">
      {entries.map(([label, hex]) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/60 py-1.5 pr-3 pl-1.5"
        >
          <span
            className="size-8 rounded-lg ring-1 ring-white/10"
            style={{ backgroundColor: hex }}
          />
          <span>
            <span className="block text-xs text-ink-400">{label}</span>
            <span className="block text-sm font-semibold text-white capitalize">
              {colorName(hex)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Facts({ item }: { item: Item }) {
  const category = getCategory(item.categoryId);
  const rows: [string, string][] = [];
  if (item.size) rows.push(['Size', item.size]);
  rows.push([
    'Condition',
    ITEM_CONDITIONS.find((c) => c.id === item.condition)?.label ?? item.condition,
  ]);
  for (const field of category?.specs ?? []) {
    const value = item.specs[field.key];
    if (value !== undefined && value !== '') rows.push([field.label, formatSpec(field, value)]);
  }
  if (item.purchase.date) rows.push(['Bought', item.purchase.date]);
  if (item.purchase.price !== undefined) {
    rows.push(['Price', `${item.purchase.price} ${item.purchase.currency ?? ''}`.trim()]);
  }
  if (item.purchase.store) rows.push(['Shop', item.purchase.store]);
  return (
    <dl className="card divide-y divide-ink-700 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-ink-400">{k}</dt>
          <dd className="text-right font-semibold text-white">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
