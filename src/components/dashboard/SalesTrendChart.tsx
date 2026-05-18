import React from 'react';
import { SalesTrendDataPoint } from '../../types';

interface SalesTrendChartProps {
  data: SalesTrendDataPoint[];
  color?: string;
}

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, color = '#2563eb' }) => {
  const width = 780;
  const height = 260;
  const paddingX = 56;
  const paddingY = 30;

  if (!data?.length) {
    return <p className="text-center text-gray-500 py-8">No sales data available for the selected period.</p>;
  }

  const max = Math.max(...data.map(d => d.sales), 0);
  const min = 0;
  const range = max - min || 1;

  const toX = (i: number) => paddingX + (i / Math.max(1, data.length - 1)) * (width - 2 * paddingX);
  const toY = (v: number) => paddingY + (height - 2 * paddingY) - ((v - min) / range) * (height - 2 * paddingY);

  const lineD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.sales)}`)
    .join(' ');

  const areaD = `${lineD} L${toX(data.length - 1)},${height - paddingY} L${toX(0)},${height - paddingY} Z`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const yLabelCount = 5;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-full block">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: yLabelCount }, (_, i) => {
          const y = paddingY + (i / (yLabelCount - 1)) * (height - 2 * paddingY);
          return (
            <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="stroke-gray-100" />
          );
        })}

        <path d={areaD} fill="url(#trendFill)" />
        <path d={lineD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].sales)} r="4.5" fill={color} stroke="white" strokeWidth="2" />

        {Array.from({ length: yLabelCount }, (_, i) => {
          const value = min + ((yLabelCount - 1 - i) / (yLabelCount - 1)) * range;
          const y = paddingY + (i / (yLabelCount - 1)) * (height - 2 * paddingY);
          return (
            <text key={i} x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400 tabular-nums">
              {Math.round(value).toLocaleString()}
            </text>
          );
        })}

        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={d.date} x={toX(i)} y={height - paddingY + 18} textAnchor="middle" className="text-[10px] fill-gray-400">
              {formatShortDate(d.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default SalesTrendChart;
