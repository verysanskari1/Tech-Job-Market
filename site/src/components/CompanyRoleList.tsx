'use client';

import { useMemo, useState } from 'react';
import type { CompanyRole } from '@/types';

interface Props {
  roles: CompanyRole[];
  companySlug: string;
}

const ALL_CATEGORY = '__all__';

function formatPosted(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompanyRoleList({ roles, companySlug }: Props) {
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of roles) {
      const c = r.category ?? 'Unclassified';
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter(r => {
      const cat = r.category ?? 'Unclassified';
      if (category !== ALL_CATEGORY && cat !== category) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roles, category, search]);

  if (roles.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center">
        <p className="text-white/60 font-sans">No open roles right now.</p>
        <p className="text-white/30 font-sans text-sm mt-1 italic">
          The scraper checks daily — come back tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search role titles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-full px-4 py-2 text-sm font-sans text-canvas placeholder:text-white/30 focus:outline-none focus:border-aurora/60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory(ALL_CATEGORY)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-sans transition-colors',
              category === ALL_CATEGORY
                ? 'bg-aurora text-terminal font-medium'
                : 'bg-surface border border-surface-border text-white/70 hover:text-canvas',
            ].join(' ')}
          >
            All ({roles.length})
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-sans transition-colors',
                category === cat
                  ? 'bg-aurora text-terminal font-medium'
                  : 'bg-surface border border-surface-border text-white/70 hover:text-canvas',
              ].join(' ')}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Role rows */}
      <div className="bg-surface border border-surface-border rounded-2xl divide-y divide-surface-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40 font-sans text-sm">
            No roles match those filters.
          </div>
        ) : (
          filtered.map(role => (
            <div
              key={role.id}
              className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 hover:bg-surface-raised/40 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-sans text-canvas text-sm md:text-base font-medium truncate">
                  {role.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-white/40">
                  {role.category && (
                    <span className="bg-surface-raised border border-surface-border rounded-md px-2 py-0.5 text-white/70">
                      {role.category}
                    </span>
                  )}
                  {role.seniority && <span>{role.seniority}</span>}
                  {role.location && <span>· {role.location}</span>}
                  {role.posted_at && <span>· Posted {formatPosted(role.posted_at)}</span>}
                </div>
              </div>
              <a
                href={`/interview/${companySlug}/${role.id}`}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-aurora text-terminal font-sans text-xs font-semibold px-4 py-2 rounded-full hover:bg-cursor transition-colors"
              >
                Take a mock interview →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
