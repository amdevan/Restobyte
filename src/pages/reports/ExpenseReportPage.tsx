


import React, { useState, useMemo } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Expense } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiSearch, FiCalendar, FiFilter, FiXCircle, FiEye, FiDollarSign, FiTag, FiArrowLeft } from 'react-icons/fi';

const PAYMENT_METHODS_FILTER_OPTIONS = ["All", "Cash", "Card", "Bank Transfer", "Online Payment", "Other"];

const ExpenseReportPage: React.FC = () => {
  const { expenses, expenseCategories } = useRestaurantData();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState('All');

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
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, startDate, endDate, selectedCategoryFilter, selectedPaymentMethodFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCategoryFilter('All');
    setSelectedPaymentMethodFilter('All');
  };

  const totalExpensesValue = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);
  
  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Expense Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiDollarSign className="mr-3 text-red-500"/> Expense Report
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
                {PAYMENT_METHODS_FILTER_OPTIONS.map(method => <option key={method} value={method}>{method}</option>)}
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
                <p className="text-xl font-bold text-red-600">
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExpenseReportPage;