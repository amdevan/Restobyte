


import React, { useState, useMemo } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Purchase } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import ViewPurchaseDetailsModal from '@/components/purchase/ViewPurchaseDetailsModal';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiSearch, FiCalendar, FiFilter, FiXCircle, FiEye, FiPlusCircle, FiDollarSign, FiArchive, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';

const PurchaseReportPage: React.FC = () => {
  const { purchases, suppliers } = useRestaurantData();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const enrichedPurchases = useMemo(() => {
    return purchases.map(purchase => ({
      ...purchase,
      supplierNameDisplay: purchase.supplierId 
        ? (suppliers.find(s => s.id === purchase.supplierId)?.name || purchase.supplierName || 'N/A') 
        : (purchase.supplierName || 'N/A'),
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, suppliers]);

  const filteredPurchases = useMemo(() => {
    return enrichedPurchases.filter(purchase => {
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
  }, [enrichedPurchases, searchTerm, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsDetailsModalOpen(true);
  };
  
  const totalPurchaseValue = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.grandTotalAmount, 0);
  }, [filteredPurchases]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Purchase Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiShoppingCart className="mr-3 text-sky-600"/> Purchase Report
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
            Back to Dashboard
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input
              label="Search PO # / Supplier / Invoice #"
              id="purchase-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch />}
              placeholder="e.g., PO-123 or Global Foods"
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
                Purchase Records ({filteredPurchases.length})
             </h3>
             <div className="text-right">
                <p className="text-sm text-gray-600">Total Value (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalPurchaseValue.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-10">
              <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {purchases.length === 0 ? "No purchase orders recorded yet." : "No purchase orders match your criteria."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice #</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-sky-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-sky-600">{p.purchaseNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.supplierNameDisplay}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.supplierInvoiceNumber || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-semibold text-right">${p.grandTotalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{p.items.length}</td>
                    <td className="py-3 px-4 text-center">
                      <Button onClick={() => handleViewDetails(p)} variant="outline" size="sm" leftIcon={<FiEye />}>
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

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Purchase Order Details" size="lg">
        <ViewPurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PurchaseReportPage;