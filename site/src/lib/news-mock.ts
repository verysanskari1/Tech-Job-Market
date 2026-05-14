import type { NewsItem } from '@/types';

// Mock news. Mirrors the shape we'd get from a real Layoffs.fyi + TechCrunch
// scraper. Dates are deterministic — built from a reference date so the feed
// doesn't drift in dev. Replace with real Supabase reads when the pipeline lands.

const now = new Date('2026-05-14T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_NEWS: NewsItem[] = [
  // ── Layoffs ──
  { id: 'n01', company_slug: 'stripe',     company_name: 'Stripe',     title: 'Stripe lays off 14% of staff in restructuring',                       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'layoff',  published_at: daysAgo(1) },
  { id: 'n02', company_slug: 'lyft',       company_name: 'Lyft',       title: 'Lyft cuts 1,000 jobs as ride volumes plateau',                        url: 'https://layoffs.fyi',        source: 'Layoffs.fyi',    category: 'layoff',  published_at: daysAgo(2) },
  { id: 'n03', company_slug: 'okta',       company_name: 'Okta',       title: 'Okta lays off 7% of workforce, second round this year',               url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'layoff',  published_at: daysAgo(4) },
  { id: 'n04', company_slug: 'twilio',     company_name: 'Twilio',     title: 'Twilio cuts another 5% as it focuses on AI',                           url: 'https://layoffs.fyi',        source: 'Layoffs.fyi',    category: 'layoff',  published_at: daysAgo(6) },
  { id: 'n05', company_slug: 'roblox',     company_name: 'Roblox',     title: 'Roblox trims engineering after revenue miss',                          url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'layoff',  published_at: daysAgo(9) },

  // ── Funding ──
  { id: 'n06', company_slug: 'anthropic',  company_name: 'Anthropic',  title: 'Anthropic raises $4B from Amazon, valuation hits $60B',                url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(1) },
  { id: 'n07', company_slug: 'openai',     company_name: 'OpenAI',     title: 'OpenAI closes $6.6B funding round at $157B valuation',                 url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(3) },
  { id: 'n08', company_slug: 'cursor',     company_name: 'Cursor',     title: 'Cursor raises $100M Series B at $2.5B valuation',                       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(5) },
  { id: 'n09', company_slug: 'perplexity', company_name: 'Perplexity', title: 'Perplexity raises $500M to expand search agent',                       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(7) },
  { id: 'n10', company_slug: 'harvey',     company_name: 'Harvey',     title: 'Harvey closes $300M Series D at $3B valuation',                        url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(8) },
  { id: 'n11', company_slug: 'mistral',    company_name: 'Mistral',    title: 'Mistral AI raises €600M led by General Catalyst',                       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(11) },
  { id: 'n12', company_slug: 'sierra',     company_name: 'Sierra',     title: 'Sierra raises $175M Series B led by Greenoaks',                        url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(14) },
  { id: 'n13', company_slug: 'writer',     company_name: 'Writer',     title: 'Writer raises $200M Series C at $1.9B valuation',                       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'funding', published_at: daysAgo(16) },

  // ── Product ──
  { id: 'n14', company_slug: 'openai',     company_name: 'OpenAI',     title: 'OpenAI launches o3 reasoning model for ChatGPT Pro users',             url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(2) },
  { id: 'n15', company_slug: 'anthropic',  company_name: 'Anthropic',  title: 'Anthropic ships Claude Code in beta to all Pro subscribers',           url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(3) },
  { id: 'n16', company_slug: 'cursor',     company_name: 'Cursor',     title: 'Cursor releases Composer 2.0 with multi-file refactoring',             url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(4) },
  { id: 'n17', company_slug: 'figma',      company_name: 'Figma',      title: 'Figma launches Sites, its first public AI design tool',                url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(6) },
  { id: 'n18', company_slug: 'notion',     company_name: 'Notion',     title: 'Notion AI gets agent-style autonomy in latest beta',                    url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(8) },
  { id: 'n19', company_slug: 'vercel',     company_name: 'Vercel',     title: 'Vercel announces v0 API for programmatic UI generation',               url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(10) },
  { id: 'n20', company_slug: 'replit',     company_name: 'Replit',     title: 'Replit Agent ships out of beta to all paid users',                      url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(12) },
  { id: 'n21', company_slug: 'linear',     company_name: 'Linear',     title: 'Linear launches Projects 2.0 with milestone tracking',                 url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'product', published_at: daysAgo(15) },

  // ── Other ──
  { id: 'n22', company_slug: 'databricks', company_name: 'Databricks', title: 'Databricks opens Bangalore engineering hub, plans 500 hires',         url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(2) },
  { id: 'n23', company_slug: 'stripe',     company_name: 'Stripe',     title: 'Stripe files confidentially for IPO, targeting Q3 2026 listing',       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(5) },
  { id: 'n24', company_slug: 'palantir',   company_name: 'Palantir',   title: 'Palantir wins $480M defense contract for AI platform',                 url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(7) },
  { id: 'n25', company_slug: 'anduril',    company_name: 'Anduril',    title: 'Anduril named primary contractor for $22B Pentagon AI program',       url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(13) },
  { id: 'n26', company_slug: 'atlassian',  company_name: 'Atlassian',  title: 'Atlassian acquires Rovo to bolster AI workflow capabilities',          url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(17) },
  { id: 'n27', company_slug: 'datadog',    company_name: 'Datadog',    title: 'Datadog opens new EMEA HQ in Dublin, hiring 200 engineers',           url: 'https://techcrunch.com',     source: 'TechCrunch',     category: 'other',   published_at: daysAgo(19) },
];

export function getMockNewsForCompany(slug: string, limit?: number): NewsItem[] {
  const matches = MOCK_NEWS.filter(n => n.company_slug === slug).sort(byDateDesc);
  return limit ? matches.slice(0, limit) : matches;
}

export function getMockNews(limit?: number): NewsItem[] {
  const sorted = [...MOCK_NEWS].sort(byDateDesc);
  return limit ? sorted.slice(0, limit) : sorted;
}

function byDateDesc(a: NewsItem, b: NewsItem) {
  return b.published_at.localeCompare(a.published_at);
}
