import React, { useState } from 'react';
import Card from '@/components/common/Card';
import { FiCreditCard, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Plan } from '@/types';
import PlanForm from '@/components/saas/PlanForm';

const ManagePlansPage: React.FC = () => {
    const { plans, addPlan, updatePlan, deletePlan, outlets } = useRestaurantData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const handleOpenModal = (plan?: Plan) => {
        setEditingPlan(plan || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPlan(null);
        setIsModalOpen(false);
    };

    const handleDelete = (planId: string) => {
        const planToDelete = plans.find(p => p.id === planId);
        if (!planToDelete) return;
        
        const planInUseByName = outlets.some(o => o.plan === planToDelete.name);
        
        if (planInUseByName) {
            alert("Cannot delete this plan because it is currently assigned to one or more tenants.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${planToDelete.name}" plan? This action cannot be undone.`)) {
            deletePlan(planId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiCreditCard className="mr-3"/> Plan Management
                </h1>
                <Button onClick={() => handleOpenModal()} leftIcon={<FiPlus/>}>Create New Plan</Button>
            </div>

            <Card className="overflow-x-auto">
                 {plans.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No subscription plans found. Please create one.</p>
                    </div>
                 ) : (
                    <table className="w-full min-w-max">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Plan Name</th>
                                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
                                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">Public</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {plans.map(plan => (
                                <tr key={plan.id}>
                                    <td className="py-3 px-4 font-medium">{plan.name}</td>
                                    <td className="py-3 px-4 text-right">${plan.price.toFixed(2)} / {plan.period}</td>
                                    <td className="py-3 px-4 text-center">{plan.isActive ? <FiCheckCircle className="text-green-500 mx-auto"/> : <FiXCircle className="text-red-500 mx-auto"/>}</td>
                                    <td className="py-3 px-4 text-center">{plan.isPublic ? <FiCheckCircle className="text-green-500 mx-auto"/> : <FiXCircle className="text-red-500 mx-auto"/>}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleOpenModal(plan)} leftIcon={<FiEdit size={14}/>}>Edit</Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)} leftIcon={<FiTrash2 size={14}/>}>Delete</Button>
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
                title={editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Plan"}
                size="xl"
            >
                <PlanForm 
                    initialData={editingPlan}
                    onSubmit={addPlan}
                    onUpdate={updatePlan}
                    onClose={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default ManagePlansPage;
