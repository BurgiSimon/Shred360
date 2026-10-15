import type { ItemColors } from '@/domain/types';

export function ColorDots({ colors, size = 'sm' }: { colors: ItemColors; size?: 'sm' | 'md' }) {
  const list = [colors.primary, colors.secondary, colors.accent].filter(Boolean) as string[];
  const cls = size === 'sm' ? 'size-3.5' : 'size-5';
  return (
    <span className="inline-flex -space-x-1">
      {list.map((c, i) => (
        <span
          key={i}
          className={`${cls} rounded-full ring-2 ring-ink-800`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </span>
  );
}
