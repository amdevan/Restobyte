
import React, { useState, useMemo } from 'react';
import { Split, PartialPayment } from '../../../types';
import Button from '../../common/Button';
import Input from '../../common/Input';
import SubBillCard from '../SubBillCard';
import PaySplitModal from '../PaySplitModal';
import { FiArrowLeft, FiCheckCircle, FiUsers, FiShuffle } from 'react-icons/fi';

interface EqualSplitViewProps {
    grandTotal: number;
    onFinalize: (splits: Split[]) => void;
    onBack: () => void;
}

const EqualSplitView: React.FC<EqualSplitViewProps> = ({ grandTotal, onFinalize, onBack }) => {
    const [numberOfSplits, setNumberOfSplits] = useState('2');
    const [splits, setSplits] = useState<Split[]>([]);
    const [payingSplit, setPayingSplit] = useState<Split | null>(null);

    const handleGenerateSplits = () => {
        const numSplits = parseInt(numberOfSplits, 10);
        if (isNaN(numSplits) || numSplits <= 1) {
            alert('Please enter a valid number of splits (2 or more).');
            return;
        }

        const amountPerSplit = grandTotal / numSplits;
        const newSplits: Split[] = Array.from({ length: numSplits }, (_, i) => ({
            id: `equal-${Date.now()}-${i}`,
            description: `Equal Share (1 of ${numSplits})`,
            subTotal: amountPerSplit, // For simplicity, we can treat the whole amount as subtotal for this view
            taxAmount: 0, // Tax is included in the equal split amount
            totalAmount: amountPerSplit,
            isPaid: false,
            payments: [],
            tipAmount: 0
        }));
        setSplits(newSplits);
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
    
    const canFinalize = splits.length > 0 && splits.every(s => s.isPaid);

    return (
        <div className="flex flex-col" style={{ minHeight: '50vh' }}>
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4 self-start" leftIcon={<FiArrowLeft />}>
                Back to Split Options
            </Button>
            {payingSplit && <PaySplitModal isOpen={!!payingSplit} onClose={() => setPayingSplit(null)} split={payingSplit} onFinalizePayment={handleFinalizeSplitPayment} />}

            <div className="flex items-end space-x-2 mb-4 p-3 border rounded-lg bg-gray-50">
                <Input
                    label="Split bill how many ways?"
                    type="number"
                    value={numberOfSplits}
                    onChange={e => setNumberOfSplits(e.target.value)}
                    min="2"
                    step="1"
                    leftIcon={<FiUsers />}
                    containerClassName="mb-0 flex-grow"
                    autoFocus
                />
                <Button onClick={handleGenerateSplits} leftIcon={<FiShuffle />}>Generate Splits</Button>
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden">
                <h3 className="text-lg font-semibold mb-2 px-2">Splits ({splits.length})</h3>
                {splits.length > 0 ? (
                    <div className="flex-grow flex space-x-4 pb-2 overflow-x-auto custom-scrollbar px-2">
                        {splits.map(split => (
                            <SubBillCard key={split.id} split={split} onPay={handlePayForSplit} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-gray-400 text-center p-4 border-2 border-dashed rounded-lg">
                        Enter the number of ways to split and click "Generate Splits".
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

export default EqualSplitView;
