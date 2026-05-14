'use client';

import { useMemo, useState } from 'react';
import MiniTrendChart from '@/components/MiniTrendChart';
import type { TimeSeriesPoint } from '@/types';

type RangeId = '7d' | '1m' | 'ytd';
const RANGE_LABELS: Record<RangeId, string> = {
  '7d':  '7D',
  '1m':  '1M',
  'ytd': 'YTD',
};

function sliceForRange(points: TimeSeriesPoint[], range: RangeId): TimeSeriesPoint[] {
  if (points.length === 0) return points;
  if (range === '7d')  return points.slice(-7);
  if (range === '1m')  return points.slice(-30);
  const yearStart = `${new Date(points[points.length - 1].date).getFullYear()}-01-01`;
  return points.filter(p => p.date >= yearStart);
}

interface Props {
  data: TimeSeriesPoint[];
}

export default function CompanyTrend({ data }: Props) {
  const [rangeId, setRangeId] = useState<RangeId>('7d');
  const sliced = useMemo(() => sliceForRange(data, rangeId), [data, rangeId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex bg-terminal border border-surface-border rounded-full p-0.5">
          {(Object.keys(RANGE_LABELS) as RangeId[]).map(r => {
            const isActive = r === rangeId;
            return (
              <button
                key={r}
                onClick={() => setRangeId(r)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer',
                  isActive ? 'bg-aurora text-terminal' : 'text-white/50 hover:text-canvas',
                ].join(' ')}
              >
                {RANGE_LABELS[r]}
              </button>
            );
          })}
        </div>
      </div>
      <MiniTrendChart data={sliced} height={240} />
    </div>
  );
}
