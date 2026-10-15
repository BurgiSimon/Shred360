import type { ColorRoles } from '@/domain/categories';
import type { ItemColors } from '@/domain/types';
import { contrastText } from '@/lib/color';

type Role = keyof ItemColors;
const ROLES: Role[] = ['primary', 'secondary', 'accent'];

export function ColorRolesField({
  colors,
  roles,
  suggestions,
  onChange,
}: {
  colors: ItemColors;
  roles: ColorRoles;
  /** Swatches extracted from the photo; tapping one fills the next empty role. */
  suggestions: string[];
  onChange: (colors: ItemColors) => void;
}) {
  function applySuggestion(hex: string) {
    const empty = ROLES.find((r) => !colors[r]);
    onChange({ ...colors, [empty ?? 'primary']: hex });
  }

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-ice/30 bg-ice/5 p-3">
          <p className="mb-2 text-xs font-semibold text-ice">From your photo — tap to use</p>
          <div className="flex flex-wrap gap-2" data-testid="color-suggestions">
            {suggestions.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applySuggestion(hex)}
                className="rounded-lg px-3 py-1.5 font-mono text-xs font-semibold ring-1 ring-white/20"
                style={{ backgroundColor: hex, color: contrastText(hex) }}
              >
                {hex}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((role) => {
          const value = colors[role];
          const label = roles[role];
          return (
            <div
              key={role}
              className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/60 p-2"
            >
              {value ? (
                <input
                  type="color"
                  aria-label={`${label} colour`}
                  value={value}
                  onChange={(e) => onChange({ ...colors, [role]: e.target.value })}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onChange({ ...colors, [role]: colors.primary })}
                  className="flex h-11 w-14 items-center justify-center rounded-xl border border-dashed border-ink-600 text-ink-400 hover:text-white"
                  aria-label={`Add ${label} colour`}
                >
                  +
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="font-mono text-xs text-ink-400">
                  {value ?? (role === 'primary' ? '' : 'optional')}
                </p>
              </div>
              {value && role !== 'primary' && (
                <button
                  type="button"
                  className="px-2 text-ink-400 hover:text-white"
                  aria-label={`Clear ${label} colour`}
                  onClick={() => {
                    const next = { ...colors };
                    delete next[role];
                    onChange(next);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
