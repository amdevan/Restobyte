import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteExploreMenuSection } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiCompass, FiSave, FiCheckCircle } from 'react-icons/fi';

const ExploreMenuSectionPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [section, setSection] = useState<WebsiteExploreMenuSection>(websiteSettings.homePageContent.exploreMenuSection);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSection(websiteSettings.homePageContent.exploreMenuSection);
  }, [websiteSettings.homePageContent.exploreMenuSection]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSection(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSection(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateWebsiteSettings({ homePageContent: { ...websiteSettings.homePageContent, exploreMenuSection: section } });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(section) !== JSON.stringify(websiteSettings.homePageContent.exploreMenuSection);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiCompass className="mr-3 text-sky-600"/>Explore Menu Section</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Customize the call-to-action section that prompts users to view your menu.</p>
          <div className="space-y-4 border-t pt-6">
            <Input label="Title" name="title" value={section.title} onChange={handleChange} />
            <Input label="Subtitle" name="subtitle" value={section.subtitle} onChange={handleChange} />
            <Input label="Button Text" name="buttonText" value={section.buttonText} onChange={handleChange} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
            </div>
            {section.imageUrl && <img src={section.imageUrl} alt="Explore menu preview" className="w-full h-48 object-cover rounded-md mt-2" />}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExploreMenuSectionPage;