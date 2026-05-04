'use client';

import { useState, useMemo } from 'react';
import IndexCards from './IndexCard';
import CategoryChart from './CategoryChart';
import CompanyTable from './CompanyTable';
import type { IndexValue, CompanySnapshot } from '@/types';

function computeCategories(companies: CompanySnapshot[]) {
  const totals: Record<string, number> = {};
  for (const co of companies) {
    for (const [cat, count] of Object.entries(co.by_category)) {
      if (cat === 'Other') continue;
      totals[cat] = (totals[cat] ?? 0) + count;
    }
  }
  return Object.entries(totals)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

const CHART_DESCRIPTIONS: Record<string, string> = {
  'Composite':     'Role distribution across all 100 tracked companies. Click any bar to drill in.',
  'AI 50':         'Where the 50 leading AI-native companies are hiring most aggressively.',
  'Early but Hot': 'Role mix at fast-growing pre-IPO startups — a leading indicator of where tech is headed.',
  'Public Tech':   'Hiring priorities at established public tech companies.',
  'India-HQ':      'Role breakdown for top India-headquartered tech companies.',
};

interface Props {
  indexes: IndexValue[];
  allCompanies: CompanySnapshot[];
}

export default function DashboardClient({ indexes, allCompanies }: Props) {
  const [selectedIndex, setSelectedIndex] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredCompanies = useMemo(() => {
    if (selectedIndex === 'ALL') return allCompanies;
    return allCompanies.filter(c => c.indexes.includes(selectedIndex));
  }, [allCompanies, selectedIndex]);

  const categories = useMemo(() => computeCategories(filteredCompanies), [filteredCompanies]);

  const totalRoles = useMemo(() => categories.reduce((s, c) => s + c.count, 0), [categories]);

  const isFiltered = selectedIndex !== 'ALL';

  const chartDescription = isFiltered
    ? CHART_DESCRIPTIONS[selectedIndex]
    : 'Role distribution across all 100 tracked companies. Click any bar to drill in.';

  const visibleCompanyCount = filteredCompanies
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !selectedCategory || (c.by_category[selectedCategory] ?? 0) > 0).length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* Hero */}
      <section>
        <h1 className="font-serif italic text-white text-5xl md:text-6xl leading-tight mb-3">
          The Tech Job Market
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-sans text-white/50">
          <span>
            <span className="text-white font-medium tabular-nums">{totalRoles.toLocaleString()}</span>
            {' '}open roles
          </span>
          <span className="text-surface-border">·</span>
          <span>
            tracking <span className="text-white font-medium tabular-nums">{filteredCompanies.length}</span>
            {' '}companies
          </span>
        </div>
      </section>

      {/* Index hero carousel */}
      <section>
        <IndexCards
          indexes={indexes}
          allCompanies={allCompanies}
          selectedIndex={selectedIndex}
          onSelectIndex={(name) => { setSelectedIndex(name); setSelectedCategory(null); }}
        />
      </section>

      {/* Chart */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
              {isFiltered ? `${selectedIndex} — Hiring by Role Type` : 'Hiring by Role Type'}
            </h2>
            <p className="text-white/40 text-xs font-sans mt-1 max-w-lg">
              {selectedCategory
                ? <>Filtered to <span className="text-white/70">{selectedCategory}</span>
                    <button onClick={() => setSelectedCategory(null)} className="ml-2 text-white/30 hover:text-white/60 transition-colors">✕ clear</button>
                  </>
                : chartDescription
              }
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={() => { setSelectedIndex('ALL'); setSelectedCategory(null); }}
              className="text-white/30 hover:text-white/60 text-xs font-sans border border-surface-border rounded px-3 py-1 transition-colors"
            >
              ✕ Clear index filter
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          <CategoryChart
            data={categories}
            companies={filteredCompanies}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>
      </section>

      {/* Company table */}
      <section className="bg-surface border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
            {selectedCategory
              ? `Companies hiring ${selectedCategory}`
              : isFiltered ? `${selectedIndex} Companies` : 'All Companies'}
          </h2>
          <span className="text-white/30 text-xs font-sans">
            {visibleCompanyCount} companies
          </span>
        </div>
        <CompanyTable
          companies={filteredCompanies}
          selectedCategory={selectedCategory}
          search={search}
          onSearch={setSearch}
          showTopRole={!isFiltered && !selectedCategory}
        />
      </section>

    </main>
  );
}
