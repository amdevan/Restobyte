
import React, { useState, useMemo } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Purchase } from '../types';
import Input from '@/components/common/Input';
import ViewPurchaseDetailsModal from '@/components/purchase/ViewPurchaseDetailsModal';
import Money from '@/components/common/Money';
import { FiSearch, FiArchive, FiPlusCircle, FiShoppingCart, FiTrash2, FiEye, FiEdit2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type SortField = 'date' | 'purchaseNumber' | 'supplier' | 'totalAmount' | 'items';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;

const PurchasePage: React.FC = () => {
  const { purchases, suppliers, deletePurchase } = useRestaurantData();
  const navigate = ReactRouterDom.useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  const enrichedPurchases = useMemo(() => {
    return purchases.map(purchase => ({
      ...purchase,
      supplierNameDisplay: purchase.supplierId
        ? (suppliers.find(s => s.id === purchase.supplierId)?.name || purchase.supplierName || 'N/A')
        : (purchase.supplierName || 'N/A'),
    }));
  }, [purchases, suppliers]);

  const filteredPurchases = useMemo(() => {
    let items = enrichedPurchases.filter(purchase => {
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
      return searchTermLower === '' ||
        purchase.purchaseNumber.toLowerCase().includes(searchTermLower) ||
        (purchase.supplierNameDisplay && purchase.supplierNameDisplay.toLowerCase().includes(searchTermLower)) ||
        (purchase.supplierInvoiceNumber && purchase.supplierInvoiceNumber.toLowerCase().includes(searchTermLower));
    });

    // Status filter
    if (statusFilter !== 'All') {
      items = items.filter(p => (p.paymentStatus || 'DUE') === statusFilter);
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'purchaseNumber') cmp = a.purchaseNumber.localeCompare(b.purchaseNumber);
      else if (sortField === 'supplier') cmp = (a.supplierNameDisplay || '').localeCompare(b.supplierNameDisplay || '');
      else if (sortField === 'totalAmount') cmp = a.grandTotalAmount - b.grandTotalAmount;
      else if (sortField === 'items') cmp = a.items.length - b.items.length;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [enrichedPurchases, searchTerm, startDate, endDate, sortField, sortDir]);

  const totalPages = Math.ceil(filteredPurchases.length / PAGE_SIZE);
  const pagedItems = filteredPurchases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const hasFilters = searchTerm || startDate || endDate || statusFilter !== 'All';

  const shortPO = (po: string) => {
    // Show last 4 chars: e.g. "PO-123456" → "#3456"
    const parts = po.split('-');
    const last = parts[parts.length - 1];
    return `#${last.slice(-4)}`;
  };

  const totalPurchaseValue = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.grandTotalAmount, 0);
  }, [filteredPurchases]);

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField; label: string; align?: 'left' | 'right' | 'center' }) => (
    <th
      className={`py-3 px-4 text-${align} text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-sky-600 select-none`}
      onClick={() => toggleSort(field)}
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiShoppingCart className="mr-3 text-sky-600" /> Purchase Orders
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-4 w-4" />
            </div>
            <Input
              type="text"
              placeholder="Search PO #, Supplier, Invoice..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm"
              containerClassName="mb-0"
              id="purchase-search"
            />
          </div>
          <button
            onClick={() => navigate('/app/purchase/add')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200 whitespace-nowrap"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Purchase</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="All">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="DUE">DUE</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setStatusFilter('All'); setPage(1); }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiX size={12} /> Clear
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {filteredPurchases.length} purchase{filteredPurchases.length !== 1 ? 's' : ''}
          {filteredPurchases.length !== purchases.length && ` of ${purchases.length}`}
          <span className="ml-2 font-semibold text-sky-600">
            Total: <Money amount={totalPurchaseValue} />
          </span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pagedItems.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {purchases.length === 0 ? 'No purchase orders yet' : 'No purchases match your filters'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {purchases.length === 0
                ? 'Click "Add Purchase" to record your first order.'
                : 'Try adjusting your search or date filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <SortHeader field="date" label="Date" />
                    <SortHeader field="purchaseNumber" label="PO #" />
                    <SortHeader field="supplier" label="Supplier" />
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice #</th>
                    <SortHeader field="totalAmount" label="Total" align="right" />
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Due</th>
                    <SortHeader field="items" label="Items" align="center" />
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedItems.map(p => (
                    <tr key={p.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-medium text-sky-600 hover:underline cursor-pointer" title={p.purchaseNumber}>{shortPO(p.purchaseNumber)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                        {p.supplierId ? (
                          <button
                            onClick={() => navigate(`/app/suppliers?highlight=${p.supplierId}`)}
                            className="text-sky-600 hover:text-sky-800 hover:underline font-medium"
                          >
                            {p.supplierNameDisplay}
                          </button>
                        ) : (
                          p.supplierNameDisplay
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{p.supplierInvoiceNumber || '-'}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right"><Money amount={p.grandTotalAmount} /></td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-col gap-0.5">
                          {p.paymentMethod && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
                              {p.paymentMethod}
                            </span>
                          )}
                          {p.paymentStatus && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                              p.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                              p.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {p.paymentStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {(() => {
                          const due = p.grandTotalAmount - (p.paidAmount || 0);
                          return due > 0 ? (
                            <span className="font-semibold text-red-600"><Money amount={due} /></span>
                          ) : (
                            <span className="text-green-600 font-medium text-xs">Paid</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                          {p.items.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/app/purchase/edit/${p.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiEdit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <FiEye size={12} /> View
                          </button>
                          <button
                            onClick={() => setDeletingPurchase(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <FiTrash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPurchase(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiEye size={18} className="text-sky-600" />
                Purchase Order Details
              </h2>
              <button onClick={() => setSelectedPurchase(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <div className="p-6">
              <ViewPurchaseDetailsModal
                purchase={selectedPurchase}
                onClose={() => setSelectedPurchase(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeletingPurchase(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrash2 size={18} className="text-red-600" />
                Delete Purchase
              </h2>
              <button onClick={() => setDeletingPurchase(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingPurchase.purchaseNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingPurchase(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingPurchase) {
                    await deletePurchase(deletingPurchase.id);
                    setDeletingPurchase(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;
