
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Counter, PrinterType } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import CounterForm from '@/components/settings/CounterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiMonitor, FiPrinter } from 'react-icons/fi';

const ManageCountersPage: React.FC = () => {
  const { counters, addCounter, updateCounter, deleteCounter, printers } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingCounter(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (counter: Counter) => {
    setEditingCounter(counter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCounter(null);
  };

  const handleDelete = (counterId: string) => {
    if (window.confirm('Are you sure you want to delete this counter? This could affect POS assignments or other configurations.')) {
      deleteCounter(counterId);
    }
  };
  
  const handleAddSubmit = (counterData: Omit<Counter, 'id' | 'assignedPrinterIds'> & { assignedPrinterIds?: string[] }) => {
    addCounter(counterData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedCounter: Counter) => {
    updateCounter(updatedCounter);
    handleCloseModal();
  };

  const getAssignedPrinterNames = (printerIds?: string[]): string => {
    if (!printerIds || printerIds.length === 0) {
      return '-';
    }
    return printerIds
      .map(id => printers.find(p => p.id === id)?.name)
      .filter(name => !!name)
      .join(', ') || '-';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiMonitor className="mr-3 text-sky-600"/> Manage Counters
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Counter
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {counters.length === 0 ? (
          <div className="text-center py-10">
            <FiMonitor size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No counters defined.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Counter" to define different counters in your restaurant.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Counter Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned Receipt Printers</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {counters.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{c.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getAssignedPrinterNames(c.assignedPrinterIds).split(', ').map((name, index) => (
                      name !== '-' && <span key={index} className="inline-block bg-sky-100 text-sky-700 text-xs font-medium mr-2 px-2 py-0.5 rounded-full">{name}</span>
                    ))}
                    {getAssignedPrinterNames(c.assignedPrinterIds) === '-' && '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(c)} variant="secondary" size="sm" aria-label="Edit Counter">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(c.id)} variant="danger" size="sm" aria-label="Delete Counter">
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
        title={editingCounter ? "Edit Counter" : "Add New Counter"}
        size="lg" // Increased size to accommodate printer selection
      >
        <CounterForm
          initialData={editingCounter}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageCountersPage;
