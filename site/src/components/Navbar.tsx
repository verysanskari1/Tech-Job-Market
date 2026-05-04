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
          {/* HackerRank logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="#2EC866"/>
            <path d="M8.5 8V16M8.5 12H13.5M13.5 8V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans font-semibold text-white text-sm tracking-tight">HackerRank</span>
          <span className="text-surface-border">|</span>
          <span className="font-sans text-white/50 text-xs tracking-widest uppercase">The Tech Job Market</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-xs font-sans tabular-nums">
            Updated {dateStr}
          </span>
        </div>
      </div>
    </nav>
  );
}
