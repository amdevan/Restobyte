import React, { useMemo } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FiXCircle, FiDollarSign, FiShoppingCart, FiTag, FiCreditCard } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';

interface SummaryLineProps {
    label: string;
    value: string | number;
    icon?: React.ReactElement<IconBaseProps>;
    isTotal?: boolean;
    className?: string;
}

const SummaryLine: React.FC<SummaryLineProps> = ({ label, value, icon, isTotal = false, className = '' }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-dashed font-bold text-lg' : 'border-b border-dashed border-gray-200'} ${className}`}>
        <span className="flex items-center text-gray-600">
            {icon && React.cloneElement(icon, { className: "mr-2 text-sky-600", size: 16 })}
            {label}
        </span>
        <span className={`font-medium ${isTotal ? 'text-xl' : ''}`}>{value}</span>
    </div>
);

interface TodaySummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TodaySummaryModal: React.FC<TodaySummaryModalProps> = ({ isOpen, onClose }) => {
    const { sales } = useRestaurantData();
    const today = new Date().toISOString().split('T')[0];

    const dailyData = useMemo(() => {
        const filteredSales = sales.filter(sale => sale.saleDate.startsWith(today));

        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const orderCount = filteredSales.length;

        const paymentMethodBreakdown = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Other';
            acc[method] = (acc[method] || 0) + sale.totalAmount;
            return acc;
        }, {} as Record<string, number>);
        
        const orderTypeBreakdown = filteredSales.reduce((acc, sale) => {
            const type = sale.orderType || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSales,
            orderCount,
            paymentMethodBreakdown,
            orderTypeBreakdown
        };
    }, [sales, today]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Summary for ${new Date(today + 'T00:00:00').toLocaleDateString()}`} size="md">
            <div className="space-y-4">
                <div className="bg-sky-50 p-4 rounded-lg">
                    <SummaryLine label="Total Sales" value={`$${dailyData.totalSales.toFixed(2)}`} icon={<FiDollarSign />} isTotal />
                    <SummaryLine label="Total Orders" value={dailyData.orderCount} icon={<FiShoppingCart />} className="border-none"/>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Sales by Payment Method</h4>
                    <div className="space-y-1">
                        {Object.keys(dailyData.paymentMethodBreakdown).length > 0 ? (
                            Object.entries(dailyData.paymentMethodBreakdown).map(([method, amount]) => (
                                <SummaryLine key={method} label={method} value={`$${amount.toFixed(2)}`} icon={<FiCreditCard />} />
                            ))
                         ) : (
                            <p className="text-gray-500 text-sm py-2 text-center">No sales recorded today.</p>
                         )}
                    </div>
                </div>

                 <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2 mt-4">Orders by Type</h4>
                    <div className="space-y-1">
                        {Object.keys(dailyData.orderTypeBreakdown).length > 0 ? (
                            Object.entries(dailyData.orderTypeBreakdown).map(([type, count]) => (
                                <SummaryLine key={type} label={type} value={`${count} Orders`} icon={<FiTag />} />
                            ))
                         ) : (
                            <p className="text-gray-500 text-sm py-2 text-center">No orders recorded today.</p>
                         )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TodaySummaryModal;
