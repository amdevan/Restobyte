import React, { useState, useEffect } from 'react';
import { SaasFaqItem } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSFaqFormProps {
    faq: SaasFaqItem[];
    onUpdate: (faq: SaasFaqItem[]) => void;
}

const CMSFaqForm: React.FC<CMSFaqFormProps> = ({ faq, onUpdate }) => {
    const [localFaq, setLocalFaq] = useState(faq);

    useEffect(() => {
        setLocalFaq(faq);
    }, [faq]);

    const handleChange = (id: string, field: keyof Omit<SaasFaqItem, 'id'>, value: string) => {
        const updated = localFaq.map(f => f.id === id ? { ...f, [field]: value } : f);
        setLocalFaq(updated);
        onUpdate(updated);
    };

    const handleAdd = () => {
        const newItem: SaasFaqItem = { id: `faq-${Date.now()}`, question: '', answer: '' };
        const updated = [...localFaq, newItem];
        setLocalFaq(updated);
        onUpdate(updated);
    };

    const handleRemove = (id: string) => {
        const updated = localFaq.filter(f => f.id !== id);
        setLocalFaq(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4 p-4">
            {localFaq.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg">
                    <div className="col-span-12 md:col-span-5">
                        <Input label="Question" value={item.question} onChange={e => handleChange(item.id, 'question', e.target.value)} placeholder="How long does setup take?" containerClassName="mb-0"/>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                        <Input label="Answer" value={item.answer} onChange={e => handleChange(item.id, 'answer', e.target.value)} placeholder="Most restaurants are up and running within 24-48 hours." containerClassName="mb-0"/>
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemove(item.id)} className="w-full md:w-auto"><FiTrash2/></Button>
                    </div>
                </div>
            ))}
            <Button onClick={handleAdd} leftIcon={<FiPlus/>}>Add FAQ Item</Button>
        </div>
    );
};

export default CMSFaqForm;
