
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteCommonMenuPage as CommonMenuSettings } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiMenu, FiSave, FiCheckCircle } from 'react-icons/fi';

const CommonMenuPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [settings, setSettings] = useState<CommonMenuSettings>(websiteSettings.commonMenuPage);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(websiteSettings.commonMenuPage);
  }, [websiteSettings.commonMenuPage]);

  const handleSave = () => {
    updateWebsiteSettings({ commonMenuPage: settings });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };
  
  const isDirty = JSON.stringify(settings) !== JSON.stringify(websiteSettings.commonMenuPage);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiMenu className="mr-3 text-sky-600"/>Common Menu Page Settings</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Set a global title for your main online menu page.</p>
          <div className="border-t pt-6">
            <Input label="Menu Page Title" name="title" value={settings.title} onChange={e => setSettings({title: e.target.value})} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommonMenuPage;
