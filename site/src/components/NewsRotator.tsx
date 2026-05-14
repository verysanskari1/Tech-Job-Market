'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import { slugify } from '@/lib/slug';
import type { NewsItem, NewsCategory } from '@/types';

export interface CompanyStat {
  total_open: number;
  delta_7d: number | null;
}

interface Props {
  items: NewsItem[];
  // slug -> { total_open, delta_7d } for the company chip on each card.
  companyStats?: Record<string, CompanyStat>;
}

const CYCLE_MS = 7000;

const CATEGORY_META: Record<NewsCategory, { label: string; classes: string }> = {
  layoff:  { label: 'Layoff',  classes: 'bg-ember/15 text-ember border-ember/30' },
  funding: { label: 'Funding', classes: 'bg-aurora/15 text-aurora border-aurora/30' },
  product: { label: 'Product', classes: 'bg-universe/15 text-[#7790ff] border-universe/40' },
  other:   { label: 'Other',   classes: 'bg-surface-raised text-white/60 border-surface-border' },
};

function formatDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsRotator({ items, companyStats }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length === 0) return;
    const t = setTimeout(() => {
      setIndex(i => (i + 1) % items.length);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [index, paused, items.length]);

  if (items.length === 0) return null;
  const item = items[index];
  const cat = CATEGORY_META[item.category];
  const stat = item.company_slug ? companyStats?.[item.company_slug] : undefined;

  return (
    <div
      className="relative bg-surface border border-surface-border rounded-2xl overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Card content — keyed on index so it animates in on each rotation */}
      <div key={item.id} className="hero-anim p-5 md:p-6 space-y-3">
        {/* Top row: category badge + date + source */}
        <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em] flex-wrap">
          <span className={`rounded-full border px-2 py-0.5 font-medium ${cat.classes}`}>
            {cat.label}
          </span>
          <span className="text-white/30">{formatDate(item.published_at)}</span>
          <span className="text-white/20">·</span>
          <span className="text-white/30">{item.source}</span>
          <span className="text-white/20">·</span>
          <span className="text-white/30">{index + 1} of {items.length}</span>
        </div>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-sans text-canvas hover:text-aurora transition-colors leading-snug text-base md:text-lg font-medium"
        >
          {item.title}
        </a>

        {/* Footer row: company + stats */}
        {item.company_slug && item.company_name && (
          <div className="flex items-center gap-4 flex-wrap pt-1">
            <Link
              href={`/company/${item.company_slug}`}
              className="inline-flex items-center gap-2 text-sm font-sans text-white/70 hover:text-canvas transition-colors"
            >
              <CompanyLogo name={item.company_name} size={18} />
              <span className="font-medium">{item.company_name}</span>
            </Link>
            {stat && (
              <>
                <span className="text-white/20">·</span>
                <span className="font-sans text-sm text-white/50 tabular-nums">
                  {stat.total_open.toLocaleString()} open tech roles
                </span>
                {stat.delta_7d != null && stat.delta_7d !== 0 && (
                  <span
                    className={`font-sans text-xs tabular-nums ${stat.delta_7d > 0 ? 'text-cursor' : 'text-ember'}`}
                  >
                    {stat.delta_7d > 0 ? '▲' : '▼'} {stat.delta_7d > 0 ? '+' : ''}{stat.delta_7d}
                    <span className="text-white/40 ml-1">in 7d</span>
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress bar across the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-border">
        <div
          key={`prog-${item.id}-${paused}`}
          className="h-full bg-aurora origin-left"
          style={{
            animation: `news-progress ${CYCLE_MS}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>

      <style>{`
        @keyframes news-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      {/* Pagination dots (small, in the top-right corner) */}
      <div className="absolute top-3 right-4 flex gap-1">
        {items.slice(0, Math.min(items.length, 10)).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show news ${i + 1}`}
            className={[
              'w-1.5 h-1.5 rounded-full transition-colors',
              i === index % 10 ? 'bg-aurora' : 'bg-white/15 hover:bg-white/30',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
