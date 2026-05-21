import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Shopify's careers site is server-rendered HTML. They group roles by
// "discipline" (engineering, design, product, etc.) and each discipline
// page lists role families with links like:
//   /careers/c-engineers_e55f5990-c516-4972-b3d6-b824205c40d6
// The UUID after `_` is the role family ID — we use it as ats_role_id.
//
// Shopify's careers pages are behind Cloudflare and reject the cloud
// IPs the Apify actor runs on — we route every fetch through the
// residential proxy.
//
// We hit the /in/ regional path because the canonical /careers path
// 404s without geolocation context and the /in/ variant has the full
// global job list.
const BASE = 'https://www.shopify.com';
const DISCIPLINES = [
  'engineering-data',
  'product',
  'design',
  'security',
  'data-science',
  'machine-learning',
];

export async function fetchShopify(proxyUrl?: string): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  for (const discipline of DISCIPLINES) {
    let html: string | null = null;
    // Try /in/ first (region path that user confirmed works), fall back
    // to canonical path. Use the proxy so Cloudflare doesn't 1020 us.
    for (const path of [`/in/careers/disciplines/${discipline}`, `/careers/disciplines/${discipline}`]) {
      try {
        const res = await fetchWithRetry(`${BASE}${path}`, {
          headers: {
            Accept: 'text/html',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }, 3, proxyUrl);
        if (!res.ok) continue;
        html = await res.text();
        if (html.length > 1000) break; // sanity check — Cloudflare blocks are tiny
      } catch {
        continue;
      }
    }
    if (!html) continue;

    const $ = cheerio.load(html);

    // Each role family is an <a href="/careers/c-{slug}_{uuid}"> with an
    // <h4> title inside and a `.location span` with the office.
    $('a[href*="/careers/c-"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const idMatch = href.match(/\/careers\/c-[^/?#]+_([a-f0-9-]{8,})/i);
      if (!idMatch) return;
      const familyId = idMatch[1];

      const title = $(el).find('h4').first().text().trim();
      if (!title) return;

      const location =
        $(el).find('.location span').first().text().trim() ||
        $(el).find('.location').first().text().trim() ||
        null;

      // Composite ID so the same role family at different locations
      // shows up as distinct rows.
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
