

import React, { useMemo } from 'react';
import { Expense, Purchase, Sale } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { FiShoppingCart, FiTruck, FiShoppingBag, FiArrowRight, FiActivity, FiBox, FiCreditCard, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Money from '../common/Money';

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
    purchases?: Purchase[];
    expenses?: Expense[];
    lowStockCount?: number;
}

type ActivityItem = {
    id: string;
    type: 'sale' | 'payment' | 'purchase' | 'expense' | 'lowStock';
    title: string;
    subtitle: string;
    amount?: number;
    date: string;
    orderType?: string;
};

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ sales, purchases = [], expenses = [], lowStockCount = 0 }) => {
    const navigate = useNavigate();

    const items: ActivityItem[] = useMemo(() => {
        const rows: ActivityItem[] = [];

        sales.slice(0, 5).forEach(sale => {
            const hasPartial = Array.isArray(sale.partialPayments) && sale.partialPayments.length > 0;
            if (hasPartial) {
                const totalReceived = sale.partialPayments!.reduce((sum, p) => sum + p.amount, 0);
                const methods = Array.from(new Set(sale.partialPayments!.map(p => p.method))).join(', ');
                rows.push({
                    id: sale.id,
                    type: 'payment',
                    title: 'Payment Received',
                    subtitle: methods ? `Via ${methods}` : 'Payment recorded',
                    amount: totalReceived,
                    date: sale.saleDate,
                    orderType: sale.orderType,
                });
                return;
            }
            rows.push({
                id: sale.id,
                type: 'sale',
                title: 'New Sale',
                subtitle: sale.customerName ? `For ${sale.customerName}` : 'Walk-in customer',
                amount: sale.totalAmount,
                date: sale.saleDate,
                orderType: sale.orderType,
            });
        });

        purchases.slice(0, 3).forEach(p => {
            rows.push({
                id: p.id,
                type: 'purchase',
                title: 'Purchase Added',
                subtitle: p.purchaseNumber ? p.purchaseNumber : (p.supplierName ? `Supplier: ${p.supplierName}` : 'Inventory purchase'),
                amount: p.grandTotalAmount,
                date: p.date,
            });
        });

        expenses.slice(0, 3).forEach(e => {
            rows.push({
                id: e.id,
                type: 'expense',
                title: 'Expense Added',
                subtitle: e.categoryName ? e.categoryName : 'Expense',
                amount: e.amount,
                date: e.date,
            });
        });

        if (lowStockCount > 0) {
            rows.push({
                id: 'low-stock',
                type: 'lowStock',
                title: 'Low Stock Alert',
                subtitle: `${lowStockCount} items need restock`,
                date: new Date().toISOString(),
            });
        }

        return rows
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);
    }, [sales, purchases, expenses, lowStockCount]);

    const iconFor = (item: ActivityItem) => {
        if (item.type === 'payment') return <FiCreditCard className="text-emerald-600" />;
        if (item.type === 'purchase') return <FiBox className="text-indigo-600" />;
        if (item.type === 'expense') return <FiCreditCard className="text-orange-600" />;
        if (item.type === 'lowStock') return <FiAlertTriangle className="text-rose-600" />;
        return getOrderTypeIcon(item.orderType ?? 'dine in');
    };

    const badgeBgFor = (item: ActivityItem) => {
        if (item.type === 'payment') return 'bg-emerald-50';
        if (item.type === 'purchase') return 'bg-indigo-50';
        if (item.type === 'expense') return 'bg-orange-50';
        if (item.type === 'lowStock') return 'bg-rose-50';
        return 'bg-emerald-50';
    };

    return (
        <Card
            title="Recent Activity"
            icon={<FiActivity className="text-gray-700" />}
            className="flex flex-col h-full !shadow-sm border border-gray-200/70 rounded-2xl"
            actions={
                <Button
                    variant="outline"
                    size="sm"
                    className="!px-3 !py-1 !text-xs"
                    onClick={() => navigate('/app/sale')}
                >
                    View All
                </Button>
            }
        >
            <div className="flex-grow">
                {items.length > 0 ? (
                    <ul className="space-y-3">
                        {items.map(item => (
                            <li
                                key={`${item.type}-${item.id}`}
                                className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition-colors"
                            >
                                <div className={`p-2.5 rounded-xl ${badgeBgFor(item)} ring-1 ring-gray-200/60`}>
                                    {iconFor(item)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.title}</p>
                                        <p className="text-[11px] text-gray-500 flex-shrink-0">{timeSince(item.date)}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                                </div>
                                {typeof item.amount === 'number' && (
                                    <span className={`text-sm font-semibold tabular-nums ${item.type === 'sale' || item.type === 'payment' ? 'text-emerald-600' : 'text-gray-800'}`}>
                                        {item.type === 'sale' || item.type === 'payment' ? '+' : '-'}
                                        <Money amount={item.amount} />
                                    </span>
                                )}
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
                    View All Activity
                </Button>
            </div>
        </Card>
    );
};

export default RecentActivityCard;
