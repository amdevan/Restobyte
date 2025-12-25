import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteHomePageContent, WebsiteService } from '@/types';
import { FiSave, FiCheckCircle, FiImage, FiCompass, FiAward, FiPlus, FiTrash2 } from 'react-icons/fi';

const HomepageContentPage: React.FC = () => {
    const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
    const [localContent, setLocalContent] = useState<WebsiteHomePageContent>(websiteSettings.homePageContent);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalContent(websiteSettings.homePageContent);
    }, [websiteSettings.homePageContent]);

    const handleSave = () => {
        const cleanedServices = (localContent.serviceSection.services || []).map(s => ({...s, id: s.id.startsWith('new-') ? `serv-${Date.now()}-${Math.random()}` : s.id}));
        const newContent = {
            ...localContent,
            serviceSection: { services: cleanedServices }
        };
        updateWebsiteSettings({ homePageContent: newContent });
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localContent) !== JSON.stringify(websiteSettings.homePageContent);

    // Banner handlers
    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalContent(prev => ({ ...prev, bannerSection: { ...prev.bannerSection, [name]: value } }));
    };
    const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalContent(prev => ({ ...prev, bannerSection: { ...prev.bannerSection, imageUrl: reader.result as string } }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Explore Menu handlers
    const handleExploreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalContent(prev => ({ ...prev, exploreMenuSection: { ...prev.exploreMenuSection, [name]: value } }));
    };
    const handleExploreImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalContent(prev => ({ ...prev, exploreMenuSection: { ...prev.exploreMenuSection, imageUrl: reader.result as string } }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Services handlers
    const handleServiceChange = (id: string, field: keyof Omit<WebsiteService, 'id'>, value: string) => {
        setLocalContent(prev => ({
            ...prev,
            serviceSection: {
                services: (prev.serviceSection.services || []).map(s => s.id === id ? { ...s, [field]: value } : s)
            }
        }));
    };
    const handleAddService = () => {
        const newService = { id: `new-${Date.now()}`, title: '', description: '', icon: 'FiGift' };
        setLocalContent(prev => ({
            ...prev,
            serviceSection: { services: [...(prev.serviceSection.services || []), newService] }
        }));
    };
    const handleRemoveService = (id: string) => {
        setLocalContent(prev => ({
            ...prev,
            serviceSection: { services: (prev.serviceSection.services || []).filter(s => s.id !== id) }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800">Homepage Content</h1>
                <div className="flex items-center space-x-3">
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty} leftIcon={<FiSave/>}>Save All Changes</Button>
                </div>
            </div>

            <Card title="Banner Section" icon={<FiImage/>}>
                <div className="p-4 space-y-4">
                    <Input label="Main Title" name="title" value={localContent.bannerSection.title} onChange={handleBannerChange} />
                    <Input label="Subtitle" name="subtitle" value={localContent.bannerSection.subtitle} onChange={handleBannerChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                        <input type="file" onChange={handleBannerImageChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                        {localContent.bannerSection.imageUrl && <img src={localContent.bannerSection.imageUrl} alt="Banner preview" className="mt-2 h-32 w-full object-cover rounded-md border" />}
                    </div>
                </div>
            </Card>

            <Card title="Service Section" icon={<FiAward/>}>
                <div className="p-4 space-y-4">
                    {(localContent.serviceSection.services || []).map(service => (
                        <div key={service.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center">
                            <div className="col-span-12 md:col-span-3"><Input label="Icon Name" value={service.icon} onChange={e => handleServiceChange(service.id, 'icon', e.target.value)} placeholder="e.g., FiAward" containerClassName="mb-0"/></div>
                            <div className="col-span-12 md:col-span-4"><Input label="Title" value={service.title} onChange={e => handleServiceChange(service.id, 'title', e.target.value)} containerClassName="mb-0"/></div>
                            <div className="col-span-12 md:col-span-4"><Input label="Description" value={service.description} onChange={e => handleServiceChange(service.id, 'description', e.target.value)} containerClassName="mb-0"/></div>
                            <div className="col-span-12 md:col-span-1 flex items-end">
                                <Button variant="danger" size="sm" onClick={() => handleRemoveService(service.id)} className="w-full md:w-auto"><FiTrash2/></Button>
                            </div>
                        </div>
                    ))}
                    <Button onClick={handleAddService} leftIcon={<FiPlus/>}>Add Service</Button>
                </div>
            </Card>

            <Card title="Explore Menu Section" icon={<FiCompass/>}>
                 <div className="p-4 space-y-4">
                    <Input label="Title" name="title" value={localContent.exploreMenuSection.title} onChange={handleExploreChange} />
                    <Input label="Subtitle" name="subtitle" value={localContent.exploreMenuSection.subtitle} onChange={handleExploreChange} />
                    <Input label="Button Text" name="buttonText" value={localContent.exploreMenuSection.buttonText} onChange={handleExploreChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <input type="file" onChange={handleExploreImageChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                        {localContent.exploreMenuSection.imageUrl && <img src={localContent.exploreMenuSection.imageUrl} alt="Explore menu preview" className="mt-2 h-32 w-full object-cover rounded-md border" />}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default HomepageContentPage;
