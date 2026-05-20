import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Google careers is server-rendered HTML at this URL with pagination
// via ?page=N. Each job links to /about/careers/applications/jobs/results/{id}.
//
// Google's HTML changes often — keep selectors permissive: any anchor
// to /jobs/results/{numeric-id}, with title = closest h3/h2 within the
// surrounding card, falling back to the link text itself.
const BASE = 'https://www.google.com/about/careers/applications/jobs/results/';
const MAX_PAGES = 200;

export async function fetchGoogle(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE}?page=${page}`;
    let html: string;
    try {
      const res = await fetchWithRetry(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!res.ok) throw new Error(`Google: HTTP ${res.status} on page ${page}`);
      html = await res.text();
    } catch (err) {
      if (page === 1) throw err;
      break; // tolerate a single later-page failure
    }

    const $ = cheerio.load(html);
    let pageCount = 0;

    // Anchor to /jobs/results/{numeric-id}. Some Google pages also link
    // by job slug — strip query/hash before matching.
    $('a[href*="/jobs/results/"]').each((_, el) => {
      const href = ($(el).attr('href') ?? '').split('?')[0].split('#')[0];
      const idMatch = href.match(/\/jobs\/results\/(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;

      // Walk up the DOM until we find a card-like ancestor with the title.
      // Google wraps each job in a <li> or <div role="listitem">.
      const card =
        $(el).closest('li').first().length ? $(el).closest('li').first() :
        $(el).closest('[role="listitem"]').first().length ? $(el).closest('[role="listitem"]').first() :
        $(el).parent();

      const title =
        card.find('h2, h3, h4').first().text().trim() ||
        $(el).text().trim().split('\n').map(s => s.trim()).filter(Boolean)[0] ||
        '';
      if (!title || /^learn more$/i.test(title)) return;

      // Location: "Google | {city, state}" pattern appears in Google's
      // current layout. Fall back to whatever text follows the title.
      let location: string | null = null;
      const cardText = card.text();
      const piped = cardText.match(/Google\s*\|\s*([^\n]+?)(?:Learn more|$)/);
      if (piped) location = piped[1].trim();

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
