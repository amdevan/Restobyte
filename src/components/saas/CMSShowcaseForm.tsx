import React, { useState, useEffect } from 'react';
import { SaasShowcase } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSShowcaseFormProps {
    showcase: SaasShowcase;
    onUpdate: (showcase: SaasShowcase) => void;
}

const CMSShowcaseForm: React.FC<CMSShowcaseFormProps> = ({ showcase, onUpdate }) => {
    const [local, setLocal] = useState(showcase);

    useEffect(() => {
        setLocal(showcase);
    }, [showcase]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updated = { ...local, [name]: value };
        setLocal(updated);
        onUpdate(updated);
    };

    const handleFeatureChange = (id: string, field: 'title' | 'description', value: string) => {
        const updatedFeatures = local.features.map(f => f.id === id ? { ...f, [field]: value } : f);
        const updated = { ...local, features: updatedFeatures };
        setLocal(updated);
        onUpdate(updated);
    };

    const handleAddFeature = () => {
        const newFeature = { id: `sf-${Date.now()}`, title: '', description: '' };
        const updated = { ...local, features: [...local.features, newFeature] };
        setLocal(updated);
        onUpdate(updated);
    };

    const handleRemoveFeature = (id: string) => {
        const updated = { ...local, features: local.features.filter(f => f.id !== id) };
        setLocal(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4 p-4">
            <Input label="Badge Text" name="badge" value={local.badge} onChange={handleFieldChange} placeholder="Efficiency First" />
            <Input label="Title" name="title" value={local.title} onChange={handleFieldChange} placeholder="Engineered for the Rush Hour" />
            <Input label="Subtitle" name="subtitle" value={local.subtitle} onChange={handleFieldChange} placeholder="Stop wrestling with legacy systems..." />
            <Input label="Image URL" name="imageUrl" value={local.imageUrl} onChange={handleFieldChange} placeholder="https://images.unsplash.com/..." />

            <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Showcase Features</h4>
                {local.features.map(feature => (
                    <div key={feature.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg mb-2">
                        <div className="col-span-12 md:col-span-5">
                            <Input label="Title" value={feature.title} onChange={e => handleFeatureChange(feature.id, 'title', e.target.value)} placeholder="4x Faster Checkout" containerClassName="mb-0"/>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <Input label="Description" value={feature.description} onChange={e => handleFeatureChange(feature.id, 'description', e.target.value)} placeholder="Proprietary billing flow..." containerClassName="mb-0"/>
                        </div>
                        <div className="col-span-12 md:col-span-1 flex items-end">
                            <Button variant="danger" size="sm" onClick={() => handleRemoveFeature(feature.id)} className="w-full md:w-auto"><FiTrash2/></Button>
                        </div>
                    </div>
                ))}
                <Button onClick={handleAddFeature} leftIcon={<FiPlus/>}>Add Feature</Button>
            </div>
        </div>
    );
};

export default CMSShowcaseForm;
