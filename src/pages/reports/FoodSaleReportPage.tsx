

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Sale, MenuItem as MenuItemType } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiSearch, FiList, FiArrowLeft } from 'react-icons/fi';

interface ItemSaleData {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  totalSales: number;
}

const FoodSaleReportPage: React.FC = () => {
  const { sales, menuItems } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const itemSalesData = useMemo(() => {
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
        if (!data[saleItem.id]) {
          const menuItem = menuItems.find(mi => mi.id === saleItem.id);
          data[saleItem.id] = { 
              id: saleItem.id,
              name: menuItem?.name || saleItem.name, 
              category: menuItem?.category || 'Uncategorized',
              quantitySold: 0, 
              totalSales: 0 
          };
        }
        data[saleItem.id].quantitySold += saleItem.quantity;
        data[saleItem.id].totalSales += saleItem.quantity * saleItem.price;
      });
    });
    
    return Object.values(data).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales, menuItems, startDate, endDate]);

  const filteredItemSalesData = useMemo(() => {
    if (!searchTerm) {
      return itemSalesData;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return itemSalesData.filter(item =>
      item.name.toLowerCase().includes(lowercasedSearchTerm) ||
      item.category.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [itemSalesData, searchTerm]);

  const totalValue = useMemo(() => {
    return filteredItemSalesData.reduce((sum, item) => sum + item.totalSales, 0);
  }, [filteredItemSalesData]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Food Sale Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiList className="mr-3 text-sky-600" /> Food Sale Report
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
          <Input label="Start Date" id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="End Date" id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="Search Item or Category" id="search-item" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<FiSearch />} placeholder="e.g., Pizza or Pasta"/>
          <Button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} variant="secondary">Reset Filters</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-700">Item Sales Details ({filteredItemSalesData.length})</h3>
           <div className="text-right">
                <p className="text-sm text-gray-600">Total Sales (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalValue.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredItemSalesData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No sales data found for the selected criteria.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity Sold</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Sales</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItemSalesData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
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

export default FoodSaleReportPage;