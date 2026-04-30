'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#05C770' }: { data: number[]; color?: string }) {
  if (data.length < 2) {
    return <div className="h-8 w-full flex items-center"><div className="w-full h-px bg-white/10" /></div>;
  }

  const chartData = data.map((v, i) => ({ i, v }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const domain: [number, number] = min === max ? [min * 0.99, max * 1.01] : [min, max];

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          domain={domain}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
