'use client';

import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#05C770', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) {
    return <div style={{ height }} className="w-full flex items-center"><div className="w-full h-px bg-white/10" /></div>;
  }

  const chartData = data.map((v, i) => ({ i, v }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const domain: [number, number] = min === max ? [min * 0.99, max * 1.01] : [min * 0.998, max * 1.002];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <YAxis domain={domain} hide />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={height > 32 ? 2 : 1.5}
          dot={height > 32 ? { fill: color, r: 2, strokeWidth: 0 } : false}
          activeDot={height > 32 ? { fill: color, r: 3, strokeWidth: 0 } : undefined}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
