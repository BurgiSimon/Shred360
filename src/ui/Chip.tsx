import type { ButtonHTMLAttributes } from 'react';

export function Chip({
  active,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-ice bg-ice/15 text-white'
          : 'border-ink-600 bg-ink-800 text-ink-200 hover:border-ink-400'
      } ${className}`}
      {...props}
    />
  );
}
