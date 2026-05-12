import type { ReactNode } from 'react';

interface Props {
  href: string | null;
  label?: string;
  className?: string;
}

// Subtle ↗ pill linking to a company's careers page. Renders nothing when
// no URL is available — gracefully skipped in lists.
export default function CareersLink({ href, label, className = '' }: Props): ReactNode {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={label ?? 'Open careers page'}
      aria-label={label ?? 'Open careers page'}
      className={`inline-flex items-center text-white/30 hover:text-aurora transition-colors ${className}`}
    >
      <span className="text-xs leading-none" aria-hidden>↗</span>
    </a>
  );
}
