

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WasteRecord, WasteItem, StockItem } from '@/types';
import { FiSearch, FiTrash2, FiCalendar, FiFilter, FiX, FiEye, FiPlusCircle, FiArchive, FiPackage, FiUser, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type SortField = 'date' | 'reason' | 'itemsCount' | 'totalLoss' | 'responsible';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 15;

const WASTE_REASONS = ['Spoilage', 'Expired', 'Damaged Goods', 'Cooking Error', 'Contamination', 'Over Production', 'Other'];

const getRecordLoss = (record: WasteRecord) => {
  if (typeof record.totalEstimatedLoss === 'number') return record.totalEstimatedLoss;
  return record.items.reduce((sum, item) => sum + (Number(item.quantityWasted) || 0) * (Number(item.costAtTimeOfWaste) || 0), 0);
};

const WastePage: React.FC = () => {
  const { stockItems, wasteRecords, addWasteRecord, autoDecreaseStockOnWaste, getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // Deleted records (local only)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<WasteRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<WasteRecord | null>(null);

  // Add form state
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addReason, setAddReason] = useState(WASTE_REASONS[0]);
  const [addCustomReason, setAddCustomReason] = useState('');
  const [addResponsible, setAddResponsible] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addItems, setAddItems] = useState<Array<{
    id: string;
    stockItemId: string;
    stockItemName: string;
    quantityWasted: string;
    unit: string;
    costAtTimeOfWaste: string;
    reasonForItem: string;
  }>>([]);

  // Item search state per line
  const [itemSearchMap, setItemSearchMap] = useState<Record<string, string>>({});
  const [itemDropdownMap, setItemDropdownMap] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      for (const [lineId, ref] of dropdownRefs.current.entries()) {
        if (ref && !ref.contains(e.target as Node)) {
          setItemDropdownMap(prev => ({ ...prev, [lineId]: false }));
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Distinct reasons
  const distinctReasons = useMemo(() => {
    const reasons = new Set(wasteRecords.map(r => r.reason));
    return ['All', ...Array.from(reasons).sort()];
  }, [wasteRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return wasteRecords.filter(r => {
      if (deletedIds.has(r.id)) return false;

      const rDate = new Date(r.date);
      if (startDate) {
        const s = new Date(startDate);
        if (rDate < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (rDate > e) return false;
      }

      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        r.reason.toLowerCase().includes(term) ||
        (r.responsiblePerson && r.responsiblePerson.toLowerCase().includes(term)) ||
        (r.notes && r.notes.toLowerCase().includes(term)) ||
        r.items.some(item => item.stockItemName.toLowerCase().includes(term));

      const matchesReason = reasonFilter === 'All' || r.reason === reasonFilter;

      return matchesSearch && matchesReason;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'reason') cmp = a.reason.localeCompare(b.reason);
      else if (sortField === 'itemsCount') cmp = a.items.length - b.items.length;
      else if (sortField === 'totalLoss') cmp = getRecordLoss(a) - getRecordLoss(b);
      else if (sortField === 'responsible') cmp = (a.responsiblePerson || '').localeCompare(b.responsiblePerson || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [wasteRecords, searchTerm, startDate, endDate, reasonFilter, sortField, sortDir, deletedIds]);

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = searchTerm || startDate || endDate || reasonFilter !== 'All';

  const totalLoss = useMemo(() => filteredRecords.reduce((s, r) => s + getRecordLoss(r), 0), [filteredRecords]);

  // Sort toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setReasonFilter('All');
    setPage(1);
  };

  // Add form helpers
  const addLine = () => {
    const id = Date.now().toString() + Math.random();
    setAddItems(prev => [...prev, {
      id, stockItemId: '', stockItemName: '', quantityWasted: '',
      unit: '', costAtTimeOfWaste: '', reasonForItem: '',
    }]);
    setItemSearchMap(prev => ({ ...prev, [id]: '' }));
    setItemDropdownMap(prev => ({ ...prev, [id]: false }));
  };

  const removeLine = (lineId: string) => {
    setAddItems(prev => prev.filter(l => l.id !== lineId));
    setItemSearchMap(prev => { const n = { ...prev }; delete n[lineId]; return n; });
    setItemDropdownMap(prev => { const n = { ...prev }; delete n[lineId]; return n; });
  };

  const updateLine = (lineId: string, field: string, value: string) => {
    setAddItems(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const updated = { ...l, [field]: value };
      return updated;
    }));
  };

  const selectStockItem = (lineId: string, item: StockItem) => {
    setAddItems(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      return {
        ...l,
        stockItemId: item.id,
        stockItemName: item.name,
        unit: item.unit,
        costAtTimeOfWaste: item.costPerUnit !== undefined ? String(item.costPerUnit) : '',
      };
    }));
    setItemSearchMap(prev => ({ ...prev, [lineId]: item.name }));
    setItemDropdownMap(prev => ({ ...prev, [lineId]: false }));
  };

  const getFilteredItems = (lineId: string) => {
    const search = (itemSearchMap[lineId] || '').toLowerCase();
    if (!search) return stockItems.slice(0, 10);
    return stockItems.filter(s =>
      s.name.toLowerCase().includes(search) || s.category.toLowerCase().includes(search)
    );
  };

  const addTotalLoss = useMemo(() => {
    return addItems.reduce((s, item) => {
      const qty = Number(item.quantityWasted) || 0;
      const cost = Number(item.costAtTimeOfWaste) || 0;
      return s + qty * cost;
    }, 0);
  }, [addItems]);

  const resetAddForm = () => {
    setAddDate(new Date().toISOString().split('T')[0]);
    setAddReason(WASTE_REASONS[0]);
    setAddCustomReason('');
    setAddResponsible('');
    setAddNotes('');
    setAddItems([]);
    setItemSearchMap({});
    setItemDropdownMap({});
  };

  const handleAddSubmit = () => {
    if (!outlet) {
      alert('An active outlet must be selected to record waste.');
      return;
    }
    if (addItems.length === 0) {
      alert('Please add at least one waste item.');
      return;
    }

    const finalReason = addReason === 'Other' ? addCustomReason.trim() : addReason;
    if (!finalReason) {
      alert('Please provide a reason for the waste.');
      return;
    }

    const processedItems: WasteItem[] = [];
    for (const line of addItems) {
      if (!line.stockItemId || !line.stockItemName || !line.unit || !line.quantityWasted || Number(line.quantityWasted) <= 0) {
        alert('Please ensure all waste items have a selected stock item and a valid quantity.');
        return;
      }
      const si = stockItems.find(s => s.id === line.stockItemId);
      if (si && Number(line.quantityWasted) > si.quantity) {
        alert(`Quantity wasted for "${line.stockItemName}" (${line.quantityWasted}) exceeds available stock (${si.quantity}).`);
        return;
      }
      processedItems.push({
        stockItemId: line.stockItemId,
        stockItemName: line.stockItemName,
        quantityWasted: Number(line.quantityWasted),
        unit: line.unit,
        costAtTimeOfWaste: line.costAtTimeOfWaste !== '' ? Number(line.costAtTimeOfWaste) : si?.costPerUnit,
        reasonForItem: line.reasonForItem.trim() || undefined,
      });
    }

    const record = addWasteRecord({
      date: addDate,
      reason: finalReason,
      responsiblePerson: addResponsible.trim() || undefined,
      notes: addNotes.trim() || undefined,
      items: processedItems,
      totalEstimatedLoss: addTotalLoss,
      outletId: outlet.id,
    });

    autoDecreaseStockOnWaste(record);

    resetAddForm();
    setShowAddModal(false);
  };

  const handleDeleteRecord = () => {
    if (!deleteRecord) return;
    setDeletedIds(prev => new Set(prev).add(deleteRecord.id));
    setDeleteRecord(null);
  };

  // Sort Header component
  const SortHeader = ({ field, label, align = 'left' }: { field: SortField; label: string; align?: string }) => (
    <th
      className={`py-3 px-4 text-${align} text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-sky-600 select-none`}
      onClick={() => toggleSort(field)}
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
          <FiTrash2 className="text-sky-600" />
          Waste Management
        </h1>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search reason, items, person..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400 w-4 h-4" />
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-4 h-4" />
          <select
            value={reasonFilter}
            onChange={e => { setReasonFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-white"
          >
            {distinctReasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <FiX size={14} />
            Clear Filters
          </button>
        )}

        <span className="text-sm text-gray-500 ml-auto">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          {filteredRecords.length !== wasteRecords.length && ` of ${wasteRecords.length}`}
        </span>

        <button
          onClick={() => { resetAddForm(); setShowAddModal(true); }}
          disabled={stockItems.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <FiPlusCircle size={16} />
          Add Waste
        </button>
      </div>

      {stockItems.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-700 text-sm">
            No stock items found. Please <span className="font-semibold">add stock entries</span> first before recording waste.
          </p>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pagedRecords.length === 0 ? (
          <div className="text-center py-10">
            <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {wasteRecords.length === 0 ? 'No waste records yet.' : 'No records match your criteria.'}
            </p>
            {hasFilters && <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <SortHeader field="date" label="Date" />
                    <SortHeader field="reason" label="Reason" />
                    <SortHeader field="itemsCount" label="Items" />
                    <SortHeader field="totalLoss" label="Total Loss" align="right" />
                    <SortHeader field="responsible" label="Responsible" />
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedRecords.map(record => (
                    <tr key={record.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm text-gray-800 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-100 text-sky-700">
                          {record.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.items.length} item{record.items.length !== 1 ? 's' : ''}
                        <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
                          ({record.items.map(i => i.stockItemName).join(', ').substring(0, 30)}{record.items.map(i => i.stockItemName).join(', ').length > 30 ? '...' : ''})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 font-semibold text-right">
                        Rs {getRecordLoss(record).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.responsiblePerson || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewRecord(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <FiEye size={12} />
                            View
                          </button>
                          <button
                            onClick={() => setDeleteRecord(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <FiTrash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-600">
                Total Est. Loss: <span className="font-bold text-red-600">Rs {totalLoss.toFixed(2)}</span>
              </span>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft size={14} />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== ADD WASTE MODAL ========== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-200 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiPlusCircle size={18} className="text-sky-600" />
                Add Waste Record
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Date & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={addDate}
                      onChange={e => setAddDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <select
                    value={addReason}
                    onChange={e => { setAddReason(e.target.value); if (e.target.value !== 'Other') setAddCustomReason(''); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white"
                  >
                    {WASTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {addReason === 'Other' && (
                    <input
                      type="text"
                      value={addCustomReason}
                      onChange={e => setAddCustomReason(e.target.value)}
                      placeholder="Specify reason..."
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Responsible Person */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsible Person (Optional)</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={addResponsible}
                    onChange={e => setAddResponsible(e.target.value)}
                    placeholder="e.g., Chef John"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Wasted Items Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FiPackage size={14} className="text-sky-600" />
                  Wasted Items
                </h3>

                {addItems.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-400 border border-dashed border-gray-300 rounded-xl">
                    No items added yet. Click "Add Item" below to start.
                  </div>
                )}

                {addItems.map((line, index) => (
                  <div key={line.id} className="border border-gray-200 rounded-xl p-3 mb-3 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Item #{index + 1}</span>
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Searchable Item */}
                      <div className="md:col-span-4 relative" ref={el => { if (el) dropdownRefs.current.set(line.id, el); }}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stock Item *</label>
                        <div className="relative">
                          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={itemSearchMap[line.id] || ''}
                            onChange={e => {
                              setItemSearchMap(prev => ({ ...prev, [line.id]: e.target.value }));
                              setItemDropdownMap(prev => ({ ...prev, [line.id]: true }));
                              if (line.stockItemId) {
                                updateLine(line.id, 'stockItemId', '');
                                updateLine(line.id, 'stockItemName', '');
                                updateLine(line.id, 'unit', '');
                              }
                            }}
                            onFocus={() => setItemDropdownMap(prev => ({ ...prev, [line.id]: true }))}
                            placeholder="Search stock item..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white"
                          />
                        </div>
                        {itemDropdownMap[line.id] && (
                          <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {getFilteredItems(line.id).length > 0 ? (
                              getFilteredItems(line.id).map(si => (
                                <div
                                  key={si.id}
                                  className="px-3 py-2 cursor-pointer hover:bg-sky-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    selectStockItem(line.id, si);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <FiPackage className="w-3.5 h-3.5 text-sky-600" />
                                    <span className="text-sm font-medium text-gray-900">{si.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {si.quantity} {si.unit}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2.5 text-sm text-gray-500 italic">No items found.</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Qty Wasted */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty Wasted *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={line.quantityWasted}
                          onChange={e => updateLine(line.id, 'quantityWasted', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center font-medium"
                        />
                      </div>

                      {/* Unit */}
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                        <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-xl text-center min-h-[38px] flex items-center justify-center">
                          {line.unit || '-'}
                        </div>
                      </div>

                      {/* Cost/Unit */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cost/Unit</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.costAtTimeOfWaste}
                          onChange={e => updateLine(line.id, 'costAtTimeOfWaste', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                        />
                      </div>

                      {/* Item Subtotal */}
                      <div className="md:col-span-3 flex items-end">
                        <div className="px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl w-full text-center">
                          Subtotal: Rs {((Number(line.quantityWasted) || 0) * (Number(line.costAtTimeOfWaste) || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addLine}
                  disabled={stockItems.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 disabled:opacity-50 transition-colors"
                >
                  <FiPlusCircle size={14} />
                  Add Item
                </button>
                {stockItems.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No stock items available. Add stock entries first.</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (Optional)</label>
                <textarea
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Power outage caused spoilage..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none"
                />
              </div>

              {/* Total Estimated Loss */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FiInfo size={14} className="text-gray-400" />
                  Total Estimated Loss
                </span>
                <span className="text-xl font-bold text-red-600">
                  Rs {addTotalLoss.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={stockItems.length === 0 || addItems.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <FiPlusCircle size={14} />
                  Save Waste Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== VIEW WASTE RECORD MODAL ========== */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewRecord(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-200 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiEye size={18} className="text-sky-600" />
                Waste Record Details
              </h2>
              <button onClick={() => setViewRecord(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Record meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Date</span>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(viewRecord.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Reason</span>
                  <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-100 text-sky-700">
                    {viewRecord.reason}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Responsible Person</span>
                  <span className="text-sm font-medium text-gray-800">{viewRecord.responsiblePerson || '-'}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Total Estimated Loss</span>
                  <span className="text-sm font-bold text-red-600">Rs {getRecordLoss(viewRecord).toFixed(2)}</span>
                </div>
              </div>

              {/* Items table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Wasted Items</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase">Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewRecord.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 text-sm text-gray-800 font-medium">{item.stockItemName}</td>
                          <td className="py-2 px-3 text-sm text-gray-600 text-center">{item.quantityWasted}</td>
                          <td className="py-2 px-3 text-sm text-gray-600 text-center">{item.unit}</td>
                          <td className="py-2 px-3 text-sm text-gray-600 text-right">Rs {(item.costAtTimeOfWaste || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-sm text-red-600 font-semibold text-right">
                            Rs {((item.quantityWasted) * (item.costAtTimeOfWaste || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {viewRecord.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Notes</span>
                  <p className="text-sm text-gray-700">{viewRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setViewRecord(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {deleteRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteRecord(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrash2 size={18} className="text-red-600" />
                Delete Waste Record
              </h2>
              <button onClick={() => setDeleteRecord(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete this waste record?
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500">Record from <strong>{new Date(deleteRecord.date).toLocaleDateString()}</strong> — {deleteRecord.reason}</p>
              <p className="text-xs text-gray-500 mt-1">Loss: <span className="font-semibold text-red-600">Rs {getRecordLoss(deleteRecord).toFixed(2)}</span></p>
            </div>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteRecord(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
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

export default WastePage;
