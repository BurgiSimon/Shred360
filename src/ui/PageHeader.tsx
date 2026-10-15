import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Show a back arrow; `true` goes back in history, a string navigates there. */
  back?: boolean | string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex items-start gap-3 px-4 pt-5 pb-3 sm:px-6">
      {back && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-1 mt-0.5 rounded-lg p-1.5 text-ink-200 hover:bg-ink-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
