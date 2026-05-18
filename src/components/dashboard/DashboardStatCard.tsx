


import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ size?: string | number; className?: string }>;
  path: string;
  subtitle?: string;
  deltaPercent?: number; // positive/negative change
  size?: 'sm' | 'md';
  sparklinePoints?: number[];
  sparklineColor?: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  path,
  subtitle,
  deltaPercent,
  size = 'sm',
  sparklinePoints,
  sparklineColor = '#2563eb',
  iconBgClass = 'bg-blue-50',
  iconColorClass = 'text-blue-600',
}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(path);
  };

  const hasDelta = typeof deltaPercent === 'number' && !Number.isNaN(deltaPercent);
  const sign = hasDelta ? Math.sign(deltaPercent!) : 0;
  const arrow = !hasDelta ? '' : sign >= 0 ? '▲' : '▼';
  const deltaText = hasDelta ? `${arrow} ${Math.abs(deltaPercent!).toFixed(1)}%` : '';

  const pad = size === 'sm' ? 'p-4' : 'p-5';
  const valueText = size === 'sm' ? 'text-lg' : 'text-2xl';
  const iconSize = size === 'sm' ? 18 : 22;
  const subtitleText = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const showSparkline = Array.isArray(sparklinePoints) && sparklinePoints.length >= 2;
  const sparkWidth = 84;
  const sparkHeight = 28;
  const sparkPad = 2;
  const effectiveSparkPoints = (() => {
    if (!showSparkline) return sparklinePoints;

    const base = sparklinePoints!;
    const max = Math.max(...base, 0);
    const min = Math.min(...base, 0);
    if (max - min === 0) {
      return base.map((v, i) => v + i);
    }
    return base;
  })();
  const sparkMax = showSparkline ? Math.max(...effectiveSparkPoints!, 0) : 0;
  const sparkMin = showSparkline ? Math.min(...effectiveSparkPoints!, 0) : 0;
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkToX = (i: number) => sparkPad + (i / Math.max(1, effectiveSparkPoints!.length - 1)) * (sparkWidth - 2 * sparkPad);
  const sparkToY = (v: number) => sparkPad + (sparkHeight - 2 * sparkPad) - ((v - sparkMin) / sparkRange) * (sparkHeight - 2 * sparkPad);
  const sparkPoints = showSparkline
    ? effectiveSparkPoints!.map((p, i) => ({ x: sparkToX(i), y: sparkToY(p) }))
    : [];

  const sparkCurveD = (() => {
    if (!showSparkline) return '';
    if (sparkPoints.length === 0) return '';
    if (sparkPoints.length === 1) return `M${sparkPoints[0].x},${sparkPoints[0].y}`;
    if (sparkPoints.length === 2) return `M${sparkPoints[0].x},${sparkPoints[0].y} L${sparkPoints[1].x},${sparkPoints[1].y}`;

    let d = `M${sparkPoints[0].x},${sparkPoints[0].y}`;
    for (let i = 0; i < sparkPoints.length - 1; i += 1) {
      const p0 = sparkPoints[i - 1] ?? sparkPoints[i];
      const p1 = sparkPoints[i];
      const p2 = sparkPoints[i + 1];
      const p3 = sparkPoints[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
  })();

  const sparkAreaD = showSparkline
    ? `${sparkCurveD} L${sparkToX(effectiveSparkPoints!.length - 1)},${sparkHeight - sparkPad} L${sparkToX(0)},${sparkHeight - sparkPad} Z`
    : '';
  const sparkLastX = showSparkline ? sparkToX(effectiveSparkPoints!.length - 1) : 0;
  const sparkLastY = showSparkline ? sparkToY(effectiveSparkPoints![effectiveSparkPoints!.length - 1]) : 0;
  const sparkGradientId = `spark-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div 
      className={`bg-white/80 backdrop-blur ${pad} rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ring-1 ring-gray-200/70 group focus:outline-none focus:ring-2 focus:ring-blue-400`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(); } }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-9 h-9 rounded-xl ${iconBgClass} flex items-center justify-center ring-1 ring-gray-200/60 flex-shrink-0`}>
                {React.cloneElement(icon, { size: iconSize, className: iconColorClass })}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-800 leading-4 truncate">{title}</div>
                {subtitle && <div className={`${subtitleText} text-gray-500 mt-0.5 truncate`}>{subtitle}</div>}
              </div>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className={`${valueText} font-extrabold text-gray-900 tracking-tight tabular-nums`}>{value}</div>
            </div>
            {hasDelta && (
              <div className={`mt-2 text-[11px] font-semibold ${sign >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {deltaText} <span className="text-gray-400 font-medium">vs previous period</span>
              </div>
            )}
          </div>
        </div>

        {showSparkline && (
          <div className="pt-1">
            <svg width={200} height={sparkHeight} viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="block w-full">
              <defs>
                <linearGradient id={sparkGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.20" />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkAreaD} fill={`url(#${sparkGradientId})`} />
              <path d={sparkCurveD} fill="none" stroke={sparklineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={sparkLastX} cy={sparkLastY} r="3.6" fill={sparklineColor} stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStatCard;
