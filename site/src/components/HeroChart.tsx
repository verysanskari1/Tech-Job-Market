'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import CompanyLogo from '@/components/CompanyLogo';
import PDoomBar from '@/components/PDoomBar';
import AnimatedCount from '@/components/AnimatedCount';
import { slugify } from '@/lib/slug';
import type { IndexSeries } from '@/types';

interface Props {
  series: IndexSeries[];
}

const INITIAL_CONSTITUENTS = 12;

// Default index — AI-first. Falls back to the first series if AI 50 isn't present.
const DEFAULT_INDEX_NAME = 'AI 50';

// Time range filters. Each defines both the chart slice and the delta period.
// YTD is computed dynamically from Jan 1 of the current year.
type RangeId = '7d' | '1m' | 'ytd';
const RANGE_LABELS: Record<RangeId, string> = {
  '7d':  '7D',
  '1m':  '1M',
  'ytd': 'YTD',
};
const RANGE_DELTA_LABELS: Record<RangeId, string> = {
  '7d':  'vs 7d ago',
  '1m':  'vs 1m ago',
  'ytd': 'vs YTD start',
};

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatTickDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sliceForRange(points: IndexSeries['points'], range: RangeId) {
  if (points.length === 0) return points;
  if (range === '7d')  return points.slice(-7);
  if (range === '1m')  return points.slice(-30);
  // YTD: from Jan 1 of the most recent year present in the data
  const yearStart = `${new Date(points[points.length - 1].date).getFullYear()}-01-01`;
  return points.filter(p => p.date >= yearStart);
}

