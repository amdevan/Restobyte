import React from 'react';
import { SaleItem } from '../../types';
import Button from '../common/Button';
import { FiPlus, FiMinus, FiShoppingCart, FiEdit2, FiCheckCircle } from 'react-icons/fi';

type OrderItem = SaleItem & { status: 'new' | 'sent'; lineId: string };

interface CartItemsProps {
  items: OrderItem[];
  onUpdateQuantity: (lineId: string, newQuantity: number) => void;
  onEditItemNote: (item: OrderItem) => void;
}

const CartItems: React.FC<CartItemsProps> = ({ items, onUpdateQuantity, onEditItemNote }) => {
  if (items.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 p-4">
        <FiShoppingCart size={48} className="mb-3" />
        <p className="font-medium">Your cart is empty</p>
        <p className="text-xs">Add items from the menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow my-3 overflow-y-auto custom-scrollbar border-y -mx-4 px-4 py-2">
      {items.map(item => {
        const isSent = item.status === 'sent';
        return (
            <div key={item.lineId} className={`flex items-center py-3 transition-opacity ${isSent ? 'opacity-60 bg-gray-50 -mx-4 px-4' : ''}`}>
                <div className="flex-grow pr-2">
                    <div className="flex items-center">
                    <p className="font-semibold text-sm text-gray-800 mr-2">{item.name}</p>
                    <button onClick={() => onEditItemNote(item)} className="text-gray-400 hover:text-sky-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Add/Edit Note" disabled={isSent}>
                        <FiEdit2 size={12} />
                    </button>
                     {isSent && <FiCheckCircle size={12} className="text-green-500 ml-1" title="Sent to Kitchen"/>}
                    </div>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                    {item.notes && <p className="text-xs text-amber-600 bg-amber-50 rounded px-1 py-0.5 mt-1 inline-block whitespace-pre-wrap">Note: {item.notes}</p>}
                </div>
                <div className="flex items-center space-x-2.5">
                    <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)} disabled={isSent}><FiMinus size={12}/></Button>
                    <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                    <Button size="sm" variant="outline" className="!p-1.5 aspect-square" onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)} disabled={isSent}><FiPlus size={12}/></Button>
                </div>
                <p className="w-20 text-right font-semibold text-sm text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        );
      })}
    </div>
  );
};

export default CartItems;