import {
  CATEGORIES,
  CATEGORY_GROUP_LABELS,
  type CategoryGroup,
  type CategoryId,
} from '@/domain/categories';

const GROUP_ORDER: CategoryGroup[] = ['clothing', 'head', 'hands'];

export function CategoryPicker({
  value,
  onPick,
}: {
  value?: string;
  onPick: (id: CategoryId) => void;
}) {
  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((group) => (
        <section key={group}>
          <h2 className="mb-2 text-xs font-bold tracking-widest text-ink-400 uppercase">
            {CATEGORY_GROUP_LABELS[group]}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.filter((c) => c.group === group).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPick(c.id)}
                aria-pressed={value === c.id}
                className={`card flex items-center gap-3 p-3 text-left transition hover:border-ice/60 ${
                  value === c.id ? 'border-ice bg-ice/10' : ''
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-semibold text-white">{c.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-ink-400">
        Boards, skis, boots and bindings are coming in a later update.
      </p>
    </div>
  );
}
