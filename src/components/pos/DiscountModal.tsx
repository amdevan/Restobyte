import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiPercent, FiDollarSign } from 'react-icons/fi';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (type: 'fixed' | 'percentage', amount: number) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onApplyDiscount }) => {
  const [type, setType] = useState<'fixed' | 'percentage'>('percentage');
  const [amount, setAmount] = useState<string>('');

  const handleApply = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      alert('Please enter a valid discount amount.');
      return;
    }
    onApplyDiscount(type, numericAmount);
    onClose();
  };
  
  useEffect(() => {
    if(isOpen) {
        setType('percentage');
        setAmount('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
          <div className="flex space-x-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setType('percentage')}
              className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${
                type === 'percentage' ? 'bg-white text-sky-700 shadow' : 'text-gray-600'
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => setType('fixed')}
              className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${
                type === 'fixed' ? 'bg-white text-sky-700 shadow' : 'text-gray-600'
              }`}
            >
              Fixed Amount ($)
            </button>
          </div>
        </div>
        <Input
          label="Discount Value"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftIcon={type === 'percentage' ? <FiPercent /> : <FiDollarSign />}
          placeholder={type === 'percentage' ? 'e.g., 10' : 'e.g., 5.00'}
          autoFocus
        />
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply Discount</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountModal;
