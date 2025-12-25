

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasSeo } from '@/types';
import { FiSave, FiCheckCircle, FiSearch } from 'react-icons/fi';

const SeoPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent } = useRestaurantData();
    const [localSeo, setLocalSeo] = useState<SaasSeo>(saasWebsiteContent.seo);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalSeo(saasWebsiteContent.seo);
    }, [saasWebsiteContent.seo]);

    const handleChange = (field: keyof SaasSeo, value: string) => {
        setLocalSeo(prev => ({ ...prev, [field]: value }));
    };
    
    const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('faviconUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        updateSaasWebsiteContent(prev => ({ ...prev, seo: localSeo }));
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localSeo) !== JSON.stringify(saasWebsiteContent.seo);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiSearch className="mr-3" /> SEO Management
                </h1>
                <div className="flex items-center space-x-3">
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty} leftIcon={<FiSave/>}>
                        Save SEO Settings
                    </Button>
                </div>
            </div>

            <Card>
                <div className="p-4 space-y-4">
                    <Input
                        label="Site Title"
                        value={localSeo.title}
                        onChange={e => handleChange('title', e.target.value)}
                        placeholder="e.g., RestoByte | Restaurant Management Software"
                    />
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <textarea
                            value={localSeo.description}
                            onChange={e => handleChange('description', e.target.value)}
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="A short description of your website for search engines."
                        />
                        <p className="text-xs text-gray-500 mt-1">Recommended length: 50-160 characters.</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                        <input 
                            type="file" 
                            onChange={handleFaviconChange} 
                            accept="image/x-icon,image/png,image/svg+xml" 
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                        />
                        {localSeo.faviconUrl && <img src={localSeo.faviconUrl} alt="Favicon Preview" className="mt-2 h-10 w-10 p-1 border rounded" />}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SeoPage;