

import React from 'react';
import { Sale } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { FiShoppingCart, FiTruck, FiShoppingBag, FiArrowRight, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};

const getOrderTypeIcon = (orderType: string) => {
    if (orderType.toLowerCase().includes('delivery')) return <FiTruck className="text-orange-500" />;
    if (orderType.toLowerCase().includes('pickup')) return <FiShoppingBag className="text-purple-500" />;
    return <FiShoppingCart className="text-blue-500" />; // Dine In
};

interface RecentActivityCardProps {
    sales: Sale[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ sales }) => {
    const navigate = useNavigate();
    const recentSales = sales.slice(0, 5); // Get last 5 sales

    return (
        <Card title="Recent Activity" icon={<FiActivity className="text-gray-700"/>} className="flex flex-col h-full shadow-lg">
            <div className="flex-grow">
                {recentSales.length > 0 ? (
                    <ul className="space-y-4">
                        {recentSales.map(sale => (
                            <li key={sale.id} className="flex items-center space-x-3">
                                <div className="p-2.5 bg-gray-100 rounded-full">
                                    {getOrderTypeIcon(sale.orderType)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                        Sale for <span className="font-semibold">{sale.customerName || 'Walk-in'}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {timeSince(sale.saleDate)}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                    +${sale.totalAmount.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full py-8">
                        <FiShoppingCart size={32} className="mb-2 text-gray-400" />
                        <p className="text-sm">No recent activity in the selected period.</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/app/sale')}
                    rightIcon={<FiArrowRight />}
                >
                    View All Sales
                </Button>
            </div>
        </Card>
    );
};

export default RecentActivityCard;