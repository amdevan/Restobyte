
import React, { useState, useEffect } from 'react';
import { SaasTestimonial } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSTestimonialsFormProps {
    testimonials: SaasTestimonial[];
    onUpdate: (testimonials: SaasTestimonial[]) => void;
}

const CMSTestimonialsForm: React.FC<CMSTestimonialsFormProps> = ({ testimonials, onUpdate }) => {
    const [localTestimonials, setLocalTestimonials] = useState(testimonials);

    useEffect(() => {
        setLocalTestimonials(testimonials);
    }, [testimonials]);

    const updateTestimonials = (updatedTestimonials: SaasTestimonial[]) => {
        setLocalTestimonials(updatedTestimonials);
        onUpdate(updatedTestimonials);
    };

    const handleChange = (id: string, field: keyof Omit<SaasTestimonial, 'id'>, value: string) => {
        updateTestimonials(localTestimonials.map(t => t.id === id ? { ...t, [field]: value } : t));
    };
    
    const handleImageChange = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange(id, 'imageUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTestimonial = () => {
        const newTestimonial: SaasTestimonial = { 
            id: `new-${Date.now()}`, 
            storeName: '', 
            result: '', 
            description: '',
            imageUrl: ''
        };
        updateTestimonials([...localTestimonials, newTestimonial]);
    };

    const handleRemoveTestimonial = (id: string) => {
        updateTestimonials(localTestimonials.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-4 p-4">
            {localTestimonials.map(testimonial => (
                <div key={testimonial.id} className="p-4 border rounded-lg space-y-3 bg-gray-50/50">
                    <div className="flex justify-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemoveTestimonial(testimonial.id)}><FiTrash2/></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Store/Company Name" value={testimonial.storeName} onChange={e => handleChange(testimonial.id, 'storeName', e.target.value)} containerClassName="mb-0"/>
                        <Input label="Person & Title" value={testimonial.result} onChange={e => handleChange(testimonial.id, 'result', e.target.value)} placeholder="e.g., Maria Garcia, Owner" containerClassName="mb-0"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content</label>
                        <textarea
                            value={testimonial.description}
                            onChange={e => handleChange(testimonial.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Person's Image</label>
                         <input 
                            type="file" 
                            onChange={(e) => handleImageChange(testimonial.id, e)} 
                            accept="image/*" 
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                        />
                        {testimonial.imageUrl && <img src={testimonial.imageUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-full border" />}
                    </div>
                </div>
            ))}
            <Button onClick={handleAddTestimonial} leftIcon={<FiPlus/>}>Add Testimonial</Button>
        </div>
    );
};

export default CMSTestimonialsForm;