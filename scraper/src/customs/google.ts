import * as cheerio from 'cheerio';
import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Google careers is server-rendered HTML at this URL with pagination
// via ?page=N. The job listing structure (verified from a live page):
//
//   <li class="lLd3Je" ssk="18:128085257684427462">
//     <div jscontroller="snXUJb">
//       <h3 class="QJPWVe">Software Engineer, On Device Machine Learning</h3>
//       <p class="l103df">Google | <span>Taipei, Taiwan</span></p>
//       <a class="WpHeLc..." href="jobs/results/128085257684427462-software-engineer-on-device-machine-learning">
//     </div>
//   </li>
//
// Note hrefs are relative (no leading slash) — an earlier draft required
// a leading slash and matched nothing.
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
      break;
    }

    const $ = cheerio.load(html);
    let pageCount = 0;

    // Iterate each job card directly — more reliable than walking up
    // from anchors when the markup is heavily nested with Google's
    // Material Design wrappers.
    $('li.lLd3Je').each((_, li) => {
      const $li = $(li);

      // Job id lives in the "Learn more" anchor's href:
      // `jobs/results/{id}-{slug}` (relative — no leading slash).
      const href = $li.find('a[href*="jobs/results/"]').first().attr('href') ?? '';
      const idMatch = href.match(/jobs\/results\/(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;

      const title = $li.find('h3.QJPWVe').first().text().trim();
      if (!title) return;

      // Location: "Google | {city1}; {city2}; +N more" pattern inside
      // <p class="l103df">. Strip the "Google | " prefix.
      let location: string | null = null;
      const locP = $li.find('p.l103df').first().text().trim();
      if (locP) {
        location = locP.replace(/^Google\s*\|\s*/, '').trim() || null;
      }

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
