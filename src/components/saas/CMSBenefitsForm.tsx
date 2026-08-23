import React, { useState, useEffect } from 'react';
import { SaasBenefit } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSBenefitsFormProps {
    benefits: SaasBenefit[];
    onUpdate: (benefits: SaasBenefit[]) => void;
}

const CMSBenefitsForm: React.FC<CMSBenefitsFormProps> = ({ benefits, onUpdate }) => {
    const [localBenefits, setLocalBenefits] = useState(benefits);

    useEffect(() => {
        setLocalBenefits(benefits);
    }, [benefits]);

    const handleChange = (id: string, field: keyof Omit<SaasBenefit, 'id'>, value: string) => {
        const updated = localBenefits.map(b => b.id === id ? { ...b, [field]: value } : b);
        setLocalBenefits(updated);
        onUpdate(updated);
    };

    const handleAdd = () => {
        const newItem: SaasBenefit = { id: `ben-${Date.now()}`, icon: 'FiCheckCircle', title: '', description: '' };
        const updated = [...localBenefits, newItem];
        setLocalBenefits(updated);
        onUpdate(updated);
    };

    const handleRemove = (id: string) => {
        const updated = localBenefits.filter(b => b.id !== id);
        setLocalBenefits(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4 p-4">
            {localBenefits.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg">
                    <div className="col-span-12 md:col-span-3">
                        <Input label="Icon Name" value={item.icon} onChange={e => handleChange(item.id, 'icon', e.target.value)} placeholder="FiCheckCircle" containerClassName="mb-0"/>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <Input label="Title" value={item.title} onChange={e => handleChange(item.id, 'title', e.target.value)} placeholder="Reduce errors" containerClassName="mb-0"/>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <Input label="Description" value={item.description} onChange={e => handleChange(item.id, 'description', e.target.value)} placeholder="Track management workflow..." containerClassName="mb-0"/>
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemove(item.id)} className="w-full md:w-auto"><FiTrash2/></Button>
                    </div>
                </div>
            ))}
            <Button onClick={handleAdd} leftIcon={<FiPlus/>}>Add Benefit</Button>
        </div>
    );
};

export default CMSBenefitsForm;
