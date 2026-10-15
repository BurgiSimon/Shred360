import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCategory } from '@/domain/categories';
import { OUTFIT_SLOTS, SLOT_META, type OutfitSlot } from '@/domain/outfitSlots';
import { CONDITION_TAGS, DISCIPLINES, type Discipline } from '@/domain/types';
import { decodeOutfit, ShareLinkError, type SharedOutfit } from '@/share/outfitLink';
import { Brand } from '@/ui/AppLayout';
import { ButtonLink } from '@/ui/Button';
import { ColorDots } from '@/ui/ColorDots';
import { Rider } from '../rider/Rider';
import { RiderStage } from '../rider/RiderStage';
import { StageControls, StageTopBar } from '../rider/StageControls';

/** Read-only 3D view of an outfit someone shared as a link. Needs no local data. */
export default function SharedOutfitPage() {
  const { payload = '' } = useParams();
  const result = useMemo<{ outfit?: SharedOutfit; error?: string }>(() => {
    try {
      return { outfit: decodeOutfit(payload) };
    } catch (e) {
      return {
        error: e instanceof ShareLinkError ? e.message : 'This share link could not be opened.',
      };
    }
  }, [payload]);

  if (!result.outfit) {
    return (
      <div className="snow-bg flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Brand />
        <div className="text-5xl">🌨️</div>
        <h1 className="text-xl font-bold text-white">Lost in the whiteout</h1>
        <p className="max-w-sm text-sm text-ink-400">{result.error}</p>
        <ButtonLink to="/wardrobe" variant="primary">
          Open Shred360
        </ButtonLink>
      </div>
    );
  }
  return <SharedOutfitView outfit={result.outfit} />;
}

function SharedOutfitView({ outfit }: { outfit: SharedOutfit }) {
  const [discipline, setDiscipline] = useState<Discipline>(outfit.discipline);
  const [peel, setPeel] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selected, setSelected] = useState<OutfitSlot>();
  const [showList, setShowList] = useState(false);
  const slots = OUTFIT_SLOTS.filter((s) => outfit.look[s]);
  const discipLabel = DISCIPLINES.find((d) => d.id === outfit.discipline);
  const selectedLook = selected ? outfit.look[selected] : undefined;

  return (
    <div className="relative h-dvh overflow-hidden bg-ink-900">
      <RiderStage autoRotate={autoRotate && !selected} onMissed={() => setSelected(undefined)}>
        <Rider
          look={outfit.look}
          discipline={discipline}
          peel={peel}
          highlightedSlot={selected}
          onSelectSlot={setSelected}
        />
      </RiderStage>

      <StageTopBar
        title={outfit.name || 'Shared outfit'}
        subtitle={
          <>
            {discipLabel?.icon} Shared via <span className="font-bold text-white">Shred360</span>
            {outfit.conditions.length > 0 && (
              <>
                {' · '}
                {outfit.conditions
                  .map((c) => CONDITION_TAGS.find((t) => t.id === c))
                  .map((t) => `${t?.icon} ${t?.label}`)
                  .join('  ')}
              </>
            )}
          </>
        }
        discipline={discipline}
        onDiscipline={setDiscipline}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-3 sm:p-5">
        {selectedLook && selected && (
          <div
            className="card pointer-events-auto flex w-full max-w-md items-center gap-3 p-3"
            role="status"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-ice uppercase">
                {SLOT_META[selected].label}
              </p>
              <p className="truncate font-bold text-white">{selectedLook.label}</p>
              <p className="truncate text-xs text-ink-400">
                {[getCategory(selectedLook.categoryId)?.label, selectedLook.brand]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <ColorDots colors={selectedLook.colors} size="md" />
          </div>
        )}
        {showList && (
          <ul className="card pointer-events-auto max-h-[40vh] w-full max-w-md divide-y divide-ink-700 overflow-y-auto">
            {slots.map((slot) => {
              const g = outfit.look[slot]!;
              return (
                <li key={slot}>
                  <button
                    type="button"
                    onClick={() => setSelected(slot)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-700/50"
                  >
                    <span className="w-20 shrink-0 text-xs font-bold text-ink-400 uppercase">
                      {SLOT_META[slot].label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {g.label}
                      </span>
                      <span className="block truncate text-xs text-ink-400">
                        {getCategory(g.categoryId)?.label}
                      </span>
                    </span>
                    <ColorDots colors={g.colors} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <StageControls
          peel={peel}
          onPeel={setPeel}
          autoRotate={autoRotate}
          onAutoRotate={setAutoRotate}
          extra={
            <button
              type="button"
              aria-pressed={showList}
              onClick={() => setShowList(!showList)}
              className={`rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                showList ? 'bg-ice/20 text-ice' : 'text-ink-400 hover:text-white'
              }`}
            >
              Gear list
            </button>
          }
        />
        <Link
          to="/wardrobe"
          className="pointer-events-auto rounded-full bg-ink-950/70 px-4 py-2 text-xs font-semibold text-ink-200 backdrop-blur hover:text-white"
        >
          Build your own 3D wardrobe with <span className="text-white">Shred</span>
          <span className="text-ice">360</span> →
        </Link>
      </div>
    </div>
  );
}
