'use client';

import { useState } from 'react';
import { domainFor } from '@/lib/logos';

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

export default function CompanyLogo({ name, careersUrl, size = 24, className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  const domain = domainFor(name, careersUrl ?? null);
  // DuckDuckGo's favicon proxy — reliable, well-cached, no API key.
  const src = domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;

  if (!src || failed) {
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

  // Plain <img> intentional — bypasses next/image's domain restriction and
  // lets us fall through to the letter avatar on any network failure.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-md bg-canvas/5 ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
