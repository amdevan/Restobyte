import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Kitchen } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import KitchenForm from '@/components/panel/KitchenForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiHome } from 'react-icons/fi';

const ManageKitchensPage: React.FC = () => {
  const { kitchens, addKitchen, updateKitchen, deleteKitchen } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKitchen, setEditingKitchen] = useState<Kitchen | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingKitchen(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (kitchen: Kitchen) => {
    setEditingKitchen(kitchen);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKitchen(null);
  };

  const handleDelete = (kitchenId: string) => {
    if (window.confirm('Are you sure you want to delete this kitchen? This might affect item routing or other configurations.')) {
      deleteKitchen(kitchenId);
    }
  };
  
  const handleAddSubmit = (kitchenData: Omit<Kitchen, 'id'>) => {
    addKitchen(kitchenData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedKitchen: Kitchen) => {
    updateKitchen(updatedKitchen);
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiHome className="mr-3 text-sky-600"/> Manage Kitchens
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Kitchen
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {kitchens.length === 0 ? (
          <div className="text-center py-10">
            <FiHome size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No kitchens defined.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Kitchen" to define kitchen stations for order routing.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Kitchen Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kitchens.map(k => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{k.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(k)} variant="secondary" size="sm" aria-label="Edit Kitchen">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(k.id)} variant="danger" size="sm" aria-label="Delete Kitchen">
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
        title={editingKitchen ? "Edit Kitchen" : "Add New Kitchen"}
        size="md"
      >
        <KitchenForm
          initialData={editingKitchen}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageKitchensPage;