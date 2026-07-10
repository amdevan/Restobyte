
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Printer, PrinterType, PrinterInterfaceType } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import PrinterForm from '@/components/settings/PrinterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiPrinter as FiPrinterIcon, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface SystemPrinter {
  name: string;
  model?: string;
  port?: string;
  status?: string;
  description?: string;
  usbPath?: string;
}

const ManagePrintersPage: React.FC = () => {
  const { printers, addPrinter, updatePrinter, deletePrinter } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [systemPrinters, setSystemPrinters] = useState<SystemPrinter[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSystemPrintersModal, setShowSystemPrintersModal] = useState(false);

  const handleOpenModalForAdd = () => {
    setEditingPrinter(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (printer: Printer) => {
    setEditingPrinter(printer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrinter(null);
  };

  const handleDelete = async (printerId: string) => {
    if (window.confirm('Are you sure you want to delete this printer configuration?')) {
      await deletePrinter(printerId);
    }
  };
  
  const handleAddSubmit = async (printerData: Omit<Printer, 'id'>) => {
    await addPrinter(printerData);
    handleCloseModal();
  };

  const handleUpdateSubmit = async (updatedPrinter: Printer) => {
    await updatePrinter(updatedPrinter);
    handleCloseModal();
  };

  const handleDetectPrinters = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/printers/system`);
      if (!response.ok) throw new Error('Failed to fetch system printers');
      const data = await response.json();
      setSystemPrinters(data.printers || []);
      setShowSystemPrintersModal(true);
    } catch (error) {
      console.error('Error detecting printers:', error);
      alert('Failed to detect system printers');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddSystemPrinter = async (systemPrinter: SystemPrinter) => {
    const isUsbPrinter = !!systemPrinter.usbPath;
    const newPrinter: Omit<Printer, 'id'> = {
      name: systemPrinter.name,
      type: PrinterType.Receipt,
      interfaceType: isUsbPrinter ? PrinterInterfaceType.USB : PrinterInterfaceType.Network,
      isActive: true,
      printerModel: systemPrinter.model,
      usbPath: systemPrinter.usbPath,
    };
    await addPrinter(newPrinter);
    setShowSystemPrintersModal(false);
  };

  const getConnectionDetails = (printer: Printer): string => {
    if (printer.interfaceType === PrinterInterfaceType.Network) {
      return `${printer.ipAddress || 'N/A'}:${printer.port || 'N/A'}`;
    }
    if (printer.interfaceType === PrinterInterfaceType.USB) {
      return printer.usbPath || 'USB';
    }
    if (printer.interfaceType === PrinterInterfaceType.Bluetooth) {
      return printer.bluetoothMac || 'Bluetooth';
    }
    if (printer.interfaceType === PrinterInterfaceType.Serial) {
      return printer.serialPort ? `${printer.serialPort} @ ${printer.baudRate}` : 'Serial';
    }
    return printer.interfaceType;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiPrinterIcon className="mr-3 text-sky-600"/> Manage Printers
        </h1>
        <div className="flex gap-3">
          <Button 
            onClick={handleDetectPrinters} 
            leftIcon={<FiRefreshCw size={20} className={isDetecting ? 'animate-spin' : ''}/>} 
            variant="secondary"
            disabled={isDetecting}
          >
            {isDetecting ? 'Detecting...' : 'Detect Printers'}
          </Button>
          <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
            Add New Printer
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {printers.length === 0 ? (
          <div className="text-center py-10">
            <FiPrinterIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No printers configured.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Printer" to set up KOT or Receipt printers.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Connection Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Paper Size</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Auto-Print</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {printers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.type}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <>
                          <FiCheckCircle className="text-green-500" />
                          <span className="text-green-700 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-red-500" />
                          <span className="text-red-700 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getConnectionDetails(p)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.paperSize || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {[
                      p.autoPrintReceipt && 'Receipts',
                      p.autoPrintKOT && 'KOTs',
                      p.autoPrintLabel && 'Labels'
                    ].filter(Boolean).join(', ') || 'None'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(p)} variant="secondary" size="sm" aria-label="Edit Printer">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(p.id)} variant="danger" size="sm" aria-label="Delete Printer">
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingPrinter ? "Edit Printer" : "Add New Printer"}
        size="2xl"
      >
        <PrinterForm
          initialData={editingPrinter}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>

      <Modal 
        isOpen={showSystemPrintersModal} 
        onClose={() => setShowSystemPrintersModal(false)} 
        title="Detected System Printers"
        size="xl"
      >
        <div className="space-y-4">
          {systemPrinters.length === 0 ? (
            <div className="text-center py-8">
              <FiPrinterIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No printers detected on this system.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {systemPrinters.map((printer, index) => (
                <Card key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{printer.name}</p>
                    <p className="text-sm text-gray-500">
                      {printer.model ? `Model: ${printer.model}` : ''}
                      {printer.status ? ` • Status: ${printer.status}` : ''}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleAddSystemPrinter(printer)} 
                    variant="primary" 
                    size="sm"
                  >
                    Add
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagePrintersPage;
