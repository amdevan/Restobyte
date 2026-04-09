


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
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  path,
  subtitle,
  deltaPercent,
  size = 'sm',
}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(path);
  };

  const hasDelta = typeof deltaPercent === 'number' && !Number.isNaN(deltaPercent);
  const sign = hasDelta ? Math.sign(deltaPercent!) : 0;
  const deltaColor =
    !hasDelta ? 'text-gray-400' : sign >= 0 ? 'text-green-600' : 'text-red-600';
  const deltaBg =
    !hasDelta ? 'bg-gray-100' : sign >= 0 ? 'bg-green-50' : 'bg-red-50';
  const arrow = !hasDelta ? '' : sign >= 0 ? '▲' : '▼';
  const deltaText = hasDelta ? `${arrow} ${Math.abs(deltaPercent!).toFixed(1)}%` : '—';

  const pad = size === 'sm' ? 'p-3' : 'p-5';
  const valueText = size === 'sm' ? 'text-2xl' : 'text-3xl';
  const iconSize = size === 'sm' ? 20 : 24;
  const subtitleText = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div 
      className={`bg-white ${pad} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200/70 group focus:outline-none focus:ring-2 focus:ring-sky-400`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(); } }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-shrink-0 p-2 bg-sky-50 rounded-md ring-1 ring-sky-100">
          {React.cloneElement(icon, { size: iconSize, className: "text-sky-600" })}
        </div>
        {hasDelta && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${deltaBg} ${deltaColor}`}>
            {deltaText}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`${valueText} font-extrabold text-gray-900 tracking-tight`}>{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
        {subtitle && <p className={`${subtitleText} uppercase tracking-wide text-gray-400 mt-0.5`}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardStatCard;
