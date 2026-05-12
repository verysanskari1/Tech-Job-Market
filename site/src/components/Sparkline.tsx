'use client';

import type { TimeSeriesPoint } from '@/types';

interface Props {
  data: TimeSeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
}

// Bare-bones SVG sparkline. We render this 40+ times in the company table,
// so we use raw SVG paths instead of recharts to stay fast.
export default function Sparkline({
  data,
  width = 96,
  height = 28,
  stroke = '#AEF96C',
}: Props) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#2E2E3A"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  const ys = data.map(p => p.total);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.total - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  // Area path: line + drop to baseline + close
  const areaD =
    pathD +
    ` L${width.toFixed(1)},${height.toFixed(1)} L0,${height.toFixed(1)} Z`;

  // Up or down? Color the line accordingly.
  const last = data[data.length - 1].total;
  const first = data[0].total;
  const colorStroke = last >= first ? stroke : '#D26F6C'; // aurora vs ember

  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} aria-hidden className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorStroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={colorStroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={colorStroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
