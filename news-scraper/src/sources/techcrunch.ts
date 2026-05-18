import { XMLParser } from 'fast-xml-parser';
import type { RawNewsItem } from '../types.js';

// TechCrunch publishes per-tag RSS at /tag/{slug}/feed/. For most
// companies the slug is the lowercased name with non-alphanum replaced
// by hyphens. A few have hand-picked slugs — pass via override.
function tagSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TAG_OVERRIDES: Record<string, string> = {
  'scale ai':       'scale-ai',
  'meta':           'meta',
  'x':              'x-corp',
  'twitter':        'twitter',
  'workday':        'workday',
};

const FEED_TIMEOUT_MS = 10_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RssItem = any;

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export async function fetchTechCrunch(companyName: string): Promise<RawNewsItem[]> {
  const slug = TAG_OVERRIDES[companyName.toLowerCase()] ?? tagSlug(companyName);
  const url = `https://techcrunch.com/tag/${slug}/feed/`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FEED_TIMEOUT_MS);

  let xml: string;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tech-job-market-news-scraper/1.0', Accept: 'application/rss+xml' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      if (res.status === 404) return []; // tag doesn't exist
      throw new Error(`TechCrunch ${companyName}: HTTP ${res.status}`);
    }
    xml = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as {
    rss?: { channel?: { item?: RssItem | RssItem[] } };
  };
  const items = asArray(parsed.rss?.channel?.item);

  return items
    .map((it): RawNewsItem | null => {
      const title = typeof it.title === 'string' ? it.title : '';
      const link  = typeof it.link === 'string' ? it.link : '';
      const pub   = typeof it.pubDate === 'string' ? it.pubDate : '';
      if (!title || !link || !pub) return null;
      const date = new Date(pub);
      if (Number.isNaN(date.getTime())) return null;
      return {
        source:       'TechCrunch',
        title,
        url:          link,
        published_at: date.toISOString(),
        company_hint: companyName,
      };
    })
    .filter((it): it is RawNewsItem => it !== null);
}
