import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteBannerSection } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiImage, FiSave, FiCheckCircle } from 'react-icons/fi';

const BannerSectionPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [banner, setBanner] = useState<WebsiteBannerSection>(websiteSettings.homePageContent.bannerSection);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setBanner(websiteSettings.homePageContent.bannerSection);
  }, [websiteSettings.homePageContent.bannerSection]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBanner(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setBanner(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateWebsiteSettings({ 
      homePageContent: { ...websiteSettings.homePageContent, bannerSection: banner }
    });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(banner) !== JSON.stringify(websiteSettings.homePageContent.bannerSection);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiImage className="mr-3 text-sky-600"/>Banner Section</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Set the content for the main banner on your website's homepage.</p>
          <div className="space-y-4 border-t pt-6">
            <Input label="Main Title" name="title" value={banner.title} onChange={handleChange} />
            <Input label="Subtitle" name="subtitle" value={banner.subtitle} onChange={handleChange} />
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
            </div>
            {banner.imageUrl && <img src={banner.imageUrl} alt="Banner preview" className="w-full h-48 object-cover rounded-md mt-2" />}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BannerSectionPage;