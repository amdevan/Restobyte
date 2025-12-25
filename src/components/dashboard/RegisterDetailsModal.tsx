
import React, { useMemo, useState } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiXCircle, FiDollarSign, FiEdit, FiCheck } from 'react-icons/fi';

interface SummaryLineProps {
    label: string;
    value: string | number;
    className?: string;
}

const SummaryLine: React.FC<SummaryLineProps> = ({ label, value, className = '' }) => (
    <div className={`flex justify-between items-center py-2 border-b border-dashed border-gray-200 ${className}`}>
        <span className="text-gray-600">{label}</span>
        <span className="font-mono text-gray-800 font-medium">{value}</span>
    </div>
);

interface RegisterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RegisterDetailsModal: React.FC<RegisterDetailsModalProps> = ({ isOpen, onClose }) => {
    const { sales } = useRestaurantData();
    const today = new Date().toISOString().split('T')[0];

    // State for editable opening cash
    const [openingCash, setOpeningCash] = useState('0.00');
    const [isEditingOpeningCash, setIsEditingOpeningCash] = useState(false);

    const dailyData = useMemo(() => {
        const filteredSales = sales.filter(sale => sale.saleDate.startsWith(today));
        
        const paymentMethodBreakdown = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Other';
            acc[method] = (acc[method] || 0) + sale.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        const cashSales = paymentMethodBreakdown['Cash'] || 0;

        return {
            paymentMethodBreakdown,
            cashSales
        };
    }, [sales, today]);

    const expectedCash = useMemo(() => {
        return parseFloat(openingCash) + dailyData.cashSales;
    }, [openingCash, dailyData.cashSales]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Register Details for ${new Date(today + 'T00:00:00').toLocaleDateString()}`} size="md">
            <div className="space-y-6">
                
                {/* Cash Summary Section */}
                <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Cash Summary</h4>
                    <div className="space-y-1 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                            <span className="text-gray-600">Opening Cash</span>
                            {isEditingOpeningCash ? (
                                <div className="flex items-center space-x-2">
                                    <Input
                                        type="number"
                                        value={openingCash}
                                        onChange={(e) => setOpeningCash(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        className="w-28 text-right font-mono p-1"
                                        containerClassName="mb-0"
                                        autoFocus
                                    />
                                    <Button size="sm" className="p-1.5" onClick={() => setIsEditingOpeningCash(false)}><FiCheck size={14} /></Button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-gray-800 font-medium">${parseFloat(openingCash).toFixed(2)}</span>
                                    <Button size="sm" variant="outline" className="p-1.5" onClick={() => setIsEditingOpeningCash(true)}><FiEdit size={12}/></Button>
                                </div>
                            )}
                        </div>
                        <SummaryLine label="Cash Sales Today" value={`$${dailyData.cashSales.toFixed(2)}`} />
                        <SummaryLine label="Expected Cash in Drawer" value={`$${expectedCash.toFixed(2)}`} className="font-bold border-t-2 border-dashed !border-t-gray-400" />
                    </div>
                </div>

                {/* All Payments Breakdown */}
                <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Total Sales by Payment Method</h4>
                    <div className="space-y-1">
                        {Object.keys(dailyData.paymentMethodBreakdown).length > 0 ? (
                            Object.entries(dailyData.paymentMethodBreakdown).map(([method, amount]) => (
                                <SummaryLine key={method} label={method} value={`$${amount.toFixed(2)}`} />
                            ))
                         ) : (
                            <p className="text-gray-500 text-sm py-2 text-center">No sales recorded today.</p>
                         )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

export default RegisterDetailsModal;
