'use client';

import { useState } from 'react';
import type { Mover } from '@/types';

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
  onHoverChange: (hovered: boolean) => void;
}

function Chip({ mover, onHoverChange }: ChipProps) {
  const [hovered, setHovered] = useState(false);
  const up = mover.delta > 0;
  const sign = up ? '+' : '';
  const deltaColor = up ? 'text-[#00FF7F]' : 'text-[#FF4D4D]';
  const deltaBg = up ? 'bg-[#00FF7F]/10' : 'bg-[#FF4D4D]/10';
  const arrow = up ? '▲' : '▼';

  function handleEnter() {
    setHovered(true);
    onHoverChange(true);
  }
  function handleLeave() {
    setHovered(false);
    onHoverChange(false);
  }

  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-3 cursor-default select-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="text-white/60 font-mono text-xs font-semibold tracking-wider">
        {ticker(mover.name)}
      </span>
      <span className={`${deltaColor} font-mono text-xs font-semibold`}>
        {arrow}{sign}{mover.delta}
      </span>

      {hovered && (
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap rounded-md bg-[#111] border border-white/10 px-3 py-2 shadow-xl pointer-events-none"
          style={{ minWidth: '160px' }}
        >
          <span className="block text-white font-sans font-semibold text-xs mb-1">
            {mover.name}
          </span>
          <span className="block text-white/50 font-sans text-xs">
            {mover.total_open.toLocaleString()} open roles
          </span>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${deltaColor} ${deltaBg}`}>
            {arrow} {sign}{mover.delta} today
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

  if (movers.length === 0) {
    return (
      <div className="border-b border-surface-border bg-terminal h-9 flex items-center px-6">
        <span className="text-white/20 font-mono text-xs">
          No movers yet — check back after the next scraper run
        </span>
      </div>
    );
  }

  const items = [...movers, ...movers];

  return (
    // overflow-x: clip keeps the scroll clipped horizontally but lets
    // the tooltip escape downward (unlike overflow-hidden which clips both axes)
    <div
      className="border-b border-surface-border bg-terminal h-9 flex items-center relative"
      style={{ overflowX: 'clip', overflowY: 'visible' }}
    >
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: 'ticker-scroll 30s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {items.map((m, i) => (
          <span key={`${m.company_id}-${i}`} className="inline-flex items-center">
            <Chip mover={m} onHoverChange={setPaused} />
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
