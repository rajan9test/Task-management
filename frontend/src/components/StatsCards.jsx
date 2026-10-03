const CARDS = [
  { key: 'total', label: 'Total Tasks', accent: 'text-slate-900' },
  { key: 'pending', label: 'Pending', accent: 'text-amber-700' },
  { key: 'completed', label: 'Completed', accent: 'text-green-700' },
  { key: 'highPriority', label: 'High Priority', accent: 'text-red-700' },
];

export default function StatsCards({ stats, isLoading }) {
  return (
    <section aria-label="Task statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((card) => (
        <div key={card.key} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{card.label}</p>
          {isLoading || !stats ? (
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-slate-200" aria-label="Loading" />
          ) : (
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${card.accent}`}>{stats[card.key]}</p>
          )}
        </div>
      ))}
    </section>
  );
}
