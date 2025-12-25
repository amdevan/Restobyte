
import React, { useState, useMemo } from 'react';
import { Split, PartialPayment } from '../../../types';
import Button from '../../common/Button';
import Input from '../../common/Input';
import SubBillCard from '../SubBillCard';
import PaySplitModal from '../PaySplitModal';
import { FiArrowLeft, FiCheckCircle, FiDollarSign } from 'react-icons/fi';

interface CustomSplitViewProps {
    grandTotal: number;
    onFinalize: (splits: Split[]) => void;
    onBack: () => void;
}

const CustomSplitView: React.FC<CustomSplitViewProps> = ({ grandTotal, onFinalize, onBack }) => {
    const [customAmount, setCustomAmount] = useState('');
    const [splits, setSplits] = useState<Split[]>([]);
    const [payingSplit, setPayingSplit] = useState<Split | null>(null);

    const totalAssignedAmount = useMemo(() => {
        return splits.reduce((sum, split) => sum + split.totalAmount, 0);
    }, [splits]);

    const remainingAmount = grandTotal - totalAssignedAmount;

    const handleAddSplit = () => {
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }
        if (amount > remainingAmount + 0.001) { // Add tolerance for floating point
            alert(`Amount cannot be greater than the remaining due of $${remainingAmount.toFixed(2)}.`);
            return;
        }

        const newSplit: Split = {
            id: `custom-${Date.now()}`,
            description: `Custom Amount`,
            subTotal: amount,
            taxAmount: 0,
            totalAmount: amount,
            isPaid: false,
            payments: [],
            tipAmount: 0,
        };
        setSplits(prev => [...prev, newSplit]);
        setCustomAmount('');
    };

    const handlePayForSplit = (split: Split) => {
        setPayingSplit(split);
    };

    const handleFinalizeSplitPayment = (splitId: string, payments: PartialPayment[], tip: number) => {
        setSplits(prev => prev.map(split => {
            if (split.id === splitId) {
                return { ...split, isPaid: true, payments, tipAmount: tip };
            }
            return split;
        }));
        setPayingSplit(null);
    };
    
    const canFinalize = remainingAmount < 0.01 && splits.every(s => s.isPaid) && splits.length > 0;

    return (
        <div className="flex flex-col" style={{ minHeight: '50vh' }}>
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4 self-start" leftIcon={<FiArrowLeft />}>
                Back to Split Options
            </Button>
            {payingSplit && <PaySplitModal isOpen={!!payingSplit} onClose={() => setPayingSplit(null)} split={payingSplit} onFinalizePayment={handleFinalizeSplitPayment} />}

            <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-end space-x-2 mb-2">
                    <Input
                        label="Amount for New Split"
                        type="number"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        leftIcon={<FiDollarSign />}
                        containerClassName="mb-0 flex-grow"
                        autoFocus
                    />
                    <Button onClick={handleAddSplit} disabled={remainingAmount <= 0}>Add Split</Button>
                </div>
                <p className="text-sm font-semibold text-right">
                    Remaining Amount: <span className="text-red-600">${remainingAmount.toFixed(2)}</span>
                </p>
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden mt-4">
                <h3 className="text-lg font-semibold mb-2 px-2">Splits ({splits.length})</h3>
                {splits.length > 0 ? (
                    <div className="flex-grow flex space-x-4 pb-2 overflow-x-auto custom-scrollbar px-2">
                        {splits.map(split => (
                            <SubBillCard key={split.id} split={split} onPay={handlePayForSplit} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-gray-400 text-center p-4 border-2 border-dashed rounded-lg">
                        Enter an amount and click "Add Split" to begin.
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 mt-4 pt-4 border-t flex justify-end">
                <Button variant="primary" onClick={() => onFinalize(splits)} disabled={!canFinalize} leftIcon={<FiCheckCircle/>}>
                    Finalize Sale
                </Button>
            </div>
        </div>
    );
};

export default CustomSplitView;
