import React, { useState, useEffect } from 'react';
import { SaasPricingPlan } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSPricingFormProps {
    pricingPlans: SaasPricingPlan[];
    onUpdate: (plans: SaasPricingPlan[]) => void;
}

const CMSPricingForm: React.FC<CMSPricingFormProps> = ({ pricingPlans, onUpdate }) => {
    const [localPlans, setLocalPlans] = useState(pricingPlans);

    useEffect(() => {
        setLocalPlans(pricingPlans);
    }, [pricingPlans]);

    const updatePlans = (updatedPlans: SaasPricingPlan[]) => {
        setLocalPlans(updatedPlans);
        onUpdate(updatedPlans);
    };

    const handlePlanChange = (id: string, field: keyof Omit<SaasPricingPlan, 'id' | 'features'>, value: string | boolean) => {
        updatePlans(localPlans.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleFeatureChange = (planId: string, featureIndex: number, value: string) => {
        updatePlans(localPlans.map(p => {
            if (p.id === planId) {
                const newFeatures = [...p.features];
                newFeatures[featureIndex] = value;
                return { ...p, features: newFeatures };
            }
            return p;
        }));
    };

    const handleAddFeature = (planId: string) => {
        updatePlans(localPlans.map(p => p.id === planId ? { ...p, features: [...p.features, ''] } : p));
    };

    const handleRemoveFeature = (planId: string, featureIndex: number) => {
        updatePlans(localPlans.map(p => {
            if (p.id === planId) {
                return { ...p, features: p.features.filter((_, i) => i !== featureIndex) };
            }
            return p;
        }));
    };
    
    const handleAddPlan = () => {
        const newPlan: SaasPricingPlan = {
            id: `new-${Date.now()}`,
            name: 'New Plan',
            price: '$0',
            period: '/ month',
            features: ['New Feature'],
            isFeatured: false
        };
        updatePlans([...localPlans, newPlan]);
    };

    const handleRemovePlan = (id: string) => {
        updatePlans(localPlans.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-6 p-4">
            {localPlans.map(plan => (
                <div key={plan.id} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3"><Input label="Plan Name" value={plan.name} onChange={e => handlePlanChange(plan.id, 'name', e.target.value)} containerClassName="mb-0"/></div>
                        <div className="col-span-2"><Input label="Price" value={plan.price} onChange={e => handlePlanChange(plan.id, 'price', e.target.value)} containerClassName="mb-0"/></div>
                        <div className="col-span-2"><Input label="Period" value={plan.period} onChange={e => handlePlanChange(plan.id, 'period', e.target.value)} placeholder="/ month" containerClassName="mb-0"/></div>
                        <div className="col-span-3 flex items-center pt-6">
                            <input type="checkbox" id={`featured-${plan.id}`} checked={plan.isFeatured} onChange={e => handlePlanChange(plan.id, 'isFeatured', e.target.checked)} className="h-4 w-4 mr-2"/>
                            <label htmlFor={`featured-${plan.id}`}>Is Featured?</label>
                        </div>
                        <div className="col-span-1 flex justify-end"><Button variant="danger" onClick={() => handleRemovePlan(plan.id)}><FiTrash2/></Button></div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-1">Features:</h4>
                        <div className="space-y-2">
                            {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Input value={feature} onChange={e => handleFeatureChange(plan.id, index, e.target.value)} containerClassName="mb-0 flex-grow"/>
                                    <Button variant="danger" size="sm" onClick={() => handleRemoveFeature(plan.id, index)} className="p-1.5"><FiTrash2 size={14}/></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddFeature(plan.id)} leftIcon={<FiPlus/>}>Add Feature</Button>
                        </div>
                    </div>
                </div>
            ))}
            <Button onClick={handleAddPlan} leftIcon={<FiPlus/>}>Add New Plan</Button>
        </div>
    );
};

export default CMSPricingForm;
