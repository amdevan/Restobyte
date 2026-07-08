
import React, { useState } from 'react';
import { PartialPayment, SaleItem, SaleTaxDetail, Split } from '../../types';
import Modal from '../common/Modal';
import { PaymentSection } from './PaymentSection';
import AddTipModal from './AddTipModal';
import SplitBillInterface from './SplitBillInterface';
import Button from '../common/Button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: SaleItem[];
  subTotal: number;
  grandTotal: number;
  taxes: SaleTaxDetail[];
  onFinalizeSale: (details: {
    payments: PartialPayment[];
    tip: number;
    isSettled: boolean;
    splitDetails?: Split[];
    receivedAmount: number;
    returnAmount: number;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  const { 
    isOpen, onClose, orderItems, subTotal, grandTotal, taxes, onFinalizeSale 
  } = props;

  const [view, setView] = useState<'full' | 'split'>('full');
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  const handleApplyTip = (tip: number) => {
    setTipAmount(tip);
    setIsTipModalOpen(false);
  };
  
  const handleFinalizeFullPayment = (payments: PartialPayment[], isSettled: boolean, receivedAmount: number, returnAmount: number) => {
    onFinalizeSale({ payments, tip: tipAmount, isSettled, receivedAmount, returnAmount });
  };

  const handleFinalizeSplitPayment = (splitDetails: Split[]) => {
    // For split payments, the individual payments and tips are contained within the splitDetails objects.
    const allPayments = splitDetails.flatMap(s => s.payments);
    const totalTip = splitDetails.reduce((sum, s) => sum + s.tipAmount, 0);
    const totalPaid = allPayments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : Number(p.amount)), 0);
    const calculatedReturnAmount = Math.max(0, totalPaid - (grandTotal + totalTip));
    onFinalizeSale({
        payments: allPayments,
        tip: totalTip,
        isSettled: true, // Split bill is only finalized when fully paid
        splitDetails: splitDetails,
        receivedAmount: totalPaid,
        returnAmount: calculatedReturnAmount,
    });
  };

  const grandTotalWithTip = grandTotal + tipAmount;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Payment`} size={view === 'split' ? '2xl' : '2xl'}>
         <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4 max-w-sm mx-auto">
             <Button variant={view === 'full' ? 'primary' : 'secondary'} className="w-full" onClick={() => setView('full')}>Full Payment</Button>
             <Button variant={view === 'split' ? 'primary' : 'secondary'} className="w-full" onClick={() => setView('split')}>Split Bill</Button>
         </div>
         {view === 'full' ? (
             <PaymentSection
                grandTotal={grandTotalWithTip}
                onFinalize={handleFinalizeFullPayment}
                onAddTip={() => setIsTipModalOpen(true)}
              />
         ) : (
             <SplitBillInterface
                orderItems={orderItems}
                subTotal={subTotal}
                taxes={taxes}
                grandTotal={grandTotal}
                onFinalize={handleFinalizeSplitPayment}
                onClose={onClose} 
             />
         )}

      </Modal>
      {/* Tip modal is separate so it can overlay the payment modal if needed */}
      <AddTipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        onApplyTip={handleApplyTip}
        subTotal={subTotal}
      />
    </>
  );
};

export default PaymentModal;
