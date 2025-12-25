
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteSocialLoginSettings } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiUserCheck, FiSave, FiCheckCircle } from 'react-icons/fi';

const SocialLoginSettingPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [settings, setSettings] = useState<WebsiteSocialLoginSettings>(websiteSettings.socialLogin);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(websiteSettings.socialLogin);
  }, [websiteSettings.socialLogin]);

  const handleToggle = (provider: keyof WebsiteSocialLoginSettings) => {
    setSettings(prev => ({ ...prev, [provider]: !prev[provider] }));
  };
  
  const handleSave = () => {
    updateWebsiteSettings({ socialLogin: settings });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(websiteSettings.socialLogin);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiUserCheck className="mr-3 text-sky-600"/>Social Login Settings</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <div className="space-y-4 border-t pt-6">
            {Object.keys(settings).map(key => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 capitalize">{key} Login</span>
                <button
                  onClick={() => handleToggle(key as keyof WebsiteSocialLoginSettings)}
                  role="switch"
                  aria-checked={settings[key as keyof WebsiteSocialLoginSettings]}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${settings[key as keyof WebsiteSocialLoginSettings] ? 'bg-sky-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings[key as keyof WebsiteSocialLoginSettings] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SocialLoginSettingPage;
