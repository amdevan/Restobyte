import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useAuth } from '@/hooks/useAuth';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import { FiArrowDownRight, FiArrowUpRight, FiCheckCircle, FiClock, FiCreditCard, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/common/Button';
import { Plan } from '@/types';
import Modal from '@/components/common/Modal';
import PlanForm from '@/components/saas/PlanForm';

const PlanCard: React.FC<{ plan: Plan; isCurrent: boolean; currentPrice: number; onEdit?: (plan: Plan) => void; onDelete?: (plan: Plan) => void; canManage?: boolean; }> = ({ plan, isCurrent, currentPrice, onEdit, onDelete, canManage = false }) => {
    const isUpgrade = plan.price > currentPrice;
    const isDowngrade = plan.price < currentPrice;
    const maxFeaturesToShow = 4;
    const visibleFeatures = plan.features.slice(0, maxFeaturesToShow);
    const hiddenFeaturesCount = Math.max(0, plan.features.length - visibleFeatures.length);

    const getButton = () => {
        if (isCurrent) {
            return <Button variant="secondary" disabled size="sm" className="w-full mt-6">Current Plan</Button>;
        }
        if (isUpgrade) {
            return (
                <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-6"
                    rightIcon={<FiArrowUpRight />}
                >
                    Upgrade
                </Button>
            );
        }
        if (isDowngrade) {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-6 bg-white/70"
                    rightIcon={<FiArrowDownRight />}
                >
                    Downgrade
                </Button>
            );
        }
        return (
            <Button variant="outline" size="sm" className="w-full mt-6 bg-white/70">
                Choose Plan
            </Button>
        );
    };

    return (
        <div className={`relative h-full w-full max-w-sm rounded-3xl p-[1px] transition-all ${plan.isFeatured ? 'bg-gradient-to-b from-sky-500/70 via-indigo-500/50 to-violet-500/40 shadow-lg' : 'bg-gradient-to-b from-gray-200/80 to-gray-200/40 shadow-sm'}`}>
            <div className={`relative flex h-full flex-col rounded-3xl p-5 md:p-6 ${plan.isFeatured ? 'bg-white/85 backdrop-blur' : 'bg-white/80 backdrop-blur'} ring-1 ring-gray-200/70`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{plan.name}</h3>
                            {plan.isFeatured && (
                                <span className="inline-flex items-center rounded-full bg-sky-600 text-white text-[10px] font-semibold px-2.5 py-1">
                                    Most Popular
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                            <div className="text-3xl font-extrabold text-gray-900 tabular-nums">Rs {plan.price.toFixed(2)}</div>
                            <div className="pb-1 text-xs font-semibold text-gray-500">/{plan.period}</div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Upgrade or downgrade anytime.</div>
                    </div>

                    {isCurrent && (
                        <div className="shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                <FiCheckCircle />
                                Active
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex-grow">
                    <div className="rounded-2xl border border-gray-200/70 bg-gray-50/60 p-3.5">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Includes</div>
                        <ul className="mt-3 space-y-2">
                            {visibleFeatures.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3 text-xs text-gray-700">
                                    <FiCheckCircle className={`${plan.isFeatured ? 'text-sky-600' : 'text-gray-500'} mt-0.5 flex-shrink-0`} />
                                    <span className="min-w-0">{feature}</span>
                                </li>
                            ))}
                            {hiddenFeaturesCount > 0 && (
                                <li className="text-xs font-semibold text-gray-500">
                                    +{hiddenFeaturesCount} more
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="mt-5">
                    {getButton()}
                </div>
                {canManage && (
                    <div className="mt-3 flex gap-2">
                        <Button type="button" variant="secondary" size="sm" className="w-full" leftIcon={<FiEdit />} onClick={() => onEdit?.(plan)}>
                            Edit
                        </Button>
                        <Button type="button" variant="danger" size="sm" className="w-full" leftIcon={<FiTrash2 />} onClick={() => onDelete?.(plan)}>
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};


const SubscriptionPage: React.FC = () => {
    const { getSingleActiveOutlet, plans, addPlan, updatePlan, deletePlan } = useRestaurantData();
    const { user } = useAuth();
    const outlet = getSingleActiveOutlet();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    if (!outlet) {
        return <FeatureDisabledPage type="selectOutlet" featureName="Subscription Details" />;
    }

    const currentPlanDetails = plans.find(p => p.name === outlet.plan);
    const publicPlans = plans.filter(p => p.isPublic).sort((a,b) => a.price - b.price);
    const canManagePlans = Boolean(user?.isSuperAdmin);

    const handleOpenModal = (plan?: Plan) => {
        setEditingPlan(plan || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPlan(null);
        setIsModalOpen(false);
    };

    const handleDeletePlan = async (plan: Plan) => {
        if (!window.confirm(`Delete "${plan.name}" plan?`)) return;
        try {
            await deletePlan(plan.id);
        } catch {
            alert('Failed to delete plan');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-b from-gray-50 via-gray-50 to-white min-h-full">
            <div className="max-w-6xl mx-auto w-full space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 backdrop-blur shadow-sm p-6 md:p-8">
                <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-sky-200/70 via-indigo-200/40 to-transparent blur-2xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-200/50 via-sky-200/30 to-transparent blur-2xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="min-w-0">
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Subscription</div>
                        <div className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl">
                            Choose the plan that fits your restaurant. Upgrade or downgrade anytime.
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                                Current Plan: <span className="ml-1 text-gray-900">{outlet.plan}</span>
                            </span>
                            <span className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <FiCheckCircle className="mr-1.5" /> {outlet.subscriptionStatus}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                                {outlet.planExpiryDate ? (
                                    <>
                                        <FiClock className="mr-1.5" />
                                        Renews/Expires: <span className="ml-1 text-gray-900">{new Date(outlet.planExpiryDate).toLocaleDateString()}</span>
                                    </>
                                ) : (
                                    <>No renewal date</>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start justify-end">
                        <Button variant="outline" size="sm" className="bg-white/70" leftIcon={<FiCreditCard />}>
                            Manage Billing
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-lg font-extrabold text-gray-900 tracking-tight">Plans</div>
                    <div className="mt-1 text-sm text-gray-600">Compare features and select the best option.</div>
                </div>
                {canManagePlans && (
                    <Button onClick={() => handleOpenModal()} leftIcon={<FiPlus />}>
                        Add Plan
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch justify-items-center">
                {publicPlans.map(plan => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrent={plan.name === outlet.plan}
                        currentPrice={currentPlanDetails?.price || 0}
                        canManage={canManagePlans}
                        onEdit={handleOpenModal}
                        onDelete={handleDeletePlan}
                    />
                ))}
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
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
        </div>
    );
};

export default SubscriptionPage;
