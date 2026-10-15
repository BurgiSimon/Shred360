import type { SpecField } from '@/domain/categories';
import type { SpecValue } from '@/domain/types';

/** Human-readable spec value for the detail page. */
export function formatSpec(field: SpecField, value: SpecValue): string {
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'number' && field.unit) return `${value} ${field.unit}`;
  return String(value);
}
