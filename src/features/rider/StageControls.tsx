import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISCIPLINES, type Discipline } from '@/domain/types';
import { RotateIcon } from '@/ui/icons';

const PEEL_LABELS = ['Dressed', 'Shell off', 'Base only'];

export function StageTopBar({
  title,
  subtitle,
  back,
  discipline,
  onDiscipline,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  discipline: Discipline;
  onDiscipline?: (d: Discipline) => void;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 bg-gradient-to-b from-ink-950/70 to-transparent p-3 sm:p-5">
      {back && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(back)}
          className="pointer-events-auto rounded-xl bg-ink-900/70 p-2 text-white backdrop-blur hover:bg-ink-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="truncate text-lg font-extrabold text-white drop-shadow sm:text-2xl">
          {title}
        </h1>
        {subtitle && <div className="text-xs text-ink-200 drop-shadow">{subtitle}</div>}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {onDiscipline && (
          <div
            className="flex rounded-xl bg-ink-900/70 p-1 backdrop-blur"
            role="radiogroup"
            aria-label="Discipline"
          >
            {DISCIPLINES.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={discipline === d.id}
                aria-label={d.label}
                onClick={() => onDiscipline(d.id)}
                className={`rounded-lg px-2.5 py-1.5 text-base transition ${
                  discipline === d.id ? 'bg-ice/25' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {d.icon}
              </button>
            ))}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}

export function StageControls({
  peel,
  onPeel,
  autoRotate,
  onAutoRotate,
  showCards,
  onShowCards,
  extra,
}: {
  peel: number;
  onPeel: (v: number) => void;
  autoRotate: boolean;
  onAutoRotate: (v: boolean) => void;
  showCards?: boolean;
  onShowCards?: (v: boolean) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="card pointer-events-auto flex w-full max-w-md flex-wrap items-center gap-3 px-4 py-3">
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex justify-between text-xs font-semibold text-ink-400">
          <span>Layers</span>
          <span className="text-white">{PEEL_LABELS[Math.round(peel)]}</span>
        </span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={peel}
          onChange={(e) => onPeel(Number(e.target.value))}
          aria-label="Peel layers"
          aria-valuetext={PEEL_LABELS[Math.round(peel)]}
        />
      </label>
      <button
        type="button"
        aria-pressed={autoRotate}
        aria-label="Auto-rotate"
        onClick={() => onAutoRotate(!autoRotate)}
        className={`rounded-xl p-2 transition ${autoRotate ? 'bg-ice/20 text-ice' : 'text-ink-400 hover:text-white'}`}
      >
        <RotateIcon className="size-5" />
      </button>
      {onShowCards && (
        <button
          type="button"
          aria-pressed={showCards}
          onClick={() => onShowCards(!showCards)}
          className={`rounded-xl px-2.5 py-2 text-xs font-bold transition ${
            showCards ? 'bg-ice/20 text-ice' : 'text-ink-400 hover:text-white'
          }`}
        >
          Photos
        </button>
      )}
      {extra}
    </div>
  );
}
