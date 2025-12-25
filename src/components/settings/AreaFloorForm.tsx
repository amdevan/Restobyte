
import React, { useState, useEffect, ChangeEvent } from 'react';
import { AreaFloor } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiMapPin } from 'react-icons/fi';

interface AreaFloorFormProps {
  initialData?: AreaFloor | null;
  onSubmit: (data: Omit<AreaFloor, 'id'>) => void;
  onUpdate: (data: AreaFloor) => void;
  onClose: () => void;
}

const AreaFloorForm: React.FC<AreaFloorFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Area/Floor Name is required.');
      return;
    }
    const areaFloorData = { name, description };
    if (initialData) {
      onUpdate({ ...initialData, ...areaFloorData });
    } else {
      onSubmit(areaFloorData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Area/Floor Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Main Dining, Rooftop Terrace, Bar Area"
        required
        autoFocus
        leftIcon={<FiMapPin />} // Icon is passed directly
        // containerClassName is already part of InputProps and applied to the outer div by Input component
        // className for additional input-specific classes (like pl-10 for padding) is handled by Input component when leftIcon is present
      />
      
      <div>
        <label htmlFor="areaFloorDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="areaFloorDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Seats up to 50 guests, quiet area, near the kitchen"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Area/Floor' : 'Save Area/Floor'}
        </Button>
      </div>
    </form>
  );
};

export default AreaFloorForm;
