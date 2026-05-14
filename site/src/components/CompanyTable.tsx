'use client';

import { useState } from 'react';
import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import CareersLink from '@/components/CareersLink';
import Sparkline from '@/components/Sparkline';
import { slugify } from '@/lib/slug';
import type { CompanySnapshot } from '@/types';

function topCategory(byCategory: Record<string, number>): string {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? '—';
}

function topCategories(byCategory: Record<string, number>, n = 5) {
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function HoverPreview({ co }: { co: CompanySnapshot }) {
  const cats = topCategories(co.by_category, 6);
  const max = cats[0]?.[1] ?? 1;
  return (
    <div className="absolute z-30 left-0 top-full mt-2 w-72 bg-surface-raised border border-surface-border rounded-xl shadow-2xl p-4 space-y-3 pointer-events-none">
      <div className="flex items-center gap-3">
        <CompanyLogo name={co.name} careersUrl={co.careers_url} size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-canvas font-sans font-medium text-sm">{co.name}</p>
          <p className="text-white/40 text-xs font-sans">{co.total_open.toLocaleString()} open roles</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {cats.map(([cat, count]) => (
          <div key={cat} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs font-sans">
              <span className="text-white/70 truncate">{cat}</span>
              <span className="text-white/40 tabular-nums">{count}</span>
            </div>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-aurora rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function CompanyTable({ companies }: { companies: CompanySnapshot[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  if (companies.length === 0) {
    return (
      <div className="text-white/30 text-sm font-sans py-8 text-center">
        No data yet.
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pageCompanies = companies.slice(start, start + PAGE_SIZE);
  const endRank = Math.min(start + PAGE_SIZE, companies.length);

  return (
    <div className="overflow-visible space-y-4">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left text-white/40 font-medium pb-3 pr-4 w-8">#</th>
            <th className="text-left text-white/40 font-medium pb-3 pr-4">Company</th>
            <th className="text-right text-white/40 font-medium pb-3 pr-4">Open roles</th>
            <th className="text-left text-white/40 font-medium pb-3 pr-4 hidden md:table-cell">30d</th>
            <th className="text-left text-white/40 font-medium pb-3">Top category</th>
          </tr>
        </thead>
        <tbody>
          {pageCompanies.map((co, i) => (
            <tr
              key={co.company_id}
              className="border-b border-surface-border/50 hover:bg-surface-raised/30 transition-colors relative"
              onMouseEnter={() => setHovered(co.company_id)}
              onMouseLeave={() => setHovered(null)}
            >
              <td className="py-3 pr-4 text-white/30 tabular-nums">{start + i + 1}</td>
              <td className="py-3 pr-4 relative">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/company/${slugify(co.name)}`}
                    className="flex items-center gap-3 text-canvas hover:text-aurora transition-colors group"
                  >
                    <CompanyLogo name={co.name} careersUrl={co.careers_url} size={24} />
                    <span className="font-medium underline decoration-transparent group-hover:decoration-aurora/60 underline-offset-4 transition-colors">
                      {co.name}
                    </span>
                  </Link>
                  <CareersLink companyName={co.name} href={co.careers_url} />
                </div>
                {hovered === co.company_id && <HoverPreview co={co} />}
              </td>
              <td className="py-3 pr-4 text-right text-white/80 tabular-nums">
                {co.total_open.toLocaleString()}
              </td>
              <td className="py-3 pr-4 hidden md:table-cell">
                <Sparkline data={co.trend} width={96} height={28} />
              </td>
              <td className="py-3">
                <Link
                  href={`/role/${slugify(topCategory(co.by_category))}`}
                  className="bg-surface-raised border border-surface-border text-white/70 hover:text-canvas hover:border-white/40 rounded-md px-2 py-0.5 text-xs transition-colors"
                >
                  {topCategory(co.by_category)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-white/40 text-xs font-sans">
            {start + 1}–{endRank} of {companies.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md text-xs font-sans text-white/70 bg-surface-raised border border-surface-border hover:text-canvas hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-white/40 text-xs font-sans tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="px-3 py-1.5 rounded-md text-xs font-sans text-white/70 bg-surface-raised border border-surface-border hover:text-canvas hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
