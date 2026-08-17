
import React, { useState, useMemo, useCallback } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Sale, SaleReturnItem } from '../types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import SaleDetailsModal from '@/components/sales/SaleDetailsModal';
import SaleReturnModal from '@/components/sales/SaleReturnModal';
import EditSaleModal from '@/components/sales/EditSaleModal';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import {
  FiSearch, FiCalendar, FiXCircle, FiEye, FiShoppingCart, FiDollarSign, FiEdit, FiTrash2,
  FiRotateCcw, FiChevronUp, FiChevronDown, FiPackage, FiClock,
  FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiArrowLeft, FiArrowRight,
} from 'react-icons/fi';
import Money from '@/components/common/Money';

const ORDER_TYPES = ["All", "Dine In", "Delivery", "Pickup", "WhatsApp"];

const ORDER_TYPE_COLORS: Record<string, string> = {
  'Dine In': 'bg-blue-100 text-blue-700 border-blue-200',
  'Delivery': 'bg-purple-100 text-purple-700 border-purple-200',
  'Pickup': 'bg-amber-100 text-amber-700 border-amber-200',
  'WhatsApp': 'bg-green-100 text-green-700 border-green-200',
};

const KDS_STATUS_COLORS: Record<string, string> = {
  'ready': 'bg-green-100 text-green-700 border-green-200',
  'new': 'bg-gray-100 text-gray-600 border-gray-200',
  'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'served': 'bg-sky-100 text-sky-700 border-sky-200',
  'on-hold': 'bg-orange-100 text-orange-700 border-orange-200',
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

type SortField = 'saleDate' | 'customerName' | 'totalAmount' | 'orderType';
type SortDirection = 'asc' | 'desc';

const SalesHistoryPage: React.FC = () => {
  const { sales, customers, tables, waiters, paymentMethods, deleteSale, returnSale, updateSale, hasPermission } = useRestaurantData();

  const paymentMethodOptions = useMemo(() => ["All", ...paymentMethods.map(pm => pm.name)], [paymentMethods]);

  // --- Filter state (default to "Today") ---
  const todayStr = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [quickFilter, setQuickFilter] = useState<string>('Today');

  // --- Sort state ---
  const [sortField, setSortField] = useState<SortField>('saleDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // --- Pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // --- Modal state ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Sale | null>(null);

  // --- Confirm delete state ---
  const [confirmDeleteSale, setConfirmDeleteSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Quick date filter presets ---
  const quickDateFilters = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      'Today': { start: todayStart.toISOString().slice(0, 10), end: todayStart.toISOString().slice(0, 10) },
      'Yesterday': { start: yesterdayStart.toISOString().slice(0, 10), end: yesterdayStart.toISOString().slice(0, 10) },
      'This Week': { start: weekStart.toISOString().slice(0, 10), end: todayStart.toISOString().slice(0, 10) },
      'This Month': { start: monthStart.toISOString().slice(0, 10), end: todayStart.toISOString().slice(0, 10) },
      'Last Month': { start: lastMonthStart.toISOString().slice(0, 10), end: lastMonthEnd.toISOString().slice(0, 10) },
    };
  }, []);

  const handleQuickFilter = useCallback((label: string) => {
    if (label === 'All') {
      setStartDate('');
      setEndDate('');
      setQuickFilter('All');
      return;
    }
    const preset = quickDateFilters[label as keyof typeof quickDateFilters];
    if (preset) {
      setStartDate(preset.start);
      setEndDate(preset.end);
      setQuickFilter(label);
    }
  }, [quickDateFilters]);

  // --- Enriched & sorted sales ---
  const enrichedSales = useMemo(() => {
    return sales.map(sale => ({
      ...sale,
      customerNameDisplay: sale.customerId ? customers.find(c => c.id === sale.customerId)?.name : sale.customerName || 'Walk-in Customer',
      tableNameDisplay: sale.assignedTableId ? tables.find(t => t.id === sale.assignedTableId)?.name : '-',
      waiterNameDisplay: sale.waiterId ? waiters.find(w => w.id === sale.waiterId)?.name : sale.waiterName || '-',
    }));
  }, [sales, customers, tables, waiters]);

  // --- Filtered sales ---
  const filteredSales = useMemo(() => {
    return enrichedSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;

      if (sDate && saleDate < sDate) return false;
      if (eDate) {
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

  // --- Sorted sales ---
  const sortedSales = useMemo(() => {
    const sorted = [...filteredSales];
    sorted.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case 'saleDate':
          aVal = new Date(a.saleDate).getTime();
          bVal = new Date(b.saleDate).getTime();
          break;
        case 'customerName':
          aVal = (a.customerNameDisplay || '').toLowerCase();
          bVal = (b.customerNameDisplay || '').toLowerCase();
          return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
        case 'totalAmount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'orderType':
          aVal = (a.orderType || '').toLowerCase();
          bVal = (b.orderType || '').toLowerCase();
          return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
        default:
          aVal = 0;
          bVal = 0;
      }
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
      }
      return 0;
    });
    return sorted;
  }, [filteredSales, sortField, sortDirection]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(sortedSales.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSales = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return sortedSales.slice(start, start + itemsPerPage);
  }, [sortedSales, safeCurrentPage, itemsPerPage]);

  // --- Summary stats ---
  const stats = useMemo(() => {
    const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalOrders = filteredSales.length;
    const avgOrderValue = totalOrders > 0 ? totalSalesValue / totalOrders : 0;
    const totalReturns = filteredSales.filter(s => (s.returnAmount ?? 0) > 0 || (s.returns && s.returns.length > 0)).length;
    const totalReturnAmount = filteredSales.reduce((sum, s) => sum + (s.returnAmount ?? 0), 0);
    return { totalSalesValue, totalOrders, avgOrderValue, totalReturns, totalReturnAmount };
  }, [filteredSales]);

  // --- Handlers ---
  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedOrderType('All');
    setSelectedPaymentMethod('All');
    setQuickFilter('All');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <FiChevronUp className="ml-1 opacity-30" size={14} />;
    return sortDirection === 'asc'
      ? <FiChevronUp className="ml-1 text-sky-600" size={14} />
      : <FiChevronDown className="ml-1 text-sky-600" size={14} />;
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSaleForDetails(sale);
    setIsDetailsModalOpen(true);
  };

  const handleReturnSale = (sale: Sale) => {
    setSelectedSaleForReturn(sale);
    setIsReturnModalOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSaleForEdit(sale);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (sale: Sale) => {
    setConfirmDeleteSale(sale);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteSale) return;
    setIsDeleting(true);
    try {
      const result = await deleteSale(confirmDeleteSale.id);
      if (!result.success) {
        alert(result.message || 'Failed to delete sale.');
      }
      setConfirmDeleteSale(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProcessReturn = async (saleId: string, returnData: { items: SaleReturnItem[]; returnAmount: number; reason?: string; refundMethod?: string; refundDate: string; outletId: string }) => {
    const result = await returnSale(saleId, { ...returnData, saleId });
    if (!result.success) {
      alert(result.message || 'Failed to process return.');
    }
    return result;
  };

  const handleSaveEdit = async (updatedSale: Sale) => {
    const result = await updateSale(updatedSale);
    if (!result) {
      alert('Failed to update sale.');
    }
    return result;
  };

  // --- Export to CSV ---
  const handleExportCSV = useCallback(() => {
    const headers = ['Sale ID', 'Date & Time', 'Customer', 'Order Type', 'Table', 'Waiter', 'Payment Method', 'Total Amount', 'Returns', 'Status'];
    const rows = sortedSales.map(sale => [
      `#${sale.id.slice(-6).toUpperCase()}`,
      new Date(sale.saleDate).toLocaleString(),
      sale.customerNameDisplay || 'Walk-in Customer',
      sale.orderType,
      sale.tableNameDisplay || '-',
      sale.waiterNameDisplay || '-',
      sale.paymentMethod,
      sale.totalAmount.toFixed(2),
      (sale.returnAmount ?? 0) > 0 ? `Yes (${sale.returnAmount?.toFixed(2)})` : 'No',
      sale.kdsStatus || 'served',
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedSales]);

  // --- Export to PDF (simple browser print) ---
  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  // --- Export to Excel (CSV with .xls extension for broad compat) ---
  const handleExportExcel = useCallback(() => {
    handleExportCSV();
  }, [handleExportCSV]);

  const handleDownloadReport = useCallback((format: 'PDF' | 'Excel' | 'CSV') => {
    switch (format) {
      case 'PDF': handleExportPDF(); break;
      case 'Excel': handleExportExcel(); break;
      case 'CSV': handleExportCSV(); break;
    }
  }, [handleExportCSV, handleExportExcel, handleExportPDF]);

  const canEdit = hasPermission('sales.edit');
  const canDelete = hasPermission('sales.delete');
  const canReturn = hasPermission('sales.return');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiShoppingCart className="mr-3 text-sky-600" /> Sales History
        </h1>
        <div className="flex items-center gap-2">
          <DownloadReportButton onDownload={handleDownloadReport} />
        </div>
      </div>

      {/* --- Summary Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-0">
          <div className="p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 truncate">Total Sales</p>
              <p className="text-xl font-bold text-gray-800"><Money amount={stats.totalSalesValue} /></p>
            </div>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 truncate">Total Orders</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 truncate">Avg. Order Value</p>
              <p className="text-xl font-bold text-gray-800"><Money amount={stats.avgOrderValue} /></p>
            </div>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <FiRotateCcw className="w-6 h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 truncate">Returns</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalReturns} <span className="text-sm font-normal text-gray-500">orders</span></p>
              {stats.totalReturnAmount > 0 && (
                <p className="text-xs text-red-500">-<Money amount={stats.totalReturnAmount} /></p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* --- Filters Section --- */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-1 mr-1">
              <FiClock size={14} /> Quick Filters:
            </span>
            {['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'Last Month'].map(label => (
              <button
                key={label}
                onClick={() => handleQuickFilter(label)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors duration-150 ${
                  quickFilter === label
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              label="Search Sale ID / Customer"
              id="sale-search"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              leftIcon={<FiSearch />}
              placeholder="e.g., sale-xyz or John Doe"
            />
            <Input
              label="Start Date"
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setQuickFilter(''); setCurrentPage(1); }}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date"
              id="end-date"
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setQuickFilter(''); setCurrentPage(1); }}
              leftIcon={<FiCalendar />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="orderTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select
                id="orderTypeFilter"
                value={selectedOrderType}
                onChange={e => { setSelectedOrderType(e.target.value); setCurrentPage(1); }}
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
                onChange={e => { setSelectedPaymentMethod(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                {paymentMethodOptions.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* --- Sales Table --- */}
      <Card className="mt-2">
        <div className="p-4 mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-700">
            Sales Records ({filteredSales.length})
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FiShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">No sales records found</h3>
              <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or date range.</p>
              <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />} size="sm">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sale ID</th>
                  <th
                    className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('saleDate')}
                  >
                    <span className="flex items-center">Date & Time {renderSortIcon('saleDate')}</span>
                  </th>
                  <th
                    className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('customerName')}
                  >
                    <span className="flex items-center">Customer {renderSortIcon('customerName')}</span>
                  </th>
                  <th
                    className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('orderType')}
                  >
                    <span className="flex items-center">Order Type {renderSortIcon('orderType')}</span>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Waiter</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                  <th
                    className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <span className="flex items-center justify-end">Total {renderSortIcon('totalAmount')}</span>
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSales.map(sale => {
                  const hasReturns = (sale.returnAmount ?? 0) > 0 || (sale.returns && sale.returns.length > 0);
                  return (
                    <tr key={sale.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm font-medium text-sky-600">#{sale.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(sale.saleDate).toLocaleDateString()}
                        <span className="text-gray-400 ml-1">{new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-[160px] truncate">{sale.customerNameDisplay}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_TYPE_COLORS[sale.orderType] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {sale.orderType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{sale.tableNameDisplay}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{sale.waiterNameDisplay}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{sale.paymentMethod}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 font-semibold text-right whitespace-nowrap">
                        <Money amount={sale.totalAmount} />
                        {hasReturns && (
                          <span className="block text-xs text-red-500 font-normal">
                            Return: <Money amount={sale.returnAmount ?? 0} />
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sale.kdsStatus && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${KDS_STATUS_COLORS[sale.kdsStatus] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {sale.kdsStatus === 'served' && <FiCheckCircle className="mr-1" size={10} />}
                            {sale.kdsStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-1">
                          <Button onClick={() => handleViewDetails(sale)} variant="outline" size="sm" aria-label="View Details" title="Details">
                            <FiEye size={14} />
                          </Button>
                          {canReturn && (
                            <Button onClick={() => handleReturnSale(sale)} variant="secondary" size="sm" aria-label="Return" title="Return">
                              <FiRotateCcw size={14} />
                            </Button>
                          )}
                          {canEdit && (
                            <Button onClick={() => handleEditSale(sale)} variant="secondary" size="sm" aria-label="Edit" title="Edit">
                              <FiEdit size={14} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button onClick={() => handleDeleteClick(sale)} variant="danger" size="sm" aria-label="Delete" title="Delete">
                              <FiTrash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* --- Pagination --- */}
        {filteredSales.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing {((safeCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(safeCurrentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} sales
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                leftIcon={<FiArrowLeft size={14} />}
              >
                Prev
              </Button>
              {/* Page number buttons */}
              {(() => {
                const pages: (number | string)[] = [];
                const maxVisible = 5;
                let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                if (startPage > 1) {
                  pages.push(1);
                  if (startPage > 2) pages.push('...');
                }
                for (let i = startPage; i <= endPage; i++) pages.push(i);
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((page, idx) =>
                  typeof page === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                        page === safeCurrentPage
                          ? 'bg-sky-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                rightIcon={<FiArrowRight size={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- Modals --- */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Sale Details" size="lg">
        <SaleDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          sale={selectedSaleForDetails}
        />
      </Modal>

      <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Process Return" size="lg">
        <SaleReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          sale={selectedSaleForReturn}
          onReturn={handleProcessReturn}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sale" size="lg">
        <EditSaleModal
          key={selectedSaleForEdit?.id || 'edit-modal'}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          sale={selectedSaleForEdit}
          onSave={handleSaveEdit}
        />
      </Modal>

      {/* --- Delete Confirmation Modal --- */}
      <Modal
        isOpen={!!confirmDeleteSale}
        onClose={() => setConfirmDeleteSale(null)}
        title="Delete Sale"
        size="sm"
      >
        {confirmDeleteSale && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete sale <span className="font-semibold">#{confirmDeleteSale.id.slice(-6).toUpperCase()}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="text-gray-700 font-medium">{confirmDeleteSale.customerName || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Amount:</span>
                <span className="text-gray-700 font-medium"><Money amount={confirmDeleteSale.totalAmount} /></span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-700 font-medium">{new Date(confirmDeleteSale.saleDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmDeleteSale(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                leftIcon={<FiTrash2 />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Sale'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesHistoryPage;
