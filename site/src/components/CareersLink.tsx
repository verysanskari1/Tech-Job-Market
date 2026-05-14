import type { ReactNode } from 'react';
import { domainFor } from '@/lib/logos';

interface Props {
  companyName: string;
  href: string | null;       // careers_url from DB; falls back to derived domain
  label?: string;
  className?: string;
}

// Subtle ↗ pill linking to a company's careers (or main) page. When the
// careers_url column is empty we fall back to the company's marketing
// domain so the link is always present — most users just want "more
// info" anyway, and the marketing site usually has a careers section.
export default function CareersLink({ companyName, href, label, className = '' }: Props): ReactNode {
  let url = href;
  if (!url) {
    const domain = domainFor(companyName, null);
    if (domain) url = `https://${domain}`;
  }
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={label ?? `Open ${companyName} careers`}
      aria-label={label ?? `Open ${companyName} careers`}
      className={`inline-flex items-center text-white/50 hover:text-aurora transition-colors ${className}`}
    >
      <span className="text-sm leading-none" aria-hidden>↗</span>
    </a>
  );
}
