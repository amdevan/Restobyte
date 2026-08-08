import React, { useMemo, useState } from 'react';
import { Sale } from '../../types';

interface TopItemsListProps {
  sales: Sale[];
  limit?: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

const TopItemsList: React.FC<TopItemsListProps> = ({ sales, limit = 5 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = useMemo(() => {
    const map: Record<string, TopItem> = {};
    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const key = item.name;
        if (!map[key]) {
          map[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        map[key].quantity += item.quantity;
        map[key].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [sales, limit]);

  const maxRevenue = items.length > 0 ? items[0].revenue : 1;

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No item data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
        return (
          <div
            key={item.name}
            className="group relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold text-gray-400 tabular-nums w-4 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-gray-800 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-gray-500 tabular-nums">{item.quantity} sold</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">
                  {item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barWidth}%`,
                  background: hoveredIndex === i
                    ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
                    : 'linear-gradient(90deg, #93c5fd, #818cf8)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopItemsList;
