
import React from 'react';
import { AttendanceStatus } from '../../types';

interface GraphDataPoint {
  status: AttendanceStatus;
  count: number;
  color: string; // This should be an SVG-compatible fill class like 'fill-green-500'
}

interface AttendanceSummaryGraphProps {
  data: GraphDataPoint[];
  totalEmployees: number;
}

const AttendanceSummaryGraph: React.FC<AttendanceSummaryGraphProps> = ({ data, totalEmployees }) => {
  if (!data || data.length === 0 ) {
    return <p className="text-center text-gray-500 py-4">No attendance data to display for the graph.</p>;
  }
  if (totalEmployees === 0 && data.every(d => d.count === 0) ) {
     return <p className="text-center text-gray-500 py-4">No active employees to display attendance for.</p>;
  }


  const chartHeight = 200;
  const barPadding = 15; // Increased padding
  const barWidth = 50;   // Increased bar width
  const Y_AXIS_LABEL_WIDTH = 35;
  const X_AXIS_LABEL_HEIGHT = 40; // Increased for better label spacing
  const chartWidth = data.length * (barWidth + barPadding) + barPadding + Y_AXIS_LABEL_WIDTH;
  
  const maxCount = Math.max(...data.map(d => d.count), 1); 
  const EFFECTIVE_CHART_HEIGHT = chartHeight - X_AXIS_LABEL_HEIGHT;

  return (
    <div className="w-full overflow-x-auto py-2 px-1 flex justify-center">
      <svg width={chartWidth} height={chartHeight} aria-labelledby="chartTitle" role="img" className="max-w-full">
        <title id="chartTitle">Employee Attendance Summary for Selected Date</title>
        
        {/* Y-Axis Labels & Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const yPos = EFFECTIVE_CHART_HEIGHT * (1 - tick) + 5;
          const value = Math.round(tick * maxCount);
          if (value === 0 && tick !==0) return null; // Avoid duplicate 0 label if maxCount is small
          return (
            <g key={`y-tick-${tick}`}>
              <text x={Y_AXIS_LABEL_WIDTH - 8} y={yPos} textAnchor="end" fontSize="10" fill="#6b7280" dy="0.3em">
                {value}
              </text>
              <line 
                x1={Y_AXIS_LABEL_WIDTH} y1={yPos - 5} 
                x2={chartWidth - barPadding} y2={yPos - 5} 
                stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2"
              />
            </g>
          );
        })}
        {/* Y-axis Line */}
        <line x1={Y_AXIS_LABEL_WIDTH} y1="0" x2={Y_AXIS_LABEL_WIDTH} y2={EFFECTIVE_CHART_HEIGHT} stroke="#d1d5db" strokeWidth="1"/>

        {/* Bars and X-Axis Labels */}
        {data.map((d, index) => {
          const barHeight = d.count > 0 ? (d.count / maxCount) * EFFECTIVE_CHART_HEIGHT : 0;
          const x = Y_AXIS_LABEL_WIDTH + barPadding + index * (barWidth + barPadding);
          const y = EFFECTIVE_CHART_HEIGHT - barHeight;

          return (
            <g key={d.status} transform={`translate(${x}, 0)`}>
              <title>{`${d.status}: ${d.count} employee(s)`}</title>
              <rect
                y={y}
                width={barWidth}
                height={barHeight}
                className={d.color} 
                rx="3" // Slightly rounded corners
              />
              {/* Count on top of bar */}
              {d.count > 0 && (
                <text
                  x={barWidth / 2}
                  y={y - 6} 
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#374151"
                >
                  {d.count}
                </text>
              )}
              {/* Status label below bar */}
              <text
                x={barWidth / 2}
                y={EFFECTIVE_CHART_HEIGHT + 15} 
                textAnchor="middle"
                fontSize="10"
                fill="#4b5563"
                className="capitalize"
              >
                {d.status.replace(/([A-Z])/g, ' $1').trim()} {/* Add space for CamelCase */}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default AttendanceSummaryGraph;
