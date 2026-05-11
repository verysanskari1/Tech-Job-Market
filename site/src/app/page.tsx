import Navbar from '@/components/Navbar';
import HeroChart from '@/components/HeroChart';
import CompanyTable from '@/components/CompanyTable';
import TickerTape from '@/components/TickerTape';
import {
  getAllIndexSeries,
  getTopCompanies,
  getMovers,
} from '@/lib/queries';

export const revalidate = 3600; // ISR — revalidate every hour

export default async function DashboardPage() {
  const [series, companies, movers] = await Promise.all([
    getAllIndexSeries(90),
    getTopCompanies(40),
    getMovers(3),
  ]);

  return (
    <>
      <Navbar />
      <TickerTape movers={movers} />

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14 space-y-16">

        {/* Brand strap-line */}
        <section className="space-y-3">
          <h1 className="font-serif italic text-canvas text-4xl md:text-5xl leading-tight">
            The <span className="text-aurora not-italic font-sans font-medium">Doomberg</span> Index
          </h1>
          <p className="text-white/50 font-sans text-base max-w-2xl">
            A live ticker of open software roles across the companies actually building things.
            Tech isn&apos;t <em className="font-serif italic text-white/80">doomed</em> — until this number is zero.
          </p>
        </section>

        {/* Hero: total roles + chart + toggles + constituents */}
        <HeroChart series={series} />

        {/* Top companies */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-canvas font-sans font-semibold text-lg md:text-xl">
              Top companies <span className="text-white/40 font-normal italic font-serif">by open roles</span>
            </h2>
            <p className="text-white/40 text-xs font-sans uppercase tracking-widest">
              Hover for breakdown · click to drill in
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
