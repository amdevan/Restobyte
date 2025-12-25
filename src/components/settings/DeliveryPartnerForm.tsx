import React, { useState, useEffect, ChangeEvent } from 'react';
import { DeliveryPartner } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiTruck, FiPercent } from 'react-icons/fi';

interface DeliveryPartnerFormProps {
  initialData?: DeliveryPartner | null;
  onSubmit: (data: Omit<DeliveryPartner, 'id'>) => void;
  onUpdate: (data: DeliveryPartner) => void;
  onClose: () => void;
}

const DeliveryPartnerForm: React.FC<DeliveryPartnerFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [commissionRate, setCommissionRate] = useState<string | number>('');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCommissionRate(initialData.commissionRate || '');
      setIsEnabled(initialData.isEnabled);
    } else {
      setName('');
      setCommissionRate('');
      setIsEnabled(true);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Partner Name is required.');
      return;
    }

    const numericCommission = commissionRate ? parseFloat(String(commissionRate)) : undefined;
    if (commissionRate && (isNaN(numericCommission) || numericCommission < 0 || numericCommission > 100)) {
        alert("Please enter a valid commission rate between 0 and 100, or leave it blank.");
        return;
    }

    const partnerData = { 
        name, 
        commissionRate: numericCommission,
        isEnabled
    };

    if (initialData) {
      onUpdate({ ...initialData, ...partnerData });
    } else {
      onSubmit(partnerData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Partner Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Uber Eats, DoorDash"
        required
        autoFocus
        leftIcon={<FiTruck />}
      />
      <Input
        label="Commission Rate (%) (Optional)"
        type="number"
        value={commissionRate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCommissionRate(e.target.value)}
        placeholder="e.g., 15"
        min="0"
        max="100"
        step="0.01"
        leftIcon={<FiPercent />}
      />
      
      <div className="flex items-center">
        <input
          id="isPartnerEnabled"
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
        />
        <label htmlFor="isPartnerEnabled" className="ml-2 block text-sm text-gray-900">
          Enable this partner
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Partner' : 'Save Partner'}
        </Button>
      </div>
    </form>
  );
};

export default DeliveryPartnerForm;
