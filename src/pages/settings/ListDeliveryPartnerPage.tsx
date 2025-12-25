import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { DeliveryPartner } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import DeliveryPartnerForm from '@/components/settings/DeliveryPartnerForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiTruck, FiCheckCircle, FiXCircle as FiStatusX } from 'react-icons/fi';

const ListDeliveryPartnerPage: React.FC = () => {
  const { deliveryPartners, addDeliveryPartner, updateDeliveryPartner, deleteDeliveryPartner } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleDelete = (partnerId: string) => {
    if (window.confirm('Are you sure you want to delete this delivery partner?')) {
      deleteDeliveryPartner(partnerId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiTruck className="mr-3 text-sky-600"/> Manage Delivery Partners
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Partner
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {deliveryPartners.length === 0 ? (
          <div className="text-center py-10">
            <FiTruck size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No delivery partners found.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Partner" to get started.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Commission Rate (%)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryPartners.map(partner => (
                <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{partner.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{partner.commissionRate !== undefined ? `${partner.commissionRate.toFixed(2)}%` : '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${partner.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {partner.isEnabled ? <FiCheckCircle className="mr-1" /> : <FiStatusX className="mr-1" />}
                      {partner.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(partner)} variant="secondary" size="sm" aria-label="Edit Partner">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(partner.id)} variant="danger" size="sm" aria-label="Delete Partner">
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
        title={editingPartner ? "Edit Delivery Partner" : "Add New Delivery Partner"}
        size="md"
      >
        <DeliveryPartnerForm
          initialData={editingPartner}
          onSubmit={addDeliveryPartner}
          onUpdate={updateDeliveryPartner}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ListDeliveryPartnerPage;
