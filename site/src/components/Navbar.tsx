interface NavbarProps {
  lastUpdated?: string;
}

export default function Navbar({ lastUpdated }: NavbarProps) {
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <nav className="border-b border-surface-border bg-terminal sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.hackerrank.com/favicon.ico"
            alt="HackerRank"
            width={20}
            height={20}
            className="rounded-sm"
          />
          <span className="font-sans font-semibold text-white text-sm tracking-tight">HackerRank</span>
          <span className="text-surface-border">|</span>
          <span className="font-sans text-white/50 text-xs tracking-widest uppercase">The Tech Job Market</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-xs font-sans">
            Updates daily
            <span className="text-surface-border mx-2">·</span>
            Last updated <span className="tabular-nums text-white/40">{dateStr}</span> PT
          </span>
        </div>
      </div>
    </nav>
  );
}
