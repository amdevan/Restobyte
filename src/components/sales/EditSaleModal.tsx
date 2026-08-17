import React, { useState, useMemo, useEffect } from 'react';
import { Sale, SaleItem } from '@/types';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiSave, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { calcSubTotal } from '@/utils/calcOrderTotals';
import Money from '@/components/common/Money';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSave: (updatedSale: Sale) => Promise<Sale | null>;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, sale, onSave }) => {
  const { tables, waiters, paymentMethods, customers } = useRestaurantData();

  const [waiterName, setWaiterName] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [assignedTableId, setAssignedTableId] = useState<string | null>(null);
  const [assignedTableName, setAssignedTableName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state from sale prop when it changes
  useEffect(() => {
    if (sale) {
      setPaymentMethod(sale.paymentMethod || '');
      setPaymentReference(sale.paymentReference || '');
      setWaiterName(sale.waiterName || '');
      setWaiterId(sale.waiterId || '');
      setAssignedTableId(sale.assignedTableId ?? null);
      setAssignedTableName(sale.assignedTableName || '');
      setOrderNotes(sale.orderNotes || '');
      setCustomerId(sale.customerId || '');
      setCustomerName(sale.customerName || '');
      setItemPrices({});
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const availablePaymentMethods = useMemo(
    () => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name),
    [paymentMethods]
  );

  const availableTables = useMemo(() => {
    return tables.filter(t => t.status === 'Free' || t.id === sale.assignedTableId);
  }, [tables, sale.assignedTableId]);

  const availableWaiters = useMemo(() => waiters, [waiters]);

  const handleItemPriceChange = (itemId: string, newPrice: number) => {
    setItemPrices(prev => ({ ...prev, [itemId]: newPrice }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Update item prices where changed
      const updatedItems: SaleItem[] = sale.items.map(item => {
        const newPrice = itemPrices[item.id];
        if (newPrice !== undefined && newPrice !== item.price) {
          return { ...item, price: newPrice, basePrice: item.basePrice || item.price };
        }
        return item;
      });

      const newSubTotal = calcSubTotal(updatedItems);

      // Recalculate tax based on existing tax rates
      const discountValue = sale.discountType === 'percentage'
        ? (newSubTotal * (sale.discountAmount || 0)) / 100
        : (sale.discountType === 'fixed' ? (sale.discountAmount || 0) : 0);
      const totalAfterDiscount = newSubTotal - discountValue;
      const newTaxDetails = (sale.taxDetails || []).map(tax => ({
        ...tax,
        amount: parseFloat(((totalAfterDiscount * tax.rate) / 100).toFixed(2)),
      }));
      const newTotalTax = newTaxDetails.reduce((sum, t) => sum + t.amount, 0);
      const newTotalAmount = totalAfterDiscount + newTotalTax;

      const updatedSale: Sale = {
        ...sale,
        items: updatedItems,
        subTotal: newSubTotal,
        taxDetails: newTaxDetails,
        totalAmount: newTotalAmount,
        customerId: customerId !== '' ? customerId : sale.customerId,
        customerName: customerName || sale.customerName,
        waiterName: waiterName || sale.waiterName,
        waiterId: waiterId || sale.waiterId,
        assignedTableId: assignedTableId ?? sale.assignedTableId,
        assignedTableName: assignedTableName || sale.assignedTableName,
        orderNotes: orderNotes || sale.orderNotes,
        paymentMethod: paymentMethod || sale.paymentMethod,
        paymentReference: paymentReference || sale.paymentReference,
      };
      const result = await onSave(updatedSale);
      if (!result) {
        throw new Error('Failed to save sale');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        Edit Sale #{sale.id.slice(-6).toUpperCase()}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select
            value={customerId}
            onChange={(e) => {
              const c = customers.find(cu => cu.id === e.target.value);
              setCustomerId(e.target.value);
              setCustomerName(c?.name || '');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="">-- Walk-in Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waiter</label>
          <select
            value={waiterId}
            onChange={(e) => {
              const w = availableWaiters.find(wt => wt.id === e.target.value);
              setWaiterId(e.target.value);
              setWaiterName(w?.name || '');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="">-- Select Waiter --</option>
            {availableWaiters.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
          <select
            value={assignedTableId || ''}
            onChange={(e) => {
              const t = availableTables.find(t => t.id === e.target.value);
              setAssignedTableId(e.target.value || null);
              setAssignedTableName(t?.name || '');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="">-- No Table --</option>
            {availableTables.map(t => (
              <option key={t.id} value={t.id}>{t.name} (Capacity: {t.capacity})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="">-- Select Payment Method --</option>
            {availablePaymentMethods.map(pm => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Payment Reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="e.g., UPI-12345, Card ending 6789"
            containerClassName="mb-0"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
          <textarea
            id="orderNotes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Special instructions, delivery notes, etc."
          />
        </div>

        {/* Item Price Editing Section */}
        {sale.items.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Item Prices</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {sale.items.map((item) => {
                const editedPrice = itemPrices[item.id];
                const displayPrice = editedPrice !== undefined ? editedPrice : item.price;
                const itemTotal = displayPrice * item.quantity;
                return (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-500 block">Qty: {item.quantity}</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      label="Price"
                      value={editedPrice !== undefined ? String(editedPrice) : String(item.price)}
                      onChange={(e) => handleItemPriceChange(item.id, parseFloat(e.target.value) || 0)}
                      containerClassName="mb-0 w-24"
                    />
                    <div className="w-24 text-right">
                      <Money amount={itemTotal} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EditSaleModal;
