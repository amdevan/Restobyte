
import React, { useState, useMemo } from 'react';
import { SaleItem, SaleTaxDetail, Split, PartialPayment } from '../../../types';
import Button from '../../common/Button';
import UnassignedItemsPanel from '../UnassignedItemsPanel';
import SubBillCard from '../SubBillCard';
import MoveItemModal from '../MoveItemModal';
import PaySplitModal from '../PaySplitModal';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

interface ItemSplitViewProps {
    orderItems: SaleItem[];
    subTotal: number;
    taxes: SaleTaxDetail[];
    onFinalize: (splits: Split[]) => void;
    onBack: () => void;
}

const ItemSplitView: React.FC<ItemSplitViewProps> = ({ orderItems, subTotal, taxes, onFinalize, onBack }) => {
    const [unassignedItems, setUnassignedItems] = useState<SaleItem[]>(orderItems);
    const [splits, setSplits] = useState<Split[]>([]);
    
    const [movingItem, setMovingItem] = useState<{ item: SaleItem, targetSplitId: string } | null>(null);
    const [payingSplit, setPayingSplit] = useState<Split | null>(null);

    const taxRate = useMemo(() => subTotal > 0 ? taxes.reduce((sum, t) => sum + t.amount, 0) / subTotal : 0, [subTotal, taxes]);

    const handleAddSplit = () => {
        const newSplit: Split = {
            id: `split-${Date.now()}`,
            items: [],
            subTotal: 0,
            taxAmount: 0,
            totalAmount: 0,
            isPaid: false,
            payments: [],
            tipAmount: 0,
        };
        setSplits(prev => [...prev, newSplit]);
    };

    const handleMoveItem = (itemToMove: SaleItem, targetSplitId: string, quantity: number) => {
        // Remove quantity from unassigned
        setUnassignedItems(prev => {
            const existing = prev.find(item => item.id === itemToMove.id && item.notes === itemToMove.notes);
            if (existing) {
                if (existing.quantity - quantity > 0) {
                    return prev.map(item => item.id === existing.id && item.notes === existing.notes ? { ...item, quantity: item.quantity - quantity } : item);
                } else {
                    return prev.filter(item => !(item.id === existing.id && item.notes === existing.notes));
                }
            }
            return prev;
        });

        // Add quantity to target split
        setSplits(prevSplits => prevSplits.map(split => {
            if (split.id === targetSplitId) {
                const newSplit = { ...split };
                const existingItem = newSplit.items.find(item => item.id === itemToMove.id && item.notes === itemToMove.notes);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    newSplit.items.push({ ...itemToMove, quantity });
                }
                
                // Recalculate totals
                newSplit.subTotal = newSplit.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                newSplit.taxAmount = newSplit.subTotal * taxRate;
                newSplit.totalAmount = newSplit.subTotal + newSplit.taxAmount;

                return newSplit;
            }
            return split;
        }));
    };

    const handleInitiateMove = (item: SaleItem, targetSplitId: string) => {
        if (item.quantity > 1) {
            setMovingItem({ item, targetSplitId });
        } else {
            handleMoveItem(item, targetSplitId, 1);
        }
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

    const canFinalize = unassignedItems.length === 0 && splits.every(s => s.isPaid) && splits.length > 0;

    return (
        <div className="flex flex-col" style={{ minHeight: '65vh' }}>
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4 self-start" leftIcon={<FiArrowLeft />}>
                Back to Split Options
            </Button>
            {movingItem && <MoveItemModal isOpen={!!movingItem} onClose={() => setMovingItem(null)} item={movingItem.item} onMove={(qty) => { handleMoveItem(movingItem.item, movingItem.targetSplitId, qty); setMovingItem(null); }} />}
            {payingSplit && <PaySplitModal isOpen={!!payingSplit} onClose={() => setPayingSplit(null)} split={payingSplit} onFinalizePayment={handleFinalizeSplitPayment} />}
            
            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="mb-4 p-2 border rounded-lg bg-gray-50">
                    <UnassignedItemsPanel items={unassignedItems} splits={splits} onMoveItem={handleInitiateMove} onAddSplit={handleAddSplit} />
                </div>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <h3 className="text-lg font-semibold mb-2 px-2">Splits ({splits.length})</h3>
                    <div className="flex-grow flex space-x-4 pb-2 overflow-x-auto custom-scrollbar px-2">
                        {splits.map(split => (
                            <SubBillCard key={split.id} split={split} onPay={handlePayForSplit} />
                        ))}
                        {splits.length === 0 && (
                            <div className="flex-grow flex items-center justify-center text-gray-400">
                                <p>Click "Add New Split" to start.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 mt-4 pt-4 border-t flex justify-end">
                <Button variant="primary" onClick={() => onFinalize(splits)} disabled={!canFinalize} leftIcon={<FiCheckCircle/>}>
                    Finalize Sale
                </Button>
            </div>
        </div>
    );
};

export default ItemSplitView;
