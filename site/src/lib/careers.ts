// Resolve a real careers-page URL from a company's ATS handle.
// Every ATS we scrape has a canonical public job-board URL pattern; this
// mirrors the same patterns the scraper uses to fetch listings.
export function deriveCareersUrl(
  ats: string | null | undefined,
  atsHandle: string | null | undefined,
): string | null {
  if (!ats || !atsHandle) return null;
  switch (ats) {
    case 'greenhouse':      return `https://job-boards.greenhouse.io/${atsHandle}`;
    case 'lever':           return `https://jobs.lever.co/${atsHandle}`;
    case 'ashby':           return `https://jobs.ashbyhq.com/${atsHandle}`;
    case 'smartrecruiters': return `https://careers.smartrecruiters.com/${atsHandle}`;
    case 'workday': {
      // handle format: "host:site" e.g. "snapchat.wd1:snap"
      const [host, site] = atsHandle.split(':');
      if (!host || !site) return null;
      return `https://${host}.myworkdayjobs.com/${site}`;
    }
    case 'icims':           return `https://${atsHandle}.icims.com/jobs/search`;
    default:                return null;
  }
}

// Companies on 'custom' ATS don't have a queryable job board, but most have
// well-known careers pages. Hard-coded so the ↗ arrow still goes somewhere
// useful for these. Key = lowercased company name.
const CUSTOM_CAREERS_URLS: Record<string, string> = {
  'shopify':   'https://www.shopify.com/careers',
  'klarna':    'https://www.klarna.com/careers/',
  'github':    'https://www.github.careers/',
  'netflix':   'https://jobs.netflix.com/',
  'microsoft': 'https://careers.microsoft.com/',
  'apple':     'https://www.apple.com/careers/',
  'meta':      'https://www.metacareers.com/',
  'google':    'https://careers.google.com/',
  'rippling':  'https://www.rippling.com/careers',
  'retool':    'https://retool.com/careers',
};

// Best-effort careers URL. Priority:
//   1. Explicit careers_url from the DB (most authoritative)
//   2. Derived from ats + ats_handle (canonical job board)
//   3. Hard-coded for known 'custom' ATS companies
//   4. null — let the caller decide what to do
export function bestCareersUrl(args: {
  careersUrl: string | null;
  ats: string | null;
  atsHandle: string | null;
  name: string;
}): string | null {
  if (args.careersUrl) return args.careersUrl;
  const derived = deriveCareersUrl(args.ats, args.atsHandle);
  if (derived) return derived;
  return CUSTOM_CAREERS_URLS[args.name.toLowerCase().trim()] ?? null;
}
