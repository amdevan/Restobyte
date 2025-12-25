import React, { useState, useMemo } from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import TenantEditModal from '@/components/saas/TenantEditModal';
import OutletForm from '@/components/settings/OutletForm';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Outlet } from '@/types';
import { FiUsers, FiSearch, FiEdit, FiToggleLeft, FiToggleRight, FiPlusCircle } from 'react-icons/fi';

const ManageTenantsPage: React.FC = () => {
    const { outlets, users, addOutlet, updateOutlet } = useRestaurantData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Outlet | null>(null);

    const getTenantAdmin = (outletId: string) => {
        return users.find(u => u.outletId === outletId && !u.isSuperAdmin);
    };

    const enrichedTenants = useMemo(() => {
        return outlets.map(outlet => ({
            ...outlet,
            adminUser: getTenantAdmin(outlet.id)
        })).sort((a,b) => new Date(b.registrationDate || 0).getTime() - new Date(a.registrationDate || 0).getTime());
    }, [outlets, users]);

    const filteredTenants = useMemo(() => {
        if (!searchTerm) {
            return enrichedTenants;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return enrichedTenants.filter(tenant =>
            tenant.restaurantName.toLowerCase().includes(lowercasedFilter) ||
            (tenant.adminUser && tenant.adminUser.username.toLowerCase().includes(lowercasedFilter))
        );
    }, [enrichedTenants, searchTerm]);

    const handleOpenModal = (tenant: Outlet) => {
        setEditingTenant(tenant);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingTenant(null);
        setIsModalOpen(false);
    };

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleToggleStatus = (tenant: Outlet) => {
        const newStatus = tenant.subscriptionStatus === 'active' ? 'inactive' : 'active';
        updateOutlet({ ...tenant, subscriptionStatus: newStatus });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiUsers className="mr-3" /> Tenant Management ({filteredTenants.length})
                </h1>
                <div className="flex items-center space-x-3 w-1/3">
                    <Input
                        placeholder="Search by restaurant or admin..."
                        leftIcon={<FiSearch />}
                        containerClassName="mb-0"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Button variant="primary" onClick={handleOpenAddModal} leftIcon={<FiPlusCircle />}>
                        Add Tenant
                    </Button>
                </div>
            </div>

            <Card className="overflow-x-auto">
                {filteredTenants.length > 0 ? (
                    <table className="w-full min-w-max">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Admin User</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Register Date</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTenants.map(tenant => (
                                <tr key={tenant.id}>
                                    <td className="py-3 px-4 font-medium">{tenant.restaurantName}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{tenant.adminUser?.username || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm"><span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{tenant.plan}</span></td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{tenant.registrationDate ? new Date(tenant.registrationDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <button onClick={() => handleToggleStatus(tenant)} className={`flex items-center text-xs p-1 rounded-full ${tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {tenant.subscriptionStatus === 'active' ? <FiToggleRight size={18} className="mr-1"/> : <FiToggleLeft size={18} className="mr-1"/>}
                                            <span className="capitalize">{tenant.subscriptionStatus}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(tenant)} leftIcon={<FiEdit size={14}/>}>
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No tenants found.</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Edit Tenant: ${editingTenant?.restaurantName}`}>
                <TenantEditModal initialData={editingTenant} onUpdate={updateOutlet} onClose={handleCloseModal} />
            </Modal>

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Add New Tenant" size="xl">
                <OutletForm
                    initialData={null}
                    onSubmit={addOutlet}
                    onUpdate={updateOutlet}
                    onClose={handleCloseAddModal}
                />
            </Modal>
        </div>
    );
};

export default ManageTenantsPage;
