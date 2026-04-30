'use client';

import { useState } from 'react';
import type { IndexValue, CompanySnapshot } from '@/types';
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

function IndexCardItem({ idx, allCompanies }: { idx: IndexValue; allCompanies: CompanySnapshot[] }) {
  const [hovered, setHovered] = useState(false);

  const constituents = allCompanies
    .filter(c => c.indexes.includes(idx.name))
    .sort((a, b) => b.total_open - a.total_open);

  const totalRoles = constituents.reduce((s, c) => s + c.total_open, 0);
  const activeCount = constituents.filter(c => c.total_open > 0).length;

  return (
    <div
      className="bg-terminal p-5 flex flex-col gap-2 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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

      {hovered && constituents.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-surface-raised border border-surface-border rounded-lg p-3 shadow-xl min-w-[220px] max-h-72 overflow-y-auto">
          <p className="text-white/40 text-xs font-sans uppercase tracking-wider mb-2">
            {idx.name} · {activeCount} of {constituents.length} hiring
          </p>
          <p className="text-white/30 text-xs font-sans mb-2 tabular-nums">
            {totalRoles.toLocaleString()} total open roles
          </p>
          <div className="space-y-1">
            {constituents.slice(0, 12).map(co => (
              <div key={co.company_id} className="flex items-center justify-between gap-4">
                <span className="text-white/70 text-xs font-sans">{co.name}</span>
                <span className="text-white/40 text-xs font-sans tabular-nums">
                  {co.total_open > 0 ? co.total_open : '—'}
                </span>
              </div>
            ))}
            {constituents.length > 12 && (
              <p className="text-white/20 text-xs font-sans pt-1">+{constituents.length - 12} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IndexCards({ indexes, allCompanies }: { indexes: IndexValue[]; allCompanies: CompanySnapshot[] }) {
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
        <IndexCardItem key={idx.index_id} idx={idx} allCompanies={allCompanies} />
      ))}
    </div>
  );
}
