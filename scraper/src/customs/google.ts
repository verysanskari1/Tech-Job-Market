import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';

// Google careers is server-rendered HTML at this URL with pagination
// via ?page=N. Each page shows ~20 jobs. The "1,197 jobs matched"
// header gives us the total count.
//
// Each job card links to /about/careers/applications/jobs/results/{id}-{slug}
// — we extract the numeric id as the ats_role_id.
const BASE = 'https://www.google.com/about/careers/applications/jobs/results/';
const MAX_PAGES = 200;

export async function fetchGoogle(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE}?page=${page}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) throw new Error(`Google: HTTP ${res.status} on page ${page}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    let pageCount = 0;

    // Each job has a link to /about/careers/applications/jobs/results/{id}-{slug}.
    // The job ID is the numeric prefix.
    $('a[href*="/jobs/results/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const idMatch = href.match(/\/jobs\/results\/(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;

      // The card containing the link holds the title and "Google | location" line.
      const card = $(el).closest('li, article, div[role="listitem"]').first();
      const block = card.length ? card : $(el).parent();

      // Title is usually an h2/h3 inside the card.
      const title = block.find('h2, h3').first().text().trim()
        || $(el).text().trim().split('\n')[0]?.trim()
        || '';
      if (!title || title.toLowerCase().includes('learn more')) return;

      // Location appears as "Google | {locations}" near the title.
      let location: string | null = null;
      const locText = block.text();
      const locMatch = locText.match(/Google\s*\|\s*([^\n]+)/);
      if (locMatch) location = locMatch[1].trim();

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
