import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import Spinner from '@/components/common/Spinner';
import Money from '@/components/common/Money';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

const CustomerOrdersPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/me/orders`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>
            {orders.length === 0 ? (
                <p className="text-gray-500">You haven't placed any orders yet.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold">#{order.id.slice(0,8)}</span>
                                    <span className="text-gray-500 text-sm ml-2">
                                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between">
                                        <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                                        <Money amount={item.unitPrice * item.quantity} />
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <Money amount={order.total} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerOrdersPage;