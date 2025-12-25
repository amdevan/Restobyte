
import React from 'react';
import { SaleTaxDetail } from '../../types';

interface CartSummaryProps {
  subTotal: number;
  discountValue: number;
  taxes: SaleTaxDetail[];
  grandTotal: number;
  tipAmount?: number;
  onDiscountClick: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subTotal, discountValue, taxes, grandTotal, tipAmount, onDiscountClick }) => {
  return (
    <div className="flex-shrink-0 space-y-2 mt-auto pt-4 border-t">
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>
          <p className="font-medium text-gray-800">${subTotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <button onClick={onDiscountClick} className="text-sky-600 hover:underline">
            {discountValue > 0 ? 'Edit Discount' : 'Add Discount'}
          </button>
          {discountValue > 0 && <p className="font-medium text-green-600">-${discountValue.toFixed(2)}</p>}
        </div>
        {taxes.map(tax => (
          <div key={tax.id} className="flex justify-between">
            <p className="text-gray-600">{tax.name} ({tax.rate}%)</p>
            <p className="font-medium text-gray-800">${tax.amount.toFixed(2)}</p>
          </div>
        ))}
         {tipAmount && tipAmount > 0 && (
            <div className="flex justify-between">
                <p className="text-gray-600">Tip</p>
                <p className="font-medium text-gray-800">${tipAmount.toFixed(2)}</p>
            </div>
        )}
      </div>
      <div className="flex justify-between text-xl font-bold border-t-2 border-dashed pt-2 mt-2">
        <p>Grand Total</p>
        <p>${grandTotal.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CartSummary;
