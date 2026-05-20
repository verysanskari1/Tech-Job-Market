import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Shopify's careers site is server-rendered HTML. They group roles by
// "discipline" (engineering, design, product, etc.) and each discipline
// page lists role families with links like:
//   /careers/c-engineers_e55f5990-c516-4972-b3d6-b824205c40d6
// The UUID after `_` is the role family ID — we use it as ats_role_id.
//
// We walk the disciplines we care about (engineering, data, security,
// product, design, mobile) and union the results. Each role family +
// location combo is one entry.
const BASE = 'https://www.shopify.com';
const DISCIPLINES = [
  'engineering-data',
  'product',
  'design',
  'security',
  'data-science',
];

export async function fetchShopify(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  for (const discipline of DISCIPLINES) {
    let html: string;
    try {
      const res = await fetchWithRetry(`${BASE}/careers/disciplines/${discipline}`, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
        },
      });
      if (!res.ok) continue; // some disciplines may not exist — skip
      html = await res.text();
    } catch {
      continue;
    }

    const $ = cheerio.load(html);

    // Each role family is an <a href="/careers/c-{slug}_{uuid}"> with an
    // <h4> title inside and a `.location span` with the office.
    $('a[href*="/careers/c-"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const idMatch = href.match(/\/careers\/c-[^/?#]+_([a-f0-9-]+)/i);
      if (!idMatch) return;
      // Composite ID so the same role family at different locations
      // shows up as distinct rows.
      const familyId = idMatch[1];

      const title = $(el).find('h4').first().text().trim();
      if (!title) return;

      const location =
        $(el).find('.location span').first().text().trim() ||
        $(el).find('.location').first().text().trim() ||
        null;

      const compositeId = `${familyId}|${(location ?? '').toLowerCase().replace(/\s+/g, '-')}`;
      if (seen.has(compositeId)) return;
      seen.add(compositeId);

      roles.push({
        ats_role_id:  compositeId,
        title_raw:    title,
        department_raw: discipline,
        location,
        posted_at:    null,
      });
    });
  }

  return roles;
}
