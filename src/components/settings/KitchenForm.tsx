import React, { useState, useEffect, ChangeEvent } from 'react';
import { Kitchen } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiHome } from 'react-icons/fi'; // FiHome for kitchen icon

interface KitchenFormProps {
  initialData?: Kitchen | null;
  onSubmit: (data: Omit<Kitchen, 'id'>) => void;
  onUpdate: (data: Kitchen) => void;
  onClose: () => void;
}

const KitchenForm: React.FC<KitchenFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Kitchen Name is required.');
      return;
    }
    const kitchenData = { name };
    if (initialData) {
      onUpdate({ ...initialData, ...kitchenData });
    } else {
      onSubmit(kitchenData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Kitchen Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Main Kitchen, Pasta Station, Grill"
        required
        autoFocus
        leftIcon={<FiHome />}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Kitchen' : 'Save Kitchen'}
        </Button>
      </div>
    </form>
  );
};

export default KitchenForm;
