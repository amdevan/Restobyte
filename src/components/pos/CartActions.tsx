
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
    <div className="rb-cart-actions mt-4">
       <Button
        variant="secondary"
        className="rb-cart-actions-kot"
        onClick={onSendKot}
        disabled={!hasNewItems || isCartEmpty}
        leftIcon={<FiSend size={14}/>}
      >
        Send KOT
      </Button>
      <Button
        variant="success"
        className="rb-cart-actions-pay"
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
