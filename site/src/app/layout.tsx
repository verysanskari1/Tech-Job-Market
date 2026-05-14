import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import Navbar from '@/components/Navbar';
import TickerTape from '@/components/TickerTape';
import Footer from '@/components/Footer';
import NewsPopup from '@/components/NewsPopup';
import { getMovers, getTopCompanies } from '@/lib/queries';
import { getMockNews } from '@/lib/news-mock';
import { slugify } from '@/lib/slug';
import type { CompanyStat } from '@/components/NewsRotator';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Doomberg Terminal · Live tech hiring tracker',
  description: 'A live ticker of open software roles across the companies actually building things. Tech isn’t doomed until this number is zero.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Navbar + ticker + news popup are global — fetch the data they need here
  // so every page renders them without each page worrying about it.
  const [movers, companies] = await Promise.all([
    getMovers().catch(() => []),
    getTopCompanies(999, 7).catch(() => []),
  ]);
  const news = getMockNews();

  const companyStats: Record<string, CompanyStat> = {};
  for (const co of companies) {
    const trend = co.trend;
    const delta = trend.length >= 2 ? trend[trend.length - 1].total - trend[0].total : null;
    companyStats[slugify(co.name)] = { total_open: co.total_open, delta_7d: delta };
  }

  return (
    <html lang="en" className={newsreader.variable}>
      <body className="bg-terminal text-white font-sans min-h-screen flex flex-col">
        <Navbar />
        <TickerTape movers={movers} />
        <div className="flex-1">{children}</div>
        <NewsPopup items={news} companyStats={companyStats} />
        <Footer />
      </body>
    </html>
  );
}