export default function HeroChart({ series }: Props) {
  // Default to AI 50 — AI-first framing. Falls back to first series.
  const initialName =
    series.find(s => s.name === DEFAULT_INDEX_NAME)?.name ?? series[0]?.name ?? 'Total';

  const [activeName, setActiveName] = useState(initialName);
  const [rangeId, setRangeId] = useState<RangeId>('7d');
  const [showAll, setShowAll] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  const active = useMemo(
    () => series.find(s => s.name === activeName) ?? series[0],
    [series, activeName],
  );

  function selectIndex(name: string) {
    setActiveName(name);
    setShowAll(false);
  }

  // Slice + recompute headline number and delta for the active range.
  const { points, latest, deltaPct } = useMemo(() => {
    if (!active) return { points: [], latest: 0, deltaPct: null as number | null };
    const sliced = sliceForRange(active.points, rangeId);
    const head = sliced[0]?.total ?? 0;
    const tail = sliced[sliced.length - 1]?.total ?? active.latest;
    const pct = head > 0 ? ((tail - head) / head) * 100 : null;
    return { points: sliced, latest: tail, deltaPct: pct };
  }, [active, rangeId]);

  if (!active) {
    return (
      <div className="bg-surface border border-surface-border rounded-2xl p-8 h-[420px] animate-pulse" />
    );
  }

  const positive = (deltaPct ?? 0) >= 0;
  const deltaColor = positive ? 'text-cursor' : 'text-ember';
  const deltaArrow = positive ? '▲' : '▼';
  const companyCount = active.companies.length;
  const visible = showAll ? active.companies : active.companies.slice(0, INITIAL_CONSTITUENTS);

  const focusedIndex = hoveredChip
    ? series.find(s => s.name === hoveredChip) ?? active
    : active;

  return (
    <div className="space-y-10">
      {/* Centered hero block */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <h1 className="font-serif italic text-canvas text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
          The <span className="text-aurora">Doomberg</span> Terminal
        </h1>
        <p className="text-white/40 text-xs md:text-sm font-sans uppercase tracking-[0.22em] flex items-center justify-center gap-2 flex-wrap">
          <span>Open tech roles across</span>
          <span
            key={`count-${active.name}`}
            className="hero-anim inline-flex items-center bg-aurora/10 border border-aurora/30 text-aurora rounded-full px-2.5 py-0.5 normal-case tracking-normal text-xs font-medium tabular-nums"
          >
            {companyCount}
          </span>
          <span
            key={`noun-${active.name}`}
            className="hero-anim inline-flex items-center bg-aurora/10 border border-aurora/30 text-aurora rounded-full px-2.5 py-0.5 normal-case tracking-normal text-xs font-medium"
          >
            {active.noun_phrase}
          </span>
        </p>
        <div className="flex items-baseline justify-center gap-4 flex-wrap">
          <AnimatedCount
            value={latest}
            className="font-serif italic text-canvas text-8xl md:text-9xl leading-none tabular-nums"
          />
          {deltaPct != null && (
            <span className={`font-sans font-medium text-base md:text-lg ${deltaColor}`}>
              {deltaArrow} {Math.abs(deltaPct).toFixed(2)}%
              <span className="text-white/40 ml-1.5">{RANGE_DELTA_LABELS[rangeId]}</span>
            </span>
          )}
        </div>
        <div
          className="flex justify-center"
          title="P(doom) = clamp(0, 1, 0.5 − Δ30d / 30). Hiring up 15% → 0. Flat → 0.5. Hiring down 15% → 1."
        >
          <PDoomBar value={active.p_doom} />
        </div>
      </div>

      {/* Index chips + description — ABOVE the graph */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2">
          {series.map(s => {
            const isActive = s.name === active.name;
            return (
              <button
                key={s.name}
                onClick={() => selectIndex(s.name)}
                onMouseEnter={() => setHoveredChip(s.name)}
                onMouseLeave={() => setHoveredChip(null)}
                title={s.description}
                className={[
                  'px-4 py-2 rounded-full text-sm font-sans transition-colors cursor-pointer',
                  isActive
                    ? 'bg-aurora text-terminal'
                    : 'bg-surface border border-surface-border text-white/70 hover:text-canvas hover:border-white/30',
                ].join(' ')}
              >
                <span className="font-medium">{s.display_name}</span>
                <span className={isActive ? 'text-terminal/60 ml-2' : 'text-white/40 ml-2'}>
                  {s.companies.length}
                </span>
              </button>
            );
          })}
        </div>
        <p
          key={`desc-${focusedIndex.name}`}
          className="hero-anim text-center text-white/50 font-sans text-sm min-h-[1.25rem]"
        >
          {focusedIndex.description}
        </p>
      </div>

      {/* Chart panel with time-range toggle */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6 space-y-4">
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

        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#AEF96C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#AEF96C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2E2E3A" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                stroke="#6B6B7A"
                tick={{ fontSize: 11, fontFamily: 'Satoshi' }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke="#6B6B7A"
                tick={{ fontSize: 11, fontFamily: 'Satoshi' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNumber(v)}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: '#1C1C24',
                  border: '1px solid #2E2E3A',
                  borderRadius: '8px',
                  fontFamily: 'Satoshi',
                  fontSize: '13px',
                  color: '#FFFFFF',
                }}
                labelStyle={{ color: '#9b9bb0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                labelFormatter={formatTickDate}
                formatter={(value: number) => [formatNumber(value), 'Open tech roles']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#AEF96C"
                strokeWidth={2.5}
                fill="url(#heroFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Constituents — top N + show all toggle */}
      <div>
        <div className="flex flex-wrap gap-2 justify-center">
          {visible.map(c => (
            <Link
              key={c.id || c.name}
              href={`/company/${slugify(c.name)}`}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-aurora/60 transition-colors"
            >
              <CompanyLogo name={c.name} careersUrl={c.careers_url} size={16} />
              <span className="font-sans text-sm text-white/80 group-hover:text-canvas">
                {c.name}
              </span>
              <span className="font-sans text-xs text-white/40 tabular-nums">{c.total_open}</span>
            </Link>
          ))}
        </div>
        {active.companies.length > INITIAL_CONSTITUENTS && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAll(v => !v)}
              className="font-sans text-sm text-white/60 hover:text-aurora underline decoration-white/20 hover:decoration-aurora underline-offset-4 transition-colors cursor-pointer"
            >
              {showAll ? 'Show less' : `Show all ${active.companies.length} companies →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
