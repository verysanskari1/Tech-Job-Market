import type { Result } from './check.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const TO_EMAIL       = process.env.TO_EMAIL ?? '';

export async function sendReport(results: Result[]): Promise<void> {
  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.warn('[email] RESEND_API_KEY or TO_EMAIL not set — skipping email.');
    return;
  }

  const ok   = results.filter(r => r.status === 'ok').length;
  const warn = results.filter(r => r.status === 'warn').length;
  const err  = results.filter(r => r.status === 'error').length;
  const skip = results.filter(r => r.status === 'skip').length;

  const allGood = warn === 0 && err === 0;
  const subject = allGood
    ? `✓ Scraper health OK — ${ok} companies clean`
    : `⚠ Scraper issues found — ${warn} warnings, ${err} errors`;

  const rows = results
    .filter(r => r.status !== 'ok')
    .map(r => {
      const icon  = r.status === 'warn' ? '⚠️' : r.status === 'error' ? '🔴' : '⏭️';
      const live  = r.live  !== null ? r.live  : '?';
      const gap   = r.gap   !== null ? (r.gap > 0 ? `+${r.gap}` : String(r.gap)) : '?';
      const pct   = r.gapPct !== null ? `${Math.round(r.gapPct * 100)}%` : '';
      const spotFail = r.spotMissing > 0 ? ` | ${r.spotMissing}/${r.spotChecked} IDs missing from DB` : '';
      return `<tr>
        <td style="padding:6px 12px">${icon} ${r.company}</td>
        <td style="padding:6px 12px">${r.ats}</td>
        <td style="padding:6px 12px;text-align:right">${live}</td>
        <td style="padding:6px 12px;text-align:right">${r.db}</td>
        <td style="padding:6px 12px;text-align:right">${gap}</td>
        <td style="padding:6px 12px;text-align:right">${pct}</td>
        <td style="padding:6px 12px;color:#888">${r.note}${spotFail}</td>
      </tr>`;
    })
    .join('\n');

  const okRow = allGood
    ? `<p style="color:#16a34a;font-weight:600">All ${ok} companies are clean. No action needed.</p>`
    : '';

  const tableHtml = rows.length > 0 ? `
    <table style="border-collapse:collapse;width:100%;font-size:14px;font-family:monospace">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:6px 12px;text-align:left">Company</th>
          <th style="padding:6px 12px;text-align:left">ATS</th>
          <th style="padding:6px 12px;text-align:right">Live</th>
          <th style="padding:6px 12px;text-align:right">DB</th>
          <th style="padding:6px 12px;text-align:right">Gap</th>
          <th style="padding:6px 12px;text-align:right">Gap%</th>
          <th style="padding:6px 12px;text-align:left">Note</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>` : '';

  const html = `
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 4px">Scraper Health Check</h2>
      <p style="color:#888;margin:0 0 24px">${new Date().toUTCString()}</p>
      <p>
        ✓ OK: <strong>${ok}</strong> &nbsp;
        ⚠ Warnings: <strong>${warn}</strong> &nbsp;
        🔴 Errors: <strong>${err}</strong> &nbsp;
        ⏭️ Skipped: <strong>${skip}</strong>
      </p>
      ${okRow}
      ${tableHtml}
      <p style="margin-top:32px;color:#aaa;font-size:12px">
        Gaps flagged when |diff| &gt; 10 roles AND &gt; 15%. Spot-check samples 10 random role IDs per company.
      </p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'scraper-qa@yourdomain.com',
      to: TO_EMAIL,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[email] Resend API error:', res.status, body);
  } else {
    console.log(`[email] Report sent to ${TO_EMAIL}`);
  }
}
