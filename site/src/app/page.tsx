import HeroChart from '@/components/HeroChart';
import CompanyTable from '@/components/CompanyTable';
import TopRoles from '@/components/TopRoles';
import SiteSearch from '@/components/SiteSearch';
import {
  getAllIndexSeries,
  getTopCompanies,
  getTopRoles,
} from '@/lib/queries';

export const revalidate = 3600; // ISR — revalidate every hour

export default async function DashboardPage() {
  const [series, companies, roles] = await Promise.all([
    getAllIndexSeries(365),
    getTopCompanies(999, 7),
    getTopRoles(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-20">

      {/* Hero (centered): brand, total roles, chart, toggles, constituents */}
      <HeroChart series={series} />

      {/* Top Roles */}
      <section id="roles" className="space-y-5 scroll-mt-20">
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="font-serif italic text-canvas text-3xl md:text-4xl">
              Most in demand tech roles
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              The biggest tech hiring categories across every tracked company.
            </p>
          </div>
          <div className="max-w-sm">
            <SiteSearch
              roles={roles.map(r => r.category)}
              placeholder="Search a role…"
              size="sm"
            />
          </div>
        </div>
        <TopRoles roles={roles.slice(0, 12)} />
      </section>

      {/* Top Companies */}
      <section id="companies" className="space-y-5 scroll-mt-20">
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="font-serif italic text-canvas text-3xl md:text-4xl">
              Top companies hiring
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              Every tracked company, ranked by open tech roles right now.
            </p>
          </div>
          <div className="max-w-sm">
            <SiteSearch
              companies={companies.map(c => c.name)}
              placeholder="Search a company…"
              size="sm"
            />
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4 md:p-6">
          <CompanyTable companies={companies} />
        </div>
      </section>

    </main>
  );
}
