
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Supplier } from '@/types';
import SupplierForm from '@/components/stock/SupplierForm';
import Money from '@/components/common/Money';
import { FiPlusCircle, FiEdit2, FiTrash2, FiUsers, FiPhone, FiMail, FiSearch, FiX, FiEye, FiShoppingCart, FiDollarSign, FiArchive, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type SortField = 'name' | 'contactPerson' | 'phone' | 'totalPurchases' | 'totalSpent';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 15;

const ManageSuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers, purchases, addSupplier, updateSupplier, deleteSupplier } = useRestaurantData();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Calculate per-supplier stats
  const supplierStats = useMemo(() => {
    const stats: Record<string, { totalPurchases: number; totalSpent: number; lastPurchaseDate: string | null }> = {};
    for (const s of suppliers) {
      stats[s.id] = { totalPurchases: 0, totalSpent: 0, lastPurchaseDate: null };
    }
    for (const p of purchases) {
      if (p.supplierId && stats[p.supplierId]) {
        stats[p.supplierId].totalPurchases += 1;
        stats[p.supplierId].totalSpent += p.grandTotalAmount;
        const pDate = new Date(p.date).toISOString();
        if (!stats[p.supplierId].lastPurchaseDate || pDate > stats[p.supplierId].lastPurchaseDate!) {
          stats[p.supplierId].lastPurchaseDate = pDate;
        }
      }
    }
    return stats;
  }, [suppliers, purchases]);

  const totalPurchasesCount = useMemo(() => purchases.length, [purchases]);
  const totalSpent = useMemo(() => purchases.reduce((sum, p) => sum + p.grandTotalAmount, 0), [purchases]);

  const filteredSuppliers = useMemo(() => {
    let items = suppliers.filter(s => {
      const lower = searchTerm.toLowerCase();
      return lower === '' ||
        s.name.toLowerCase().includes(lower) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(lower)) ||
        (s.phone && s.phone.includes(lower)) ||
        (s.email && s.email.toLowerCase().includes(lower));
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'contactPerson') cmp = (a.contactPerson || '').localeCompare(b.contactPerson || '');
      else if (sortField === 'phone') cmp = (a.phone || '').localeCompare(b.phone || '');
      else if (sortField === 'totalPurchases') cmp = (supplierStats[a.id]?.totalPurchases || 0) - (supplierStats[b.id]?.totalPurchases || 0);
      else if (sortField === 'totalSpent') cmp = (supplierStats[a.id]?.totalSpent || 0) - (supplierStats[b.id]?.totalSpent || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [suppliers, searchTerm, sortField, sortDir, supplierStats]);

  const totalPages = Math.ceil(filteredSuppliers.length / PAGE_SIZE);
  const pagedItems = filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleOpenModalForAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField; label: string; align?: 'left' | 'right' }) => (
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
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiUsers className="mr-3 text-sky-600" /> Manage Suppliers
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>
          <button
            onClick={handleOpenModalForAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200 whitespace-nowrap"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <FiUsers className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Suppliers</p>
            <p className="text-lg font-bold text-gray-900">{suppliers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <FiShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Purchases</p>
            <p className="text-lg font-bold text-gray-900">{totalPurchasesCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <FiDollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Spent</p>
            <p className="text-lg font-bold text-gray-900"><Money amount={totalSpent} /></p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pagedItems.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match your search'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {suppliers.length === 0 ? 'Click "Add Supplier" to get started.' : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <SortHeader field="name" label="Name" />
                    <SortHeader field="contactPerson" label="Contact" />
                    <SortHeader field="phone" label="Phone" />
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                    <SortHeader field="totalPurchases" label="Purchases" align="right" />
                    <SortHeader field="totalSpent" label="Total Spent" align="right" />
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedItems.map(supplier => {
                    const stats = supplierStats[supplier.id] || { totalPurchases: 0, totalSpent: 0 };
                    return (
                      <tr key={supplier.id} className="hover:bg-sky-50 transition-all duration-200">
                        <td className="py-3 px-4">
                          <div>
                            <span
                              className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                              onClick={() => navigate(`/app/suppliers?highlight=${supplier.id}`)}
                            >
                              {supplier.name}
                            </span>
                            {supplier.address && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{supplier.address}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{supplier.contactPerson || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {supplier.phone ? (
                            <a href={`tel:${supplier.phone}`} className="hover:text-sky-600 flex items-center gap-1">
                              <FiPhone size={11} />{supplier.phone}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {supplier.email ? (
                            <a href={`mailto:${supplier.email}`} className="hover:text-sky-600 flex items-center gap-1">
                              <FiMail size={11} />{supplier.email}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                            {stats.totalPurchases}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">
                          {stats.totalSpent > 0 ? <Money amount={stats.totalSpent} /> : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/app/stock/suppliers/${supplier.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                            >
                              <FiEye size={12} /> View
                            </button>
                            <button
                              onClick={() => handleOpenModalForEdit(supplier)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <FiEdit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => setDeletingSupplier(supplier)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <FiTrash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Add/Edit Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleCloseModal}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiUsers size={18} className="text-sky-600" />
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
              <FiX size={18} />
            </button>
          </div>
          <div className="p-6">
            <SupplierForm
              initialData={editingSupplier}
              onSubmit={addSupplier}
              onUpdate={updateSupplier}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeletingSupplier(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrash2 size={18} className="text-red-600" />
                Delete Supplier
              </h2>
              <button onClick={() => setDeletingSupplier(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deletingSupplier.name}</strong>?
            </p>
            {supplierStats[deletingSupplier.id]?.totalPurchases ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-amber-700">
                  This supplier has <strong>{supplierStats[deletingSupplier.id].totalPurchases}</strong> purchase(s) totaling <strong><Money amount={supplierStats[deletingSupplier.id].totalSpent} /></strong>. Purchase records will not be deleted.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">This supplier has no purchase history.</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingSupplier(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingSupplier) {
                    await deleteSupplier(deletingSupplier.id);
                    setDeletingSupplier(null);
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

export default ManageSuppliersPage;
