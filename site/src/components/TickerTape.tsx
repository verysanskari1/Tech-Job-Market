'use client';

import { useRef, useState } from 'react';
import type { Mover } from '@/types';

// Public companies use real tickers; private ones get 4-letter shorthand
const TICKER_MAP: Record<string, string> = {
  // Public
  'Snowflake': 'SNOW',
  'Databricks': 'DBRK',
  'Coinbase': 'COIN',
  'Spotify': 'SPOT',
  'Stripe': 'STRP',
  'Netflix': 'NFLX',
  'Roblox': 'RBLX',
  'ServiceNow': 'NOW',
  'Workday': 'WDAY',
  'Microsoft': 'MSFT',
  'Apple': 'AAPL',
  'Meta': 'META',
  'Google': 'GOOGL',
  'Salesforce': 'CRM',
  'MongoDB': 'MDB',
  'Cloudflare': 'NET',
  'Datadog': 'DDOG',
  'HashiCorp': 'HCP',
  'Lyft': 'LYFT',
  'Okta': 'OKTA',
  'Twilio': 'TWLO',
  'Atlassian': 'TEAM',
  'Confluent': 'CFLT',
  'GitLab': 'GTLB',
  'UiPath': 'PATH',
  'Samsara': 'IOT',
  'Asana': 'ASAN',
  'Brex': 'BREX',
  // Private — 4-letter shorthand
  'Anthropic': 'ANTH',
  'Cursor': 'CURS',
  'Replit': 'REPL',
  'Vercel': 'VRCL',
  'Linear': 'LNRR',
  'Notion': 'NTON',
  'Figma': 'FGMA',
  'Canva': 'CNVA',
  'Retool': 'RETL',
  'Airtable': 'AIRT',
  'Loom': 'LOOM',
  'Miro': 'MIRO',
  'Rippling': 'RPPL',
  'Wise': 'WISE',
  'HackerRank': 'HKRK',
  'Scale AI': 'SCAI',
  'Cohere': 'COHR',
  'Mistral': 'MSTL',
  'Perplexity': 'PRPL',
  'Harvey': 'HRVY',
  'Glean': 'GLAN',
  'Leapfrog': 'LEAP',
  'Temporal': 'TMPL',
  'dbt Labs': 'DBTL',
  'Hex': 'HEXX',
  'Modal': 'MODL',
  'Weights & Biases': 'WABI',
  'Hugging Face': 'HGFC',
  'Together AI': 'TGTH',
};

function ticker(name: string): string {
  return TICKER_MAP[name] ?? name.slice(0, 4).toUpperCase();
}

interface ChipProps {
  mover: Mover;
}

function Chip({ mover }: ChipProps) {
  const [hovered, setHovered] = useState(false);
  // We only ever receive movers with non-zero delta (filtered server-side).
  const up = mover.delta > 0;
  const sign = up ? '+' : '';
  const color = up ? 'text-[#00FF7F]' : 'text-[#FF4D4D]';
  const tickerColor = up ? 'text-[#00FF7F]/80' : 'text-[#FF4D4D]/80';
  const arrow = up ? '▲' : '▼';

  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-3 cursor-default select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`${tickerColor} font-mono text-xs font-semibold tracking-wider`}>
        {ticker(mover.name)}
      </span>
      <span className={`${color} font-mono text-xs font-semibold`}>
        {arrow}{sign}{mover.delta}
      </span>

      {hovered && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap rounded-md bg-[#1a1a1a] border border-white/10 px-3 py-1.5 text-xs font-sans text-white shadow-lg pointer-events-none flex items-center gap-3">
          <span className="font-semibold">{mover.name}</span>
          <span className="text-white/50 tabular-nums">{mover.total_open.toLocaleString()} open tech roles</span>
          <span className={`${color} font-medium tabular-nums`}>
            {sign}{mover.delta} in 7d
          </span>
        </span>
      )}
    </span>
  );
}

const SEPARATOR = (
  <span className="text-white/15 px-1 select-none">·</span>
);

export default function TickerTape({ movers }: { movers: Mover[] }) {
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  if (movers.length === 0) {
    return (
      <div className="border-b border-surface-border bg-terminal h-9 flex items-center px-6">
        <span className="text-white/20 font-mono text-xs">
          No movers yet. Check back after the next scraper run.
        </span>
      </div>
    );
  }

  // Duplicate the list so the loop is seamless
  const items = [...movers, ...movers];

  return (
    <div
      className="border-b border-surface-border bg-terminal overflow-x-clip h-9 flex items-center relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex items-center whitespace-nowrap"
        style={{
          animation: 'ticker-scroll 150s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {items.map((m, i) => (
          <span key={`${m.company_id}-${i}`} className="inline-flex items-center">
            <Chip mover={m} />
            {SEPARATOR}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
