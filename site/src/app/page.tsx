import Navbar from '@/components/Navbar';
import DashboardClient from '@/components/DashboardClient';
import TickerTape from '@/components/TickerTape';
import { getLatestIndexValues, getTopCompanies, getMovers } from '@/lib/queries';

export const revalidate = 3600;

export default async function DashboardPage() {
  const [indexes, allCompanies, movers] = await Promise.all([
    getLatestIndexValues(),
    getTopCompanies(),
    getMovers(),
  ]);

  const lastUpdated = indexes[0]?.captured_at;

  return (
    <>
      <Navbar lastUpdated={lastUpdated} />
      <TickerTape movers={movers} />
      <DashboardClient indexes={indexes} allCompanies={allCompanies} />
    </>
  );
}
