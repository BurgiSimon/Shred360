import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useItems, useOutfit, useOutfits } from '@/data/hooks';
import { useRepository } from '@/data/RepositoryContext';
import { categoriesForSlot, getCategory } from '@/domain/categories';
import { itemDisplayName } from '@/domain/items';
import { createOutfit, defaultOutfitName, resolveOutfit } from '@/domain/outfits';
import { lookFromResolved } from '@/domain/outfitLook';
import { OUTFIT_SLOTS, SLOT_META, type OutfitSlot } from '@/domain/outfitSlots';
import { CONDITION_TAGS, DISCIPLINES, type Item, type Outfit } from '@/domain/types';
import { Button, ButtonLink } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ColorDots } from '@/ui/ColorDots';
import { EmptyState } from '@/ui/EmptyState';
import { ItemThumb } from '@/ui/ItemThumb';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { FlatRider } from './FlatRider';

/** Keyed by location so each navigation starts from a fresh draft (see NewItemPage). */
export function OutfitEditorPage() {
  const location = useLocation();
  return <OutfitEditorLoader key={`${location.key}${location.pathname}${location.search}`} />;
}

function OutfitEditorLoader() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: existing, loading } = useOutfit(id);
  const { data: items, loading: itemsLoading } = useItems();
  const { data: outfits } = useOutfits();
  const [draft, setDraft] = useState<Outfit>();

  // Initialise the draft once (during render, so there's no flash of an empty form): from the
  // stored outfit when editing, else a fresh one pre-filled with the item we came from (?item=…).
  if (!draft && !itemsLoading) {
    if (id && existing) {
      setDraft(existing);
    } else if (!id) {
      const outfit = createOutfit();
      const seed = items?.find((i) => i.id === params.get('item'));
      const slot = seed && getCategory(seed.categoryId)?.slot;
      if (seed && slot) outfit.slots[slot] = seed.id;
      setDraft(outfit);
    }
  }

  if ((id && loading) || itemsLoading) return <RouteFallback />;
  if (id && !existing) return <EmptyState icon="🤷" title="That outfit doesn't exist anymore" />;
  if (!items?.length) {
    return (
      <>
        <PageHeader title="New outfit" back="/outfits" />
        <EmptyState
          icon="🧥"
          title="Add some gear first"
          action={
            <ButtonLink to="/wardrobe/new" variant="primary">
              Add gear
            </ButtonLink>
          }
        >
          Outfits are built from the gear in your wardrobe.
        </EmptyState>
      </>
    );
  }
  if (!draft) return <RouteFallback />;

  return (
    <OutfitEditor
      draft={draft}
      setDraft={setDraft}
      // Forget the saved draft so a reused page instance starts a new outfit, never overwrites.
      onSaved={() => setDraft(undefined)}
      items={items}
      isNew={!id}
      outfitCount={outfits?.length ?? 0}
    />
  );
}

