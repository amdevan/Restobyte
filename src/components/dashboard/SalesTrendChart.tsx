import React, { useState, useCallback } from 'react';
import { SalesTrendDataPoint } from '../../types';

interface SalesTrendChartProps {
  data: SalesTrendDataPoint[];
  color?: string;
  formatValue?: (value: number) => string;
}

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  color = '#2563eb',
  formatValue,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 780;
  const height = 280;
  const paddingX = 56;
  const paddingY = 30;
  const chartWidth = width - 2 * paddingX;
  const chartHeight = height - 2 * paddingY;

  const formatVal = formatValue || ((v: number) => v.toLocaleString());

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No sales data available for the selected period.
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.sales), 0);
  const min = 0;
  const range = max - min || 1;

  const toX = (i: number) => paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
  const toY = (v: number) => paddingY + chartHeight - ((v - min) / range) * chartHeight;

  // Smooth cubic bezier curve
  const buildSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 6;
      const c1x = p1.x + (p2.x - p0.x) / tension;
      const c1y = p1.y + (p2.y - p0.y) / tension;
      const c2x = p2.x - (p3.x - p1.x) / tension;
      const c2y = p2.y - (p3.y - p1.y) / tension;

      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.sales) }));
  const lineD = buildSmoothPath(points);

  const areaD = `${lineD} L${toX(data.length - 1)},${height - paddingY} L${toX(0)},${height - paddingY} Z`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const yLabelCount = 5;

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;
  const hoveredCoord = hoveredIndex !== null ? points[hoveredIndex] : null;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * width;
      const dataIndex = Math.round(
        ((svgX - paddingX) / chartWidth) * (data.length - 1)
      );
      const clamped = Math.max(0, Math.min(data.length - 1, dataIndex));
      setHoveredIndex(clamped);
    },
    [data.length, chartWidth]
  );

  return (
    <div className="w-full overflow-x-auto relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-full block"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yLabelCount }, (_, i) => {
          const y = paddingY + (i / (yLabelCount - 1)) * chartHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          );
        })}

        {/* Hover vertical line */}
        {hoveredCoord && (
          <line
            x1={hoveredCoord.x}
            y1={paddingY}
            x2={hoveredCoord.x}
            y2={height - paddingY}
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#trendFill)" />

        {/* Line */}
        <path d={lineD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points - show on hover */}
        {hoveredIndex !== null && hoveredCoord && (
          <>
            <circle cx={hoveredCoord.x} cy={hoveredCoord.y} r="6" fill="white" stroke={color} strokeWidth="3" />
          </>
        )}

        {/* Always show last point */}
        <circle
          cx={toX(data.length - 1)}
          cy={toY(data[data.length - 1].sales)}
          r="4.5"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />

        {/* Y-axis labels */}
        {Array.from({ length: yLabelCount }, (_, i) => {
          const value = min + ((yLabelCount - 1 - i) / (yLabelCount - 1)) * range;
          const y = paddingY + (i / (yLabelCount - 1)) * chartHeight;
          return (
            <text
              key={`y-${i}`}
              x={paddingX - 10}
              y={y + 4}
              textAnchor="end"
              className="text-[10px] fill-gray-400 tabular-nums"
            >
              {formatVal(Math.round(value))}
            </text>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={`x-${d.date}`}
              x={toX(i)}
              y={height - paddingY + 18}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
            >
              {formatShortDate(d.date)}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && hoveredCoord && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs shadow-lg border border-gray-700"
          style={{
            left: `${(hoveredCoord.x / width) * 100}%`,
            top: `${(hoveredCoord.y / height) * 100 - 8}%`,
            transform: hoveredCoord.x > width / 2 ? 'translateX(-110%) translateX(-8px)' : 'translateX(8px)',
          }}
        >
          <div className="font-semibold">{formatShortDate(hoveredPoint.date)}</div>
          <div className="text-gray-300 mt-0.5">
            Sales: <span className="font-bold text-white">{formatVal(hoveredPoint.sales)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTrendChart;
