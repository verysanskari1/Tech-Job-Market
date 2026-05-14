'use client';

import { useMemo, useState } from 'react';
import NewsFeed from '@/components/NewsFeed';
import type { NewsItem, NewsCategory } from '@/types';

interface Props {
  items: NewsItem[];
}

type Filter = 'all' | NewsCategory;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'All'     },
  { id: 'layoff',  label: 'Layoffs' },
  { id: 'funding', label: 'Funding' },
  { id: 'product', label: 'Product' },
  { id: 'other',   label: 'Other'   },
];

export default function NewsPageClient({ items }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, layoff: 0, funding: 0, product: 0, other: 0 };
    for (const i of items) c[i.category] += 1;
    return c;
  }, [items]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter(i => i.category === filter)),
    [items, filter],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const isActive = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-sans transition-colors cursor-pointer',
                isActive
                  ? 'bg-aurora text-terminal font-medium'
                  : 'bg-surface border border-surface-border text-white/70 hover:text-canvas',
              ].join(' ')}
            >
              {f.label} <span className={isActive ? 'text-terminal/60' : 'text-white/40'}>({counts[f.id]})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface border border-surface-border rounded-2xl px-5">
        <NewsFeed items={filtered} />
      </div>
    </div>
  );
}
