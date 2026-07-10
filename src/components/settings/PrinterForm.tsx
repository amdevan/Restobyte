
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Printer, PrinterType, PrinterInterfaceType, PaperSize } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiPrinter as FiPrinterIcon, FiInfo } from 'react-icons/fi';

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
  const [isActive, setIsActive] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const [usbPath, setUsbPath] = useState('');
  const [bluetoothMac, setBluetoothMac] = useState('');
  const [serialPort, setSerialPort] = useState('');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize['80mm']);
  const [printerModel, setPrinterModel] = useState('');
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [retries, setRetries] = useState<number>(3);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [autoPrintKOT, setAutoPrintKOT] = useState(false);
  const [autoPrintLabel, setAutoPrintLabel] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setInterfaceType(initialData.interfaceType);
      setIsActive(initialData.isActive);
      setIpAddress(initialData.ipAddress || '');
      setPort(initialData.port || '');
      setUsbPath(initialData.usbPath || '');
      setBluetoothMac(initialData.bluetoothMac || '');
      setSerialPort(initialData.serialPort || '');
      setBaudRate(initialData.baudRate || 9600);
      setPaperSize(initialData.paperSize || PaperSize['80mm']);
      setPrinterModel(initialData.printerModel || '');
      setTimeoutMs(initialData.timeoutMs || 5000);
      setRetries(initialData.retries || 3);
      setAutoPrintReceipt(initialData.autoPrintReceipt || false);
      setAutoPrintKOT(initialData.autoPrintKOT || false);
      setAutoPrintLabel(initialData.autoPrintLabel || false);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setType(PrinterType.Receipt);
      setInterfaceType(PrinterInterfaceType.Network);
      setIsActive(true);
      setIpAddress('');
      setPort('');
      setUsbPath('');
      setBluetoothMac('');
      setSerialPort('');
      setBaudRate(9600);
      setPaperSize(PaperSize['80mm']);
      setPrinterModel('');
      setTimeoutMs(5000);
      setRetries(3);
      setAutoPrintReceipt(false);
      setAutoPrintKOT(false);
      setAutoPrintLabel(false);
      setNotes('');
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
    if (interfaceType === PrinterInterfaceType.Serial && (!serialPort.trim())) {
      alert('Serial Port is required for Serial printers.');
      return;
    }

    const printerData: Omit<Printer, 'id'> = { 
        name, 
        type, 
        interfaceType, 
        isActive,
        ipAddress: interfaceType === PrinterInterfaceType.Network ? ipAddress : undefined,
        port: interfaceType === PrinterInterfaceType.Network ? port : undefined,
        usbPath: interfaceType === PrinterInterfaceType.USB ? usbPath : undefined,
        bluetoothMac: interfaceType === PrinterInterfaceType.Bluetooth ? bluetoothMac : undefined,
        serialPort: interfaceType === PrinterInterfaceType.Serial ? serialPort : undefined,
        baudRate: interfaceType === PrinterInterfaceType.Serial ? baudRate : undefined,
        paperSize,
        printerModel,
        timeoutMs,
        retries,
        autoPrintReceipt,
        autoPrintKOT,
        autoPrintLabel,
        notes,
    };

    if (initialData) {
      onUpdate({ ...initialData, ...printerData });
    } else {
      onSubmit(printerData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
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

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-sky-600 rounded focus:ring-sky-500 border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Printer is Active
        </label>
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
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="e.g., 9100"
            required={interfaceType === PrinterInterfaceType.Network}
          />
        </div>
      )}

      {interfaceType === PrinterInterfaceType.USB && (
        <div>
          <Input
            label="USB Path"
            value={usbPath}
            onChange={(e) => setUsbPath(e.target.value)}
            placeholder="e.g., /dev/usb/lp0 or usb://..."
          />
        </div>
      )}

      {interfaceType === PrinterInterfaceType.Bluetooth && (
        <div>
          <Input
            label="Bluetooth MAC Address"
            value={bluetoothMac}
            onChange={(e) => setBluetoothMac(e.target.value)}
            placeholder="e.g., 00:11:22:33:44:55"
          />
        </div>
      )}

      {interfaceType === PrinterInterfaceType.Serial && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Serial Port *"
            value={serialPort}
            onChange={(e) => setSerialPort(e.target.value)}
            placeholder="e.g., COM1 or /dev/ttyS0"
            required
          />
          <Input
            label="Baud Rate"
            type="number"
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            placeholder="9600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paperSize" className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
          <select
            id="paperSize"
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {Object.values(PaperSize).map(psValue => (
              <option key={psValue} value={psValue}>{psValue}</option>
            ))}
          </select>
        </div>

        <Input
          label="Printer Model"
          value={printerModel}
          onChange={(e) => setPrinterModel(e.target.value)}
          placeholder="e.g., Epson TM-T88VI"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Timeout (ms)"
          type="number"
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
          placeholder="5000"
        />
        <Input
          label="Max Retries"
          type="number"
          value={retries}
          onChange={(e) => setRetries(Number(e.target.value))}
          placeholder="3"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoPrintReceipt"
            checked={autoPrintReceipt}
            onChange={(e) => setAutoPrintReceipt(e.target.checked)}
            className="h-4 w-4 text-sky-600 rounded focus:ring-sky-500 border-gray-300"
          />
          <label htmlFor="autoPrintReceipt" className="text-sm font-medium text-gray-700">
            Auto-Print Receipts
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoPrintKOT"
            checked={autoPrintKOT}
            onChange={(e) => setAutoPrintKOT(e.target.checked)}
            className="h-4 w-4 text-sky-600 rounded focus:ring-sky-500 border-gray-300"
          />
          <label htmlFor="autoPrintKOT" className="text-sm font-medium text-gray-700">
            Auto-Print KOTs
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoPrintLabel"
            checked={autoPrintLabel}
            onChange={(e) => setAutoPrintLabel(e.target.checked)}
            className="h-4 w-4 text-sky-600 rounded focus:ring-sky-500 border-gray-300"
          />
          <label htmlFor="autoPrintLabel" className="text-sm font-medium text-gray-700">
            Auto-Print Labels
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this printer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          rows={3}
        />
      </div>

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
