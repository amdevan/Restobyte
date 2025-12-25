
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Printer, PrinterInterfaceType } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import PrinterForm from '@/components/settings/PrinterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiPrinter as FiPrinterIcon } from 'react-icons/fi';

const ManagePrintersPage: React.FC = () => {
  const { printers, addPrinter, updatePrinter, deletePrinter } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

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

  const handleDelete = (printerId: string) => {
    if (window.confirm('Are you sure you want to delete this printer configuration?')) {
      deletePrinter(printerId);
    }
  };
  
  const handleAddSubmit = (printerData: Omit<Printer, 'id'>) => {
    addPrinter(printerData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedPrinter: Printer) => {
    updatePrinter(updatedPrinter);
    handleCloseModal();
  };

  const getConnectionDetails = (printer: Printer): string => {
    if (printer.interfaceType === PrinterInterfaceType.Network) {
      return `${printer.ipAddress || 'N/A'}:${printer.port || 'N/A'}`;
    }
    return printer.interfaceType;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiPrinterIcon className="mr-3 text-sky-600"/> Manage Printers
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Printer
        </Button>
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
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Connection Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {printers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getConnectionDetails(p)}</td>
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
        size="lg" // Larger for more fields
      >
        <PrinterForm
          initialData={editingPrinter}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManagePrintersPage;
