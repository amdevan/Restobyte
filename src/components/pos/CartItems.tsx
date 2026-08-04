import React, { memo, useState } from 'react';
import { SaleItem } from '../../types';
import Button from '../common/Button';
import { FiPlus, FiMinus, FiShoppingCart, FiEdit2, FiCheckCircle, FiPercent, FiDollarSign, FiX } from 'react-icons/fi';
import Money from '../common/Money';

type OrderItem = SaleItem & { status: 'new' | 'sent'; lineId: string };

interface CartItemsProps {
  items: OrderItem[];
  onUpdateQuantity: (lineId: string, newQuantity: number) => void;
  onEditItemNote: (item: OrderItem) => void;
  onUpdateDiscount?: (lineId: string, discountType: 'fixed' | 'percentage' | undefined, discountValue: number | undefined) => void;
}

const CartItems: React.FC<CartItemsProps> = ({ items, onUpdateQuantity, onEditItemNote, onUpdateDiscount }) => {
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState<{ type: 'fixed' | 'percentage'; value: string }>({ type: 'fixed', value: '' });

  if (items.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 p-4">
        <FiShoppingCart size={48} className="mb-3" />
        <p className="font-medium">Your cart is empty</p>
        <p className="text-xs">Add items from the menu to get started.</p>
      </div>
    );
  }

  const handleApplyDiscount = (lineId: string) => {
    const value = parseFloat(discountInput.value);
    if (!isNaN(value) && value > 0 && onUpdateDiscount) {
      onUpdateDiscount(lineId, discountInput.type, value);
    }
    setEditingDiscount(null);
    setDiscountInput({ type: 'fixed', value: '' });
  };

  const handleRemoveDiscount = (lineId: string) => {
    if (onUpdateDiscount) {
      onUpdateDiscount(lineId, undefined, undefined);
    }
    setEditingDiscount(null);
  };

  const calculateItemTotal = (item: OrderItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discountType || !item.discountValue || item.discountValue <= 0) {
      return baseTotal;
    }
    if (item.discountType === 'fixed') {
      return Math.max(0, baseTotal - (item.discountValue * item.quantity));
    }
    return Math.max(0, baseTotal * (1 - item.discountValue / 100));
  };

  const getItemDiscount = (item: OrderItem) => {
    if (!item.discountType || !item.discountValue || item.discountValue <= 0) return 0;
    const baseTotal = item.price * item.quantity;
    if (item.discountType === 'fixed') {
      return Math.min(baseTotal, item.discountValue * item.quantity);
    }
    return baseTotal * (item.discountValue / 100);
  };

  return (
    <div className="flex-grow my-3 overflow-y-auto custom-scrollbar border-y -mx-4 px-4 py-2">
      {items.map(item => {
        const isSent = item.status === 'sent';
        const hasDiscount = item.discountType && item.discountValue && item.discountValue > 0;
        const discount = getItemDiscount(item);
        const itemTotal = calculateItemTotal(item);
        
        return (
            <div key={item.lineId} className={`py-3 transition-opacity ${isSent ? 'opacity-60 bg-gray-50 -mx-4 px-4' : ''}`}>
                <div className="flex items-center">
                    <div className="flex-grow pr-2">
                        <div className="flex items-center">
                            <p className="font-semibold text-sm text-gray-800 mr-2">{item.name}</p>
                            <button onClick={() => onEditItemNote(item)} className="text-gray-400 hover:text-sky-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Add/Edit Note" disabled={isSent}>
                                <FiEdit2 size={12} />
                            </button>
                            {isSent && <FiCheckCircle size={12} className="text-green-500 ml-1" title="Sent to Kitchen"/>}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500"><Money amount={item.price} /></p>
                            {hasDiscount && (
                                <span className="text-xs text-green-600 bg-green-50 px-1 rounded">
                                    -{item.discountType === 'fixed' ? (
                                        <Money amount={item.discountValue} />
                                    ) : (
                                        `${item.discountValue}%`
                                    )}
                                </span>
                            )}
                        </div>
                        {item.notes && <p className="text-xs text-amber-600 bg-amber-50 rounded px-1 py-0.5 mt-1 inline-block whitespace-pre-wrap">Note: {item.notes}</p>}
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}><FiMinus size={12}/></Button>
                        <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                        <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}><FiPlus size={12}/></Button>
                    </div>
                    <p className="w-20 text-right font-semibold text-sm text-gray-800"><Money amount={itemTotal} /></p>
                </div>
                
                {/* Discount Button */}
                {!isSent && onUpdateDiscount && (
                    <div className="mt-1 flex items-center gap-2">
                        {editingDiscount === item.lineId ? (
                            <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
                                <button
                                    type="button"
                                    onClick={() => setDiscountInput(prev => ({ ...prev, type: 'fixed' }))}
                                    className={`p-1 rounded ${discountInput.type === 'fixed' ? 'bg-sky-500 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                    title="Fixed amount"
                                >
                                    <FiDollarSign size={10} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDiscountInput(prev => ({ ...prev, type: 'percentage' }))}
                                    className={`p-1 rounded ${discountInput.type === 'percentage' ? 'bg-sky-500 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                    title="Percentage"
                                >
                                    <FiPercent size={10} />
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max={discountInput.type === 'percentage' ? 100 : item.price * item.quantity}
                                    step={discountInput.type === 'percentage' ? 1 : 0.01}
                                    value={discountInput.value}
                                    onChange={(e) => setDiscountInput(prev => ({ ...prev, value: e.target.value }))}
                                    className="w-16 text-xs px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    placeholder={discountInput.type === 'percentage' ? '%' : 'Rs'}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleApplyDiscount(item.lineId);
                                        if (e.key === 'Escape') setEditingDiscount(null);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleApplyDiscount(item.lineId)}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    title="Apply"
                                >
                                    <FiCheckCircle size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingDiscount(null)}
                                    className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                    title="Cancel"
                                >
                                    <FiX size={12} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingDiscount(item.lineId);
                                        setDiscountInput({ type: 'fixed', value: '' });
                                    }}
                                    className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
                                    title="Add discount"
                                >
                                    <FiPercent size={10} />
                                    Discount
                                </button>
                                {hasDiscount && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDiscount(item.lineId)}
                                        className="text-xs text-red-500 hover:text-red-600"
                                        title="Remove discount"
                                    >
                                        Remove
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
                
                {/* Show discount info for sent items */}
                {isSent && hasDiscount && (
                    <div className="mt-1">
                        <span className="text-xs text-green-600">
                            Discount: {item.discountType === 'fixed' ? (
                                <Money amount={item.discountValue! * item.quantity} />
                            ) : (
                                `${item.discountValue}%`
                            )}
                        </span>
                    </div>
                )}
            </div>
        );
      })}
    </div>
  );
};

export default memo(CartItems);
