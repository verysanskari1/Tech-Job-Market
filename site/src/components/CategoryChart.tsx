'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CategoryCount } from '@/types';

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

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: CategoryCount }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { category, count } = payload[0].payload;
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm font-sans shadow-lg">
      <p className="text-white font-medium">{category}</p>
      <p className="text-white/60">{count.toLocaleString()} open roles</p>
      <p className="text-white/30 text-xs mt-0.5">Click to filter companies</p>
    </div>
  );
}

interface Props {
  data: CategoryCount[];
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
}

export default function CategoryChart({ data, selectedCategory, onCategorySelect }: Props) {
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff06' }} />
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
