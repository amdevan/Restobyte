
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Waiter } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiUser } from 'react-icons/fi';

interface WaiterFormProps {
  initialData?: Waiter | null;
  onSubmit: (data: Omit<Waiter, 'id'>) => void;
  onUpdate: (data: Waiter) => void;
  onClose: () => void;
}

const WaiterForm: React.FC<WaiterFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmployeeId(initialData.employeeId || '');
      setPhone(initialData.phone || '');
    } else {
      setName('');
      setEmployeeId('');
      setPhone('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Waiter Name is required.');
      return;
    }
    const waiterData = { 
        name, 
        employeeId: employeeId.trim() || undefined,
        phone: phone.trim() || undefined,
    };
    if (initialData) {
      onUpdate({ ...initialData, ...waiterData });
    } else {
      onSubmit(waiterData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Waiter Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., John Doe"
        required
        autoFocus
        leftIcon={<FiUser />}
      />
      <Input
        label="Employee ID (Optional)"
        value={employeeId}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmployeeId(e.target.value)}
        placeholder="e.g., EMP001"
        leftIcon={<FiUser />}
      />
      <Input
        label="Phone Number (Optional)"
        type="tel"
        value={phone}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
        placeholder="e.g., +1-555-123-4567"
        leftIcon={<FiUser />}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Waiter' : 'Save Waiter'}
        </Button>
      </div>
    </form>
  );
};

export default WaiterForm;