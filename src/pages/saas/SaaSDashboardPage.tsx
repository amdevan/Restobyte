
import React, { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import { FiUsers, FiDollarSign, FiBarChart2, FiActivity } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';
import BarChart from '@/components/common/BarChart';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="shadow-lg">
        <div className="flex items-center p-4">
            <div className="p-3 rounded-full bg-sky-100 text-sky-600 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    </Card>
);

const SaaSDashboardPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/tenants`);
        const data = await res.json();
        setTenants(Array.isArray(data.tenants) ? data.tenants : []);
      } catch {
        setError('Failed to load tenants');
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(o => o.subscriptionStatus === 'active').length;
  
  // Calculate MRR
  const PLAN_PRICES: Record<string, number> = { Basic: 29, Pro: 59 };
  const mrr = tenants.reduce((sum, t) => {
    if (t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trialing') {
      const p = PLAN_PRICES[t.plan] ?? 0;
      return sum + p;
    }
    return sum;
  }, 0);

  // Churn Rate (Mock calculation as we don't have historical data easily accessible)
  const churnRate = "0.0%"; 

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">SaaS Platform Overview</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="text-gray-500 text-sm">Loading metrics...</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tenants" value={totalTenants.toString()} icon={<FiUsers size={24}/>} />
        <StatCard title="Monthly Recurring Revenue" value={`$${mrr.toFixed(2)}`} icon={<FiDollarSign size={24}/>} />
        <StatCard title="Active Subscriptions" value={activeTenants.toString()} icon={<FiActivity size={24}/>} />
        <StatCard title="Churn Rate" value={churnRate} icon={<FiBarChart2 size={24}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Tenant Signups">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                     <tr>
                         <th className="px-4 py-3">Restaurant</th>
                         <th className="px-4 py-3">Plan</th>
                         <th className="px-4 py-3">Date</th>
                         <th className="px-4 py-3">Status</th>
                     </tr>
                 </thead>
                 <tbody>
                     {recentTenants.length > 0 ? recentTenants.map(tenant => (
                         <tr key={tenant.id} className="bg-white border-b hover:bg-gray-50">
                             <td className="px-4 py-3 font-medium text-gray-900">{tenant.name}</td>
                             <td className="px-4 py-3">{tenant.plan}</td>
                             <td className="px-4 py-3">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}</td>
                             <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                                    tenant.subscriptionStatus === 'trialing' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {tenant.subscriptionStatus}
                                </span>
                             </td>
                         </tr>
                     )) : (
                        <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-gray-500">No tenants found.</td>
                        </tr>
                     )}
                 </tbody>
             </table>
          </div>
        </Card>
        <Card title="Signups Per Week">
          <SignupChart />
        </Card>
      </div>
    </div>
  );
};

const SignupChart: React.FC = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [counts, setCounts] = useState<number[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const run = async () => {
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/signups-weekly?weeks=8`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setLabels(data.labels || []);
        setCounts(data.counts || []);
      } catch {
        setError('Failed to load signups');
      }
    };
    run();
  }, []);
  const chartData = labels.map((l, i) => ({ label: l, value: counts[i] || 0 }));
  return (
    <div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <BarChart data={chartData} />
    </div>
  );
};

export default SaaSDashboardPage;
