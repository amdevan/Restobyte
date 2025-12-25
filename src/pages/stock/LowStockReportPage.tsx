

import React, { useState, useMemo } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiSearch, FiAlertTriangle, FiArchive, FiTrendingDown, FiXOctagon, FiArrowLeft } from 'react-icons/fi';

const LowStockReportPage: React.FC = () => {
  const { stockItems } = useRestaurantData();
  const navigate = ReactRouterDom.useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const lowStockAndOutOfStockItems = useMemo(() => {
    return stockItems.filter(item => 
      item.quantity <= item.lowStockThreshold || item.quantity === 0
    );
  }, [stockItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return lowStockAndOutOfStockItems;
    }
    return lowStockAndOutOfStockItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lowStockAndOutOfStockItems, searchTerm]);

  const getStatus = (item: StockItem): { text: string; colorClass: string; icon: React.ReactNode } => {
    if (item.quantity === 0) {
      return { text: 'Out of Stock', colorClass: 'text-red-700 bg-red-100 border-red-300', icon: <FiXOctagon className="mr-1.5" /> };
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { text: 'Low Stock', colorClass: 'text-amber-700 bg-amber-100 border-amber-300', icon: <FiTrendingDown className="mr-1.5" /> };
    }
    // This case should ideally not be reached if filtered correctly, but as a fallback:
    return { text: 'In Stock', colorClass: 'text-green-700 bg-green-100 border-green-300', icon: <FiAlertTriangle className="mr-1.5" /> };
  };

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Low Stock Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiAlertTriangle className="mr-3 text-red-500"/> Low Stock Report
        </h1>
        <div className="flex items-center space-x-3">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                Back to Dashboard
            </Button>
            <div className="relative w-full sm:w-72">
            <Input
                id="low-stock-search"
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm"
                containerClassName="mb-0"
                leftIcon={<FiSearch className="text-gray-400 h-5 w-5" />}
            />
            </div>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {stockItems.length === 0 ? "No stock items available." : 
               searchTerm ? "No items match your search in the low stock report." : "All items are currently above their low stock thresholds!"}
            </p>
             {stockItems.length > 0 && !searchTerm && lowStockAndOutOfStockItems.length === 0 &&
                <p className="text-sm text-green-600 mt-1">Good job on stock management!</p>
            }
            {stockItems.length === 0 && 
                <p className="text-sm text-gray-400 mt-1">Add items via 'Stock Entry' to populate your inventory.</p>
            }
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Current Qty</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Low Stock Threshold</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map(item => {
                const statusInfo = getStatus(item);
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.quantity === 0 ? 'bg-red-50 hover:bg-red-100' : item.quantity <= item.lowStockThreshold ? 'bg-amber-50 hover:bg-amber-100' : ''}`}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${item.quantity === 0 ? 'text-red-600' : item.quantity <= item.lowStockThreshold ? 'text-amber-700' : 'text-gray-600'}`}>{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.lowStockThreshold}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusInfo.colorClass}`}>
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
      <p className="text-xs text-gray-500 text-center">
        This report shows items whose current quantity is less than or equal to their set "Low Stock Threshold", or items that are out of stock (quantity is 0).
      </p>
    </div>
  );
};

export default LowStockReportPage;