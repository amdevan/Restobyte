


import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ size?: string | number; className?: string }>;
  path: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  path,
}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(path);
  };

  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200/50 group"
      onClick={handleNavigate}
    >
        <div className="flex justify-between items-start">
            <div className="flex-shrink-0 p-3 bg-sky-100 rounded-lg">
                {React.cloneElement(icon, { size: 24, className: "text-sky-600" })}
            </div>
            {/* Placeholder for future elements like a sparkline */}
        </div>
        <div className="mt-4">
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
        </div>
    </div>
  );
};

export default DashboardStatCard;