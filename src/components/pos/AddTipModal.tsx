
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiDollarSign } from 'react-icons/fi';

interface AddTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTip: (tip: number) => void;
  subTotal: number; // To calculate percentages
}

const AddTipModal: React.FC<AddTipModalProps> = ({ isOpen, onClose, onApplyTip, subTotal }) => {
  const [tipAmount, setTipAmount] = useState('');

  const handleApply = () => {
    const numericTip = parseFloat(tipAmount);
    if (!isNaN(numericTip) && numericTip >= 0) {
      onApplyTip(numericTip);
      onClose();
    } else {
      alert('Please enter a valid tip amount.');
    }
  };
  
  const handlePercentageClick = (percentage: number) => {
      const calculatedTip = subTotal * (percentage / 100);
      setTipAmount(calculatedTip.toFixed(2));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Tip">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => handlePercentageClick(10)}>10%</Button>
            <Button variant="outline" onClick={() => handlePercentageClick(15)}>15%</Button>
            <Button variant="outline" onClick={() => handlePercentageClick(20)}>20%</Button>
        </div>
        <Input
          label="Custom Tip Amount"
          type="number"
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
          leftIcon={<FiDollarSign />}
          placeholder="e.g., 5.00"
          autoFocus
          step="0.01"
          min="0"
        />
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply Tip</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTipModal;
