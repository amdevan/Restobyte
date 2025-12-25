import React, { useState, useEffect } from 'react';
import { SaleItem } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FiSave, FiXCircle } from 'react-icons/fi';

interface ItemNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SaleItem & { lineId: string } | null;
  onSave: (lineId: string, newNote: string) => void;
}

const ItemNoteModal: React.FC<ItemNoteModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setNote(item.notes || '');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    onSave(item.lineId, note);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Note for ${item.name}`} size="sm">
      <div className="space-y-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., No onions, extra spicy, allergy note..."
          autoFocus
        />
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>Cancel</Button>
          <Button onClick={handleSave} leftIcon={<FiSave />}>Save Note</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemNoteModal;