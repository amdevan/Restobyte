

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Sale, MenuItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiTag, FiDollarSign, FiList, FiArrowLeft } from 'react-icons/fi';

interface CategorySaleData {
  categoryName: string;
  quantitySold: number;
  totalSales: number;
}

const CategoryPieChart: React.FC<{ data: CategorySaleData[] }> = ({ data }) => {
    const totalSales = data.reduce((sum, item) => sum + item.totalSales, 0);
    if (totalSales === 0) return null;

    const colors = ['#38bdf8', '#fbbf24', '#34d399', '#f87171', '#818cf8', '#a78bfa', '#f472b6', '#fb923c'];

    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center p-4 space-y-4 md:space-y-0 md:space-x-8">
            <svg width="200" height="200" viewBox="-100 -100 200 200" className="transform -rotate-90">
                <title>Sales Distribution by Category</title>
                {data.map((item, index) => {
                    const percentage = item.totalSales / totalSales;
                    const strokeDasharray = `${percentage * circumference} ${circumference}`;
                    const strokeDashoffset = -accumulatedPercentage * circumference;
                    accumulatedPercentage += percentage;

                    return (
                        <circle
                            key={item.categoryName}
                            r={radius}
                            cx="0"
                            cy="0"
                            fill="transparent"
                            stroke={colors[index % colors.length]}
                            strokeWidth="30"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                        >
                            <title>{`${item.categoryName}: $${item.totalSales.toFixed(2)} (${(percentage * 100).toFixed(1)}%)`}</title>
                        </circle>
                    );
                })}
            </svg>
            <div className="w-full md:w-1/2 space-y-2">
                {data.map((item, index) => (
                    <div key={item.categoryName} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: colors[index % colors.length] }}></span>
                        <span className="text-gray-700 truncate flex-1">{item.categoryName}</span>
                        <span className="font-medium text-gray-800 ml-2">${item.totalSales.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const FoodMenuSaleByCategoryPage: React.FC = () => {
  const { sales, menuItems } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categorySalesData = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;
      if (sDate && saleDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (saleDate > endOfDay) return false;
      }
      return true;
    });

    const data: Record<string, CategorySaleData> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(saleItem => {
        const menuItem = menuItems.find(mi => mi.id === saleItem.id);
        const categoryName = menuItem?.category || 'Uncategorized';
        
        if (!data[categoryName]) {
          data[categoryName] = { categoryName, quantitySold: 0, totalSales: 0 };
        }
        data[categoryName].quantitySold += saleItem.quantity;
        data[categoryName].totalSales += saleItem.quantity * saleItem.price;
      });
    });
    
    return Object.values(data).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales, menuItems, startDate, endDate]);
  
  const totalValue = useMemo(() => {
    return categorySalesData.reduce((sum, item) => sum + item.totalSales, 0);
  }, [categorySalesData]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Food Menu Sale By Category Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiTag className="mr-3 text-sky-600" /> Food Menu Sale By Category
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input label="Start Date" id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="End Date" id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Button onClick={() => { setStartDate(''); setEndDate(''); }} variant="secondary">Reset Dates</Button>
        </div>
      </Card>

      <Card title="Category Sales Distribution">
          <CategoryPieChart data={categorySalesData} />
      </Card>

      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-700">Category Sales Details</h3>
           <div className="text-right">
                <p className="text-sm text-gray-600">Total Sales (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalValue.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {categorySalesData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No sales data found for the selected period.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category Name</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity Sold</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Sales</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorySalesData.map(item => (
                  <tr key={item.categoryName} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.categoryName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.quantitySold}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-semibold text-right">${item.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FoodMenuSaleByCategoryPage;