

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { FiSearch, FiArchive, FiAlertTriangle, FiCheckCircle, FiTrendingDown } from 'react-icons/fi';

const ViewStockLevelsPage: React.FC = () => {
  const { stockItems } = useRestaurantData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStockItems = useMemo(() => {
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stockItems, searchTerm]);

  const getStatus = (item: StockItem): { text: string; colorClass: string; icon: React.ReactNode } => {
    if (item.quantity <= 0) {
      return { text: 'Out of Stock', colorClass: 'text-red-600 bg-red-100', icon: <FiAlertTriangle className="mr-1.5" /> };
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { text: 'Low Stock', colorClass: 'text-amber-600 bg-amber-100', icon: <FiTrendingDown className="mr-1.5" /> };
    }
    return { text: 'In Stock', colorClass: 'text-green-600 bg-green-100', icon: <FiCheckCircle className="mr-1.5" /> };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">View Stock Levels</h1>
        <div className="relative w-full sm:w-72">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
           </div>
          <Input
            type="text"
            placeholder="Search stock items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm"
            containerClassName="mb-0"
            id="stock-search"
          />
        </div>
      </div>

      <Card className="overflow-x-auto">
        {filteredStockItems.length === 0 ? (
          <div className="text-center py-10">
            <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No stock items found.</p>
            {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search term.</p>}
            {!searchTerm && <p className="text-sm text-gray-400 mt-1">Stock inventory is currently empty or not loaded.</p>}
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Low Stock Threshold</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStockItems.map(item => {
                const statusInfo = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-sky-50 transition-all duration-200">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.lowStockThreshold}</td>
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
      </Card>
      {/* TODO: Add buttons for "Add Stock Entry" or "Adjust Stock" later */}
    </div>
  );
};

export default ViewStockLevelsPage;