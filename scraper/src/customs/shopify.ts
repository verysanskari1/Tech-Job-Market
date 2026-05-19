import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';

// Shopify's careers site is server-rendered (no JSON API). Pages live at
// /careers/search (paginated via ?page=N) and individual jobs at
// /careers/{job-slug}-{id}.
//
// We walk pages until one returns 0 new jobs.
const BASE = 'https://www.shopify.com';
const MAX_PAGES = 50;

export async function fetchShopify(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE}/careers/search?page=${page}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
      },
    });
    if (!res.ok) throw new Error(`Shopify: HTTP ${res.status} on page ${page}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    let pageCount = 0;

    // Each job is an <a href="/careers/...-{id}"> linking to a detail page.
    // Title sits inside the link; location is a sibling.
    $('a[href^="/careers/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      // Skip non-job links: /careers/search, /careers/teams, etc.
      // Job slugs end with a numeric id segment.
      const idMatch = href.match(/\/careers\/[^/?#]+?-(\d+)(?:[/?#]|$)/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;

      const text = $(el).text().trim();
      if (!text) return;
      // Title is typically the first line; location follows on subsequent lines.
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      const title = lines[0] ?? '';
      const location = lines.length > 1 ? lines.slice(1).join(' / ') : null;
      if (!title) return;

      seen.add(id);
      roles.push({
        ats_role_id:  id,
        title_raw:    title,
        department_raw: null,
        location,
        posted_at:    null,
      });
      pageCount++;
    });

    if (pageCount === 0) break;
  }

  return roles;
}
