// Small helper: retry transient network failures (DNS hiccups, TLS resets,
// CDN 503s) up to N times with backoff. Throws the last error if all
// attempts fail. Don't retry on 4xx — those are deterministic.
//
// Optional `proxyUrl` routes through undici's ProxyAgent (matches the
// Ashby/Workday pattern). Use for endpoints that block cloud IPs.
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  attempts = 3,
  proxyUrl?: string,
): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let proxyFetch: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ProxyAgent: any = null;
  if (proxyUrl) {
    const undici = await import('undici');
    proxyFetch = undici.fetch;
    ProxyAgent = undici.ProxyAgent;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = proxyUrl
        ? await proxyFetch(url, { ...init, dispatcher: new ProxyAgent(proxyUrl) }) as unknown as Response
        : await fetch(url, init);
      // 4xx is deterministic — surface immediately so the caller can handle it.
      if (res.status >= 400 && res.status < 500) return res;
      if (res.ok) return res;
      // 5xx → retry
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Network error (fetch failed) — retry
      lastError = err;
    }
    if (attempt < attempts) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
