'use client';

import { useState, useCallback } from 'react';
import AiTrendsChart from '@/components/AiTrendsChart';
import TweetModal from '@/components/TweetModal';
import type { AiModelMeta, ChartPoint, TweetRow } from '@/lib/ai-trends-queries';

interface Props {
  models: AiModelMeta[];
  chartData: ChartPoint[];
}

interface ModalState {
  modelSlug: string;
  modelId: number;
  weekIso: string;
  weekLabel: string;
}

export default function AiTrendsClient({ models, chartData }: Props) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [tweets, setTweets] = useState<TweetRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePointClick = useCallback(async (
    modelSlug: string,
    modelId: number,
    weekIso: string,
  ) => {
    const point = chartData.find(d => d.weekIso === weekIso);
    const weekLabel = point?.week ?? weekIso;

    setModal({ modelSlug, modelId, weekIso, weekLabel });
    setTweets([]);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/ai-tweets?modelId=${modelId}&week=${weekIso}&limit=10`
      );
      if (res.ok) {
        const data = await res.json() as TweetRow[];
        setTweets(data);
      }
    } finally {
      setLoading(false);
    }
  }, [chartData]);

  const handleClose = useCallback(() => {
    setModal(null);
    setTweets([]);
  }, []);

  const activeModel = modal ? models.find(m => m.slug === modal.modelSlug) ?? null : null;

  return (
    <>
      <AiTrendsChart
        models={models}
        data={chartData}
        onPointClick={handlePointClick}
      />

      {modal && (
        <TweetModal
          model={activeModel}
          weekLabel={modal.weekLabel}
          tweets={tweets}
          loading={loading}
          onClose={handleClose}
        />
      )}
    </>
  );
}
