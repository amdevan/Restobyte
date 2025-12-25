

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Customer } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiBriefcase, FiHash } from 'react-icons/fi';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
  onUpdate: (data: Customer) => void;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState(''); // Date of Birth YYYY-MM-DD
  const [companyName, setCompanyName] = useState('');
  const [vatPan, setVatPan] = useState('');


  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setDob(initialData.dob || '');
      setCompanyName(initialData.companyName || '');
      setVatPan(initialData.vatPan || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDob('');
      setCompanyName('');
      setVatPan('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Customer Name and Phone are required.');
      return;
    }
    const customerData = { 
        name, 
        phone, 
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        dob: dob || undefined, // Store as YYYY-MM-DD string or undefined
        companyName: companyName.trim() || undefined,
        vatPan: vatPan.trim() || undefined,
    };
    if (initialData) {
      onUpdate({ ...initialData, ...customerData });
    } else {
      onSubmit(customerData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
            label="Customer Name *"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            required
            autoFocus
            leftIcon={<FiUser />}
        />
         <Input
            label="Company Name (Optional)"
            value={companyName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Corporation"
            leftIcon={<FiBriefcase />}
        />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
            label="Phone Number *"
            type="tel"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            placeholder="e.g., +1-555-123-4567"
            required
            leftIcon={<FiPhone />}
        />
        <Input
            label="VAT/PAN (Optional)"
            value={vatPan}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setVatPan(e.target.value)}
            placeholder="e.g., VAT123456789"
            leftIcon={<FiHash />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Input
            label="Date of Birth (Optional)"
            type="date"
            value={dob}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
            leftIcon={<FiCalendar />}
            max={new Date().toISOString().split("T")[0]} // Prevent future dates
        />
        <Input
            label="Email Address (Optional)"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="e.g., john.doe@example.com"
            leftIcon={<FiMail />}
        />
      </div>
      <Input
        label="Address (Optional)"
        value={address}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
        placeholder="e.g., 123 Main St, Anytown, USA"
        leftIcon={<FiMapPin />}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Customer' : 'Save Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;