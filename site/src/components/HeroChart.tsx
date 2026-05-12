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
import { slugify } from '@/lib/slug';
import type { IndexSeries } from '@/types';

interface Props {
  series: IndexSeries[];   // first item is the "Total" series
}

const INITIAL_CONSTITUENTS = 12;

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatTickDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HeroChart({ series }: Props) {
  const [activeName, setActiveName] = useState(series[0]?.name ?? 'Total');
  const [showAll, setShowAll] = useState(false);

  const active = useMemo(
    () => series.find(s => s.name === activeName) ?? series[0],
    [series, activeName],
  );

  // Reset paginator when toggling indexes
  function selectIndex(name: string) {
    setActiveName(name);
    setShowAll(false);
  }

  if (!active) {
    return (
      <div className="bg-surface border border-surface-border rounded-2xl p-8 h-[420px] animate-pulse" />
    );
  }

  const positive = (active.delta_30d_pct ?? 0) >= 0;
  const deltaColor = positive ? 'text-cursor' : 'text-ember';
  const deltaArrow = positive ? '▲' : '▼';
  const companyCount = active.companies.length;
  const visible = showAll ? active.companies : active.companies.slice(0, INITIAL_CONSTITUENTS);

  return (
    <div className="space-y-10">
      {/* Centered hero block */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="font-serif italic text-canvas text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
          The <span className="text-aurora">Doomberg</span> Terminal
        </h1>
        <p className="text-white/40 text-xs md:text-sm font-sans uppercase tracking-[0.22em]">
          {active.name === 'Total'
            ? `Total open tech roles across ${companyCount} companies`
            : `${active.name} · ${companyCount} ${companyCount === 1 ? 'company' : 'companies'}`}
        </p>
        <div className="flex items-baseline justify-center gap-4 flex-wrap">
          <span className="font-serif italic text-canvas text-8xl md:text-9xl leading-none tabular-nums">
            {formatNumber(active.latest)}
          </span>
          {active.delta_30d_pct != null && (
            <span className={`font-sans font-medium text-base md:text-lg ${deltaColor}`}>
              {deltaArrow} {Math.abs(active.delta_30d_pct).toFixed(2)}%
              <span className="text-white/40 ml-1.5">vs 30d ago</span>
            </span>
          )}
        </div>
        <p className="font-serif italic text-white/70 text-lg md:text-xl">
          We&apos;re not doomed until it&apos;s 0.
        </p>
      </div>

      {/* The graph */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={active.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                formatter={(value: number) => [formatNumber(value), 'Open roles']}
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

      {/* Index toggle chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {series.map(s => {
          const isActive = s.name === active.name;
          const label = s.name === 'Total' ? 'All tech' : s.name;
          const meta = s.name === 'Total'
            ? `${s.companies.length} companies`
            : formatNumber(s.latest);
          return (
            <button
              key={s.name}
              onClick={() => selectIndex(s.name)}
              className={[
                'px-4 py-2 rounded-full text-sm font-sans transition-colors cursor-pointer',
                isActive
                  ? 'bg-aurora text-terminal'
                  : 'bg-surface border border-surface-border text-white/70 hover:text-canvas hover:border-white/30',
              ].join(' ')}
            >
              <span className="font-medium">{label}</span>
              <span className={isActive ? 'text-terminal/60 ml-2' : 'text-white/40 ml-2'}>
                {meta}
              </span>
            </button>
          );
        })}
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
              {showAll
                ? 'Show less'
                : `Show all ${active.companies.length} companies →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
