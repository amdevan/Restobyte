import React, { useMemo, useState } from 'react';
import { Sale } from '../../types';

interface OrderTypeDistributionChartProps {
  sales: Sale[];
}

const COLORS: Record<string, string> = {
  'Dine In': '#3b82f6',
  'Takeaway': '#f59e0b',
  'Delivery': '#10b981',
  'Pickup': '#8b5cf6',
};

const FALLBACK_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'];

const OrderTypeDistributionChart: React.FC<OrderTypeDistributionChartProps> = ({ sales }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      const type = sale.orderType || 'Dine In';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({
        name,
        value,
        color: COLORS[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [sales]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No order data available
      </div>
    );
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 62;
  const innerR = 40;
  const gap = 2;

  let accumulated = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = accumulated * 2 * Math.PI - Math.PI / 2;
    accumulated += pct;
    const endAngle = accumulated * 2 * Math.PI - Math.PI / 2;

    const midAngle = (startAngle + endAngle) / 2;
    const isHovered = hoveredIndex === i;
    const r = isHovered ? outerR + 4 : outerR;
    const ir = isHovered ? innerR - 2 : innerR;

    const largeArc = pct > 0.5 ? 1 : 0;

    const x1 = cx + r * Math.cos(startAngle + gap / r);
    const y1 = cy + r * Math.sin(startAngle + gap / r);
    const x2 = cx + r * Math.cos(endAngle - gap / r);
    const y2 = cy + r * Math.sin(endAngle - gap / r);
    const ix1 = cx + ir * Math.cos(endAngle - gap / r);
    const iy1 = cy + ir * Math.sin(endAngle - gap / r);
    const ix2 = cx + ir * Math.cos(startAngle + gap / r);
    const iy2 = cy + ir * Math.sin(startAngle + gap / r);

    const pathD = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { ...d, pathD, pct, midAngle, r };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice, i) => (
            <path
              key={slice.name}
              d={slice.pathD}
              fill={slice.color}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{total}</span>
          <span className="text-[10px] text-gray-500 font-medium">orders</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs font-medium text-gray-700 flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-gray-900 tabular-nums">{d.value}</span>
            <span className="text-[10px] text-gray-500 tabular-nums w-10 text-right">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTypeDistributionChart;
