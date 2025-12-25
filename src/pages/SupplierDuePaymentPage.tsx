

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Purchase } from '../types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import RecordSupplierPaymentModal from '@/components/purchase/RecordSupplierPaymentModal';
import { FiSearch, FiCalendar, FiDollarSign, FiArchive, FiCreditCard, FiFilter, FiXCircle } from 'react-icons/fi';

const SupplierDuePaymentPage: React.FC = () => {
  const { purchases, suppliers, recordSupplierPayment } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const purchasesWithDues = useMemo(() => {
    return purchases.filter(p => p.grandTotalAmount > (p.paidAmount || 0))
      .map(p => ({
        ...p,
        supplierNameDisplay: p.supplierId 
            ? (suppliers.find(s => s.id === p.supplierId)?.name || p.supplierName || 'N/A')
            : (p.supplierName || 'N/A')
      }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest dues first
  }, [purchases, suppliers]);

  const filteredPurchasesWithDues = useMemo(() => {
    return purchasesWithDues.filter(purchase => {
      const purchaseDateObj = new Date(purchase.date);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;

      if (sDate && purchaseDateObj < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (purchaseDateObj > endOfDay) return false;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        purchase.purchaseNumber.toLowerCase().includes(searchTermLower) ||
        (purchase.supplierNameDisplay && purchase.supplierNameDisplay.toLowerCase().includes(searchTermLower)) ||
        (purchase.supplierInvoiceNumber && purchase.supplierInvoiceNumber.toLowerCase().includes(searchTermLower));
      
      return matchesSearch;
    });
  }, [purchasesWithDues, searchTerm, startDate, endDate]);

  const handleOpenModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPurchase(null);
  };

  const handleRecordPayment = (purchaseId: string, amountPaid: number, paymentDate: string, paymentMethod: string, reference?: string, notes?: string) => {
    recordSupplierPayment(purchaseId, amountPaid, paymentDate, paymentMethod, reference, notes);
    // Optionally: show a success message
  };
  
  const totalDueAmount = useMemo(() => {
    return filteredPurchasesWithDues.reduce((sum, p) => sum + (p.grandTotalAmount - (p.paidAmount || 0)), 0);
  }, [filteredPurchasesWithDues]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiCreditCard className="mr-3 text-sky-600" /> Supplier Due Payments
        </h1>
      </div>
      
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input
              label="Search PO # / Supplier / Invoice #"
              id="supplier-due-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch />}
              placeholder="e.g., PO-123 or Global Foods"
            />
            <Input
              label="Start Date (PO Date)"
              id="start-date-due"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date (PO Date)"
              id="end-date-due"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <div className="flex space-x-2 items-end h-full">
              <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
         <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
             <h3 className="text-lg font-semibold text-gray-700">
                Purchase Orders with Outstanding Dues ({filteredPurchasesWithDues.length})
             </h3>
             <div className="text-right">
                <p className="text-sm text-gray-600">Total Outstanding (Filtered)</p>
                <p className="text-xl font-bold text-red-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalDueAmount.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredPurchasesWithDues.length === 0 ? (
            <div className="text-center py-10">
              <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {purchasesWithDues.length === 0 ? "No outstanding supplier dues found." : "No dues match your search criteria."}
              </p>
              {purchasesWithDues.length === 0 && <p className="text-sm text-green-600 mt-1">All supplier payments are up to date!</p>}
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice #</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Grand Total</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount Paid</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Due Amount</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchasesWithDues.map(p => {
                  const due = p.grandTotalAmount - (p.paidAmount || 0);
                  return (
                    <tr key={p.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm font-medium text-sky-600">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{p.supplierNameDisplay}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{p.supplierInvoiceNumber || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 text-right">${p.grandTotalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">${(p.paidAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-red-600 font-semibold text-right">${due.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button onClick={() => handleOpenModal(p)} variant="primary" size="sm" leftIcon={<FiDollarSign />}>
                          Record Payment
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title="Record Supplier Payment"
        size="md"
      >
        <RecordSupplierPaymentModal
          purchase={selectedPurchase}
          onClose={handleCloseModal}
          onRecordPayment={handleRecordPayment}
        />
      </Modal>
    </div>
  );
};

export default SupplierDuePaymentPage;