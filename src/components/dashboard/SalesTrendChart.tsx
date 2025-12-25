
import React from 'react';
import { SalesTrendDataPoint } from '../../types';

interface SalesTrendChartProps {
  data: SalesTrendDataPoint[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-8">No sales data available for the selected period.</p>;
  }

  const chartHeight = 220;
  const chartWidth = 450; // Increased width for more space
  const padding = { top: 20, right: 20, bottom: 45, left: 45 }; // Increased bottom/left for labels
  
  const effectiveWidth = chartWidth - padding.left - padding.right;
  const effectiveHeight = chartHeight - padding.top - padding.bottom;

  const maxSales = Math.max(...data.map(d => d.sales), 0);
  const minSales = 0; // Assuming sales don't go negative

  // X-axis (days)
  const xPoints = data.map((_, index) => padding.left + (index / (data.length - 1)) * effectiveWidth);
  
  // Y-axis (sales amount)
  const yPoints = data.map(d => 
    padding.top + effectiveHeight - ((d.sales - minSales) / (maxSales - minSales + (maxSales === minSales ? 1 : 0))) * effectiveHeight
  );
  
  const linePath = data.map((_, index) => `${index === 0 ? 'M' : 'L'}${xPoints[index]},${yPoints[index]}`).join(' ');

  const yAxisTicks = 5;
  const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => 
    minSales + (i / yAxisTicks) * (maxSales - minSales)
  );

  return (
    <div className="w-full overflow-x-auto p-2 flex justify-center">
      <svg width={chartWidth} height={chartHeight} aria-labelledby="salesTrendTitle" role="img" className="max-w-full">
        <title id="salesTrendTitle">7-Day Sales Trend</title>
        {/* Y-axis grid lines and labels */}
        {yTickValues.map(tickValue => {
          const yPos = padding.top + effectiveHeight - ((tickValue - minSales) / (maxSales - minSales + (maxSales === minSales ? 1:0) )) * effectiveHeight;
          return (
            <g key={`y-tick-${tickValue}`}>
              <line 
                x1={padding.left} y1={yPos} 
                x2={chartWidth - padding.right} y2={yPos} 
                stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2"
              />
              <text 
                x={padding.left - 8} y={yPos} 
                textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#6b7280">
                ${Math.round(tickValue)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, index) => (
          <text 
            key={`x-label-${d.date}`}
            x={xPoints[index]} y={chartHeight - padding.bottom + 15} 
            textAnchor="middle" fontSize="10" fill="#6b7280">
            {d.date}
          </text>
        ))}
        
        {/* Y-axis Line */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1"/>
        {/* X-axis Line */}
        <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1"/>


        {/* Sales line */}
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" />

        {/* Data points */}
        {data.map((d, index) => (
          <circle 
            key={`point-${d.date}`} 
            cx={xPoints[index]} cy={yPoints[index]} r="3" 
            fill="#0ea5e9" stroke="#fff" strokeWidth="1.5"
          >
            <title>{`${d.date}: $${d.sales.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default SalesTrendChart;
