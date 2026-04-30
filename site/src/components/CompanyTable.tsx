import type { CompanySnapshot } from '@/types';

function topCategory(byCategory: Record<string, number>): string {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? '—';
}

export default function CompanyTable({ companies }: { companies: CompanySnapshot[] }) {
  if (companies.length === 0) {
    return (
      <div className="text-white/30 text-sm font-sans py-8 text-center">
        No data yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left text-white/40 font-medium pb-3 pr-4 w-8">#</th>
            <th className="text-left text-white/40 font-medium pb-3 pr-4">Company</th>
            <th className="text-right text-white/40 font-medium pb-3 pr-4">Open Roles</th>
            <th className="text-left text-white/40 font-medium pb-3">Top Category</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((co, i) => (
            <tr
              key={co.company_id}
              className="border-b border-surface-border/50 hover:bg-surface-raised/50 transition-colors"
            >
              <td className="py-3 pr-4 text-white/30">{i + 1}</td>
              <td className="py-3 pr-4 text-white font-medium">{co.name}</td>
              <td className="py-3 pr-4 text-right text-white/80 tabular-nums">
                {co.total_open.toLocaleString()}
              </td>
              <td className="py-3">
                <span className="bg-surface-raised border border-surface-border text-white/70 rounded-md px-2 py-0.5 text-xs">
                  {topCategory(co.by_category)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
