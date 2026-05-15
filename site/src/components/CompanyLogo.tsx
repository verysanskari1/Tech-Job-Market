'use client';

import { useState } from 'react';
import { domainFor, LOGO_URL_OVERRIDES } from '@/lib/logos';
import { slugify } from '@/lib/slug';

interface Props {
  name: string;
  careersUrl?: string | null;
  size?: number;
  className?: string;
}

// Newsreader italic letter avatar. Color picked deterministically from the
// brand palette so the same company always gets the same chip.
const PALETTE = [
  { bg: '#003333', fg: '#AEF96C' },  // terrain / aurora
  { bg: '#AEF96C', fg: '#003333' },  // aurora / terrain
  { bg: '#3355FF', fg: '#E7F8FF' },  // universe / ice
  { bg: '#AA99FF', fg: '#141419' },  // comet / terminal
  { bg: '#D26F6C', fg: '#FFFFFF' },  // ember / canvas
  { bg: '#FABD83', fg: '#141419' },  // dune / terminal
  { bg: '#FCF283', fg: '#141419' },  // sunrise / terminal
  { bg: '#C3EDFF', fg: '#003333' },  // glacier / terrain
  { bg: '#DBFFC2', fg: '#003333' },  // sprout / terrain
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Logo.dev publishable token. Public by design — safe to commit. The env
// var can override it (e.g. when rotating the key without redeploying code).
const LOGO_DEV_TOKEN =
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || 'pk_NNwvFnj4TEqB0N1c9E10kA';

// Resolution priority:
//   1. /logos/{slug}.svg   — drop a hand-curated SVG here for any company
//                            and it wins. 404s fall through silently.
//   2. LOGO_URL_OVERRIDES  — hardcoded URL per company (e.g. CDN PNG)
//   3. logo.dev            — high-quality brand icons (PNG/SVG), if token set
//   4. Google favicon @ 256px — free, no key, but often low-res
//   5. Newsreader letter avatar
export default function CompanyLogo({ name, careersUrl, size = 24, className = '' }: Props) {
  const [stage, setStage] = useState(0);

  const slug = slugify(name);
  const key = name.toLowerCase().trim();
  const explicit = LOGO_URL_OVERRIDES[key];
  const domain = domainFor(name, careersUrl ?? null);

  // Request the smallest size that looks crisp on a retina display (2x).
  // 128 is plenty for chips/rows; we save a lot of bytes vs 256 across
  // 40+ logos on the page.
  const reqPx = size <= 32 ? 128 : size <= 64 ? 192 : 256;
  const logoDevUrl = LOGO_DEV_TOKEN && domain
    ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${reqPx}&format=png`
    : null;
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=${reqPx}`
    : null;

  // Build the resolution chain so onError can advance to the next URL.
  const chain: string[] = [];
  chain.push(`/logos/${slug}.svg`);
  if (explicit) chain.push(explicit);
  if (logoDevUrl) chain.push(logoDevUrl);
  if (faviconUrl) chain.push(faviconUrl);

  if (stage >= chain.length) {
    const { bg, fg } = paletteFor(name);
    return (
      <span
        className={`inline-flex items-center justify-center font-serif italic font-medium select-none shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: bg,
          color: fg,
          fontSize: Math.max(10, Math.floor(size * 0.46)),
          borderRadius: Math.max(4, Math.floor(size * 0.22)),
          lineHeight: 1,
        }}
        aria-label={name}
      >
        {initials(name)}
      </span>
    );
  }

  const src = chain[stage];

  // Plain <img> intentional — bypasses next/image's domain restriction and
  // lets us advance through the fallback chain on any network failure.
  // The wrapper is a white tile so logos with dark/transparent marks
  // (Anthropic, OpenAI, Roblox, Palantir, etc.) stay visible on the dark
  // page background.
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-md bg-canvas ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setStage(s => s + 1)}
        style={{
          width: Math.round(size * 0.86),
          height: Math.round(size * 0.86),
          objectFit: 'contain',
        }}
      />
    </span>
  );
}
