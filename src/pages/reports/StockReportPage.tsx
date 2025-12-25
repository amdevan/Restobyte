
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiSearch, FiArchive, FiAlertTriangle, FiCheckCircle, FiTrendingDown, FiDollarSign, FiFilter, FiArrowLeft } from 'react-icons/fi';

const StockReportPage: React.FC = () => {
  const { stockItems } = useRestaurantData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(stockItems.map(item => item.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [stockItems]);

  const filteredStockItems = useMemo(() => {
    return stockItems
      .filter(item => {
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesSearch = searchTerm === '' ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .map(item => ({
        ...item,
        totalValue: (item.quantity || 0) * (item.costPerUnit || 0)
      }));
  }, [stockItems, searchTerm, categoryFilter]);

  const getStatus = (item: StockItem): { text: string; colorClass: string; icon: React.ReactNode } => {
    if (item.quantity <= 0) {
      return { text: 'Out of Stock', colorClass: 'text-red-600 bg-red-100', icon: <FiAlertTriangle className="mr-1.5" /> };
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { text: 'Low Stock', colorClass: 'text-amber-600 bg-amber-100', icon: <FiTrendingDown className="mr-1.5" /> };
    }
    return { text: 'In Stock', colorClass: 'text-green-600 bg-green-100', icon: <FiCheckCircle className="mr-1.5" /> };
  };

  const summaryData = useMemo(() => {
    const totalItems = stockItems.length;
    const totalStockValue = stockItems.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0);
    const lowStockCount = stockItems.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
    const outOfStockCount = stockItems.filter(item => item.quantity <= 0).length;
    return { totalItems, totalStockValue, lowStockCount, outOfStockCount };
  }, [stockItems]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Stock Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiArchive className="mr-3 text-sky-600"/> Comprehensive Stock Report
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/report')} variant="outline" leftIcon={<FiArrowLeft />}>
            Back to Dashboard
            </Button>
        </div>
      </div>
      
      <Card title="Stock Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Total Unique Items</p><p className="text-2xl font-bold text-sky-600">{summaryData.totalItems}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Total Stock Value</p><p className="text-2xl font-bold text-sky-600">${summaryData.totalStockValue.toFixed(2)}</p></div>
            <div className="p-3 bg-amber-50 rounded-lg"><p className="text-sm text-amber-600">Low Stock Items</p><p className="text-2xl font-bold text-amber-700">{summaryData.lowStockCount}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-600">Out of Stock Items</p><p className="text-2xl font-bold text-red-700">{summaryData.outOfStockCount}</p></div>
        </div>
      </Card>

      <Card>
         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
                label="Search by Name or Category"
                type="text"
                placeholder="Search stock items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                leftIcon={<FiSearch />}
            />
            <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                <select
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
         </div>
        <div className="overflow-x-auto">
          {filteredStockItems.length === 0 ? (
            <div className="text-center py-10">
              <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No stock items found.</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter.</p>}
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unit</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Cost/Unit</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Value</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStockItems.map(item => {
                  const statusInfo = getStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right font-semibold">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.unit}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">${(item.costPerUnit || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 font-bold text-right">${item.totalValue.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass}`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockReportPage;
