import { notFound } from 'next/navigation';
import Link from 'next/link';
import CompanyLogo from '@/components/CompanyLogo';
import CareersLink from '@/components/CareersLink';
import CompanyTrend from '@/components/CompanyTrend';
import { getRoleBySlug, getRoleTimeSeries } from '@/lib/queries';
import { slugify } from '@/lib/slug';

export const revalidate = 3600;

export default async function RolePage({ params }: { params: { slug: string } }) {
  const role = await getRoleBySlug(params.slug);
  if (!role) notFound();

  const trend = await getRoleTimeSeries(role.category, 365);
  const max = role.companies[0]?.count ?? 1;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 space-y-12">

        <Link href="/" className="inline-flex items-center gap-1 text-white/40 hover:text-canvas text-sm font-sans transition-colors">
          ← Back to the index
        </Link>

        {/* Header */}
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <p className="text-white/40 text-xs md:text-sm font-sans uppercase tracking-[0.22em]">
            Open tech roles · {role.category}
          </p>
          <h1 className="font-serif italic text-canvas text-5xl md:text-7xl leading-none tabular-nums">
            {role.total.toLocaleString()}
          </h1>
          <p className="font-serif italic text-white/70 text-lg">
            <em>{role.category}</em> roles open right now across{' '}
            <span className="text-aurora not-italic font-sans font-medium">{role.companies.length}</span> companies.
          </p>
        </header>

        {/* Hiring trend */}
        <section className="space-y-4">
          <h2 className="text-canvas font-sans font-semibold text-lg">
            Hiring trend <em className="font-serif italic font-normal text-white/60">for {role.category}</em>
          </h2>
          <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6">
            <CompanyTrend data={trend} />
          </div>
        </section>

        {/* Companies hiring */}
        <section className="space-y-3">
          <h2 className="font-sans font-semibold text-canvas text-lg">
            Companies hiring <em className="font-serif italic font-normal text-white/60">right now</em>
          </h2>
          <div className="bg-surface border border-surface-border rounded-2xl divide-y divide-surface-border">
            {role.companies.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 md:p-5 hover:bg-surface-raised/30 transition-colors group"
              >
                <span className="text-white/30 text-sm font-sans tabular-nums w-6">{i + 1}</span>
                <Link
                  href={`/company/${slugify(c.name)}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <CompanyLogo name={c.name} careersUrl={c.careers_url} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-canvas font-medium group-hover:text-aurora transition-colors">
                      {c.name}
                    </p>
                    <div className="h-1 bg-surface-raised rounded-full overflow-hidden mt-1.5 max-w-xs">
                      <div
                        className="h-full bg-aurora rounded-full"
                        style={{ width: `${(c.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
                <CareersLink companyName={c.name} href={c.careers_url} />
                <span className="font-sans text-white/70 text-sm tabular-nums shrink-0">
                  {c.count} {c.count === 1 ? 'role' : 'roles'}
                </span>
              </div>
            ))}
          </div>
        </section>

    </main>
  );
}
