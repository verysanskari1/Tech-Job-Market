import type { RawNewsItem } from '../types.js';

// Layoffs.fyi publishes a public Google Sheets CSV. URL is the
// File→Publish-to-web link on their tracker sheet.
// (Confirm current URL at https://layoffs.fyi — they've moved it before.)
const LAYOFFS_FYI_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4LWAEXKqM2I9jh-uHwL_C_Y6CNkjL9JFAiqQS4OkA9wM7HBepUEDPVuxq72MQ3Y6vYqQ8m1F-y2g0/pub?gid=0&single=true&output=csv';

// CSV columns (verify when integrating): Company, Location, # Laid Off,
// Date, Funds Raised, Industry, Source, List of Employees Laid Off,
// Stage, Date Added, Country, Percentage
function parseCsvLine(line: string): string[] {
  // Naive but works for this sheet — fields can contain commas inside
  // double quotes. Standard quote-aware CSV split.
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      current += ch;
    } else {
      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ',') { out.push(current); current = ''; continue; }
      current += ch;
    }
  }
  out.push(current);
  return out;
}

export async function fetchLayoffsFyi(): Promise<RawNewsItem[]> {
  const res = await fetch(LAYOFFS_FYI_CSV);
  if (!res.ok) throw new Error(`Layoffs.fyi: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const idx = {
    company:   header.indexOf('company'),
    laidOff:   header.findIndex(h => h.includes('laid off')),
    date:      header.indexOf('date'),
    pct:       header.indexOf('percentage'),
    source:    header.indexOf('source'),
  };

  const items: RawNewsItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const company = cols[idx.company]?.trim();
    const dateStr = cols[idx.date]?.trim();
    if (!company || !dateStr) continue;

    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) continue;

    const laidOff = idx.laidOff >= 0 ? Number(cols[idx.laidOff]) : null;
    const pct = idx.pct >= 0 ? Number(cols[idx.pct]) : null;
    const sourceUrl = idx.source >= 0 ? cols[idx.source]?.trim() : '';

    const titleParts: string[] = [`${company} layoffs`];
    if (laidOff && !Number.isNaN(laidOff)) titleParts.push(`${laidOff} affected`);
    else if (pct && !Number.isNaN(pct))    titleParts.push(`${Math.round(pct * 100)}% of staff`);
    const title = titleParts.join(' — ');

    items.push({
      source:       'Layoffs.fyi',
      title,
      url:          sourceUrl && sourceUrl.startsWith('http') ? sourceUrl : 'https://layoffs.fyi',
      published_at: parsed.toISOString(),
      company_hint: company,
    });
  }
  return items;
}
