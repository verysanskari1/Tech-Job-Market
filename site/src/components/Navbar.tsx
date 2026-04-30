export default function Navbar() {
  return (
    <nav className="border-b border-surface-border bg-terminal/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* HackerRank logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="28" height="28" rx="6" fill="#05C770"/>
            <path
              d="M7 8.5V19.5M7 14H13M13 8.5V19.5M16.5 11.5L19.5 14L16.5 16.5"
              stroke="#141419"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-sans font-bold text-white text-base tracking-tight">
            HackerRank
          </span>
          <span className="text-surface-border text-lg leading-none">|</span>
          <span className="font-sans font-medium text-white/60 text-sm">
            Tech Job Market
          </span>
        </div>
        <span className="text-white/30 text-xs font-sans">
          Updated daily ·{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </nav>
  );
}
