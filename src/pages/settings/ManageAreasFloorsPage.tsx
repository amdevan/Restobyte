import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { AreaFloor } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import AreaFloorForm from '@/components/settings/AreaFloorForm'; // New form component
import { FiPlusCircle, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi';

const ManageAreasFloorsPage: React.FC = () => {
  const { areasFloors, addAreaFloor, updateAreaFloor, deleteAreaFloor } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAreaFloor, setEditingAreaFloor] = useState<AreaFloor | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingAreaFloor(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (areaFloor: AreaFloor) => {
    setEditingAreaFloor(areaFloor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAreaFloor(null);
  };

  const handleDelete = (areaFloorId: string) => {
    if (window.confirm('Are you sure you want to delete this area/floor? This could affect table assignments or other configurations.')) {
      deleteAreaFloor(areaFloorId);
    }
  };
  
  const handleAddSubmit = (areaFloorData: Omit<AreaFloor, 'id'>) => {
    addAreaFloor(areaFloorData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedAreaFloor: AreaFloor) => {
    updateAreaFloor(updatedAreaFloor);
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiMapPin className="mr-3 text-sky-600"/> Manage Areas/Floors
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Area/Floor
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {areasFloors.length === 0 ? (
          <div className="text-center py-10">
            <FiMapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No areas or floors defined.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Area/Floor" to define sections of your restaurant.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {areasFloors.map(af => (
                <tr key={af.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{af.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs sm:max-w-md truncate ...">
                    {af.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(af)} variant="secondary" size="sm" aria-label="Edit Area/Floor">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(af.id)} variant="danger" size="sm" aria-label="Delete Area/Floor">
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
        title={editingAreaFloor ? "Edit Area/Floor" : "Add New Area/Floor"}
        size="md"
      >
        <AreaFloorForm
          initialData={editingAreaFloor}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageAreasFloorsPage;