'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import type { NewsItem, NewsCategory } from '@/types';
import type { CompanyStat } from '@/components/NewsRotator';

interface Props {
  items: NewsItem[];
  companyStats?: Record<string, CompanyStat>;
}

const ROTATE_MS = 10000;

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

export default function NewsPopup({ items, companyStats }: Props) {
  const [open, setOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);

  // Rotate the headline shown on the collapsed chip — gives a "live ticker"
  // feel even when collapsed. Pauses when expanded.
  useEffect(() => {
    if (open || items.length === 0) return;
    const t = setTimeout(() => setPreviewIdx(i => (i + 1) % items.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [open, previewIdx, items.length]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (items.length === 0) return null;
  const preview = items[previewIdx];

  return (
    <>
      {/* Collapsed: floating notification chip in lower-right of viewport */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-[340px] bg-surface border border-aurora/40 rounded-xl shadow-2xl text-left hover:border-aurora cursor-pointer transition-colors group overflow-hidden"
          title="Open news feed"
        >
          <div key={preview.id} className="hero-anim p-4 space-y-2">
            <p className="font-sans text-sm text-white/90 leading-snug line-clamp-2">
              {preview.title}
            </p>

            {preview.company_name && (() => {
              const stat = preview.company_slug ? companyStats?.[preview.company_slug] : undefined;
              return (
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-sans text-white/50">
                  <span className="font-medium text-white/80">{preview.company_name}</span>
                  {stat && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="tabular-nums">{stat.total_open.toLocaleString()} open tech roles</span>
                      {stat.delta_7d != null && stat.delta_7d !== 0 && (
                        <span
                          className={`tabular-nums ${stat.delta_7d > 0 ? 'text-cursor' : 'text-ember'}`}
                        >
                          {stat.delta_7d > 0 ? '▲' : '▼'} {stat.delta_7d > 0 ? '+' : ''}{stat.delta_7d} in 7d
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Progress bar so users see this thing is rotating */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-border">
            <div
              key={`prog-${preview.id}`}
              className="h-full bg-aurora origin-left"
              style={{
                animation: `news-popup-progress ${ROTATE_MS}ms linear forwards`,
              }}
            />
          </div>

          <style>{`
            @keyframes news-popup-progress {
              from { transform: scaleX(0); }
              to   { transform: scaleX(1); }
            }
          `}</style>
        </button>
      )}

      {/* Expanded: slide-out panel from the right */}
      {open && (
        <>
          {/* Backdrop */}
          <button
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-terminal/60 backdrop-blur-sm cursor-default"
            aria-label="Close news panel"
          />

          {/* Panel */}
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-surface border-l border-surface-border shadow-2xl flex flex-col">
            <header className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div className="space-y-0.5">
                <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-aurora font-medium">
                  News · live
                </p>
                <h2 className="font-serif italic text-canvas text-xl">In the news</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-canvas text-2xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-raised transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-2">
              <ul className="divide-y divide-surface-border">
                {items.map(item => {
                  const cat = CATEGORY_META[item.category];
                  const stat = item.company_slug ? companyStats?.[item.company_slug] : undefined;
                  return (
                    <li key={item.id} className="py-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em]">
                        <span className={`rounded-full border px-2 py-0.5 font-medium ${cat.classes}`}>
                          {cat.label}
                        </span>
                        <span className="text-white/30">{formatDate(item.published_at)}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white/30">{item.source}</span>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-sans text-canvas hover:text-aurora transition-colors leading-snug text-sm"
                      >
                        {item.title}
                      </a>

                      {item.company_slug && item.company_name && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <Link
                            href={`/company/${item.company_slug}`}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1.5 text-xs font-sans text-white/60 hover:text-canvas transition-colors"
                          >
                            <CompanyLogo name={item.company_name} size={14} />
                            <span>{item.company_name}</span>
                          </Link>
                          {stat && (
                            <>
                              <span className="text-white/20 text-xs">·</span>
                              <span className="font-sans text-xs text-white/40 tabular-nums">
                                {stat.total_open.toLocaleString()} open tech roles
                              </span>
                              {stat.delta_7d != null && stat.delta_7d !== 0 && (
                                <span
                                  className={`font-sans text-[11px] tabular-nums ${stat.delta_7d > 0 ? 'text-cursor' : 'text-ember'}`}
                                >
                                  {stat.delta_7d > 0 ? '▲' : '▼'} {stat.delta_7d > 0 ? '+' : ''}{stat.delta_7d}d
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="px-5 py-3 border-t border-surface-border">
              <Link
                href="/news"
                onClick={() => setOpen(false)}
                className="font-sans text-xs text-white/60 hover:text-aurora underline decoration-white/20 hover:decoration-aurora underline-offset-4 transition-colors"
              >
                See full archive →
              </Link>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
