'use client';

import type { ReactNode } from 'react';

interface Props {
  companyName: string;
  href: string | null;       // best careers URL, computed server-side
  className?: string;
}

// Subtle ↗ linking to a company's careers page. The href is computed
// server-side via bestCareersUrl(), which falls through:
//   careers_url column → derived from ats+handle → hardcoded for known
//   'custom' companies → null
// We render nothing for that final null case.
export default function CareersLink({ companyName, href, className = '' }: Props): ReactNode {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={`Open ${companyName} careers`}
      aria-label={`Open ${companyName} careers`}
      className={`inline-flex items-center text-white/50 hover:text-aurora transition-colors ${className}`}
    >
      <span className="text-sm leading-none" aria-hidden>↗</span>
    </a>
  );
}
