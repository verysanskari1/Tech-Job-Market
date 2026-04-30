import type { IndexValue } from '@/types';

const INDEX_ORDER = ['Composite', 'AI 50', 'Early but Hot', 'Public Tech', 'India-HQ'];

function ChangeChip({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-white/20 text-xs font-sans">Day 1 baseline</span>;

  const positive = pct >= 0;
  const arrow = positive ? '▲' : '▼';
  const colorClass = positive ? 'text-cursor' : 'text-ember';

  return (
    <span className={`text-sm font-sans font-medium ${colorClass}`}>
      {arrow} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export default function IndexCards({ indexes }: { indexes: IndexValue[] }) {
  const sorted = INDEX_ORDER
    .map(name => indexes.find(i => i.name === name))
    .filter(Boolean) as IndexValue[];

  // Append any indexes not in the hardcoded order
  const rest = indexes.filter(i => !INDEX_ORDER.includes(i.name));
  const all = [...sorted, ...rest];

  if (all.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {INDEX_ORDER.map(name => (
          <div key={name} className="bg-surface border border-surface-border rounded-xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {all.map(idx => (
        <div key={idx.index_id} className="bg-surface border border-surface-border rounded-xl p-5 flex flex-col gap-2">
          <span className="text-white/50 text-xs font-sans uppercase tracking-wider">
            {idx.name}
          </span>
          <span className="font-serif italic text-white text-3xl leading-none">
            {idx.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </span>
          <ChangeChip pct={idx.change_pct} />
        </div>
      ))}
    </div>
  );
}
