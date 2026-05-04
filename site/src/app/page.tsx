import Navbar from '@/components/Navbar';
import DashboardClient from '@/components/DashboardClient';
import { getLatestIndexValues, getTopCompanies } from '@/lib/queries';

export const revalidate = 3600;

export default async function DashboardPage() {
  const [indexes, allCompanies] = await Promise.all([
    getLatestIndexValues(),
    getTopCompanies(),
  ]);

  return (
    <>
      <Navbar />
      <DashboardClient indexes={indexes} allCompanies={allCompanies} />
    </>
  );
}
