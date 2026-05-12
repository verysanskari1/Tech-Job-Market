import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-surface-border bg-terminal/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-sans font-bold text-canvas text-lg tracking-tight">
            Doomberg
          </Link>
          <a href="/#roles" className="font-sans text-white/60 hover:text-canvas text-sm transition-colors">
            Roles
          </a>
          <a href="/#companies" className="font-sans text-white/60 hover:text-canvas text-sm transition-colors">
            Companies
          </a>
        </div>
        <span className="text-white/30 text-xs font-sans hidden md:inline">
          Updated daily · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </nav>
  );
}
