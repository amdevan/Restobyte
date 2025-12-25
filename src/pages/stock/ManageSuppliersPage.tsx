

import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Supplier } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import SupplierForm from '@/components/stock/SupplierForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiPhone, FiMail } from 'react-icons/fi';

const ManageSuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(supplierId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-sky-600"/> Manage Suppliers
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Supplier
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {suppliers.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No suppliers found.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Supplier" to get started.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact Person</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map(supplier => (
                <tr key={supplier.id} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{supplier.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{supplier.contactPerson || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {supplier.phone ? (<a href={`tel:${supplier.phone}`} className="hover:text-sky-600 flex items-center"><FiPhone size={12} className="mr-1.5"/>{supplier.phone}</a>) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                     {supplier.email ? (<a href={`mailto:${supplier.email}`} className="hover:text-sky-600 flex items-center"><FiMail size={12} className="mr-1.5"/>{supplier.email}</a>) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(supplier)} variant="secondary" size="sm" aria-label="Edit Supplier">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(supplier.id)} variant="danger" size="sm" aria-label="Delete Supplier">
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
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        size="lg" // Adjust size for supplier form
      >
        <SupplierForm
          initialData={editingSupplier}
          onSubmit={addSupplier}
          onUpdate={updateSupplier}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageSuppliersPage;