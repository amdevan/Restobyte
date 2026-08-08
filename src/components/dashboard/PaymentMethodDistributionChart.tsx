import React, { useMemo, useState } from 'react';
import { Sale } from '../../types';

interface PaymentMethodDistributionChartProps {
  sales: Sale[];
}

const COLORS: Record<string, string> = {
  'Cash': '#10b981',
  'Card': '#3b82f6',
  'Online': '#8b5cf6',
  'Online Payment': '#8b5cf6',
  'Fonepay': '#f59e0b',
  'Split': '#ec4899',
  'Credit': '#ef4444',
};

const FALLBACK_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4'];

const PaymentMethodDistributionChart: React.FC<PaymentMethodDistributionChartProps> = ({ sales }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const amounts: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.partialPayments && sale.partialPayments.length > 0) {
        sale.partialPayments.forEach(p => {
          const method = p.method || 'Cash';
          amounts[method] = (amounts[method] || 0) + p.amount;
        });
      } else if (sale.paymentMethod) {
        const method = sale.paymentMethod;
        amounts[method] = (amounts[method] || 0) + sale.totalAmount;
      }
    });
    return Object.entries(amounts)
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
        No payment data available
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

    return { ...d, pathD, pct };
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
          {hoveredIndex !== null ? (
            <>
              <span className="text-lg font-extrabold text-gray-900 tabular-nums">{((data[hoveredIndex].value / total) * 100).toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500 font-medium">{data[hoveredIndex].name}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-500 font-medium">Total</span>
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}</span>
            </>
          )}
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
            <span className="text-xs font-semibold text-gray-900 tabular-nums">{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}</span>
            <span className="text-[10px] text-gray-500 tabular-nums w-10 text-right">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodDistributionChart;
