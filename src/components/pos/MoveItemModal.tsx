
import React, { useState } from 'react';
import { SaleItem } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SaleItem;
  onMove: (quantity: number) => void;
}

const MoveItemModal: React.FC<MoveItemModalProps> = ({ isOpen, onClose, item, onMove }) => {
  const [quantity, setQuantity] = useState('1');

  const handleMove = () => {
    const numQty = parseInt(quantity, 10);
    if (!isNaN(numQty) && numQty > 0 && numQty <= item.quantity) {
      onMove(numQty);
    } else {
      alert(`Please enter a valid quantity between 1 and ${item.quantity}.`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Move ${item.name}`} size="sm">
      <div className="space-y-4">
        <p>How many of the {item.quantity} available items do you want to move?</p>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          max={item.quantity}
          autoFocus
        />
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMove}>Move</Button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveItemModal;
