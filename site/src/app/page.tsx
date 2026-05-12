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
    getAllIndexSeries(90),
    getTopCompanies(40),
    getTopRoles(),
    getMovers(3),
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
              Top roles hiring
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              Click any role to see every company hiring for it.
            </p>
          </div>
          <TopRoles roles={roles.slice(0, 12)} />
        </section>

        {/* Top Companies */}
        <section id="companies" className="space-y-5 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="font-serif italic text-canvas text-3xl md:text-4xl">
              Top companies
            </h2>
            <p className="font-sans text-white/50 text-sm md:text-base">
              The 40 companies with the most open software roles right now.
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
