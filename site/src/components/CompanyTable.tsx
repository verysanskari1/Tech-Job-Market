'use client';

import { useState } from 'react';
import type { CompanySnapshot } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'AI Engineer': '#05C770',
  'ML/Research': '#AA99FF',
  'Backend Engineer': '#3355FF',
  'Frontend Engineer': '#C3EDFF',
  'Infrastructure Engineer': '#FABD83',
  'Data Engineer': '#FCF283',
  'Security Engineer': '#D26F6C',
  'Mobile Engineer': '#AEF96C',
  'Hardware Engineer': '#DBFFC2',
  'Forward Deployed Engineer': '#05C770',
  'GTM Engineer': '#FABD83',
  'QA/Test Engineer': '#E7F8FF',
  'MTS': '#AA99FF',
  'New Grad/Junior': '#FCF283',
};

function topCategory(byCategory: Record<string, number>): string {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? '—';
}

function CategoryBreakdown({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return (
    <div className="px-4 pb-3 space-y-2">
      {/* Bar chart */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {sorted.map(([cat, count]) => (
          <div
            key={cat}
            style={{ width: `${(count / total) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? '#2E2E3A' }}
            title={`${cat}: ${count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.slice(0, 6).map(([cat, count]) => (
          <span key={cat} className="flex items-center gap-1.5 text-xs font-sans text-white/60">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#2E2E3A' }} />
            {cat} <span className="text-white/40">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CompanyTable({ companies }: { companies: CompanySnapshot[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (companies.length === 0) {
    return (
      <div className="text-white/30 text-sm font-sans py-8 text-center">No data yet</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left text-white/40 font-medium pb-3 pr-4 w-8">#</th>
            <th className="text-left text-white/40 font-medium pb-3 pr-4">Company</th>
            <th className="text-right text-white/40 font-medium pb-3 pr-4">Open Roles</th>
            <th className="text-left text-white/40 font-medium pb-3">Top Category</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((co, i) => (
            <>
              <tr
                key={co.company_id}
                onClick={() => setExpanded(expanded === co.company_id ? null : co.company_id)}
                className="border-b border-surface-border/50 hover:bg-surface-raised/60 transition-colors cursor-pointer select-none"
              >
                <td className="py-3 pr-4 text-white/30">{i + 1}</td>
                <td className="py-3 pr-4 text-white font-medium flex items-center gap-2">
                  {co.name}
                  {co.total_open === 0 && (
                    <span className="text-white/20 text-xs font-normal">no data</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right text-white/80 tabular-nums">
                  {co.total_open > 0 ? co.total_open.toLocaleString() : '—'}
                </td>
                <td className="py-3">
                  {co.total_open > 0 ? (
                    <span
                      className="border border-surface-border text-white/70 rounded-md px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${CATEGORY_COLORS[topCategory(co.by_category)] ?? '#2E2E3A'}18` }}
                    >
                      {topCategory(co.by_category)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
              {expanded === co.company_id && co.total_open > 0 && (
                <tr key={`${co.company_id}-expanded`} className="bg-surface-raised/30 border-b border-surface-border/50">
                  <td colSpan={4}>
                    <CategoryBreakdown byCategory={co.by_category} total={co.total_open} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
