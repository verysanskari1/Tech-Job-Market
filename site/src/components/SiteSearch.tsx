'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slug';

interface Props {
  // Pass items by kind so each instance scopes to one section.
  // Omit either to disable that hit type entirely.
  companies?: string[];
  roles?: string[];
  placeholder?: string;
  size?: 'sm' | 'md';
}

type Hit =
  | { kind: 'company'; name: string; slug: string }
  | { kind: 'role';    name: string; slug: string };

export default function SiteSearch({ companies = [], roles = [], placeholder, size = 'md' }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const allHits = useMemo<Hit[]>(() => {
    const c = companies.map<Hit>(name => ({ kind: 'company', name, slug: slugify(name) }));
    const r = roles.map<Hit>(name => ({ kind: 'role', name, slug: slugify(name) }));
    return [...c, ...r];
  }, [companies, roles]);

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return allHits
      .filter(h => h.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [q, allHits]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function go(hit: Hit) {
    const href = hit.kind === 'company' ? `/company/${hit.slug}` : `/role/${hit.slug}`;
    router.push(href);
    setOpen(false);
    setQ('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (i + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (i - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(hits[active]);
    }
  }

  const isCompact = size === 'sm';
  const inputClasses = isCompact
    ? 'w-full bg-surface border border-surface-border focus:border-aurora/60 rounded-full pl-9 pr-3 py-2 text-sm font-sans text-canvas placeholder:text-white/30 transition-colors outline-none'
    : 'w-full bg-surface border border-surface-border focus:border-aurora/60 rounded-full pl-11 pr-16 py-3 text-base font-sans text-canvas placeholder:text-white/30 transition-colors outline-none';

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Search…'}
          className={inputClasses}
          spellCheck={false}
          autoComplete="off"
        />
        <span
          className={`absolute ${isCompact ? 'left-3 text-sm' : 'left-4'} top-1/2 -translate-y-1/2 text-white/40`}
          aria-hidden
        >
          ⌕
        </span>
      </div>

      {open && hits.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-surface-raised border border-surface-border rounded-2xl shadow-2xl overflow-hidden z-20">
          <ul>
            {hits.map((hit, i) => (
              <li key={`${hit.kind}-${hit.slug}`}>
                <Link
                  href={hit.kind === 'company' ? `/company/${hit.slug}` : `/role/${hit.slug}`}
                  onClick={() => { setOpen(false); setQ(''); }}
                  onMouseEnter={() => setActive(i)}
                  className={[
                    'flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-sans cursor-pointer',
                    i === active ? 'bg-surface text-canvas' : 'text-white/70 hover:text-canvas',
                  ].join(' ')}
                >
                  <span>{hit.name}</span>
                  <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-white/40">
                    {hit.kind}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && q && hits.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-surface-raised border border-surface-border rounded-2xl px-4 py-3 text-sm font-sans text-white/50 z-20">
          No matches for &ldquo;{q}&rdquo;.
        </div>
      )}
    </div>
  );
}
