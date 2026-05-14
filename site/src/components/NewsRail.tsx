'use client';

import { useState } from 'react';
import Link from 'next/link';
import NewsFeed from '@/components/NewsFeed';
import type { NewsItem } from '@/types';

interface Props {
  items: NewsItem[];
}

// Right rail for the homepage. Collapsible (not sticky) — when collapsed,
// renders as a thin vertical strip with the label rotated. Lives in a flex
// column inside its grid cell so it scrolls naturally with the page.
export default function NewsRail({ items }: Props) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-surface border border-surface-border rounded-2xl hover:border-aurora/60 transition-colors w-10 py-4 flex flex-col items-center gap-2 cursor-pointer"
        title="Expand news"
      >
        <span className="text-aurora text-xs" aria-hidden>›</span>
        <span
          className="text-white/40 text-[10px] font-sans uppercase tracking-[0.2em] mt-2"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          News
        </span>
      </button>
    );
  }

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-baseline gap-2">
          <h2 className="font-sans font-semibold text-canvas text-sm">News</h2>
          <span className="text-white/40 text-[10px] font-sans uppercase tracking-[0.18em]">live</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-white/40 hover:text-canvas text-base leading-none cursor-pointer"
          title="Collapse"
          aria-label="Collapse news rail"
        >
          ›
        </button>
      </header>

      <div className="px-4 max-h-[700px] overflow-y-auto">
        <NewsFeed items={items.slice(0, 12)} compact />
      </div>

      <footer className="px-4 py-3 border-t border-surface-border">
        <Link
          href="/news"
          className="font-sans text-xs text-white/60 hover:text-aurora underline decoration-white/20 hover:decoration-aurora underline-offset-4 transition-colors"
        >
          See all news →
        </Link>
      </footer>
    </div>
  );
}
