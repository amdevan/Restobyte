import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Waiter } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import WaiterForm from '@/components/panel/WaiterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';

const ManageWaitersPage: React.FC = () => {
  const { waiters, addWaiter, updateWaiter, deleteWaiter } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingWaiter(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWaiter(null);
  };

  const handleDelete = (waiterId: string) => {
    if (window.confirm('Are you sure you want to delete this waiter?')) {
      deleteWaiter(waiterId);
    }
  };
  
  const handleAddSubmit = (waiterData: Omit<Waiter, 'id'>) => {
    addWaiter(waiterData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedWaiter: Waiter) => {
    updateWaiter(updatedWaiter);
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-sky-600"/> Manage Waiters
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Waiter
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {waiters.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No waiters defined.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Waiter" to add staff members.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Employee ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waiters.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{w.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{w.employeeId || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{w.phone || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(w)} variant="secondary" size="sm" aria-label="Edit Waiter">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(w.id)} variant="danger" size="sm" aria-label="Delete Waiter">
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
        title={editingWaiter ? "Edit Waiter" : "Add New Waiter"}
        size="md"
      >
        <WaiterForm
          initialData={editingWaiter}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageWaitersPage;