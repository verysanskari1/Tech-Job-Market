import type { CategoryMover, GainersLosers } from '@/types';

function CompanyRow({ name, delta, total }: { name: string; delta: number; total: number }) {
  const up = delta > 0;
  const color = up ? 'text-[#00FF7F]' : 'text-[#FF4D4D]';
  const sign = up ? '+' : '';
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border/40 last:border-0">
      <span className="text-white/80 font-sans text-sm truncate pr-2">{name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white/30 font-mono text-xs tabular-nums">{total.toLocaleString()}</span>
        <span className={`${color} font-mono text-sm font-semibold tabular-nums w-14 text-right`}>
          {sign}{delta}
        </span>
      </div>
    </div>
  );
}

function CategoryRow({ category, delta, total }: CategoryMover) {
  const up = delta > 0;
  const color = up ? 'text-[#00FF7F]' : 'text-[#FF4D4D]';
  const arrow = up ? '▲' : '▼';
  const sign = up ? '+' : '';
  const pct = total > 0 ? Math.round(Math.abs(delta) / (total - delta) * 100) : 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border/40 last:border-0">
      <span className="text-white/80 font-sans text-sm">{category}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`${color} font-mono text-xs`}>{arrow} {pct}%</span>
        <span className={`${color} font-mono text-sm font-semibold tabular-nums w-14 text-right`}>
          {sign}{delta}
        </span>
      </div>
    </div>
  );
}

function NotEnoughData({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <span className="text-white/20 font-sans text-xs text-center">
        Not enough data yet
      </span>
      <span className="text-white/10 font-sans text-xs text-center">
        {label} will populate after 7 days of snapshots
      </span>
    </div>
  );
}

interface Props {
  gainersLosers: GainersLosers;
  categoryMovers: CategoryMover[];
}

export default function GainersLosersPanel({ gainersLosers, categoryMovers }: Props) {
  const label = gainersLosers.hasData ? '7-day' : 'partial data';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Gainers */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
            Top Gainers
          </h2>
          <span className="text-white/30 font-sans text-xs">{label}</span>
        </div>
        {gainersLosers.gainers.length > 0 ? (
          <div>
            {gainersLosers.gainers.map(m => (
              <CompanyRow key={m.company_id} name={m.name} delta={m.delta} total={m.total_open} />
            ))}
          </div>
        ) : (
          <NotEnoughData label="Gainers" />
        )}
      </div>

      {/* Losers */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
            Top Losers
          </h2>
          <span className="text-white/30 font-sans text-xs">{label}</span>
        </div>
        {gainersLosers.losers.length > 0 ? (
          <div>
            {gainersLosers.losers.map(m => (
              <CompanyRow key={m.company_id} name={m.name} delta={m.delta} total={m.total_open} />
            ))}
          </div>
        ) : (
          <NotEnoughData label="Losers" />
        )}
      </div>

      {/* Role category movers */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-sans font-semibold text-sm uppercase tracking-wider">
            Roles by Category
          </h2>
          <span className="text-white/30 font-sans text-xs">{label}</span>
        </div>
        {categoryMovers.length > 0 ? (
          <div>
            {categoryMovers.map(c => (
              <CategoryRow key={c.category} {...c} />
            ))}
          </div>
        ) : (
          <NotEnoughData label="Category trends" />
        )}
      </div>

    </section>
  );
}
