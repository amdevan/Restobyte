
import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Expense } from '@/types';
import Input from '@/components/common/Input';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Money from '@/components/common/Money';
import { FiSearch, FiArchive, FiTag, FiPlusCircle, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type SortField = 'date' | 'category' | 'amount' | 'payee' | 'paymentMethod';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;

const ExpensePage: React.FC = () => {
  const { expenses, expenseCategories, addExpense: contextAddExpense, updateExpense, deleteExpense, paymentMethods, getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();

  const paymentMethodFilterOptions = useMemo(() => ["All", ...paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name)], [paymentMethods]);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    let items = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;

      if (sDate && expenseDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (expenseDate > endOfDay) return false;
      }

      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        (expense.payee && expense.payee.toLowerCase().includes(searchTermLower)) ||
        (expense.description && expense.description.toLowerCase().includes(searchTermLower)) ||
        (expense.referenceNumber && expense.referenceNumber.toLowerCase().includes(searchTermLower));

      const matchesCategory = selectedCategoryFilter === 'All' || expense.categoryId === selectedCategoryFilter;
      const matchesPaymentMethod = selectedPaymentMethodFilter === 'All' || expense.paymentMethod === selectedPaymentMethodFilter;

      return matchesSearch && matchesCategory && matchesPaymentMethod;
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'category') cmp = a.categoryName.localeCompare(b.categoryName);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'payee') cmp = (a.payee || '').localeCompare(b.payee || '');
      else if (sortField === 'paymentMethod') cmp = a.paymentMethod.localeCompare(b.paymentMethod);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [expenses, searchTerm, startDate, endDate, selectedCategoryFilter, selectedPaymentMethodFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
  const pagedItems = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const hasFilters = searchTerm || startDate || endDate || selectedCategoryFilter !== 'All' || selectedPaymentMethodFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCategoryFilter('All');
    setSelectedPaymentMethodFilter('All');
    setPage(1);
  };

  const handleOpenModal = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'categoryName' | 'outletId'>) => {
    if (!outlet) {
      alert('An active outlet must be selected to add an expense.');
      return;
    }
    const category = expenseCategories.find(cat => cat.id === expenseData.categoryId);
    if (!category) {
      alert("Selected category not found.");
      return;
    }
    contextAddExpense({ ...expenseData, categoryName: category.name, outletId: outlet.id });
    handleCloseModal();
  };

  const handleUpdateExpense = (expenseData: Expense) => {
    updateExpense(expenseData);
    handleCloseModal();
  };

  const totalExpensesValue = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiTag className="mr-3 text-sky-600" /> Expense Management
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-4 w-4" />
            </div>
            <Input
              type="text"
              placeholder="Search payee, description, ref#..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm"
              containerClassName="mb-0"
              id="expense-search"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={expenseCategories.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {expenseCategories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-amber-700 text-sm">
            No expense categories found. Please <a href="#/settings/expense-categories" className="font-semibold underline hover:text-amber-800">add categories in Settings</a> before recording expenses.
          </p>
        </div>
      )}

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
          value={selectedCategoryFilter}
          onChange={(e) => { setSelectedCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="All">All Categories</option>
          {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select
          value={selectedPaymentMethodFilter}
          onChange={(e) => { setSelectedPaymentMethodFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          {paymentMethodFilterOptions.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiX size={12} /> Clear
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          {filteredExpenses.length !== expenses.length && ` of ${expenses.length}`}
          <span className="ml-2 font-semibold text-sky-600">
            Total: <Money amount={totalExpensesValue} />
          </span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pagedItems.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match your filters'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {expenses.length === 0
                ? 'Click "Add Expense" to record your first one.'
                : 'Try adjusting your search or date/category filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <SortHeader field="date" label="Date" />
                    <SortHeader field="category" label="Category" />
                    <SortHeader field="amount" label="Amount" align="right" />
                    <SortHeader field="payee" label="Payee" />
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                    <SortHeader field="paymentMethod" label="Payment Method" />
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ref #</th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedItems.map(exp => (
                    <tr key={exp.id} className="hover:bg-sky-50 transition-all duration-200">
                      <td className="py-3 px-4 text-sm text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                          <FiTag size={10} />{exp.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right"><Money amount={exp.amount} /></td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">{exp.payee || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-[180px]">{exp.description || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{exp.paymentMethod}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{exp.referenceNumber || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenModal(exp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <FiEdit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingExpense(exp)}
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

      {/* Add/Edit Expense Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleCloseModal}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiTag size={18} className="text-sky-600" />
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
              <FiX size={18} />
            </button>
          </div>
          <div className="p-6">
            <ExpenseForm
              initialData={editingExpense}
              onSubmit={handleAddExpense}
              onUpdate={handleUpdateExpense}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeletingExpense(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrash2 size={18} className="text-red-600" />
                Delete Expense
              </h2>
              <button onClick={() => setDeletingExpense(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this expense{deletingExpense.payee ? ` for ${deletingExpense.payee}` : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingExpense) {
                    await deleteExpense(deletingExpense.id);
                    setDeletingExpense(null);
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

export default ExpensePage;
