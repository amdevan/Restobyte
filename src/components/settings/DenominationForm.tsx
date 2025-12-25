
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Denomination } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiArchive, FiDollarSign } from 'react-icons/fi';

interface DenominationFormProps {
  initialData?: Denomination | null;
  onSubmit: (data: Omit<Denomination, 'id'>) => void;
  onUpdate: (data: Denomination) => void;
  onClose: () => void;
}

const DenominationForm: React.FC<DenominationFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState<string | number>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setValue(initialData.value);
    } else {
      setName('');
      setValue('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Denomination Name is required.');
      return;
    }
    const numericValue = parseFloat(String(value));
    if (isNaN(numericValue) || numericValue <= 0) {
      alert('Please enter a valid positive value.');
      return;
    }

    const denominationData = { name, value: numericValue };
    
    if (initialData) {
      onUpdate({ ...initialData, ...denominationData });
    } else {
      onSubmit(denominationData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Denomination Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., $100 Bill, Quarter Coin"
        required
        autoFocus
        leftIcon={<FiArchive />}
      />
      <Input
        label="Value *"
        type="number"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        placeholder="e.g., 100, 0.25"
        min="0.01"
        step="0.01"
        required
        leftIcon={<FiDollarSign />}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Denomination' : 'Save Denomination'}
        </Button>
      </div>
    </form>
  );
};

export default DenominationForm;
