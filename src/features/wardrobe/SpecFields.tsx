import type { SpecField } from '@/domain/categories';
import type { SpecValue } from '@/domain/types';

export function SpecFields({
  fields,
  values,
  onChange,
}: {
  fields: readonly SpecField[];
  values: Record<string, SpecValue>;
  onChange: (values: Record<string, SpecValue>) => void;
}) {
  function set(key: string, value: SpecValue | undefined) {
    const next = { ...values };
    if (value === undefined || value === '' || value === false) delete next[key];
    else next[key] = value;
    onChange(next);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `spec-${field.key}`;
        const value = values[field.key];
        switch (field.type) {
          case 'boolean':
            return (
              <label
                key={field.key}
                htmlFor={id}
                className="flex items-center gap-3 rounded-xl border border-ink-700 px-3 py-2.5"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => set(field.key, e.target.checked)}
                />
                {field.label}
              </label>
            );
          case 'select':
            return (
              <label key={field.key} htmlFor={id} className="flex flex-col gap-1">
                {field.label}
                <select
                  id={id}
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => set(field.key, e.target.value)}
                >
                  <option value="">—</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            );
          case 'number':
            return (
              <label key={field.key} htmlFor={id} className="flex flex-col gap-1">
                <span>
                  {field.label} {field.unit && <span className="text-ink-400">({field.unit})</span>}
                </span>
                <input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={field.min}
                  max={field.max}
                  value={typeof value === 'number' ? value : ''}
                  onChange={(e) =>
                    set(field.key, e.target.value === '' ? undefined : Number(e.target.value))
                  }
                />
              </label>
            );
          case 'text':
            return (
              <label key={field.key} htmlFor={id} className="flex flex-col gap-1">
                {field.label}
                <input
                  id={id}
                  type="text"
                  placeholder={field.placeholder}
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              </label>
            );
        }
      })}
    </div>
  );
}
