import NewsPageClient from './NewsPageClient';
import { getNewsFromDB } from '@/lib/queries';
import { getMockNews } from '@/lib/news-mock';

export const revalidate = 3600;

export default async function NewsPage() {
  const dbNews = await getNewsFromDB(200).catch(() => []);
  const news = dbNews.length > 0 ? dbNews : getMockNews();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 md:py-14 space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif italic text-canvas text-4xl md:text-5xl leading-tight">
          News
        </h1>
        <p className="font-sans text-white/50 text-sm md:text-base">
          Hiring-related news across every tracked company. Layoffs,
          funding, product launches, and other moves.
        </p>
      </header>
      <NewsPageClient items={news} />
    </main>
  );
}
