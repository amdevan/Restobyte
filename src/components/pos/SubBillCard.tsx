
import React from 'react';
import { Split } from '../../types';
import Button from '../common/Button';
import { FiDollarSign, FiCheckCircle } from 'react-icons/fi';

interface SubBillCardProps {
  split: Split;
  onPay: (split: Split) => void;
}

const SubBillCard: React.FC<SubBillCardProps> = ({ split, onPay }) => {
  return (
    <div className={`p-3 rounded-lg border-2 ${split.isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'} w-64 flex-shrink-0 flex flex-col`}>
      <div className="flex justify-between items-center mb-2 pb-2 border-b">
        <h3 className="font-bold text-lg">Split {split.id.slice(-4)}</h3>
        {split.isPaid ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800 flex items-center">
            <FiCheckCircle size={14} className="mr-1"/> Paid
          </span>
        ) : (
          <Button size="sm" onClick={() => onPay(split)}>Pay</Button>
        )}
      </div>
      <div className="space-y-1 flex-grow overflow-y-auto custom-scrollbar pr-1 min-h-[50px]">
        {split.items && split.items.length > 0 ? (
            split.items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                    <span className="font-mono">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
            ))
        ) : (
            <p className="text-sm text-gray-600 italic">{split.description || 'Custom Amount'}</p>
        )}
      </div>
      <div className="mt-2 pt-2 border-t text-sm space-y-0.5">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>${split.subTotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tax:</span><span>${split.taxAmount.toFixed(2)}</span></div>
        {split.tipAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tip:</span><span>${split.tipAmount.toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold text-md mt-1"><span>Total:</span><span>${(split.totalAmount + split.tipAmount).toFixed(2)}</span></div>
      </div>
    </div>
  );
};

export default SubBillCard;
