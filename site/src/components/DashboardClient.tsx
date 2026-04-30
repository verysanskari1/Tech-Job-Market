'use client';

import { useState, useMemo } from 'react';
import IndexCards from './IndexCard';
import CategoryChart from './CategoryChart';
import CompanyTable from './CompanyTable';
import type { IndexValue, CompanySnapshot } from '@/types';

const INDEX_FILTERS = ['ALL', 'AI 50', 'Early but Hot', 'Public Tech', 'Composite'];

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
  const totalCompanies = allCompanies.length;
  const activeCompanies = allCompanies.filter(c => c.total_open > 0).length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* Hero */}
      <section>
        <h1 className="font-serif italic text-white text-5xl md:text-6xl leading-tight mb-3">
          The Tech Hiring Index
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-sans text-white/50">
          <span>
            <span className="text-white font-medium tabular-nums">{totalRoles.toLocaleString()}</span>
            {' '}open engineering roles
          </span>
          <span className="text-surface-border">·</span>
          <span>
            <span className="text-white font-medium tabular-nums">{activeCompanies}</span>
            {' '}of{' '}
            <span className="text-white font-medium tabular-nums">{totalCompanies}</span>
            {' '}companies hiring
          </span>
          <span className="text-surface-border">·</span>
          <span className="text-white/30">Non-engineering roles excluded</span>
        </div>
      </section>

      {/* Index cards */}
      <section className="space-y-2">
        <p className="text-white/30 text-xs font-sans uppercase tracking-widest">Indexes</p>
        <IndexCards indexes={indexes} />
        <p className="text-white/20 text-xs font-sans">
          Base = 1,000 on first snapshot · % change appears from day 2
        </p>
      </section>

      {/* Chart + index filter */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
              Roles by Category
            </h2>
            {selectedCategory && (
              <p className="text-white/40 text-xs font-sans mt-0.5">
                Showing companies with <span className="text-white/70">{selectedCategory}</span> roles
                <button onClick={() => setSelectedCategory(null)} className="ml-2 text-white/30 hover:text-white/60 transition-colors">✕ clear</button>
              </p>
            )}
          </div>
          {/* Index filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {INDEX_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setSelectedIndex(f); setSelectedCategory(null); }}
                className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
                  selectedIndex === f
                    ? 'bg-cursor/20 text-cursor border border-cursor/40'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          <CategoryChart
            data={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>
      </section>

      {/* Company table */}
      <section className="bg-surface border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
            {selectedCategory ? `Companies — ${selectedCategory}` : 'All Companies'}
          </h2>
          <span className="text-white/30 text-xs font-sans">
            {selectedIndex !== 'ALL' ? selectedIndex : 'All indexes'} ·{' '}
            {allCompanies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
              .filter(c => !selectedCategory || (c.by_category[selectedCategory] ?? 0) > 0).length} companies
          </span>
        </div>
        <CompanyTable
          companies={allCompanies}
          selectedCategory={selectedCategory}
          search={search}
          onSearch={setSearch}
        />
      </section>

    </main>
  );
}
