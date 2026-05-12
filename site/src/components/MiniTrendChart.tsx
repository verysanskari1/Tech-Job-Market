'use client';

import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TimeSeriesPoint } from '@/types';

interface Props {
  data: TimeSeriesPoint[];
  height?: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatTickDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MiniTrendChart({ data, height = 220 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="bg-surface-raised border border-surface-border rounded-xl flex items-center justify-center text-white/30 font-sans text-sm"
        style={{ height }}
      >
        Not enough history yet.
      </div>
    );
  }

  const gradId = `miniFill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#AEF96C" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#AEF96C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2E2E3A" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTickDate}
            stroke="#6B6B7A"
            tick={{ fontSize: 10, fontFamily: 'Satoshi' }}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
          />
          <YAxis
            stroke="#6B6B7A"
            tick={{ fontSize: 10, fontFamily: 'Satoshi' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#1C1C24',
              border: '1px solid #2E2E3A',
              borderRadius: '8px',
              fontFamily: 'Satoshi',
              fontSize: '12px',
              color: '#FFFFFF',
            }}
            labelStyle={{ color: '#9b9bb0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            labelFormatter={formatTickDate}
            formatter={(value: number) => [formatNumber(value), 'Open roles']}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#AEF96C"
            strokeWidth={2}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
