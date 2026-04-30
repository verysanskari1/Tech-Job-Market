export default function Navbar() {
  return (
    <nav className="border-b border-surface-border bg-terminal/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* HackerRank wordmark — white variant */}
          <span className="font-sans font-bold text-white text-lg tracking-tight">
            HackerRank
          </span>
          <span className="text-surface-border">|</span>
          <span className="font-sans font-medium text-white/60 text-sm">
            Tech Job Market
          </span>
        </div>
        <span className="text-white/30 text-xs font-sans">
          Updated daily · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </nav>
  );
}
