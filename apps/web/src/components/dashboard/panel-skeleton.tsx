export function PanelSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-8 w-44 animate-pulse rounded-lg bg-ink-100" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-ink-100/80" />
      <div className="h-36 animate-pulse rounded-2xl bg-ink-100/70" />
      <div className="h-52 animate-pulse rounded-2xl bg-ink-100/50" />
    </div>
  );
}
