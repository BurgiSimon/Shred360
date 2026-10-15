export function RouteFallback({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10 text-ink-400" role="status">
      <span className="mr-3 size-5 animate-spin rounded-full border-2 border-ink-600 border-t-ice" />
      {label}
    </div>
  );
}
