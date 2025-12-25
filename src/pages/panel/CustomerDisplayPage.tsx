import React, { useState, useEffect } from 'react';
import { Sale, SaleItem, SaleTaxDetail } from '@/types';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FiShoppingCart } from 'react-icons/fi';

const CustomerDisplayPage: React.FC = () => {
    const { getSingleActiveOutlet } = useRestaurantData();
    const outlet = getSingleActiveOutlet();

    const [activeOrder, setActiveOrder] = useState<Partial<Sale> | null>(() => {
        const savedOrder = localStorage.getItem('customerDisplayOrder');
        return savedOrder ? JSON.parse(savedOrder) : null;
    });

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'customerDisplayOrder') {
                if (event.newValue) {
                    setActiveOrder(JSON.parse(event.newValue));
                } else {
                    setActiveOrder(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    const renderIdleScreen = () => (
        <div className="flex flex-col items-center justify-center text-center text-gray-600">
            {outlet?.logoUrl ? (
                <img src={outlet.logoUrl} alt={`${outlet.restaurantName} Logo`} className="w-40 h-40 object-contain mb-8 rounded-full shadow-lg"/>
            ) : (
                <FiShoppingCart size={100} className="text-gray-300 mb-8" />
            )}
            <h1 className="text-5xl font-bold text-gray-800">{outlet?.restaurantName || 'Welcome'}</h1>
            <p className="text-2xl mt-4 text-gray-500">Your order will appear here</p>
        </div>
    );
    
    const renderOrderView = (order: Partial<Sale>) => (
        <div className="grid grid-cols-3 gap-8 h-full">
            {/* Left side: Item list */}
            <div className="col-span-2 bg-white rounded-2xl shadow-lg p-8 overflow-y-auto custom-scrollbar">
                 <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-4">Your Order</h2>
                 <ul className="space-y-4">
                     {order.items?.map((item: SaleItem, index: number) => (
                         <li key={`${item.id}-${index}`} className="flex justify-between items-center text-2xl animate-fade-in-down" style={{animationDelay: `${index * 50}ms`}}>
                             <div className="flex-1">
                                 <span className="font-semibold text-gray-800">{item.quantity} x {item.name}</span>
                                 {item.notes && <p className="text-lg text-amber-600 pl-4">&hookrightarrow; {item.notes}</p>}
                             </div>
                             <span className="font-mono font-semibold text-gray-900 w-40 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                         </li>
                     ))}
                 </ul>
            </div>

            {/* Right side: Totals */}
            <div className="col-span-1 bg-gray-50 rounded-2xl shadow-lg p-8 flex flex-col">
                <div className="flex-grow space-y-4 text-xl">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-mono font-medium text-gray-800">${order.subTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                     {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-mono font-medium">-${(order.discountType === 'fixed' ? order.discountAmount : (order.subTotal || 0) * (order.discountAmount / 100)).toFixed(2)}</span>
                        </div>
                    ) : null}
                     {order.taxDetails?.map(tax => (
                         <div key={tax.id} className="flex justify-between">
                            <span className="text-gray-600">{tax.name} ({tax.rate}%)</span>
                            <span className="font-mono font-medium text-gray-800">${tax.amount.toFixed(2)}</span>
                        </div>
                     ))}
                </div>
                <div className="mt-auto pt-6 border-t-4 border-dashed">
                    <div className="flex justify-between items-baseline text-gray-800">
                        <span className="text-4xl font-bold">TOTAL</span>
                        <span className="text-5xl font-bold font-mono">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-gray-100 flex items-center justify-center p-8 font-sans">
            {activeOrder && activeOrder.items && activeOrder.items.length > 0 ? renderOrderView(activeOrder) : renderIdleScreen()}
        </div>
    );
};

export default CustomerDisplayPage;
