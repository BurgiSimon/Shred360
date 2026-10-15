import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card mx-4 flex flex-col items-center gap-3 px-6 py-10 text-center sm:mx-6">
      <div className="text-5xl">{icon}</div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children && <div className="max-w-sm text-sm text-ink-400">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
