
import React, { useState } from 'react';
import { Split, PartialPayment } from '../../types';
import Modal from '../common/Modal';
import { PaymentSection } from './PaymentSection';
import AddTipModal from './AddTipModal';

interface PaySplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    split: Split;
    onFinalizePayment: (splitId: string, payments: PartialPayment[], tip: number) => void;
}

const PaySplitModal: React.FC<PaySplitModalProps> = ({ isOpen, onClose, split, onFinalizePayment }) => {
    const [isTipModalOpen, setIsTipModalOpen] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);

    const handleApplyTip = (tip: number) => {
        setTipAmount(tip);
        setIsTipModalOpen(false);
    };

    const handleFinalize = (payments: PartialPayment[], isSettled: boolean) => {
        // For a single split, we assume it's settled if paid. `isSettled` here refers to the sub-payment.
        onFinalizePayment(split.id, payments, tipAmount);
    };

    const grandTotalWithTip = split.totalAmount + tipAmount;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Pay for Split ${split.id.slice(-4)}`}>
                <PaymentSection
                    grandTotal={grandTotalWithTip}
                    onFinalize={handleFinalize}
                    onAddTip={() => setIsTipModalOpen(true)}
                />
            </Modal>
            <AddTipModal
                isOpen={isTipModalOpen}
                onClose={() => setIsTipModalOpen(false)}
                onApplyTip={handleApplyTip}
                subTotal={split.subTotal}
            />
        </>
    );
};

export default PaySplitModal;
