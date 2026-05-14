// Resolve a company name to a Clearbit logo URL.
// Most companies are at {lowercased-name}.com — overrides cover the rest.
const DOMAIN_OVERRIDES: Record<string, string> = {
  'xai':                'x.ai',
  'block':              'block.xyz',
  'meta':               'meta.com',
  'google':             'google.com',
  'github':             'github.com',
  'openai':             'openai.com',
  'anthropic':          'anthropic.com',
  'doordash':           'doordash.com',
  'scale ai':           'scale.com',
  'hubspot':            'hubspot.com',
  'mongodb':            'mongodb.com',
  'gitlab':             'gitlab.com',
  'cloudflare':         'cloudflare.com',
  'inflection ai':      'inflection.ai',
  'together ai':        'together.ai',
  'stability ai':       'stability.ai',
  'sarvam ai':          'sarvam.ai',
  'grafana labs':       'grafana.com',
  'elastic':            'elastic.co',
  'navan':              'navan.com',
  'miro':               'miro.com',
  'glean':              'glean.com',
  'wiz':                'wiz.io',
  'mistral':            'mistral.ai',
  'meesho':             'meesho.com',
  'phonepe':            'phonepe.com',
  'paytm':              'paytm.com',
  'cred':               'cred.club',
  'cohere':             'cohere.com',
  'elevenlabs':         'elevenlabs.io',
  'confluent':          'confluent.io',
  'poolside':           'poolside.ai',
  'deel':               'deel.com',
  'ramp':               'ramp.com',
  'pinterest':          'pinterest.com',
  'robinhood':          'robinhood.com',
  'affirm':             'affirm.com',
  'asana':              'asana.com',
  'intercom':           'intercom.com',
  'toast':              'toasttab.com',
  'chime':              'chime.com',
  'supabase':           'supabase.com',
  'wise':               'wise.com',
  'workday':            'workday.com',
  'servicenow':         'servicenow.com',
  'roblox':             'roblox.com',
  'hackerrank':         'hackerrank.com',
  'box':                'box.com',
  'modal':              'modal.com',
  'sentry':             'sentry.io',
  'rippling':           'rippling.com',
  'razorpay':           'razorpay.com',
  'duolingo':           'duolingo.com',
  'webflow':            'webflow.com',
  'replit':             'replit.com',
  'notion':             'notion.so',
  'anduril':            'anduril.com',
  'harvey':             'harvey.ai',
  'figma':              'figma.com',
  'discord':            'discord.com',
  'brex':               'brex.com',
  'airtable':           'airtable.com',
  'datadog':            'datadoghq.com',
  'databricks':         'databricks.com',
  'twilio':             'twilio.com',
  'groww':              'groww.in',
  'airbnb':             'airbnb.com',
  'lyft':               'lyft.com',
  'runway':             'runwayml.com',
  'okta':               'okta.com',
  'dropbox':            'dropbox.com',
  'sierra':             'sierra.ai',
  'gusto':              'gusto.com',
  'carta':              'carta.com',
  'lattice':            'lattice.com',
  'postman':            'postman.com',
  'descript':           'descript.com',
  'mercury':            'mercury.com',
  'posthog':            'posthog.com',
  'reddit':             'reddit.com',
  'amplitude':          'amplitude.com',
  'canva':              'canva.com',
  'temporal':           'temporal.io',
  'snap':               'snap.com',
  'plaid':              'plaid.com',
  'anyscale':           'anyscale.com',
  'writer':             'writer.com',
  'perplexity':         'perplexity.ai',
  'cursor':             'cursor.com',
  'linear':             'linear.app',
  'vercel':             'vercel.com',
  'stripe':             'stripe.com',
  'palantir':           'palantir.com',
  'atlassian':          'atlassian.com',
  'pika':               'pika.art',
  'shopify':            'shopify.com',
  'klarna':             'klarna.com',
  'netflix':            'netflix.com',
  'microsoft':          'microsoft.com',
  'apple':              'apple.com',
  'retool':             'retool.com',
};

// Hard-coded logo URLs for companies where favicon services return the wrong
// or low-res image. Key = lowercased company name. Falls back to favicon
// proxy if not listed here.
export const LOGO_URL_OVERRIDES: Record<string, string> = {
  // Razorpay's favicon is outdated/wrong on most proxies — use their CDN logo.
  'razorpay': 'https://razorpay.com/favicon.png',
};

export function logoUrl(companyName: string): string {
  const key = companyName.toLowerCase().trim();
  const domain = DOMAIN_OVERRIDES[key] ?? `${key.replace(/\s+/g, '')}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

// Hosts that belong to ATS providers, not to the company. If careers_url
// points at one of these (e.g. job-boards.greenhouse.io/anthropic), the
// favicon at that domain is the ATS's logo, not Anthropic's — fall through
// to the override map instead.
const ATS_HOSTS = [
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'icims.com',
];

function isAtsHost(host: string): boolean {
  return ATS_HOSTS.some(ats => host === ats || host.endsWith('.' + ats));
}

// Resolve a company to a bare hostname. Priority:
//  1. Hardcoded override (DOMAIN_OVERRIDES) — most reliable for known companies
//  2. careers_url hostname IF it isn't an ATS provider
//  3. heuristic `${slug}.com`
// Returns null only if everything fails (shouldn't happen given the slug fallback).
export function domainFor(name: string, careersUrl: string | null): string | null {
  const key = name.toLowerCase().trim();
  if (DOMAIN_OVERRIDES[key]) return DOMAIN_OVERRIDES[key];

  if (careersUrl) {
    try {
      const url = new URL(careersUrl);
      let host = url.hostname.toLowerCase();
      host = host.replace(/^(careers|jobs|apply|boards|hire|work|talent|join)\./, '');
      host = host.replace(/^www\./, '');
      if (host && host.includes('.') && !isAtsHost(host)) return host;
    } catch {
      // fall through
    }
  }

  return `${key.replace(/\s+/g, '')}.com`;
}
