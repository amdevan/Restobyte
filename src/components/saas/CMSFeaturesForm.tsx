import React, { useState, useEffect } from 'react';
import { SaasFeature } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSFeaturesFormProps {
    features: SaasFeature[];
    onUpdate: (features: SaasFeature[]) => void;
}

const CMSFeaturesForm: React.FC<CMSFeaturesFormProps> = ({ features, onUpdate }) => {
    const [localFeatures, setLocalFeatures] = useState(features);

    useEffect(() => {
        setLocalFeatures(features);
    }, [features]);

    const handleChange = (id: string, field: keyof Omit<SaasFeature, 'id'>, value: string) => {
        const updatedFeatures = localFeatures.map(f => f.id === id ? { ...f, [field]: value } : f);
        setLocalFeatures(updatedFeatures);
        onUpdate(updatedFeatures);
    };
    
    const handleAddFeature = () => {
        const newFeature: SaasFeature = { id: `new-${Date.now()}`, icon: 'FiGift', title: '', description: '' };
        const updatedFeatures = [...localFeatures, newFeature];
        setLocalFeatures(updatedFeatures);
        onUpdate(updatedFeatures);
    };

    const handleRemoveFeature = (id: string) => {
        const updatedFeatures = localFeatures.filter(f => f.id !== id);
        setLocalFeatures(updatedFeatures);
        onUpdate(updatedFeatures);
    };

    return (
        <div className="space-y-4 p-4">
            {localFeatures.map(feature => (
                <div key={feature.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg">
                    <div className="col-span-12 md:col-span-4"><Input label="Icon Name" value={feature.icon} onChange={e => handleChange(feature.id, 'icon', e.target.value)} placeholder="e.g., FiShoppingCart" containerClassName="mb-0"/></div>
                    <div className="col-span-12 md:col-span-3"><Input label="Title" value={feature.title} onChange={e => handleChange(feature.id, 'title', e.target.value)} containerClassName="mb-0"/></div>
                    <div className="col-span-12 md:col-span-4"><Input label="Description" value={feature.description} onChange={e => handleChange(feature.id, 'description', e.target.value)} containerClassName="mb-0"/></div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemoveFeature(feature.id)} className="w-full md:w-auto"><FiTrash2/></Button>
                    </div>
                </div>
            ))}
            <Button onClick={handleAddFeature} leftIcon={<FiPlus/>}>Add Feature</Button>
        </div>
    );
};

export default CMSFeaturesForm;
