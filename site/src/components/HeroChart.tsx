'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { slugify } from '@/lib/slug';
import { logoUrl } from '@/lib/logos';
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { IndexSeries } from '@/types';

interface Props {
  series: IndexSeries[];   // first item is the "Total" series
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatTickDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HeroChart({ series }: Props) {
  const [activeName, setActiveName] = useState(series[0]?.name ?? 'Total');
  const active = series.find(s => s.name === activeName) ?? series[0];

  if (!active) {
    return (
      <div className="bg-surface border border-surface-border rounded-2xl p-8 h-[420px] animate-pulse" />
    );
  }

  const positive = (active.delta_30d_pct ?? 0) >= 0;
  const deltaColor = positive ? 'text-cursor' : 'text-ember';
  const deltaArrow = positive ? '▲' : '▼';

  return (
    <div className="space-y-6">
      {/* Hero number + delta */}
      <div className="flex flex-col gap-2">
        <p className="text-white/40 text-xs font-sans uppercase tracking-[0.2em]">
          {active.name === 'Total' ? 'Total open tech roles' : active.name}
        </p>
        <div className="flex items-baseline gap-5 flex-wrap">
          <span className="font-serif italic text-canvas text-7xl md:text-8xl leading-none">
            {formatNumber(active.latest)}
          </span>
          {active.delta_30d_pct != null && (
            <span className={`font-sans font-medium text-base ${deltaColor}`}>
              {deltaArrow} {Math.abs(active.delta_30d_pct).toFixed(2)}% <span className="text-white/40">vs 30d ago</span>
            </span>
          )}
        </div>
        <p className="text-white/60 font-sans text-sm md:text-base max-w-2xl">
          {active.description}
        </p>
      </div>

      {/* The graph */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={active.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#05C770" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#05C770" stopOpacity={0} />
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
                stroke="#05C770"
                strokeWidth={2.5}
                fill="url(#heroFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Index toggle chips */}
      <div className="flex flex-wrap gap-2">
        {series.map(s => {
          const isActive = s.name === active.name;
          return (
            <button
              key={s.name}
              onClick={() => setActiveName(s.name)}
              className={[
                'px-4 py-2 rounded-full text-sm font-sans transition-colors',
                isActive
                  ? 'bg-aurora text-terminal'
                  : 'bg-surface border border-surface-border text-white/70 hover:text-canvas hover:border-white/30',
              ].join(' ')}
            >
              <span className="font-medium">{s.name === 'Total' ? 'All tech' : s.name}</span>
              <span className={isActive ? 'text-terminal/60 ml-2' : 'text-white/40 ml-2'}>
                {formatNumber(s.latest)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Constituents — companies making up the active index */}
      <div className="pt-2">
        <p className="text-white/40 text-[11px] font-sans uppercase tracking-[0.18em] mb-3">
          {active.companies.length} {active.companies.length === 1 ? 'company' : 'companies'}{' '}
          {active.name === 'Total' ? 'tracked' : `in ${active.name}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {active.companies.slice(0, 60).map(c => (
            <Link
              key={c.name}
              href={`/company/${slugify(c.name)}`}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-surface-border hover:border-white/30 transition-colors"
            >
              <Image
                src={logoUrl(c.name)}
                alt=""
                width={16}
                height={16}
                className="rounded-sm bg-canvas/5"
                unoptimized
              />
              <span className="font-sans text-sm text-white/80 group-hover:text-canvas">
                {c.name}
              </span>
              <span className="font-sans text-xs text-white/40">{c.total_open}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

