import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CompanyLogo from '@/components/CompanyLogo';
import CompanyRoleList from '@/components/CompanyRoleList';
import { getCompanyBySlug, getCompanyRoles } from '@/lib/queries';
import { slugify } from '@/lib/slug';

export const revalidate = 3600;

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = await getCompanyBySlug(params.slug);
  if (!company) notFound();

  const roles = await getCompanyRoles(company.id);

  const categories = (Object.entries(company.by_category) as [string, number][])
    .filter(([cat]) => cat !== 'Other')
    .sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] ?? 1;

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
              <h1 className="font-serif italic text-canvas text-5xl md:text-6xl leading-none">
                {company.name}
              </h1>
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
              {company.total_open.toLocaleString()}
            </p>
          </div>
        </header>

        {/* Category breakdown */}
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

        {/* Role list with mock-interview CTAs */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-canvas font-sans font-semibold text-lg md:text-xl">
              Every open role <span className="text-white/40 font-normal italic font-serif">at {company.name}</span>
            </h2>
            <p className="text-white/40 text-xs font-sans uppercase tracking-widest">
              {roles.length} listed
            </p>
          </div>
          <CompanyRoleList roles={roles} companySlug={company.slug} />
        </section>

      </main>
    </>
  );
}
