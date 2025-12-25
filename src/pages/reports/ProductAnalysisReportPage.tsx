
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiList, FiArrowLeft, FiFilter, FiTag } from 'react-icons/fi';

interface ItemSaleData {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  grossRevenue: number;
}

const ProductAnalysisReportPage: React.FC = () => {
  const { sales, menuItems, foodMenuCategories } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const analysisData = useMemo(() => {
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

    const data: Record<string, ItemSaleData> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(saleItem => {
        const menuItem = menuItems.find(mi => mi.id === saleItem.id);
        const categoryName = menuItem?.category || 'Uncategorized';
        
        if (categoryFilter !== 'All' && categoryName !== categoryFilter) {
            return;
        }

        if (!data[saleItem.id]) {
          data[saleItem.id] = { 
            id: saleItem.id,
            name: menuItem?.name || saleItem.name,
            category: categoryName,
            quantitySold: 0,
            grossRevenue: 0 
          };
        }
        data[saleItem.id].quantitySold += saleItem.quantity;
        data[saleItem.id].grossRevenue += saleItem.quantity * saleItem.price;
      });
    });
    
    return Object.values(data).sort((a, b) => b.grossRevenue - a.grossRevenue);
  }, [sales, menuItems, startDate, endDate, categoryFilter]);
  
  const totalRevenue = useMemo(() => {
    return analysisData.reduce((sum, item) => sum + item.grossRevenue, 0);
  }, [analysisData]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Product Analysis Report as ${format}... (This is a simulation)`);
  };
  
  const categories = useMemo(() => ['All', ...foodMenuCategories.map(c => c.name)], [foodMenuCategories]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiList className="mr-3 text-sky-600" /> Product Analysis Report
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="categoryFilter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Button onClick={() => { setStartDate(''); setEndDate(''); setCategoryFilter('All'); }} variant="secondary">Reset Filters</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-700">Item Performance ({analysisData.length})</h3>
           <div className="text-right">
                <p className="text-sm text-gray-600">Total Revenue (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">${totalRevenue.toFixed(2)}</p>
            </div>
        </div>
        <div className="overflow-x-auto">
          {analysisData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No sales data found for the selected criteria.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Item Name</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-right">Qty Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">% of Total Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                    <td className="py-3 px-4 text-right">{item.quantitySold}</td>
                    <td className="py-3 px-4 text-right font-semibold">${item.grossRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">{totalRevenue > 0 ? ((item.grossRevenue / totalRevenue) * 100).toFixed(2) : '0.00'}%</td>
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

export default ProductAnalysisReportPage;
