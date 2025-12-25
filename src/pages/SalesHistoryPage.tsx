

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Sale } from '../types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import SaleDetailsModal from '@/components/sales/SaleDetailsModal';
import { FiSearch, FiCalendar, FiFilter, FiXCircle, FiEye, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import Money from '@/components/common/Money';

const ORDER_TYPES = ["All", "Dine In", "Delivery", "Pickup", "WhatsApp"];

const SalesHistoryPage: React.FC = () => {
  const { sales, customers, tables, waiters, paymentMethods } = useRestaurantData();

  const paymentMethodOptions = useMemo(() => ["All", ...paymentMethods.map(pm => pm.name)], [paymentMethods]);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);

  const enrichedSales = useMemo(() => {
    return sales.map(sale => ({
      ...sale,
      customerNameDisplay: sale.customerId ? customers.find(c => c.id === sale.customerId)?.name : sale.customerName || 'Walk-in Customer',
      tableNameDisplay: sale.assignedTableId ? tables.find(t => t.id === sale.assignedTableId)?.name : '-',
      waiterNameDisplay: sale.waiterId ? waiters.find(w => w.id === sale.waiterId)?.name : sale.waiterName || '-',
    })).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()); // Sort by most recent first
  }, [sales, customers, tables, waiters]);

  const filteredSales = useMemo(() => {
    return enrichedSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;

      if (sDate && saleDate < sDate) return false;
      if (eDate) {
        // Adjust eDate to be end of day for inclusive filtering
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (saleDate > endOfDay) return false;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        sale.id.toLowerCase().includes(searchTermLower) ||
        (sale.customerNameDisplay && sale.customerNameDisplay.toLowerCase().includes(searchTermLower));

      const matchesOrderType = selectedOrderType === 'All' || sale.orderType === selectedOrderType;
      const matchesPaymentMethod = selectedPaymentMethod === 'All' || sale.paymentMethod === selectedPaymentMethod;
      
      return matchesSearch && matchesOrderType && matchesPaymentMethod;
    });
  }, [enrichedSales, searchTerm, startDate, endDate, selectedOrderType, selectedPaymentMethod]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedOrderType('All');
    setSelectedPaymentMethod('All');
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSaleForDetails(sale);
    setIsDetailsModalOpen(true);
  };
  
  const totalSalesValue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [filteredSales]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiShoppingCart className="mr-3 text-sky-600"/> Sales History
        </h1>
        {/* Actions like "Export" could go here later */}
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              label="Search Sale ID / Customer"
              id="sale-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch />}
              placeholder="e.g., sale-xyz or John Doe"
            />
            <Input
              label="Start Date"
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date"
              id="end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="orderTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select
                id="orderTypeFilter"
                value={selectedOrderType}
                onChange={e => setSelectedOrderType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                {ORDER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="paymentMethodFilter" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                id="paymentMethodFilter"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                {paymentMethodOptions.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
             <h3 className="text-lg font-semibold text-gray-700">
                Sales Records ({filteredSales.length})
             </h3>
             <div className="text-right">
                <p className="text-sm text-gray-600">Total Value (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    <Money amount={totalSalesValue} />
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No sales records found matching your criteria.
            </p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sale ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Waiter</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-sky-50 transition-all duration-200">
                    <td className="py-3 px-4 text-sm font-medium text-sky-600">#{sale.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(sale.saleDate).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sale.customerNameDisplay}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sale.orderType}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sale.tableNameDisplay}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sale.waiterNameDisplay}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sale.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-semibold text-right"><Money amount={sale.totalAmount} /></td>
                    <td className="py-3 px-4 text-center">
                      <Button onClick={() => handleViewDetails(sale)} variant="outline" size="sm" leftIcon={<FiEye />}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Sale Details" size="lg">
        <SaleDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          sale={selectedSaleForDetails}
        />
      </Modal>
    </div>
  );
};

export default SalesHistoryPage;
