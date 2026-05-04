'use client';

import { useState, useEffect } from 'react';
import type { IndexValue, CompanySnapshot } from '@/types';
import Sparkline from './Sparkline';

const INDEX_ORDER = ['Composite', 'AI 50', 'Early but Hot', 'Public Tech', 'India-HQ'];

const INDEX_COLORS: Record<string, string> = {
  'Composite':     '#05C770',
  'AI 50':         '#AA99FF',
  'Early but Hot': '#FABD83',
  'Public Tech':   '#3355FF',
  'India-HQ':      '#F87171',
};

const INDEX_DESCRIPTIONS: Record<string, string> = {
  'Composite':     'Every company we track — the broadest view of tech hiring.',
  'AI 50':         '50 leading AI-native companies, from frontier labs to applied AI startups.',
  'Early but Hot': 'Fast-growing pre-IPO startups where hiring signals early momentum.',
  'Public Tech':   'Publicly traded tech companies — established players, real market signal.',
  'India-HQ':      'Top India-headquartered tech companies, including global product unicorns.',
};

interface Props {
  indexes: IndexValue[];
  allCompanies: CompanySnapshot[];
  selectedIndex: string;
  onSelectIndex: (name: string) => void;
}

export default function IndexCards({ indexes, allCompanies, selectedIndex, onSelectIndex }: Props) {
  const sorted = INDEX_ORDER
    .map(name => indexes.find(i => i.name === name))
    .filter(Boolean) as IndexValue[];
  const rest = indexes.filter(i => !INDEX_ORDER.includes(i.name));
  const all = [...sorted, ...rest];

  // Carousel position — default to whichever index is selected, or 0
  const defaultPos = Math.max(0, all.findIndex(i => i.name === selectedIndex));
  const [pos, setPos] = useState(defaultPos);

  // Sync carousel to external selectedIndex changes
  useEffect(() => {
    if (selectedIndex === 'ALL') return;
    const idx = all.findIndex(i => i.name === selectedIndex);
    if (idx >= 0) setPos(idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  if (all.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-8 h-52 animate-pulse" />
    );
  }

  const idx = all[pos];
  const color = INDEX_COLORS[idx.name] ?? '#ffffff80';
  const description = INDEX_DESCRIPTIONS[idx.name] ?? '';
  const isSelected = selectedIndex === idx.name;

  const constituents = allCompanies
    .filter(c => c.indexes.includes(idx.name))
    .sort((a, b) => b.total_open - a.total_open);
  const totalRoles = constituents.reduce((s, c) => s + c.total_open, 0);
  const activeCount = constituents.filter(c => c.total_open > 0).length;

  const prev = () => setPos((pos - 1 + all.length) % all.length);
  const next = () => setPos((pos + 1) % all.length);

  const handleSelect = () => {
    onSelectIndex(isSelected ? 'ALL' : idx.name);
  };

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      {/* Tab strip */}
      <div className="flex border-b border-surface-border overflow-x-auto">
        {all.map((ix, i) => {
          const c = INDEX_COLORS[ix.name] ?? '#ffffff80';
          const active = i === pos;
          return (
            <button
              key={ix.index_id}
              onClick={() => { setPos(i); onSelectIndex(ix.name); }}
              className={`flex-1 min-w-[120px] px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-colors border-b-2 whitespace-nowrap ${
                active ? 'text-white border-current bg-surface-raised/30' : 'text-white/30 border-transparent hover:text-white/60'
              }`}
              style={active ? { color: c, borderColor: c } : {}}
            >
              {ix.name}
            </button>
          );
        })}
      </div>

      {/* Hero */}
      <div className="px-6 pt-5 pb-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-sm font-sans leading-snug">{description}</p>
            <p className="text-white/30 text-xs font-sans mt-1">
              {activeCount} of {constituents.length} companies hiring
              <span className="mx-1.5 text-surface-border">·</span>
              {totalRoles.toLocaleString()} open roles
            </p>
          </div>
          <button
            onClick={handleSelect}
            className={`flex-shrink-0 text-xs font-sans px-3 py-1.5 rounded border transition-colors ${
              isSelected
                ? 'border-current text-current bg-white/5'
                : 'border-surface-border text-white/30 hover:text-white/60 hover:border-white/30'
            }`}
            style={isSelected ? { color, borderColor: color } : {}}
          >
            {isSelected ? '✓ Filtering' : 'Filter to this index'}
          </button>
        </div>

        {/* Value + change */}
        <div className="flex items-baseline gap-3 mt-4 mb-3">
          <span className="font-serif italic text-white text-5xl leading-none tabular-nums">
            {idx.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </span>
          {idx.change_pct != null ? (
            <span className={`text-sm font-sans font-medium tabular-nums ${idx.change_pct >= 0 ? 'text-cursor' : 'text-red-400'}`}>
              {idx.change_pct >= 0 ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}% vs yesterday
            </span>
          ) : (
            <span className="text-white/20 text-sm font-sans">baseline day</span>
          )}
        </div>

        {/* Large sparkline */}
        <div className="mt-2">
          <HeroSparkline data={idx.sparkline} color={color} />
        </div>

        {/* Dot nav */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={prev} className="text-white/20 hover:text-white/60 transition-colors px-1 text-xs">‹</button>
          {all.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPos(i); onSelectIndex(all[i].name); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === pos ? 'bg-white/80 w-3' : 'bg-white/20 hover:bg-white/40'}`}
            />
          ))}
          <button onClick={next} className="text-white/20 hover:text-white/60 transition-colors px-1 text-xs">›</button>
        </div>
      </div>
    </div>
  );
}

function HeroSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="w-full h-px bg-white/10" />
      </div>
    );
  }
  // Use Sparkline with a taller height override
  return <Sparkline data={data} color={color} height={96} />;
}