function OutfitEditor({
  draft,
  setDraft,
  onSaved,
  items,
  isNew,
  outfitCount,
}: {
  draft: Outfit;
  setDraft: (o: Outfit) => void;
  onSaved: () => void;
  items: Item[];
  isNew: boolean;
  outfitCount: number;
}) {
  const repo = useRepository();
  const navigate = useNavigate();
  const [picking, setPicking] = useState<OutfitSlot>();
  const [saving, setSaving] = useState(false);
  const resolved = useMemo(() => resolveOutfit(draft, items), [draft, items]);
  const look = useMemo(() => lookFromResolved(resolved), [resolved]);

  function setSlot(slot: OutfitSlot, itemId: string | undefined) {
    const slots = { ...draft.slots };
    if (itemId) slots[slot] = itemId;
    else delete slots[slot];
    setDraft({ ...draft, slots });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await repo.saveOutfit({
        ...draft,
        name: draft.name.trim() || defaultOutfitName(draft.discipline, outfitCount),
      });
      onSaved();
      navigate(`/outfits/${saved.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={isNew ? 'New outfit' : 'Edit outfit'} back={isNew ? '/outfits' : true} />
      <div className="grid gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card flex items-center gap-4 p-4 lg:flex-col">
            <FlatRider look={look} className="h-44 w-auto shrink-0 lg:h-72" />
            <div className="min-w-0 flex-1 space-y-3 lg:w-full">
              <label className="flex flex-col gap-1">
                Name
                <input
                  value={draft.name}
                  placeholder={defaultOutfitName(draft.discipline, outfitCount)}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <div className="flex gap-2" role="radiogroup" aria-label="Discipline">
                {DISCIPLINES.map((d) => (
                  <Chip
                    key={d.id}
                    role="radio"
                    aria-checked={draft.discipline === d.id}
                    active={draft.discipline === d.id}
                    onClick={() => setDraft({ ...draft, discipline: d.id })}
                  >
                    {d.icon} {d.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CONDITION_TAGS.map((c) => {
              const active = draft.conditions.includes(c.id);
              return (
                <Chip
                  key={c.id}
                  active={active}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      conditions: active
                        ? draft.conditions.filter((x) => x !== c.id)
                        : [...draft.conditions, c.id],
                    })
                  }
                >
                  {c.icon} {c.label}
                </Chip>
              );
            })}
          </div>
        </aside>

        <div className="space-y-2">
          <h2 className="text-xs font-bold tracking-widest text-ink-400 uppercase">Layers</h2>
          <ul className="space-y-2">
            {OUTFIT_SLOTS.map((slot) => {
              const item = resolved[slot];
              const available = items.filter((i) => getCategory(i.categoryId)?.slot === slot);
              return (
                <li key={slot}>
                  <button
                    type="button"
                    onClick={() => setPicking(slot)}
                    className="card flex w-full items-center gap-3 p-2.5 text-left transition hover:border-ice/50"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ink-700">
                      {item ? (
                        <ItemThumb item={item} className="size-full" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xl text-ink-400">
                          {categoriesForSlot(slot)[0]?.icon}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold tracking-wide text-ink-400 uppercase">
                        {SLOT_META[slot].label}
                      </p>
                      <p
                        className={`truncate text-sm font-semibold ${item ? 'text-white' : 'text-ink-400'}`}
                      >
                        {item
                          ? itemDisplayName(item)
                          : available.length
                            ? `Choose · ${available.length} available`
                            : SLOT_META[slot].hint}
                      </p>
                    </div>
                    {item && <ColorDots colors={item.colors} size="md" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="safe-bottom sticky bottom-20 z-20 flex gap-3 rounded-2xl border border-ink-700 bg-ink-900/95 p-3 backdrop-blur sm:bottom-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save & view in 3D'}
            </Button>
          </div>
        </div>
      </div>

      {picking && (
        <SlotPicker
          slot={picking}
          items={items.filter((i) => getCategory(i.categoryId)?.slot === picking)}
          selectedId={draft.slots[picking]}
          onPick={(itemId) => {
            setSlot(picking, itemId);
            setPicking(undefined);
          }}
          onClose={() => setPicking(undefined)}
        />
      )}
    </>
  );
}

function SlotPicker({
  slot,
  items,
  selectedId,
  onPick,
  onClose,
}: {
  slot: OutfitSlot;
  items: Item[];
  selectedId?: string;
  onPick: (itemId: string | undefined) => void;
  onClose: () => void;
}) {
  const meta = SLOT_META[slot];
  const firstCategory = categoriesForSlot(slot)[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose ${meta.label}`}
        className="safe-bottom max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-900 p-4 sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{meta.label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-2 text-2xl text-ink-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          <li>
            <button
              type="button"
              onClick={() => onPick(undefined)}
              className={`flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm font-semibold ${
                !selectedId ? 'border-ice text-white' : 'border-ink-600 text-ink-400'
              }`}
            >
              None
            </button>
          </li>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onPick(item.id)}
                aria-pressed={item.id === selectedId}
                className={`w-full overflow-hidden rounded-xl border-2 text-left ${
                  item.id === selectedId ? 'border-ice' : 'border-transparent'
                }`}
              >
                <ItemThumb item={item} className="aspect-square w-full" />
                <span className="block truncate bg-ink-800 px-2 py-1 text-xs font-semibold text-white">
                  {itemDisplayName(item)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {items.length === 0 && (
          <p className="mt-3 text-sm text-ink-400">
            No {meta.hint.toLowerCase()} in your wardrobe yet.
          </p>
        )}
        {firstCategory && (
          <ButtonLink
            to={`/wardrobe/new?category=${firstCategory.id}`}
            variant="ghost"
            className="mt-3 w-full"
          >
            + Add {meta.hint.toLowerCase()}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
