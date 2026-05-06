'use client';

import { useState } from 'react';
import type { Mover } from '@/types';

// Real tickers for public companies, 4-char shorthand for private
const TICKERS: Record<string, string> = {
  'Anthropic':        'ANTH',
  'OpenAI':           'OPAI',
  'Cursor':           'CURS',
  'Stripe':           'STRP',
  'Vercel':           'VRCL',
  'Linear':           'LNRR',
  'Anduril':          'ANDR',
  'Ramp':             'RAMP',
  'Notion':           'NTON',
  'Palantir':         'PLTR',
  'Harvey':           'HRVY',
  'Scale AI':         'SCAL',
  'Figma':            'FGMA',
  'Discord':          'DCRD',
  'Brex':             'BREX',
  'Replit':           'RPLT',
  'Airtable':         'ARTB',
  'Cloudflare':       'NET',
  'Datadog':          'DDOG',
  'Databricks':       'DBRK',
  'Coinbase':         'COIN',
  'Twilio':           'TWLO',
  'Airbnb':           'ABNB',
  'Lyft':             'LYFT',
  'Okta':             'OKTA',
  'Dropbox':          'DBX',
  'Sarvam AI':        'SRVM',
  'xAI':              'XAI',
  'Sierra':           'SRRA',
  'Gusto':            'GSTO',
  'Carta':            'CRTA',
  'Lattice':          'LTCE',
  'Postman':          'PSTM',
  'Descript':         'DSCP',
  'Mercury':          'MERC',
  'PhonePe':          'PHPE',
  'PostHog':          'PHOG',
  'Webflow':          'WFLW',
  'GitLab':           'GTLB',
  'Reddit':           'RDDT',
  'Amplitude':        'AMPL',
  'HubSpot':          'HUBS',
  'Together AI':      'TGAI',
  'Razorpay':         'RZRP',
  'Miro':             'MIRO',
  'Navan':            'NVAN',
  'Glean':            'GLEAN',
  'Wiz':              'WIZ',
  'Grafana Labs':     'GFNA',
  'DoorDash':         'DASH',
  'MongoDB':          'MDB',
  'Atlassian':        'TEAM',
  'Mistral':          'MSTL',
  'Plaid':            'PLAD',
  'Meesho':           'MESH',
  'Anyscale':         'ANSC',
  'Cohere':           'COHE',
  'ElevenLabs':       'ELVN',
  'Character.AI':     'CHAI',
  'Confluent':        'CFLT',
  'Poolside':         'PLSD',
  'Deel':             'DEEL',
  'Writer':           'WRTR',
  'Pinecone':         'PCNE',
  'Coda':             'CODA',
  'Klarna':           'KLNA',
  'Shopify':          'SHOP',
  'Canva':            'CANV',
  'Retool':           'RTOL',
  'Perplexity':       'PRXY',
  'Runway':           'RNWY',
  'Groww':            'GRWW',
  'Stability AI':     'STAB',
  'Pika':             'PIKA',
  'Inflection AI':    'INFL',
  'Remote':           'RMTE',
  'Spotify':          'SPOT',
  'Nvidia':           'NVDA',
  'Salesforce':       'CRM',
  'GitHub':           'GHUB',
  'Duolingo':         'DUOL',
  'Robinhood':        'HOOD',
  'Affirm':           'AFRM',
  'Toast':            'TOST',
  'Intercom':         'INCM',
  'Asana':            'ASAN',
  'Box':              'BOX',
  'HackerRank':       'HRNK',
  'Snap':             'SNAP',
  'Pinterest':        'PINS',
  'Block':            'SQ',
  'Chime':            'CHME',
  'Supabase':         'SPBS',
  'Temporal':         'TMPL',
  'Elastic':          'ESTC',
  'PagerDuty':        'PD',
  'dbt Labs':         'DBTL',
  'Neon':             'NEON',
  'Modal':            'MODL',
  'Sentry':           'SNTY',
  'LaunchDarkly':     'LDKL',
  'Sourcegraph':      'SRCG',
  'Paytm':            'PAYTM',
  'CRED':             'CRED',
  'Freshworks':       'FRSH',
  'Zepto':            'ZPTO',
};

function TickerChip({ mover }: { mover: Mover }) {
  const [hovered, setHovered] = useState(false);
  const ticker = TICKERS[mover.name] ?? mover.name.slice(0, 4).toUpperCase();
  const isUp = mover.delta > 0;
  const color = isUp ? '#05C770' : '#F87171';
  const arrow = isUp ? '▲' : '▼';

  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-3 cursor-default select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-white/50 text-xs font-mono font-medium tracking-wider">{ticker}</span>
      <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
        {arrow}{Math.abs(mover.delta)}
      </span>
      <span className="text-white/10 text-xs">·</span>

      {hovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none">
          <span className="block text-white text-xs font-sans font-medium">{mover.name}</span>
          <span className="block text-white/40 text-xs font-sans tabular-nums mt-0.5">
            {mover.total_open.toLocaleString()} open roles
            <span className="ml-2" style={{ color }}>
              {arrow} {Math.abs(mover.delta)} today
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

interface Props {
  movers: Mover[];
}

export default function TickerTape({ movers }: Props) {
  const [slow, setSlow] = useState(false);

  if (movers.length === 0) return null;

  // Duplicate for seamless infinite loop
  const items = [...movers, ...movers];

  return (
    <div
      className="border-b border-surface-border bg-terminal overflow-hidden"
      onMouseEnter={() => setSlow(true)}
      onMouseLeave={() => setSlow(false)}
    >
      <div className="flex items-center h-8">
        {/* Label */}
        <div className="flex-shrink-0 px-3 border-r border-surface-border h-full flex items-center">
          <span className="text-white/20 text-xs font-mono uppercase tracking-widest">LIVE</span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden relative">
          <div className={slow ? 'ticker-track-slow' : 'ticker-track'}>
            <span className="inline-flex">
              {items.map((mover, i) => (
                <TickerChip key={`${mover.company_id}-${i}`} mover={mover} />
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
