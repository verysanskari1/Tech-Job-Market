import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CompanyLogo from '@/components/CompanyLogo';
import { getRoleBySlug } from '@/lib/queries';
import { slugify } from '@/lib/slug';

export const revalidate = 3600;

export default async function RolePage({ params }: { params: { slug: string } }) {
  const role = await getRoleBySlug(params.slug);
  if (!role) notFound();

  const max = role.companies[0]?.count ?? 1;

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 space-y-12">

        <Link href="/" className="inline-flex items-center gap-1 text-white/40 hover:text-canvas text-sm font-sans transition-colors">
          ← Back to the index
        </Link>

        {/* Header */}
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <p className="text-white/40 text-xs md:text-sm font-sans uppercase tracking-[0.22em]">
            Open roles · {role.category}
          </p>
          <h1 className="font-serif italic text-canvas text-5xl md:text-7xl leading-none tabular-nums">
            {role.total.toLocaleString()}
          </h1>
          <p className="font-serif italic text-white/70 text-lg">
            <em>{role.category}</em> roles open right now across{' '}
            <span className="text-aurora not-italic font-sans font-medium">{role.companies.length}</span> companies.
          </p>
        </header>

        {/* CTA strip */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-sans font-medium text-canvas">Practice for {role.category} interviews</p>
            <p className="font-sans text-white/50 text-sm">Get a tailored mock interview based on real role descriptions.</p>
          </div>
          <a
            href={`/interview/role/${role.slug}`}
            className="shrink-0 inline-flex items-center gap-1.5 bg-aurora text-terminal font-sans text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-cursor transition-colors"
          >
            Take a mock interview →
          </a>
        </div>

        {/* Companies hiring */}
        <section className="space-y-3">
          <h2 className="font-sans font-semibold text-canvas text-lg">
            Companies hiring <em className="font-serif italic font-normal text-white/60">right now</em>
          </h2>
          <div className="bg-surface border border-surface-border rounded-2xl divide-y divide-surface-border">
            {role.companies.map((c, i) => (
              <Link
                key={c.id}
                href={`/company/${slugify(c.name)}`}
                className="flex items-center gap-4 p-4 md:p-5 hover:bg-surface-raised/30 transition-colors group"
              >
                <span className="text-white/30 text-sm font-sans tabular-nums w-6">{i + 1}</span>
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
                <span className="font-sans text-white/70 text-sm tabular-nums">
                  {c.count} {c.count === 1 ? 'role' : 'roles'}
                </span>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
