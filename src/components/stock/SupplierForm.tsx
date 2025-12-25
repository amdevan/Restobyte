
import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle } from 'react-icons/fi';

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSubmit: (data: Omit<Supplier, 'id'>) => void;
  onUpdate: (data: Supplier) => void;
  onClose: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setContactPerson(initialData.contactPerson || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
    } else {
      // Reset for new entry
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Supplier Name is required.');
      return;
    }
    const supplierData = { name, contactPerson, phone, email, address, notes };
    if (initialData) {
      onUpdate({ ...initialData, ...supplierData });
    } else {
      onSubmit(supplierData);
    }
    onClose(); // Close modal after submit/update
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Supplier Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Global Food Suppliers Inc."
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Contact Person"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          placeholder="e.g., John Doe"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g., +1-555-123-4567"
        />
      </div>
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e.g., contact@globalsuppliers.com"
      />
      <Input
        label="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g., 123 Supply Chain Rd, Food City"
      />
      <div>
        <label htmlFor="supplierNotes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="supplierNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Preferred delivery times, payment terms"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Supplier' : 'Save Supplier'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
