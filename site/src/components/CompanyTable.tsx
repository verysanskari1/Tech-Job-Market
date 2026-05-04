'use client';

import { useState } from 'react';
import type { CompanySnapshot } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'AI Engineer':              '#05C770',
  'ML/Research':              '#AA99FF',
  'Backend Engineer':         '#3355FF',
  'Frontend Engineer':        '#C3EDFF',
  'Infrastructure Engineer':  '#FABD83',
  'Data Engineer':            '#FCF283',
  'Security Engineer':        '#D26F6C',
  'Mobile Engineer':          '#AEF96C',
  'Hardware Engineer':        '#DBFFC2',
  'Forward Deployed Engineer':'#05C770',
  'GTM Engineer':             '#FABD83',
  'QA/Test Engineer':         '#E7F8FF',
  'MTS':                      '#AA99FF',
  'New Grad/Junior':          '#FCF283',
};

const COMPANY_DOMAINS: Record<string, string> = {
  'Anthropic':        'anthropic.com',
  'OpenAI':           'openai.com',
  'Cursor':           'cursor.com',
  'Stripe':           'stripe.com',
  'Vercel':           'vercel.com',
  'Linear':           'linear.app',
  'Anduril':          'anduril.com',
  'Ramp':             'ramp.com',
  'Notion':           'notion.so',
  'Palantir':         'palantir.com',
  'Harvey':           'harvey.ai',
  'Scale AI':         'scale.com',
  'Figma':            'figma.com',
  'Discord':          'discord.com',
  'Brex':             'brex.com',
  'Replit':           'replit.com',
  'Airtable':         'airtable.com',
  'Cloudflare':       'cloudflare.com',
  'Datadog':          'datadoghq.com',
  'Databricks':       'databricks.com',
  'Coinbase':         'coinbase.com',
  'Twilio':           'twilio.com',
  'Airbnb':           'airbnb.com',
  'Lyft':             'lyft.com',
  'Okta':             'okta.com',
  'Dropbox':          'dropbox.com',
  'Sarvam AI':        'sarvam.ai',
  'xAI':              'x.ai',
  'Sierra':           'sierra.ai',
  'Gusto':            'gusto.com',
  'Carta':            'carta.com',
  'Lattice':          'lattice.com',
  'Postman':          'postman.com',
  'Descript':         'descript.com',
  'Mercury':          'mercury.com',
  'PhonePe':          'phonepe.com',
  'PostHog':          'posthog.com',
  'Webflow':          'webflow.com',
  'GitLab':           'gitlab.com',
  'Reddit':           'reddit.com',
  'Amplitude':        'amplitude.com',
  'HubSpot':          'hubspot.com',
  'Together AI':      'together.ai',
  'Razorpay':         'razorpay.com',
  'Miro':             'miro.com',
  'Navan':            'navan.com',
  'Glean':            'glean.com',
  'Wiz':              'wiz.io',
  'Grafana Labs':     'grafana.com',
  'DoorDash':         'doordash.com',
  'MongoDB':          'mongodb.com',
  'Atlassian':        'atlassian.com',
  'Mistral':          'mistral.ai',
  'Plaid':            'plaid.com',
  'Meesho':           'meesho.com',
  'Anyscale':         'anyscale.com',
  'Cohere':           'cohere.com',
  'ElevenLabs':       'elevenlabs.io',
  'Character.AI':     'character.ai',
  'Confluent':        'confluent.io',
  'Poolside':         'poolside.ai',
  'Deel':             'deel.com',
  'Writer':           'writer.com',
  'Pinecone':         'pinecone.io',
  'Coda':             'coda.io',
  'Klarna':           'klarna.com',
  'Shopify':          'shopify.com',
  'Canva':            'canva.com',
  'Retool':           'retool.com',
  'Perplexity':       'perplexity.ai',
  'Runway':           'runwayml.com',
  'Groww':            'groww.in',
  'Stability AI':     'stability.ai',
  'Pika':             'pika.art',
  'Inflection AI':    'inflection.ai',
  'Remote':           'remote.com',
  'Carta':            'carta.com',
  'Discord':          'discord.com',
  'Figma':            'figma.com',
  'Gusto':            'gusto.com',
  'Spotify':          'spotify.com',
  'Nvidia':           'nvidia.com',
  'Salesforce':       'salesforce.com',
  'GitHub':           'github.com',
  'Duolingo':         'duolingo.com',
  'Robinhood':        'robinhood.com',
  'Affirm':           'affirm.com',
  'Toast':            'toasttab.com',
  'Intercom':         'intercom.com',
  'Asana':            'asana.com',
  'Box':              'box.com',
};

