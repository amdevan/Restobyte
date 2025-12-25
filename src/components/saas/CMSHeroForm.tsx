import React, { useState, useEffect } from 'react';
import { SaasWebsiteContent } from '../../types';
import Input from '../common/Input';
import RichTextEditor from '../common/RichTextEditor';

interface CMSHeroFormProps {
    hero: SaasWebsiteContent['hero'];
    onUpdate: (hero: SaasWebsiteContent['hero']) => void;
}

const CMSHeroForm: React.FC<CMSHeroFormProps> = ({ hero, onUpdate }) => {
    const [localHero, setLocalHero] = useState(hero);

    useEffect(() => {
        setLocalHero(hero);
    }, [hero]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedHero = { ...localHero, [name]: value };
        setLocalHero(updatedHero);
        onUpdate(updatedHero);
    };

    const handleSubtitleChange = (html: string) => {
        const updatedHero = { ...localHero, subtitle: html };
        setLocalHero(updatedHero);
        onUpdate(updatedHero);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedHero = { ...localHero, imageUrl: reader.result as string };
                setLocalHero(updatedHero);
                onUpdate(updatedHero);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4 p-4">
            <Input label="Title" name="title" value={localHero.title} onChange={handleChange} />
            <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <RichTextEditor
                    value={localHero.subtitle}
                    onChange={handleSubtitleChange}
                    placeholder="Write a compelling subtitle..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {localHero.imageUrl && <img src={localHero.imageUrl} alt="Hero Preview" className="mt-2 h-32 w-full object-cover rounded-md border" />}
            </div>
        </div>
    );
};

export default CMSHeroForm;
