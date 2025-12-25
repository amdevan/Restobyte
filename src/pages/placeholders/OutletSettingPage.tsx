import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Outlet } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import OutletForm from '@/components/settings/OutletForm';
import { FiTool, FiPlusCircle, FiEdit, FiTrash2, FiCheckCircle, FiHome } from 'react-icons/fi';

const OutletSettingPage: React.FC = () => {
    const { 
        outlets, 
        activeOutletIds,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        setActiveOutletIds,
    } = useRestaurantData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

    const handleOpenModalForAdd = () => {
        setEditingOutlet(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (outlet: Outlet) => {
        setEditingOutlet(outlet);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOutlet(null);
    };

    const handleDelete = (outletId: string) => {
        if (outlets.length <= 1) {
            alert("You cannot delete the last remaining outlet.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this outlet? This action cannot be undone.')) {
            deleteOutlet(outletId);
        }
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FiTool className="mr-3 text-sky-600"/> Outlet Management
                </h1>
                <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle />}>
                    Add New Outlet
                </Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {outlets.map(outlet => (
                                <tr key={outlet.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                                        <div className="text-xs text-gray-500">{outlet.restaurantName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{outlet.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {activeOutletIds.length === 1 && activeOutletIds[0] === outlet.id ? (
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center">
                                                <FiCheckCircle className="mr-1.5"/> Active
                                            </span>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => setActiveOutletIds([outlet.id])}>Set as Active</Button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <Button onClick={() => handleOpenModalForEdit(outlet)} variant="secondary" size="sm" leftIcon={<FiEdit />}>Edit</Button>
                                            <Button onClick={() => handleDelete(outlet.id)} variant="danger" size="sm" leftIcon={<FiTrash2 />} disabled={outlets.length <= 1}>Delete</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {outlets.length === 0 && (
                        <div className="text-center py-10">
                            <FiHome size={40} className="mx-auto text-gray-300 mb-2"/>
                            <p className="text-gray-500">No outlets found. Please add your first outlet.</p>
                        </div>
                     )}
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}
                size="xl"
            >
                <OutletForm 
                    initialData={editingOutlet}
                    onSubmit={addOutlet}
                    onUpdate={updateOutlet}
                    onClose={handleCloseModal}
                />
            </Modal>
        </div>
    )
};

export default OutletSettingPage;