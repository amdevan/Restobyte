
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Printer, PrinterType, PrinterInterfaceType } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiPrinter as FiPrinterIcon } from 'react-icons/fi';

interface PrinterFormProps {
  initialData?: Printer | null;
  onSubmit: (data: Omit<Printer, 'id'>) => void;
  onUpdate: (data: Printer) => void;
  onClose: () => void;
}

const PrinterForm: React.FC<PrinterFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PrinterType>(PrinterType.Receipt);
  const [interfaceType, setInterfaceType] = useState<PrinterInterfaceType>(PrinterInterfaceType.Network);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setInterfaceType(initialData.interfaceType);
      setIpAddress(initialData.ipAddress || '');
      setPort(initialData.port || '');
    } else {
      setName('');
      setType(PrinterType.Receipt);
      setInterfaceType(PrinterInterfaceType.Network);
      setIpAddress('');
      setPort('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Printer Name is required.');
      return;
    }
    if (interfaceType === PrinterInterfaceType.Network && (!ipAddress.trim() || !port.trim())) {
      alert('IP Address and Port are required for Network printers.');
      return;
    }

    const printerData: Omit<Printer, 'id'> = { 
        name, 
        type, 
        interfaceType, 
        ipAddress: interfaceType === PrinterInterfaceType.Network ? ipAddress : undefined,
        port: interfaceType === PrinterInterfaceType.Network ? port : undefined,
    };

    if (initialData) {
      onUpdate({ ...initialData, ...printerData });
    } else {
      onSubmit(printerData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Printer Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Kitchen Printer 1, Main Receipt Printer"
        required
        autoFocus
        leftIcon={<FiPrinterIcon />}
      />
      
      <div>
        <label htmlFor="printerType" className="block text-sm font-medium text-gray-700 mb-1">Printer Type *</label>
        <select
          id="printerType"
          value={type}
          onChange={(e) => setType(e.target.value as PrinterType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          {Object.values(PrinterType).map(ptValue => (
            <option key={String(ptValue)} value={String(ptValue)}>{String(ptValue)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="interfaceType" className="block text-sm font-medium text-gray-700 mb-1">Interface Type *</label>
        <select
          id="interfaceType"
          value={interfaceType}
          onChange={(e) => setInterfaceType(e.target.value as PrinterInterfaceType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          {Object.values(PrinterInterfaceType).map(itValue => (
            <option key={String(itValue)} value={String(itValue)}>{String(itValue)}</option>
          ))}
        </select>
      </div>

      {interfaceType === PrinterInterfaceType.Network && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="IP Address *"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="e.g., 192.168.1.100"
            required={interfaceType === PrinterInterfaceType.Network}
          />
          <Input
            label="Port *"
            type="text" // Using text to allow port numbers like 9100
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="e.g., 9100"
            required={interfaceType === PrinterInterfaceType.Network}
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Printer' : 'Save Printer'}
        </Button>
      </div>
    </form>
  );
};

export default PrinterForm;
