
import React, { memo } from 'react';
import Button from '../common/Button';
import { FiArrowRight, FiSend, FiRefreshCw } from 'react-icons/fi';

interface CartActionsProps {
  onGoToPayment: () => void;
  onSendKot: () => void;
  isCartEmpty: boolean;
  hasNewItems: boolean;
  hasModifiedItems?: boolean;
}

const CartActions: React.FC<CartActionsProps> = ({ onGoToPayment, onSendKot, isCartEmpty, hasNewItems, hasModifiedItems }) => {
  const showUpdateKot = hasModifiedItems && !hasNewItems;
  return (
    <div className="rb-cart-actions mt-4">
       <Button
        variant={showUpdateKot ? 'primary' : 'secondary'}
        className="rb-cart-actions-kot"
        onClick={onSendKot}
        disabled={!hasNewItems && !hasModifiedItems || isCartEmpty}
        leftIcon={showUpdateKot ? <FiRefreshCw size={14}/> : <FiSend size={14}/>}
      >
        {showUpdateKot ? 'Update KOT' : 'Send KOT'}
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

export default memo(CartActions);
