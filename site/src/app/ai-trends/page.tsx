import Navbar from '@/components/Navbar';
import AiTrendsClient from './AiTrendsClient';
import { getAiModels, getWeeklySentiment, buildChartData } from '@/lib/ai-trends-queries';

export const revalidate = 3600;

export default async function AiTrendsPage() {
  const [models, sentimentRows] = await Promise.all([
    getAiModels(),
    getWeeklySentiment(),
  ]);

  const chartData = buildChartData(models, sentimentRows);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-14">

        <section className="space-y-2">
          <h1 className="font-serif italic text-white text-5xl md:text-6xl leading-tight">
            AI Model Sentiment
          </h1>
          <p className="text-white/50 font-sans text-base max-w-xl">
            Week-over-week Twitter sentiment for the top AI models since 2022.
            Click any data point to see the top tweets from that week.
          </p>
        </section>

        <section className="bg-surface border border-surface-border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
              Sentiment Trend
            </h2>
            <p className="text-white/30 text-xs font-sans">
              Score: −1 (very negative) → +1 (very positive) · sourced from top engaged tweets
            </p>
          </div>
          <AiTrendsClient models={models} chartData={chartData} />
        </section>

      </main>
    </>
  );
}
