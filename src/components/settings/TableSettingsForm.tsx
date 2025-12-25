
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Table, AreaFloor } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiGrid, FiUsers, FiMapPin } from 'react-icons/fi';

interface TableSettingsFormProps {
  initialData?: Table | null;
  onSubmit: (name: string, capacity: number, areaFloorId?: string) => void;
  onUpdate: (tableId: string, name: string, capacity: number, areaFloorId?: string) => void;
  onClose: () => void;
}

const TableSettingsForm: React.FC<TableSettingsFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const { areasFloors } = useRestaurantData();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | string>('');
  const [selectedAreaFloorId, setSelectedAreaFloorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCapacity(initialData.capacity);
      setSelectedAreaFloorId(initialData.areaFloorId);
    } else {
      setName('');
      setCapacity('');
      setSelectedAreaFloorId(undefined);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Table Name is required.');
      return;
    }
    const numCapacity = parseInt(String(capacity), 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      alert('Please enter a valid positive number for capacity.');
      return;
    }

    if (initialData) {
      onUpdate(initialData.id, name, numCapacity, selectedAreaFloorId);
    } else {
      onSubmit(name, numCapacity, selectedAreaFloorId);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Table Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Table 1, Patio A, VIP Booth"
        required
        autoFocus
        leftIcon={<FiGrid />}
      />
      <Input
        label="Capacity *"
        type="number"
        value={capacity}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCapacity(e.target.value)}
        placeholder="e.g., 4"
        min="1"
        required
        leftIcon={<FiUsers />}
      />
      
      <div>
        <label htmlFor="areaFloorId" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiMapPin className="mr-2 h-4 w-4 text-gray-400" /> Assign to Area/Floor (Optional)
        </label>
        <select
          id="areaFloorId"
          value={selectedAreaFloorId || ''}
          onChange={(e) => setSelectedAreaFloorId(e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="">-- Unassigned --</option>
          {areasFloors.map((af: AreaFloor) => (
            <option key={af.id} value={af.id}>
              {af.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Table' : 'Save Table'}
        </Button>
      </div>
    </form>
  );
};

export default TableSettingsForm;