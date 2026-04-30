'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CategoryCount } from '@/types';

// Maps each category to a brand color
const CATEGORY_COLORS: Record<string, string> = {
  'AI Engineer':             '#05C770',
  'ML/Research':             '#AA99FF',
  'Backend Engineer':        '#3355FF',
  'Frontend Engineer':       '#C3EDFF',
  'Infrastructure Engineer': '#FABD83',
  'Data Engineer':           '#FCF283',
  'Security Engineer':       '#D26F6C',
  'Mobile Engineer':         '#AEF96C',
  'Hardware Engineer':       '#DBFFC2',
  'Forward Deployed Engineer': '#05C770',
  'GTM Engineer':            '#FABD83',
  'QA/Test Engineer':        '#E7F8FF',
  'MTS':                     '#AA99FF',
  'New Grad/Junior':         '#FCF283',
};

const DEFAULT_COLOR = '#2E2E3A';

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: CategoryCount }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { category, count } = payload[0].payload;
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm font-sans">
      <p className="text-white font-medium">{category}</p>
      <p className="text-white/60">{count.toLocaleString()} open roles</p>
    </div>
  );
}

export default function CategoryChart({ data }: { data: CategoryCount[] }) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-white/30 text-sm font-sans">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        barSize={14}
      >
        <XAxis
          type="number"
          tick={{ fill: '#ffffff50', fontSize: 11, fontFamily: 'Satoshi, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={170}
          tick={{ fill: '#ffffff80', fontSize: 12, fontFamily: 'Satoshi, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map(entry => (
            <Cell
              key={entry.category}
              fill={CATEGORY_COLORS[entry.category] ?? DEFAULT_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
