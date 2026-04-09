import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/config';
import Spinner from '@/components/common/Spinner';

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, reservations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [ordersRes, reservationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/me/orders`, { headers }),
          fetch(`${API_BASE_URL}/me/reservations`, { headers })
        ]);

        const orders = await ordersRes.json();
        const reservations = await reservationsRes.json();

        setStats({
          orders: Array.isArray(orders) ? orders.length : 0,
          reservations: Array.isArray(reservations) ? reservations.length : 0
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.username}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <h3 className="text-lg font-semibold text-orange-700">Active Orders</h3>
          <p className="text-3xl font-bold text-orange-900 mt-2">0</p>
          <p className="text-sm text-orange-600 mt-1">Track your delivery</p>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-700">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-900 mt-2">{stats.orders}</p>
          <p className="text-sm text-blue-600 mt-1">Lifetime history</p>
        </div>

        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 className="text-lg font-semibold text-green-700">Reservations</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">{stats.reservations}</p>
          <p className="text-sm text-green-600 mt-1">Total bookings</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          {stats.orders === 0 && stats.reservations === 0 ? "No recent activity found." : "Check your orders and reservations tabs for details."}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;