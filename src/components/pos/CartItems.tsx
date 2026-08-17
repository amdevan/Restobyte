import React, { memo, useState } from 'react';
import { SaleItem, SaleItemExtra } from '../../types';
import Button from '../common/Button';
import { FiPlus, FiMinus, FiShoppingCart, FiEdit2, FiCheckCircle, FiPercent, FiDollarSign, FiX } from 'react-icons/fi';
import Money from '../common/Money';

type OrderItem = SaleItem & { status: 'new' | 'sent'; lineId: string };

interface CartItemsProps {
  items: OrderItem[];
  onUpdateQuantity: (lineId: string, newQuantity: number) => void;
  onEditItemNote: (item: OrderItem) => void;
  onUpdateDiscount?: (lineId: string, discountType: 'fixed' | 'percentage' | undefined, discountValue: number | undefined) => void;
  onEditExtras?: (lineId: string) => void;
  onRemoveExtra?: (lineId: string, extraId: string) => void;
}

// Fast stable hash for deep-equality cart comparison — avoids re-render when
// props arrive via new reference but contain identical data (main flicker source).
const fastHash = (v: unknown): string => {
  if (v === null || v === undefined) return String(v);
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(fastHash).join(',') + ']';
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + fastHash((v as Record<string, unknown>)[k])).join(',') + '}';
};

const areCartItemsPropsEqual = (prev: CartItemsProps, next: CartItemsProps): boolean => {
  if (prev.onUpdateQuantity !== next.onUpdateQuantity) return false;
  if (prev.onEditItemNote !== next.onEditItemNote) return false;
  if (prev.onUpdateDiscount !== next.onUpdateDiscount) return false;
  if (prev.onEditExtras !== next.onEditExtras) return false;
  if (prev.onRemoveExtra !== next.onRemoveExtra) return false;
  if (prev.items.length !== next.items.length) return false;
  if (prev.items === next.items) return true;
  for (let i = 0; i < prev.items.length; i++) {
    const a = prev.items[i], b = next.items[i];
    if (a.lineId !== b.lineId || a.id !== b.id || a.name !== b.name || a.price !== b.price ||
        a.quantity !== b.quantity || a.status !== b.status || a.notes !== b.notes ||
        a.variationName !== b.variationName || a.discountType !== b.discountType ||
        a.discountValue !== b.discountValue) return false;
    const ea = (a as any).extras, eb = (b as any).extras;
    if (!!ea !== !!eb) return false;
    if (ea && eb && fastHash(ea) !== fastHash(eb)) return false;
  }
  return true;
};

const CartItems: React.FC<CartItemsProps> = ({ items, onUpdateQuantity, onEditItemNote, onUpdateDiscount, onEditExtras, onRemoveExtra }) => {
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
        const itemExtras: SaleItemExtra[] = item.extras || [];
        
        return (
            <div key={item.lineId} className={`py-3 transition-opacity ${isSent ? 'opacity-60 bg-gray-50 -mx-4 px-4' : ''}`}>
                <div className="flex items-start">
                    <div className="flex-grow pr-2">
                        <div className="flex items-center">
                            <p className="font-semibold text-sm text-gray-800 mr-2">{item.name}</p>
                            <button onClick={() => onEditItemNote(item)} className="text-gray-400 hover:text-sky-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Add/Edit Note" disabled={isSent}>
                                <FiEdit2 size={12} />
                            </button>
                            {onEditExtras && (
                                <button
                                    type="button"
                                    onClick={() => onEditExtras(item.lineId)}
                                    className={`text-xs ${isSent ? 'text-amber-600 hover:text-amber-700 bg-amber-50' : 'text-sky-600 hover:text-sky-700 bg-sky-50'} px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1`}
                                    title={isSent ? 'Add Extra (will re-send to KOT)' : 'Add/Edit Extras'}
                                >
                                    <FiPlus size={10} />
                                    Extra
                                </button>
                            )}
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
                        
                        {/* Extras display with inline remove */}
                        {itemExtras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                                {itemExtras.map((extra) => (
                                    <div key={extra.id} className="flex items-center gap-1 text-xs text-gray-500">
                                        <span className="text-gray-400">+</span>
                                        <span>{extra.name}</span>
                                        <span className="text-gray-400">(<Money amount={extra.price} />){extra.quantity && extra.quantity > 1 ? ` x ${extra.quantity}` : ''}</span>
                                        {onRemoveExtra && !isSent && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveExtra(item.lineId, extra.id)}
                                                className="text-red-400 hover:text-red-600 ml-0.5"
                                                title={`Remove ${extra.name}`}
                                            >
                                                <FiX size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {item.notes && <p className="text-xs text-amber-600 bg-amber-50 rounded px-1 py-0.5 mt-1 inline-block whitespace-pre-wrap">Note: {item.notes}</p>}
                    </div>
                    <div className="flex items-center space-x-2.5 pt-0.5">
                        <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}><FiMinus size={12}/></Button>
                        <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                        <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}><FiPlus size={12}/></Button>
                    </div>
                    <p className="w-20 text-right font-semibold text-sm text-gray-800 pt-0.5"><Money amount={itemTotal} /></p>
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

export default memo(CartItems, areCartItemsPropsEqual);
