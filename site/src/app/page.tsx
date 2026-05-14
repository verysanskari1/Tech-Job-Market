import Navbar from '@/components/Navbar';
import HeroChart from '@/components/HeroChart';
import CompanyTable from '@/components/CompanyTable';
import TickerTape from '@/components/TickerTape';
import TopRoles from '@/components/TopRoles';
import {
  getAllIndexSeries,
  getTopCompanies,
  getTopRoles,
  getMovers,
} from '@/lib/queries';

export const revalidate = 3600; // ISR — revalidate every hour

export default async function DashboardPage() {
  const [series, companies, roles, movers] = await Promise.all([
    getAllIndexSeries(365),
    getTopCompanies(999, 7),
    getTopRoles(),
    getMovers(),
  ]);

  return (
    <>
      <Navbar />
      <TickerTape movers={movers} />

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-20">

        {/* Hero (centered): brand, total roles, chart, toggles, constituents */}
        <HeroChart series={series} />

        {/* Top Roles */}
        <section id="roles" className="space-y-5 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="font-serif italic text-canvas text-3xl md:text-4xl">
              Most in demand roles
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              The biggest tech hiring categories across every tracked company.
            </p>
          </div>
          <TopRoles roles={roles.slice(0, 12)} />
        </section>

        {/* Top Companies */}
        <section id="companies" className="space-y-5 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="font-serif italic text-canvas text-3xl md:text-4xl">
              Top companies hiring
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              Every tracked company, ranked by open tech roles right now.
            </p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4 md:p-6">
            <CompanyTable companies={companies} />
          </div>
        </section>

      </main>
    </>
  );
}
