import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useItems, useOutfits } from '@/data/hooks';
import { useRepository } from '@/data/RepositoryContext';
import { duplicateOutfit, outfitItemCount, resolveOutfit } from '@/domain/outfits';
import { lookFromResolved } from '@/domain/outfitLook';
import { CONDITION_TAGS, DISCIPLINES, type Item, type Outfit } from '@/domain/types';
import { ButtonLink } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { EditIcon, PlusIcon, TrashIcon } from '@/ui/icons';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { FlatRider } from './FlatRider';

export function OutfitsPage() {
  const { data: outfits, loading } = useOutfits();
  const { data: items, loading: itemsLoading } = useItems();

  if (loading || itemsLoading) return <RouteFallback />;

  return (
    <>
      <PageHeader
        title="Outfits"
        subtitle="Build fits from your real gear, then check them in 3D"
        actions={
          <ButtonLink to="/outfits/new" variant="primary" aria-label="New outfit">
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">New outfit</span>
          </ButtonLink>
        }
      />
      {!outfits?.length ? (
        <EmptyState
          icon="🏂"
          title="No outfits yet"
          action={
            items?.length ? (
              <ButtonLink to="/outfits/new" variant="primary">
                Build your first fit
              </ButtonLink>
            ) : (
              <ButtonLink to="/wardrobe/new" variant="primary">
                Add gear first
              </ButtonLink>
            )
          }
        >
          Combine a jacket, pants, helmet, goggles and gloves into a fit, then spin it around on the
          3D slope.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
          {outfits.map((o) => (
            <li key={o.id}>
              <OutfitCard outfit={o} items={items ?? []} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OutfitCard({ outfit, items }: { outfit: Outfit; items: Item[] }) {
  const repo = useRepository();
  const navigate = useNavigate();
  const look = useMemo(() => lookFromResolved(resolveOutfit(outfit, items)), [outfit, items]);
  const discipline = DISCIPLINES.find((d) => d.id === outfit.discipline);
  const count = outfitItemCount(outfit);

  return (
    <article className="card group relative flex gap-3 overflow-hidden p-3 transition hover:border-ice/50">
      <Link
        to={`/outfits/${outfit.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${outfit.name || 'outfit'} in 3D`}
      />
      <div className="flex w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-ink-700 to-ink-800">
        <FlatRider look={look} className="h-32 w-auto" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="truncate font-bold text-white">{outfit.name || 'Untitled outfit'}</h2>
        <p className="text-xs text-ink-400">
          {discipline?.icon} {discipline?.label} · {count} piece{count === 1 ? '' : 's'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {outfit.conditions.map((c) => {
            const tag = CONDITION_TAGS.find((t) => t.id === c);
            return (
              <span
                key={c}
                className="rounded-full bg-ink-700 px-2 py-0.5 text-[11px] font-semibold text-ink-200"
              >
                {tag?.icon} {tag?.label}
              </span>
            );
          })}
        </div>
        <div className="relative z-10 mt-auto flex gap-1 pt-2">
          <Link
            to={`/outfits/${outfit.id}/edit`}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-700 hover:text-white"
            aria-label="Edit outfit"
          >
            <EditIcon className="size-4" />
          </Link>
          <button
            type="button"
            className="rounded-lg px-2 text-xs font-semibold text-ink-400 hover:bg-ink-700 hover:text-white"
            onClick={async () => {
              const copy = await repo.saveOutfit(duplicateOutfit(outfit));
              navigate(`/outfits/${copy.id}/edit`);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-ink-400 hover:bg-red-500/20 hover:text-red-300"
            aria-label="Delete outfit"
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${outfit.name || 'this outfit'}"? Your gear stays in the wardrobe.`,
                )
              ) {
                void repo.deleteOutfit(outfit.id);
              }
            }}
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
