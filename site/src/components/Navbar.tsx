export default function Navbar() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <nav className="border-b border-surface-border bg-terminal sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="5" fill="#05C770"/>
            <path d="M7 8.5V19.5M7 14H13M13 8.5V19.5M16.5 11.5L19.5 14L16.5 16.5"
              stroke="#141419" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans font-semibold text-white text-sm tracking-tight">HackerRank</span>
          <span className="text-surface-border">|</span>
          <span className="font-sans text-white/50 text-xs tracking-widest uppercase">Tech Hiring Index</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block bg-cursor/10 border border-cursor/30 text-cursor text-xs font-sans px-2 py-0.5 rounded">
            ENG ROLES ONLY
          </span>
          <span className="text-white/30 text-xs font-sans tabular-nums">{dateStr}</span>
        </div>
      </div>
    </nav>
  );
}
