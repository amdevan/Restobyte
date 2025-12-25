

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Expense, ExpenseCategory } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import ExpenseForm from '@/components/expense/ExpenseForm';
import { FiSearch, FiCalendar, FiFilter, FiXCircle, FiEye, FiDollarSign, FiPlusCircle, FiEdit, FiTrash2, FiTag } from 'react-icons/fi';

const ExpensePage: React.FC = () => {
  const { expenses, expenseCategories, addExpense: contextAddExpense, updateExpense, deleteExpense, paymentMethods, getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();

  const paymentMethodFilterOptions = useMemo(() => ["All", ...paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name)], [paymentMethods]);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
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
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first
  }, [expenses, searchTerm, startDate, endDate, selectedCategoryFilter, selectedPaymentMethodFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCategoryFilter('All');
    setSelectedPaymentMethodFilter('All');
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
    if(!outlet) {
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
    updateExpense(expenseData); // updateExpense in hook should already handle categoryName or get it
    handleCloseModal();
  };
  
  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense record?")) {
        deleteExpense(expenseId);
    }
  };
  
  const totalExpensesValue = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiDollarSign className="mr-3 text-sky-600"/> Expense Management
        </h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<FiPlusCircle />} variant="primary" disabled={expenseCategories.length === 0}>
            Add New Expense
        </Button>
      </div>
      {expenseCategories.length === 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <p className="text-amber-700 text-sm">
                No expense categories found. Please <a href="#/settings/expense-categories" className="font-semibold underline hover:text-amber-800">add categories in Settings</a> before recording expenses.
            </p>
          </Card>
      )}

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              label="Search Payee / Description / Ref #"
              id="expense-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch />}
              placeholder="e.g., Landlord, INV-123"
            />
            <Input
              label="Start Date"
              id="start-date-expense"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date"
              id="end-date-expense"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="categoryFilterExpense" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="categoryFilterExpense"
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                <option value="All">All Categories</option>
                {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="paymentMethodFilterExpense" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                id="paymentMethodFilterExpense"
                value={selectedPaymentMethodFilter}
                onChange={e => setSelectedPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                {paymentMethodFilterOptions.map(method => <option key={method} value={method}>{method}</option>)}
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
                Expense Records ({filteredExpenses.length})
             </h3>
             <div className="text-right">
                <p className="text-sm text-gray-600">Total Expenses (Filtered)</p>
                <p className="text-xl font-bold text-sky-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalExpensesValue.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {expenses.length === 0 ? "No expenses recorded yet." : "No expenses match your criteria."}
            </p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payee</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ref #</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                            <FiTag size={12} className="mr-1"/>{exp.categoryName}
                        </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-semibold text-right">${exp.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{exp.payee || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">{exp.description || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{exp.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex space-x-1">
                        <Button onClick={() => handleOpenModal(exp)} variant="secondary" size="sm" className="p-1.5" aria-label="Edit Expense">
                            <FiEdit size={14}/>
                        </Button>
                        <Button onClick={() => handleDeleteExpense(exp.id)} variant="danger" size="sm" className="p-1.5" aria-label="Delete Expense">
                            <FiTrash2 size={14}/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingExpense ? "Edit Expense" : "Add New Expense"} 
        size="lg"
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={handleAddExpense}
          onUpdate={handleUpdateExpense}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ExpensePage;