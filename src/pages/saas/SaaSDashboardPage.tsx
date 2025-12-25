
import React from 'react';
import Card from '@/components/common/Card';
import { FiUsers, FiDollarSign, FiBarChart2, FiActivity } from 'react-icons/fi';

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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">SaaS Platform Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tenants" value="125" icon={<FiUsers size={24}/>} />
        <StatCard title="Monthly Recurring Revenue" value="$12,345" icon={<FiDollarSign size={24}/>} />
        <StatCard title="Active Subscriptions" value="110" icon={<FiActivity size={24}/>} />
        <StatCard title="Churn Rate" value="2.5%" icon={<FiBarChart2 size={24}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Tenant Signups">
          <p className="text-gray-600">A list of recently registered restaurants will appear here. (Coming Soon)</p>
        </Card>
        <Card title="Revenue Growth">
          <p className="text-gray-600">A chart showing MRR growth over time will be displayed here. (Coming Soon)</p>
        </Card>
      </div>
    </div>
  );
};

export default SaaSDashboardPage;