function topCategory(byCategory: Record<string, number>): string | null {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

function CategoryBar({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex h-1 rounded-full overflow-hidden gap-px mt-1">
      {sorted.map(([cat, count]) => (
        <div
          key={cat}
          style={{ width: `${(count / total) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? '#2E2E3A' }}
          title={`${cat}: ${count}`}
        />
      ))}
    </div>
  );
}

interface Props {
  companies: CompanySnapshot[];
  selectedCategory: string | null;
  search: string;
  onSearch: (s: string) => void;
}

export default function CompanyTable({ companies, selectedCategory, search, onSearch }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = companies
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !selectedCategory || (c.by_category[selectedCategory] ?? 0) > 0)
    .sort((a, b) => {
      if (selectedCategory) {
        return (b.by_category[selectedCategory] ?? 0) - (a.by_category[selectedCategory] ?? 0);
      }
      return b.total_open - a.total_open;
    });

  return (
    <div className="space-y-4">
      {/* Search + filter indicator */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-surface-raised border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm font-sans text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-2 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs font-sans text-white/60">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[selectedCategory] ?? '#fff' }}
            />
            {selectedCategory}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left text-white/30 font-medium pb-3 pr-4 w-8 text-xs uppercase tracking-wider">#</th>
              <th className="text-left text-white/30 font-medium pb-3 pr-4 text-xs uppercase tracking-wider">Company</th>
              <th className="text-right text-white/30 font-medium pb-3 pr-4 text-xs uppercase tracking-wider">
                {selectedCategory ? selectedCategory : 'Open Roles'}
              </th>
              <th className="text-left text-white/30 font-medium pb-3 text-xs uppercase tracking-wider">Top Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((co, i) => {
              const domain = COMPANY_DOMAINS[co.name];
              const top = topCategory(co.by_category);
              const isExpanded = expanded === co.company_id;
              const roleCount = selectedCategory
                ? (co.by_category[selectedCategory] ?? 0)
                : co.total_open;

              return (
                <>
                  <tr
                    key={co.company_id}
                    onClick={() => setExpanded(isExpanded ? null : co.company_id)}
                    className="border-b border-surface-border/40 hover:bg-surface-raised/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 pr-4 text-white/20 tabular-nums">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        {domain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded-sm opacity-80"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-sm bg-surface-raised" />
                        )}
                        <span className="text-white font-medium">{co.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {roleCount > 0 ? (
                        <span className="text-white/80 font-medium">{roleCount.toLocaleString()}</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {top && co.total_open > 0 ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded border border-white/10"
                          style={{ color: CATEGORY_COLORS[top] ?? '#ffffff80', backgroundColor: `${CATEGORY_COLORS[top] ?? '#fff'}12` }}
                        >
                          {top}
                        </span>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                  </tr>
                  {isExpanded && co.total_open > 0 && (
                    <tr key={`${co.company_id}-exp`} className="border-b border-surface-border/40 bg-surface-raised/20">
                      <td colSpan={4} className="px-4 pb-4 pt-2">
                        <CategoryBar byCategory={co.by_category} total={co.total_open} />
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                          {Object.entries(co.by_category)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, count]) => (
                              <span key={cat} className="flex items-center gap-1.5 text-xs font-sans text-white/50">
                                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#2E2E3A' }} />
                                {cat}
                                <span className="text-white/30 tabular-nums">{count}</span>
                              </span>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-white/30 text-sm">
                  No companies match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
