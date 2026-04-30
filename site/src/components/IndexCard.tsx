import type { IndexValue } from '@/types';
import Sparkline from './Sparkline';

const INDEX_ORDER = ['Composite', 'AI 50', 'Early but Hot', 'Public Tech'];

const INDEX_COLORS: Record<string, string> = {
  'Composite': '#05C770',
  'AI 50': '#AA99FF',
  'Early but Hot': '#FABD83',
  'Public Tech': '#3355FF',
};

function ChangeChip({ pct }: { pct: number | null }) {
  if (pct == null) {
    return <span className="text-white/20 text-xs font-sans tracking-wide">DAY 1 BASELINE</span>;
  }
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-sans font-medium tabular-nums ${positive ? 'text-cursor' : 'text-ember'}`}>
      {positive ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export default function IndexCards({ indexes }: { indexes: IndexValue[] }) {
  const sorted = INDEX_ORDER
    .map(name => indexes.find(i => i.name === name))
    .filter(Boolean) as IndexValue[];
  const rest = indexes.filter(i => !INDEX_ORDER.includes(i.name));
  const all = [...sorted, ...rest];

  if (all.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-surface-border">
        {INDEX_ORDER.map(name => (
          <div key={name} className="bg-terminal p-5 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-surface-border border border-surface-border">
      {all.map(idx => (
        <div key={idx.index_id} className="bg-terminal p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-sans uppercase tracking-widest font-medium"
              style={{ color: INDEX_COLORS[idx.name] ?? '#ffffff80' }}
            >
              {idx.name}
            </span>
            <ChangeChip pct={idx.change_pct} />
          </div>
          <span className="font-serif italic text-white text-4xl leading-none tabular-nums">
            {idx.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </span>
          <Sparkline data={idx.sparkline} color={INDEX_COLORS[idx.name] ?? '#05C770'} />
        </div>
      ))}
    </div>
  );
}
