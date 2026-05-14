'use client';

interface Props {
  value: number; // 0..1
}

// Horizontal 0→1 scale with a marker at `value`. Endpoints labeled.
// Marker color shifts aurora → sunrise → ember as the value climbs.
export default function PDoomBar({ value }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = clamped * 100;

  const markerColor =
    clamped < 0.33 ? '#AEF96C'   // aurora — calm
    : clamped < 0.66 ? '#FCF283' // sunrise — warning
    : '#D26F6C';                  // ember — alarming

  return (
    <div className="inline-flex items-center gap-3 max-w-full">
      <span className="font-serif italic text-white/70 text-base md:text-lg">
        P<span className="not-italic">(</span>doom<span className="not-italic">)</span>
      </span>

      <div className="relative w-48 md:w-64 h-1.5 bg-surface-border rounded-full">
        {/* subtle tick marks */}
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-px h-2.5 bg-white/20" />
        <span className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-px h-2 bg-white/10" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-px h-2.5 bg-white/20" />

        {/* the marker */}
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-terminal shadow"
          style={{ left: `${pct}%`, background: markerColor }}
          aria-hidden
        />
      </div>

      <span className="font-serif italic text-canvas tabular-nums text-base md:text-lg w-12 text-right">
        {clamped.toFixed(2)}
      </span>
    </div>
  );
}
