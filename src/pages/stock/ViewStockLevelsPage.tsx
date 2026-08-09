

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiSearch, FiArchive, FiAlertTriangle, FiCheckCircle, FiTrendingDown, FiX, FiEdit2, FiSave, FiTrash2 } from 'react-icons/fi';

type SortField = 'name' | 'category' | 'quantity' | 'status';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'in-stock' | 'low' | 'out';
const PAGE_SIZE = 25;

const ViewStockLevelsPage: React.FC = () => {
  const { stockItems, updateStockItem, deleteStockItem } = useRestaurantData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  // Edit state
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', quantity: 0, unit: 'pcs', lowStockThreshold: 0, costPerUnit: 0 });
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(stockItems.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [stockItems]);

  const getStatus = (item: StockItem): { text: string; colorClass: string; icon: React.ReactNode; order: number } => {
    if (item.quantity <= 0) {
      return { text: 'Out of Stock', colorClass: 'text-red-600 bg-red-100', icon: <FiAlertTriangle className="mr-1.5" />, order: 3 };
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { text: 'Low Stock', colorClass: 'text-amber-600 bg-amber-100', icon: <FiTrendingDown className="mr-1.5" />, order: 2 };
    }
    return { text: 'In Stock', colorClass: 'text-green-600 bg-green-100', icon: <FiCheckCircle className="mr-1.5" />, order: 1 };
  };

  const filteredStockItems = useMemo(() => {
    let items = stockItems.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item as any).sku?.toLowerCase().includes(term) ||
        (item as any).barcode?.toLowerCase().includes(term);
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const status = getStatus(item);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'out' && status.order === 3) ||
        (statusFilter === 'low' && status.order === 2) ||
        (statusFilter === 'in-stock' && status.order === 1);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortField === 'status') cmp = getStatus(a).order - getStatus(b).order;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [stockItems, searchTerm, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredStockItems.length / PAGE_SIZE);
  const pagedItems = filteredStockItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setPage(1);
  };

  const hasFilters = searchTerm || categoryFilter || statusFilter !== 'all';

  // Edit handlers
  const openEdit = (item: StockItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold,
      costPerUnit: item.costPerUnit || 0,
    });
  };

  const saveEdit = () => {
    if (!editingItem) return;
    if (!editForm.name.trim() || !editForm.category.trim()) {
      alert('Name and Category are required.');
      return;
    }
    updateStockItem(editingItem.id, {
      name: editForm.name.trim(),
      category: editForm.category.trim(),
      quantity: Math.max(0, editForm.quantity),
      unit: editForm.unit,
      lowStockThreshold: Math.max(0, editForm.lowStockThreshold),
      costPerUnit: Math.max(0, editForm.costPerUnit),
    });
    setEditingItem(null);
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-sky-600 select-none"
      onClick={() => toggleSort(field)}
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

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
            placeholder="Search by name, category, SKU, barcode..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm"
            containerClassName="mb-0"
            id="stock-search"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={clearFilters} leftIcon={<FiX size={14} />}>
            Clear Filters
          </Button>
        )}

        <span className="text-sm text-gray-500 ml-auto">
          {filteredStockItems.length} item{filteredStockItems.length !== 1 ? 's' : ''}
          {filteredStockItems.length !== stockItems.length && ` of ${stockItems.length}`}
        </span>
      </div>

      <Card className="overflow-x-auto">
        {pagedItems.length === 0 ? (
          <div className="text-center py-10">
            <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No stock items found.</p>
            {hasFilters && <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>}
            {!hasFilters && <p className="text-sm text-gray-400 mt-1">Stock inventory is currently empty.</p>}
          </div>
        ) : (
          <>
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <SortHeader field="name" label="Item Name" />
                  <SortHeader field="category" label="Category" />
                  <SortHeader field="quantity" label="Quantity" />
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unit</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Cost/Unit</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Low Stock Threshold</th>
                  <SortHeader field="status" label="Status" />
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedItems.map(item => {
                  const statusInfo = getStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right font-medium">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.unit}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.costPerUnit ? `Rs ${item.costPerUnit}` : '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.lowStockThreshold}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass}`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <FiEdit2 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <FiTrash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Edit Stock Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiEdit2 size={18} className="text-sky-600" />
                Edit Stock Item
              </h2>
              <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.quantity}
                    onChange={e => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select
                    value={editForm.unit}
                    onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white"
                  >
                    {['kg', 'g', 'ltr', 'ml', 'pcs', 'pack', 'dozen', 'bottle', 'can', 'box', 'unit'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.lowStockThreshold}
                    onChange={e => setEditForm(f => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Per Unit (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.costPerUnit}
                    onChange={e => setEditForm(f => ({ ...f, costPerUnit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={saveEdit} leftIcon={<FiSave size={14} />}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeletingItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrash2 size={18} className="text-red-600" />
                Delete Stock Item
              </h2>
              <button onClick={() => setDeletingItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingItem.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingItem(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteStockItem(deletingItem.id);
                  setDeletingItem(null);
                }}
                leftIcon={<FiTrash2 size={14} />}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStockLevelsPage;
