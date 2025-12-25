
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Denomination } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import DenominationForm from '@/components/settings/DenominationForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiArchive } from 'react-icons/fi';

const ManageDenominationsPage: React.FC = () => {
  const { denominations, addDenomination, updateDenomination, deleteDenomination } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDenomination, setEditingDenomination] = useState<Denomination | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingDenomination(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (denomination: Denomination) => {
    setEditingDenomination(denomination);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDenomination(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this denomination?')) {
      deleteDenomination(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiArchive className="mr-3 text-sky-600"/> Manage Denominations
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Denomination
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {denominations.length === 0 ? (
          <div className="text-center py-10">
            <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No denominations found.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Denomination" to define your cash values.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {denominations.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{d.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">${d.value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(d)} variant="secondary" size="sm" aria-label="Edit Denomination">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(d.id)} variant="danger" size="sm" aria-label="Delete Denomination">
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
        title={editingDenomination ? "Edit Denomination" : "Add New Denomination"}
        size="md"
      >
        <DenominationForm
          initialData={editingDenomination}
          onSubmit={addDenomination}
          onUpdate={updateDenomination}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageDenominationsPage;
