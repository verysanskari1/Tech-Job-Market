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

// Resolution priority:
//   1. /logos/{slug}.svg   — drop a hand-curated SVG here for any company
//                            and it wins. 404s fall through silently.
//   2. LOGO_URL_OVERRIDES  — hardcoded URL per company (e.g. CDN PNG)
//   3. Google favicon @ 256px
//   4. Newsreader letter avatar
export default function CompanyLogo({ name, careersUrl, size = 24, className = '' }: Props) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  const slug = slugify(name);
  const key = name.toLowerCase().trim();
  const explicit = LOGO_URL_OVERRIDES[key];
  const domain = domainFor(name, careersUrl ?? null);
  // Google's favicon service. 256 is the practical ceiling — most company
  // favicons cap out around 64–128 at the source, but ask for max anyway.
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
    : null;

  // Build the resolution chain so onError can advance to the next URL.
  const chain: string[] = [];
  chain.push(`/logos/${slug}.svg`);
  if (explicit) chain.push(explicit);
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
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setStage(s => (s + 1) as 0 | 1 | 2 | 3)}
      className={`shrink-0 rounded-md bg-canvas/5 ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
