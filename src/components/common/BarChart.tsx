import React from 'react';

type Datum = { label: string; value: number };

const BarChart: React.FC<{ data: Datum[]; height?: number }> = ({ data, height = 180 }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end h-full space-x-2">
        {data.map((d, idx) => {
          const h = (d.value / max) * (height - 30);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-sky-500 rounded-t" style={{ height: h }} />
              <span className="text-xs text-gray-600 mt-1">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
