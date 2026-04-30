import Navbar from '@/components/Navbar';
import IndexCards from '@/components/IndexCard';
import CategoryChart from '@/components/CategoryChart';
import CompanyTable from '@/components/CompanyTable';
import {
  getLatestIndexValues,
  getCategoryBreakdown,
  getTopCompanies,
} from '@/lib/queries';

export const revalidate = 3600;

export default async function DashboardPage() {
  const [indexes, categories, companies] = await Promise.all([
    getLatestIndexValues(),
    getCategoryBreakdown(),
    getTopCompanies(20),
  ]);

  const totalRoles = categories.reduce((sum, c) => sum + c.count, 0);
  const totalCompanies = companies.filter(c => c.total_open > 0).length;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Hero */}
        <section className="space-y-4">
          <h1 className="font-serif italic text-white text-5xl md:text-6xl leading-tight">
            The Tech Hiring Index
          </h1>
          <p className="text-white/50 font-sans text-base max-w-xl">
            Tracking open engineering roles across {totalCompanies} companies daily —
            modelled on how a stock market index works.
          </p>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cursor" />
              <span className="text-white/60 text-sm font-sans">
                <span className="text-white font-medium">{totalRoles.toLocaleString()}</span> open engineering roles
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="text-white/60 text-sm font-sans">
                <span className="text-white font-medium">{companies.length}</span> companies tracked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="text-white/60 text-sm font-sans">
                Non-engineering roles excluded
              </span>
            </div>
          </div>
        </section>

        {/* Index cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white/40 text-xs font-sans uppercase tracking-widest">
              Indexes
            </h2>
            <span className="text-white/30 text-xs font-sans">
              Base = 1,000 · Change % shown after day 2
            </span>
          </div>
          <IndexCards indexes={indexes} />
        </section>

        {/* Two-column: chart + table */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
                Roles by Category
              </h2>
              <span className="text-white/30 text-xs font-sans">{totalRoles.toLocaleString()} total</span>
            </div>
            <CategoryChart data={categories} />
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
                Top Companies
              </h2>
              <span className="text-white/30 text-xs font-sans">by open roles</span>
            </div>
            <CompanyTable companies={companies} />
          </div>

        </section>

      </main>
    </>
  );
}
