import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CompanyLogo from '@/components/CompanyLogo';
import CareersLink from '@/components/CareersLink';
import MiniTrendChart from '@/components/MiniTrendChart';
import { getCompanyBySlug, getCompanyTimeSeries } from '@/lib/queries';
import { slugify } from '@/lib/slug';

export const revalidate = 3600;

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="space-y-1">
      <p className="text-white/40 text-[11px] font-sans uppercase tracking-[0.18em]">{label}</p>
      <p className="font-sans text-canvas text-base md:text-lg">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = await getCompanyBySlug(params.slug);
  if (!company) notFound();

  const trend = await getCompanyTimeSeries(company.id, 90);

  const categories = (Object.entries(company.by_category) as [string, number][])
    .filter(([cat]) => cat !== 'Other')
    .sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] ?? 1;

  // Compute 30-day delta from the trend so the company page mirrors the hero
  const latest = trend[trend.length - 1]?.total ?? company.total_open;
  const monthAgoIdx = Math.max(0, trend.length - 31);
  const monthAgo = trend[monthAgoIdx]?.total ?? 0;
  const delta_30d_pct = monthAgo > 0 ? ((latest - monthAgo) / monthAgo) * 100 : null;
  const positive = (delta_30d_pct ?? 0) >= 0;

  const hasStats =
    company.last_funding_stage || company.employee_count != null || company.region;

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-12">

        <Link href="/" className="inline-flex items-center gap-1 text-white/40 hover:text-canvas text-sm font-sans transition-colors">
          ← Back to the index
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <CompanyLogo
              name={company.name}
              careersUrl={company.careers_url}
              size={72}
              className="border border-surface-border"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="font-serif italic text-canvas text-5xl md:text-6xl leading-none">
                  {company.name}
                </h1>
                <CareersLink
                  href={company.careers_url}
                  label={`${company.name} careers page`}
                  className="text-base"
                />
              </div>
              {company.indexes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {company.indexes.map(idx => (
                    <span key={idx} className="text-[11px] font-sans text-white/50 bg-surface border border-surface-border rounded-full px-2.5 py-0.5">
                      {idx}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs font-sans uppercase tracking-[0.18em] mb-1">Open roles</p>
            <p className="font-serif italic text-aurora text-6xl leading-none tabular-nums">
              {formatNumber(company.total_open)}
            </p>
            {delta_30d_pct != null && (
              <p className={`font-sans text-sm mt-1 ${positive ? 'text-cursor' : 'text-ember'}`}>
                {positive ? '▲' : '▼'} {Math.abs(delta_30d_pct).toFixed(2)}%
                <span className="text-white/40 ml-1">vs 30d</span>
              </p>
            )}
          </div>
        </header>

        {/* Stats row — only render fields that exist */}
        {hasStats && (
          <section className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Funding stage" value={company.last_funding_stage} />
            <Stat label="Employees" value={company.employee_count} />
            <Stat label="HQ" value={company.region} />
            <Stat label="Tracked since" value={trend[0]?.date ?? null} />
          </section>
        )}

        {/* 90-day hiring trend */}
        <section className="space-y-4">
          <h2 className="text-canvas font-sans font-semibold text-lg">
            Hiring trend <em className="font-serif italic font-normal text-white/60">last 90 days</em>
          </h2>
          <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6">
            <MiniTrendChart data={trend} height={240} />
          </div>
        </section>

        {/* Category breakdown — categories link to /role/[slug] */}
        {categories.length > 0 && (
          <section className="bg-surface border border-surface-border rounded-2xl p-6 space-y-4">
            <h2 className="text-canvas font-sans font-semibold text-sm uppercase tracking-wider">
              Roles by <em className="font-serif italic font-normal text-white/60">category</em>
            </h2>
            <div className="space-y-2.5">
              {categories.map(([cat, count]) => (
                <Link
                  key={cat}
                  href={`/role/${slugify(cat)}`}
                  className="block space-y-1 group"
                >
                  <div className="flex items-baseline justify-between text-sm font-sans">
                    <span className="text-white/80 group-hover:text-aurora transition-colors">{cat}</span>
                    <span className="text-white/40 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aurora rounded-full"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Careers CTA */}
        {company.careers_url && (
          <section className="bg-surface border border-surface-border rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-sans font-medium text-canvas">
                See every role on the <em className="font-serif italic text-aurora">{company.name}</em> careers page
              </p>
              <p className="font-sans text-white/50 text-sm">
                Direct link to where they actually post and accept applications.
              </p>
            </div>
            <a
              href={company.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-aurora text-terminal font-sans text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-cursor transition-colors shrink-0"
            >
              Open careers page ↗
            </a>
          </section>
        )}

      </main>
    </>
  );
}
