import Navbar from '@/components/Navbar';
import DashboardClient from '@/components/DashboardClient';
import { getLatestIndexValues, getTopCompanies } from '@/lib/queries';

export const revalidate = 3600;

export default async function DashboardPage() {
  const [indexes, allCompanies] = await Promise.all([
    getLatestIndexValues(),
    getTopCompanies(),
  ]);

  const lastUpdated = indexes[0]?.captured_at;

  return (
    <>
      <Navbar lastUpdated={lastUpdated} />
      <DashboardClient indexes={indexes} allCompanies={allCompanies} />
    </>
  );
}
