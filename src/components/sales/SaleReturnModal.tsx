import React, { useState, useMemo } from 'react';
import { Sale, SaleReturnItem } from '@/types';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Money from '@/components/common/Money';
import { FiXCircle, FiSave, FiTrash2 } from 'react-icons/fi';
import { formatMoney, getDefaultCurrency } from '@/utils/currency';
import { useRestaurantData } from '@/hooks/useRestaurantData';

interface SaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onReturn: (saleId: string, returnData: { items: SaleReturnItem[]; returnAmount: number; reason?: string; refundMethod?: string; refundDate: string; outletId: string; returnType?: 'stock_return' | 'waste' }) => Promise<{ success: boolean; message?: string }>;
}

const REFUND_METHODS = ['Cash', 'Card', 'Online', 'Original Payment'];

const SaleReturnModal: React.FC<SaleReturnModalProps> = ({ isOpen, onClose, sale, onReturn }) => {
  const { applicationSettings, currencies, paymentMethods } = useRestaurantData();
  const defaultCurrency = useMemo(() => getDefaultCurrency(currencies), [currencies]);

  const [returnItems, setReturnItems] = useState<SaleReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState(REFUND_METHODS[0]);
  const [returnType, setReturnType] = useState<'stock_return' | 'waste'>('stock_return');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sale) return null;

  const availablePaymentMethods = useMemo(
    () => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name),
    [paymentMethods]
  );

  const refundOptions = useMemo(() => {
    const opts = [...REFUND_METHODS];
    availablePaymentMethods.forEach(pm => {
      if (!opts.includes(pm)) opts.push(pm);
    });
    return opts;
  }, [availablePaymentMethods]);

  // Use composite key (id + name) to uniquely identify items with variations
  const getItemKey = (item: Sale['items'][number]) => `${item.id}__${item.name}`;

  const handleToggleItem = (item: Sale['items'][number]) => {
    const key = getItemKey(item);
    const exists = returnItems.find(ri => `${ri.id}__${ri.name}` === key);
    if (exists) {
      setReturnItems(returnItems.filter(ri => `${ri.id}__${ri.name}` !== key));
    } else {
      setReturnItems([...returnItems, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        reason: '',
        variationName: item.variationName,
      }]);
    }
  };

  const handleQuantityChange = (itemKey: string, quantity: number) => {
    const item = sale.items.find(i => getItemKey(i) === itemKey);
    const maxQty = item?.quantity || 1;
    const qty = Math.max(0, Math.min(quantity, maxQty));
    setReturnItems(returnItems.map(ri =>
      `${ri.id}__${ri.name}` === itemKey ? { ...ri, quantity: qty } : ri
    ));
  };

  const handleRemoveItem = (itemKey: string) => {
    setReturnItems(returnItems.filter(ri => `${ri.id}__${ri.name}` !== itemKey));
  };

  const returnAmount = useMemo(() => {
    return returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [returnItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (returnItems.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onReturn(sale.id, {
        items: returnItems,
        returnAmount,
        reason,
        refundMethod,
        refundDate: new Date().toISOString(),
        outletId: sale.outletId,
        returnType,
      });
      if (result.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Return Items from Sale #{sale.id.slice(-6).toUpperCase()}
        </h3>
        <p className="text-sm text-gray-600">
          Select items to return and specify quantities.
        </p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
        {sale.items.map((item) => {
          const itemKey = getItemKey(item);
          const isReturned = returnItems.some(ri => `${ri.id}__${ri.name}` === itemKey);
          const returnItem = returnItems.find(ri => `${ri.id}__${ri.name}` === itemKey);
          return (
            <div key={itemKey} className={`flex items-center space-x-3 p-2 rounded ${isReturned ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
              <input
                type="checkbox"
                checked={isReturned}
                onChange={() => handleToggleItem(item)}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <span className="text-xs text-gray-500 block">Price: {formatMoney(item.price, defaultCurrency, applicationSettings)}</span>
              </div>
              {isReturned && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={returnItem?.quantity || 0}
                    onChange={(e) => handleQuantityChange(itemKey, parseInt(e.target.value) || 0)}
                    className="w-16 text-center text-sm"
                    containerClassName="mb-0"
                  />
                  <span className="text-xs text-gray-500">of {item.quantity}</span>
                </div>
              )}
              {isReturned && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveItem(itemKey)}
                  aria-label="Remove from return"
                >
                  <FiTrash2 size={14} />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {returnItems.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Refund Amount:</span>
            <span className="text-lg font-bold text-gray-800">
              <Money amount={returnAmount} />
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
        <select
          value={returnType}
          onChange={(e) => setReturnType(e.target.value as 'stock_return' | 'waste')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="stock_return">Stock Return (Restock inventory)</option>
          <option value="waste">Waste Food (Do not restock)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {returnType === 'stock_return' 
            ? 'Returned items will be added back to inventory.' 
            : 'Returned items will be logged as waste and not restocked.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
        <select
          value={refundMethod}
          onChange={(e) => setRefundMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {refundOptions.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
        <textarea
          id="returnReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Wrong order, Quality issue, Customer request..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={isSubmitting || returnItems.length === 0}>
          {isSubmitting ? 'Processing...' : 'Process Return'}
        </Button>
      </div>
    </form>
  );
};

export default SaleReturnModal;
