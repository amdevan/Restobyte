import React, { useMemo } from 'react';
import { useCart } from '../../hooks/useCart';
import Button from '../common/Button';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import Money from '../common/Money';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ReturnType<typeof useCart>['cart'];
  removeFromCart: ReturnType<typeof useCart>['removeFromCart'];
  updateQuantity: ReturnType<typeof useCart>['updateQuantity'];
  cartTotal: number;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
    isOpen, 
    onClose, 
    cart, 
    removeFromCart, 
    updateQuantity, 
    cartTotal 
}) => {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-full flex pointer-events-none">
        <div className="w-screen max-w-md pointer-events-auto transform transition-transform ease-in-out duration-300 bg-white shadow-xl flex flex-col h-full">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                    <FiShoppingBag className="text-orange-500" /> Your Cart
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                    <FiX size={24} />
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2 text-orange-200">
                            <FiShoppingBag size={40} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">Your cart is empty</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">Looks like you haven't added anything to your cart yet.</p>
                        </div>
                        <button onClick={onClose} className="mt-4 text-orange-500 font-bold hover:underline">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 relative group">
                                <img 
                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{item.name}</h3>
                                        <button 
                                            onClick={() => removeFromCart(item.id)} 
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.description}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-orange-500 text-sm"><Money amount={item.price * item.quantity} /></span>
                                    
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <button 
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 hover:bg-gray-50 text-gray-500 transition-colors w-7 flex justify-center"
                                            disabled={item.quantity <= 1}
                                        >
                                            <FiMinus size={12} />
                                        </button>
                                        <span className="w-6 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 hover:bg-gray-50 text-gray-500 transition-colors w-7 flex justify-center"
                                        >
                                            <FiPlus size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
                <div className="border-t border-gray-100 p-6 bg-white sticky bottom-0 z-10 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium"><Money amount={cartTotal} /></span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Delivery Fee</span>
                            <span className="font-medium text-green-600">Free</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-orange-500"><Money amount={cartTotal} /></span>
                        </div>
                    </div>
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 flex justify-between px-6 items-center group">
                        <span>Checkout</span>
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono group-hover:bg-white/30 transition-colors"><Money amount={cartTotal} /></span>
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;