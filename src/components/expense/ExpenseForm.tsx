

import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiCalendar, FiDollarSign, FiTag, FiUsers, FiAlignLeft, FiHash } from 'react-icons/fi';

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
      setDate(initialData.date.split('T')[0]); // Ensure only date part
      setCategoryId(initialData.categoryId);
      setAmount(initialData.amount);
      setPayee(initialData.payee || '');
      setDescription(initialData.description || '');
      setPaymentMethod(initialData.paymentMethod);
      setReferenceNumber(initialData.referenceNumber || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(expenseCategories[0]?.id || ''); // Default to first category if available
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
        // For update, we also need categoryName, which will be the same as the selectedCategory's name
        onUpdate({ ...initialData, ...expenseData, categoryName: selectedCategory.name });
    } else if (onSubmit) {
        // For add, useRestaurantData will handle adding categoryName based on categoryId
        onSubmit(expenseData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date *"
          type="date"
          value={date}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          required
          autoFocus
          leftIcon={<FiCalendar />}
        />
        <Input
          label="Amount *"
          type="number"
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="e.g., 50.00"
          min="0.01"
          step="0.01"
          required
          leftIcon={<FiDollarSign />}
        />
      </div>
      
      <div>
        <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          id="expenseCategory"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          <option value="" disabled>Select a category</option>
          {expenseCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {expenseCategories.length === 0 && <p className="text-xs text-amber-600 mt-1">No expense categories found. Please add them in Settings.</p>}
      </div>

      <Input
        label="Payee (Optional)"
        value={payee}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPayee(e.target.value)}
        placeholder="e.g., Landlord, Office Supplies Store"
        leftIcon={<FiUsers />}
      />

      <div>
        <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          id="expenseDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Monthly rent for shop, Purchase of new printer"
        />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="paymentMethodExpense" className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
            id="paymentMethodExpense"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            required
            >
            {paymentMethodOptions.map(method => (
                <option key={method} value={method}>{method}</option>
            ))}
            </select>
        </div>
        <Input
            label="Reference Number (Optional)"
            value={referenceNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setReferenceNumber(e.target.value)}
            placeholder="e.g., INV-123, Receipt #456"
            leftIcon={<FiHash />}
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={expenseCategories.length === 0 && !initialData?.categoryId}>
          {initialData ? 'Update Expense' : 'Save Expense'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;