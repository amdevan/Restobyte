
import React, { useState, useEffect, useMemo } from 'react';
import { Purchase } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiDollarSign, FiSave, FiXCircle, FiCalendar, FiFileText, FiAlignLeft } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface RecordSupplierPaymentModalProps {
  purchase: Purchase | null;
  onClose: () => void;
  onRecordPayment: (purchaseId: string, amountPaid: number, paymentDate: string, paymentMethod: string, reference?: string, notes?: string) => void;
}

const RecordSupplierPaymentModal: React.FC<RecordSupplierPaymentModalProps> = ({ purchase, onClose, onRecordPayment }) => {
  const { paymentMethods } = useRestaurantData();
  const paymentMethodOptions = useMemo(() => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name), [paymentMethods]);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethodOptions[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const dueAmount = purchase ? purchase.grandTotalAmount - (purchase.paidAmount || 0) : 0;

  useEffect(() => {
    if (purchase) {
      setAmountPaid(dueAmount > 0 ? dueAmount.toFixed(2) : ''); // Pre-fill with due amount if positive
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(paymentMethodOptions[0] || 'Cash');
      setReference('');
      setNotes('');
    }
  }, [purchase, dueAmount, paymentMethodOptions]);

  if (!purchase) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountPaid);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (numericAmount > dueAmount) {
        if (!window.confirm(`The amount entered ($${numericAmount.toFixed(2)}) is greater than the current due ($${dueAmount.toFixed(2)}). Do you want to proceed? This might result in an overpayment.`)) {
            return;
        }
    }
    onRecordPayment(purchase.id, numericAmount, paymentDate, paymentMethod, reference, notes);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        Record Payment for PO: <span className="text-sky-600">{purchase.purchaseNumber}</span>
      </h3>
      <p className="text-sm text-gray-600">
        Supplier: <span className="font-semibold">{purchase.supplierName || 'N/A'}</span>
      </p>
      <p className="text-sm text-gray-600">
        Total PO Amount: <span className="font-semibold">${purchase.grandTotalAmount.toFixed(2)}</span>
      </p>
       <p className="text-sm text-gray-600">
        Currently Paid: <span className="font-semibold">${(purchase.paidAmount || 0).toFixed(2)}</span>
      </p>
      <p className="text-sm text-red-600">
        Current Due Amount: <span className="font-semibold">${dueAmount.toFixed(2)}</span>
      </p>
      
      <Input
        label="Amount Being Paid *"
        type="number"
        id="amountPaid"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
        min="0.01"
        step="0.01"
        leftIcon={<FiDollarSign />}
        required
        autoFocus
      />
      <Input
        label="Payment Date *"
        type="date"
        id="paymentDate"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        leftIcon={<FiCalendar />}
        required
      />
      <div>
        <label htmlFor="paymentMethodSupplier" className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
        <select
          id="paymentMethodSupplier"
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
        label="Reference (Optional)"
        id="paymentReference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="e.g., Cheque #, Transaction ID"
        leftIcon={<FiFileText />}
      />
      <div>
        <label htmlFor="paymentNotesSupplier" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea
          id="paymentNotesSupplier"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Part payment, Full and final settlement"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default RecordSupplierPaymentModal;
