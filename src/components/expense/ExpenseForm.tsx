
import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { Expense } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { FiSave, FiCalendar, FiTag, FiUsers, FiHash, FiFileText, FiX } from 'react-icons/fi';

interface ExpenseFormProps {
  initialData?: Expense | null;
  onSubmit: (data: Omit<Expense, 'id' | 'categoryName' | 'outletId'>) => void;
  onUpdate: (data: Expense) => void;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const { expenseCategories, paymentMethods } = useRestaurantData();
  const paymentMethodOptions = useMemo(() => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name), [paymentMethods]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [payee, setPayee] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethodOptions[0]);
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date.split('T')[0]);
      setCategoryId(initialData.categoryId);
      setAmount(initialData.amount);
      setPayee(initialData.payee || '');
      setDescription(initialData.description || '');
      setPaymentMethod(initialData.paymentMethod);
      setReferenceNumber(initialData.referenceNumber || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(expenseCategories[0]?.id || '');
      setAmount('');
      setPayee('');
      setDescription('');
      setPaymentMethod(paymentMethodOptions[0]);
      setReferenceNumber('');
    }
  }, [initialData, expenseCategories, paymentMethodOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !categoryId || !amount) {
      alert('Date, Category, and Amount are required.');
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const selectedCategory = expenseCategories.find(cat => cat.id === categoryId);
    if (!selectedCategory) {
      alert('Invalid expense category selected.');
      return;
    }

    const expenseData = {
      date,
      categoryId,
      amount: numericAmount,
      payee: payee.trim() || undefined,
      description: description.trim() || undefined,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
    };

    if (initialData && onUpdate) {
      onUpdate({ ...initialData, ...expenseData, categoryName: selectedCategory.name });
    } else if (onSubmit) {
      onSubmit(expenseData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
              required
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="e.g., 50.00"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
            required
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white appearance-none"
            required
          >
            <option value="" disabled>Select a category</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {expenseCategories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">No expense categories found. Please add them in Settings.</p>
        )}
      </div>

      {/* Payee */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payee</label>
        <div className="relative">
          <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={payee}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPayee(e.target.value)}
            placeholder="e.g., Landlord, Office Supplies Store"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <div className="relative">
          <FiFileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white resize-none"
            placeholder="e.g., Monthly rent for shop, Purchase of new printer"
          />
        </div>
      </div>

      {/* Payment Method & Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white appearance-none"
            required
          >
            {paymentMethodOptions.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
          <div className="relative">
            <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={referenceNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReferenceNumber(e.target.value)}
              placeholder="e.g., INV-123, Receipt #456"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <FiX size={14} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={expenseCategories.length === 0 && !initialData?.categoryId}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-200"
        >
          <FiSave size={14} />
          {initialData ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
