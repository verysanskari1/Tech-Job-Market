import Navbar from '@/components/Navbar';
import IndexCards from '@/components/IndexCard';
import CategoryChart from '@/components/CategoryChart';
import CompanyTable from '@/components/CompanyTable';
import {
  getLatestIndexValues,
  getCategoryBreakdown,
  getTopCompanies,
} from '@/lib/queries';

export const revalidate = 3600; // ISR — revalidate every hour

export default async function DashboardPage() {
  const [indexes, categories, companies] = await Promise.all([
    getLatestIndexValues(),
    getCategoryBreakdown(),
    getTopCompanies(20),
  ]);

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-14">

        {/* Hero */}
        <section className="space-y-2">
          <h1 className="font-serif italic text-white text-5xl md:text-6xl leading-tight">
            The Tech Hiring Index
          </h1>
          <p className="text-white/50 font-sans text-base max-w-xl">
            Tracking open roles across 100 companies daily — modelled on how a
            stock market index works.
          </p>
        </section>

        {/* Index cards */}
        <section className="space-y-4">
          <h2 className="text-white/40 text-xs font-sans uppercase tracking-widest">
            Indexes
          </h2>
          <IndexCards indexes={indexes} />
        </section>

        {/* Two-column: chart + table */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Category breakdown */}
          <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
              Roles by Category
            </h2>
            <CategoryChart data={categories} />
          </div>

          {/* Top companies */}
          <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
              Top Companies by Open Roles
            </h2>
            <CompanyTable companies={companies} />
          </div>

        </section>

      </main>
    </>
  );
}
