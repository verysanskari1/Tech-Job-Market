import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import type { NewsItem, NewsCategory } from '@/types';

interface Props {
  items: NewsItem[];
  showCompany?: boolean;
  compact?: boolean;
}

// Category color + label mapping. Layoff = ember (bad), Funding = aurora (good),
// Product = universe (neutral signal), Other = white/50.
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

export default function NewsFeed({ items, showCompany = true, compact = false }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-white/30 text-sm font-sans py-8 text-center">
        No news yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-border">
      {items.map(item => {
        const cat = CATEGORY_META[item.category];
        return (
          <li key={item.id} className={compact ? 'py-3' : 'py-4'}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block space-y-1.5"
            >
              {/* Category + date + source */}
              <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em]">
                <span className={`rounded-full border px-2 py-0.5 font-medium ${cat.classes}`}>
                  {cat.label}
                </span>
                <span className="text-white/30">{formatDate(item.published_at)}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/30">{item.source}</span>
              </div>

              {/* Title */}
              <p className={`font-sans text-canvas group-hover:text-aurora transition-colors leading-snug ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
                {item.title}
              </p>

              {/* Company link */}
              {showCompany && item.company_slug && item.company_name && (
                <div className="pt-0.5">
                  <Link
                    href={`/company/${item.company_slug}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-sans text-white/50 hover:text-canvas transition-colors"
                  >
                    <CompanyLogo name={item.company_name} size={14} />
                    {item.company_name}
                  </Link>
                </div>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
