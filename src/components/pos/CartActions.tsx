
import React from 'react';
import Button from '../common/Button';
import { FiArrowRight, FiSend } from 'react-icons/fi';

interface CartActionsProps {
  onGoToPayment: () => void;
  onSendKot: () => void;
  isCartEmpty: boolean;
  hasNewItems: boolean;
}

const CartActions: React.FC<CartActionsProps> = ({ onGoToPayment, onSendKot, isCartEmpty, hasNewItems }) => {
  return (
    <div className="mt-4 grid grid-cols-5 gap-2">
       <Button
        variant="secondary"
        className="col-span-2"
        onClick={onSendKot}
        disabled={!hasNewItems || isCartEmpty}
        leftIcon={<FiSend size={14}/>}
      >
        Send KOT
      </Button>
      <Button 
        className="w-full col-span-3 !text-lg !py-3 bg-green-600 hover:bg-green-700 focus:ring-green-500" 
        onClick={onGoToPayment} 
        disabled={isCartEmpty}
        rightIcon={<FiArrowRight />}
      >
        Payment
      </Button>
    </div>
  );
};

export default CartActions;
