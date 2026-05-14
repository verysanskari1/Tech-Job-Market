export default function Footer() {
  return (
    <footer className="mt-20 border-t border-surface-border py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans text-white/40">
        <p>
          The <span className="text-aurora">Doomberg</span> Terminal · live tech hiring index
        </p>
        <p>
          Logos by{' '}
          <a
            href="https://logo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-aurora underline decoration-white/20 hover:decoration-aurora underline-offset-4 transition-colors"
          >
            logo.dev
          </a>
        </p>
      </div>
    </footer>
  );
}
