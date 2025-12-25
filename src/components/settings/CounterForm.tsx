
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Counter, Printer, PrinterType } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiMonitor, FiPrinter } from 'react-icons/fi';

interface CounterFormProps {
  initialData?: Counter | null;
  onSubmit: (data: Omit<Counter, 'id' | 'assignedPrinterIds'> & { assignedPrinterIds?: string[] }) => void;
  onUpdate: (data: Counter) => void;
  onClose: () => void;
}

const CounterForm: React.FC<CounterFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const { printers } = useRestaurantData();
  const [name, setName] = useState('');
  const [assignedPrinterIds, setAssignedPrinterIds] = useState<string[]>([]);

  const receiptPrinters = printers.filter(p => p.type === PrinterType.Receipt);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAssignedPrinterIds(initialData.assignedPrinterIds || []);
    } else {
      setName('');
      setAssignedPrinterIds([]);
    }
  }, [initialData]);

  const handlePrinterSelectionChange = (printerId: string) => {
    setAssignedPrinterIds(prevSelectedIds =>
      prevSelectedIds.includes(printerId)
        ? prevSelectedIds.filter(id => id !== printerId)
        : [...prevSelectedIds, printerId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Counter Name is required.');
      return;
    }
    const counterData = { name, assignedPrinterIds };
    if (initialData) {
      onUpdate({ ...initialData, ...counterData });
    } else {
      onSubmit(counterData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Counter Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Main Counter, Bar Counter, Takeaway Station"
        required
        autoFocus
        leftIcon={<FiMonitor />}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Receipt Printers <FiPrinter className="inline-block ml-1" />
        </label>
        {receiptPrinters.length === 0 ? (
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
            No receipt printers found. Please add printers with type 'Receipt' in Settings &rarr; Printer.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 custom-scrollbar">
            {receiptPrinters.map(printer => (
              <label key={printer.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                  checked={assignedPrinterIds.includes(printer.id)}
                  onChange={() => handlePrinterSelectionChange(printer.id)}
                />
                <span className="text-sm text-gray-700">{printer.name} ({printer.interfaceType})</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Counter' : 'Save Counter'}
        </Button>
      </div>
    </form>
  );
};

export default CounterForm;
