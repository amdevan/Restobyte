
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteWhiteLabelSettings } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiImage, FiSave, FiEye, FiCheckCircle } from 'react-icons/fi';

const WebsiteWhiteLabelPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [settings, setSettings] = useState<WebsiteWhiteLabelSettings>(websiteSettings.whiteLabel);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(websiteSettings.whiteLabel);
  }, [websiteSettings.whiteLabel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };


  const handleSave = () => {
    updateWebsiteSettings({ whiteLabel: settings });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };
  
  const isDirty = JSON.stringify(settings) !== JSON.stringify(websiteSettings.whiteLabel);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiEye className="mr-3 text-sky-600"/>Website White Label</h2>
                <div className="flex items-center space-x-3 h-10">
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">Customize the branding of your customer-facing website.</p>
            <div className="space-y-4 border-t pt-6">
                <Input label="Application Name" name="appName" value={settings.appName} onChange={handleChange} />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <input type="file" name="logoUrl" onChange={e => handleFileChange(e, 'logoUrl')} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                    {settings.logoUrl && <img src={settings.logoUrl} alt="Logo preview" className="mt-2 h-20 bg-gray-100 p-2 rounded-md border object-contain" />}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                    <input type="file" name="faviconUrl" onChange={e => handleFileChange(e, 'faviconUrl')} accept="image/x-icon,image/png,image/svg+xml" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                    {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon preview" className="mt-2 h-10 w-10 bg-gray-100 p-1 rounded-md border object-contain" />}
                </div>

                <div>
                    <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            id="primaryColor"
                            name="primaryColor"
                            value={settings.primaryColor}
                            onChange={handleChange}
                            className="p-1 h-10 w-10 block bg-white border border-gray-300 cursor-pointer rounded-lg"
                        />
                        <Input
                            type="text"
                            name="primaryColor"
                            value={settings.primaryColor}
                            onChange={handleChange}
                            className="font-mono"
                            containerClassName="mb-0 flex-grow"
                        />
                    </div>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default WebsiteWhiteLabelPage;
