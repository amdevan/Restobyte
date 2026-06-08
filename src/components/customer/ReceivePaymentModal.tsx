
import React, { useState, useEffect, useMemo } from 'react';
import { Customer } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiCreditCard, FiAlignLeft } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Money from '../common/Money';
import { formatMoney, getDefaultCurrency } from '../../utils/currency';

interface ReceivePaymentModalProps {
  customer: Customer | null;
  onClose: () => void;
  onReceivePayment: (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => void | Promise<void>;
}

const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({ customer, onClose, onReceivePayment }) => {
  const { paymentMethods, currencies, applicationSettings } = useRestaurantData();
  const availablePaymentMethods = useMemo(() => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name), [paymentMethods]);
  const defaultCurrency = useMemo(() => getDefaultCurrency(currencies), [currencies]);
  const moneySettings = useMemo(() => {
    return {
      currencySymbolPosition: applicationSettings?.currencySymbolPosition ?? 'before',
      decimalPlaces: applicationSettings?.decimalPlaces ?? 2,
    };
  }, [applicationSettings?.currencySymbolPosition, applicationSettings?.decimalPlaces]);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(availablePaymentMethods[0] || 'Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dueAmount = customer ? Number((customer as any).dueAmount) : 0;
    if (customer && Number.isFinite(dueAmount) && dueAmount > 0) {
      // Pre-fill amount with current due, but allow editing
      setAmount(String(dueAmount.toFixed(2)));
    } else {
      setAmount('');
    }
    setPaymentMethod(availablePaymentMethods[0] || 'Cash');
    setNotes('');
  }, [customer, availablePaymentMethods]);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    const dueAmount = Number((customer as any).dueAmount) || 0;
    if (numericAmount > dueAmount) {
        const entered = defaultCurrency ? formatMoney(numericAmount, defaultCurrency, moneySettings) : numericAmount.toFixed(moneySettings.decimalPlaces);
        const due = defaultCurrency ? formatMoney(dueAmount, defaultCurrency, moneySettings) : dueAmount.toFixed(moneySettings.decimalPlaces);
        if (!window.confirm(`The amount entered (${entered}) is greater than the due amount (${due}). Do you want to proceed? This might result in a credit for the customer.`)) {
            return;
        }
    }
    try {
      setIsSubmitting(true);
      await onReceivePayment(customer.id, numericAmount, paymentMethod, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        Receive Payment from: <span className="text-sky-600">{customer.name}</span>
      </h3>
      <p className="text-sm text-gray-600">
        Current Due Amount: <span className="font-semibold"><Money amount={Number((customer as any).dueAmount) || 0} /></span>
      </p>
      
      <Input
        label="Amount Received *"
        type="number"
        id="paymentAmount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0.01"
        step="0.01"
        required
        autoFocus
      />

      <div>
        <label htmlFor="paymentMethodModal" className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
        <select
          id="paymentMethodModal"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          {availablePaymentMethods.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea
          id="paymentNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Payment for Invoice #123, Cleared all dues"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={isSubmitting}>
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default ReceivePaymentModal;
