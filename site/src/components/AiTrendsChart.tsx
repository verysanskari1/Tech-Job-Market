'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Dot,
} from 'recharts';
import type { AiModelMeta, ChartPoint } from '@/lib/ai-trends-queries';

interface Props {
  models: AiModelMeta[];
  data: ChartPoint[];
  onPointClick: (modelSlug: string, modelId: number, weekIso: string) => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: { color: string; name: string; value: number; dataKey: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs font-sans space-y-1 min-w-[160px]">
      <p className="text-white/50 mb-2">{label}</p>
      {payload
        .filter(p => p.value !== undefined)
        .sort((a, b) => b.value - a.value)
        .map(p => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className={p.value >= 0 ? 'text-green-400' : 'text-red-400'}>
              {p.value >= 0 ? '+' : ''}{p.value.toFixed(2)}
            </span>
          </div>
        ))}
      <p className="text-white/30 mt-2 text-[10px]">Click a point to see tweets</p>
    </div>
  );
}

interface ClickableDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  dataKey?: string;
  stroke?: string;
  models: AiModelMeta[];
  onPointClick: Props['onPointClick'];
}

function ClickableDot({ cx, cy, payload, dataKey, stroke, models, onPointClick }: ClickableDotProps) {
  if (!cx || !cy || !payload || !dataKey) return null;
  const slug = String(dataKey);
  const model = models.find(m => m.slug === slug);
  if (!model) return null;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      fill={stroke}
      stroke={stroke}
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => onPointClick(slug, model.id, payload.weekIso)}
    />
  );
}

export default function AiTrendsChart({ models, data, onPointClick }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-white/30 text-sm font-sans">
        No sentiment data yet — run the ai-tweet-scraper actor first.
      </div>
    );
  }

  // Only show every Nth tick so the X axis doesn't crowd
  const tickEvery = Math.max(1, Math.floor(data.length / 12));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <XAxis
          dataKey="week"
          tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'Satoshi, sans-serif' }}
          axisLine={false}
          tickLine={false}
          interval={tickEvery - 1}
        />
        <YAxis
          domain={[-1, 1]}
          tickCount={5}
          tickFormatter={v => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
          tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'Satoshi, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'Satoshi, sans-serif', paddingTop: 12 }}
        />
        {/* Neutral zero line */}
        <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="4 4" />

        {models.map(model => (
          <Line
            key={model.slug}
            type="monotone"
            dataKey={model.slug}
            name={model.display_name}
            stroke={model.color}
            strokeWidth={2}
            dot={(props) => (
              <ClickableDot
                key={`dot-${props.cx}-${props.cy}`}
                {...props}
                models={models}
                onPointClick={onPointClick}
              />
            )}
            activeDot={{ r: 6, strokeWidth: 0, cursor: 'pointer' }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
