'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CategoryCount, CompanySnapshot } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'AI Engineer':              '#05C770',
  'ML/Research':              '#AA99FF',
  'Backend Engineer':         '#3355FF',
  'Frontend Engineer':        '#C3EDFF',
  'Infrastructure Engineer':  '#FABD83',
  'Data Engineer':            '#FCF283',
  'Security Engineer':        '#D26F6C',
  'Mobile Engineer':          '#AEF96C',
  'Hardware Engineer':        '#DBFFC2',
  'Forward Deployed Engineer':'#05C770',
  'GTM Engineer':             '#FABD83',
  'QA/Test Engineer':         '#E7F8FF',
  'MTS':                      '#AA99FF',
  'New Grad/Junior':          '#FCF283',
};

interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  companies: CompanySnapshot[];
}

function CustomTooltip({ active, payload, companies }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { category, count } = payload[0].payload as CategoryCount;
  const topCos = companies
    .filter(c => (c.by_category[category] ?? 0) > 0)
    .sort((a, b) => (b.by_category[category] ?? 0) - (a.by_category[category] ?? 0))
    .slice(0, 6);
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2.5 text-sm font-sans shadow-lg min-w-[200px]">
      <p className="text-white font-medium mb-1">{category}</p>
      <p className="text-white/50 text-xs mb-2">{count.toLocaleString()} open roles</p>
      {topCos.map(co => (
        <div key={co.company_id} className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-white/70 text-xs">{co.name}</span>
          <span className="text-white/40 text-xs tabular-nums">{co.by_category[category]}</span>
        </div>
      ))}
      <p className="text-white/20 text-xs mt-2 border-t border-surface-border pt-2">Click to filter companies</p>
    </div>
  );
}

interface Props {
  data: CategoryCount[];
  companies: CompanySnapshot[];
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
}

export default function CategoryChart({ data, companies, selectedCategory, onCategorySelect }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-white/30 text-sm font-sans">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
        barSize={16}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const cat = (e.activePayload[0].payload as CategoryCount).category;
            onCategorySelect(selectedCategory === cat ? null : cat);
          }
        }}
      >
        <XAxis
          type="number"
          tick={{ fill: '#ffffff40', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={185}
          tick={{ fill: '#ffffff80', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} companies={companies} />} cursor={{ fill: '#ffffff06' }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} style={{ cursor: 'pointer' }}>
          {data.map(entry => {
            const isSelected = selectedCategory === entry.category;
            const isDimmed = selectedCategory !== null && !isSelected;
            const baseColor = CATEGORY_COLORS[entry.category] ?? '#3355FF';
            return (
              <Cell
                key={entry.category}
                fill={baseColor}
                opacity={isDimmed ? 0.25 : 1}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
