import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useItems, useOutfit, usePhotoUrls } from '@/data/hooks';
import { getCategory } from '@/domain/categories';
import { itemCoverPhotoId, itemDisplayName } from '@/domain/items';
import { lookFromResolved } from '@/domain/outfitLook';
import { resolveOutfit } from '@/domain/outfits';
import { OUTFIT_SLOTS, SLOT_META, type OutfitSlot } from '@/domain/outfitSlots';
import type { Discipline } from '@/domain/types';
import { ButtonLink } from '@/ui/Button';
import { ColorDots } from '@/ui/ColorDots';
import { EmptyState } from '@/ui/EmptyState';
import { EditIcon, ShareIcon } from '@/ui/icons';
import { ItemThumb } from '@/ui/ItemThumb';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { encodeOutfit, shareUrl } from '@/share/outfitLink';
import { SharePanel } from '../share/SharePanel';
import { PhotoCards, type PhotoCard } from './PhotoCards';
import { Rider } from './Rider';
import { RiderStage } from './RiderStage';
import { StageControls, StageTopBar } from './StageControls';
import { TurntableDriver, type TurntableRun } from './TurntableDriver';

export default function FitCheckPage() {
  const { id } = useParams();
  const { data: outfit, loading } = useOutfit(id);
  const { data: items, loading: itemsLoading } = useItems();
  const [discipline, setDiscipline] = useState<Discipline>();
  const [peel, setPeel] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCards, setShowCards] = useState(true);
  const [selected, setSelected] = useState<OutfitSlot>();
  const [sharing, setSharing] = useState(false);
  const [turntable, setTurntable] = useState<TurntableRun | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const runTurntable = useCallback(
    (seconds: number, onProgress?: (t: number) => void) =>
      new Promise<void>((resolve) => {
        setSelected(undefined);
        setTurntable({
          id: Date.now(),
          seconds,
          onProgress,
          onDone: () => {
            setTurntable(null);
            resolve();
          },
        });
      }),
    [],
  );

  const resolved = useMemo(
    () => (outfit && items ? resolveOutfit(outfit, items) : {}),
    [outfit, items],
  );
  const look = useMemo(() => lookFromResolved(resolved), [resolved]);
  const photoIds = useMemo(
    () =>
      OUTFIT_SLOTS.map((slot) => resolved[slot] && itemCoverPhotoId(resolved[slot])).filter(
        (p): p is string => Boolean(p),
      ),
    [resolved],
  );
  const urls = usePhotoUrls(photoIds);
  const cards = useMemo<PhotoCard[]>(
    () =>
      OUTFIT_SLOTS.flatMap((slot) => {
        const item = resolved[slot];
        const photo = item && itemCoverPhotoId(item);
        const url = photo && urls[photo];
        return item && url ? [{ slot, url, label: itemDisplayName(item) }] : [];
      }),
    [resolved, urls],
  );

  if (loading || itemsLoading) return <RouteFallback />;
  if (!outfit) {
    return (
      <>
        <PageHeader title="Not found" back="/outfits" />
        <EmptyState icon="🤷" title="That outfit doesn't exist anymore" />
      </>
    );
  }

  const activeDiscipline = discipline ?? outfit.discipline;
  const selectedItem = selected ? resolved[selected] : undefined;
  const title = outfit.name || 'Untitled outfit';

  return (
    <div className="relative h-[calc(100dvh-4.75rem)] overflow-hidden bg-ink-900 sm:h-dvh">
      <RiderStage
        autoRotate={autoRotate && !selected && !turntable}
        onMissed={() => setSelected(undefined)}
        onCanvas={(canvas) => (canvasRef.current = canvas)}
      >
        <TurntableDriver run={turntable} />
        <Rider
          look={look}
          discipline={activeDiscipline}
          peel={peel}
          highlightedSlot={selected}
          onSelectSlot={setSelected}
        />
        {showCards && <PhotoCards cards={cards} selected={selected} onSelect={setSelected} />}
      </RiderStage>

      <StageTopBar
        title={title}
        back="/outfits"
        discipline={activeDiscipline}
        onDiscipline={setDiscipline}
        actions={
          <>
            <ButtonLink
              to={`/outfits/${outfit.id}/edit`}
              aria-label="Edit outfit"
              className="!px-3"
            >
              <EditIcon className="size-4" />
            </ButtonLink>
            <button
              type="button"
              onClick={() => setSharing(true)}
              aria-label="Share outfit"
              className="inline-flex items-center gap-2 rounded-xl bg-ice px-3 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-6px] shadow-ice/60 hover:bg-white"
            >
              <ShareIcon className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </>
        }
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-3 sm:p-5">
        {selectedItem && selected && (
          <div
            className="card pointer-events-auto flex w-full max-w-md items-center gap-3 p-3"
            role="status"
          >
            <ItemThumb item={selectedItem} className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-ice uppercase">
                {SLOT_META[selected].label}
              </p>
              <p className="truncate font-bold text-white">{itemDisplayName(selectedItem)}</p>
              <p className="truncate text-xs text-ink-400">
                {[getCategory(selectedItem.categoryId)?.label, selectedItem.size]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <ColorDots colors={selectedItem.colors} size="md" />
            <Link
              to={`/wardrobe/${selectedItem.id}`}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-ice hover:bg-ink-700"
            >
              Open
            </Link>
          </div>
        )}
        <StageControls
          peel={peel}
          onPeel={setPeel}
          autoRotate={autoRotate}
          onAutoRotate={setAutoRotate}
          showCards={showCards}
          onShowCards={cards.length ? setShowCards : undefined}
        />
      </div>
      {sharing && (
        <SharePanel
          caption={{
            title,
            subtitle: Object.values(look)
              .map((g) => g?.brand)
              .filter((b, i, all): b is string => Boolean(b) && all.indexOf(b) === i)
              .slice(0, 4)
              .join(' · '),
          }}
          getCanvas={() => canvasRef.current}
          link={shareUrl(
            encodeOutfit({
              name: title,
              discipline: activeDiscipline,
              conditions: outfit.conditions,
              look,
            }),
          )}
          onTurntable={runTurntable}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
