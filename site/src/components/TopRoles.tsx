'use client';

import { useState } from 'react';
import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import type { RoleCategorySummary } from '@/types';

interface Props {
  roles: RoleCategorySummary[];
}

function HoverPreview({ role }: { role: RoleCategorySummary }) {
  const max = role.top_companies[0]?.count ?? 1;
  return (
    <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-surface-raised border border-surface-border rounded-xl shadow-2xl p-4 space-y-2.5 pointer-events-none">
      <p className="text-white/40 text-[10px] font-sans uppercase tracking-[0.18em]">
        Top companies hiring
      </p>
      {role.top_companies.map(co => (
        <div key={co.name} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs font-sans">
            <div className="flex items-center gap-2 min-w-0">
              <CompanyLogo name={co.name} careersUrl={co.careers_url} size={14} />
              <span className="text-white/80 truncate">{co.name}</span>
            </div>
            <span className="text-white/40 tabular-nums">{co.count}</span>
          </div>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-aurora rounded-full"
              style={{ width: `${(co.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TopRoles({ roles }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (roles.length === 0) {
    return null;
  }

  const max = roles[0].total;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {roles.map(role => (
        <Link
          key={role.slug}
          href={`/role/${role.slug}`}
          className="group relative bg-surface border border-surface-border hover:border-aurora/60 rounded-xl p-5 transition-colors"
          onMouseEnter={() => setHovered(role.slug)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-sans font-medium text-canvas text-base group-hover:text-aurora transition-colors">
              {role.category}
            </h3>
            <span className="font-serif italic text-canvas text-3xl leading-none tabular-nums">
              {role.total.toLocaleString()}
            </span>
          </div>
          <p className="text-white/40 text-xs font-sans mt-2">
            across {role.company_count} {role.company_count === 1 ? 'company' : 'companies'}
          </p>
          <div className="h-1 bg-surface-raised rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-aurora rounded-full"
              style={{ width: `${(role.total / max) * 100}%` }}
            />
          </div>

          {hovered === role.slug && <HoverPreview role={role} />}
        </Link>
      ))}
    </div>
  );
}
