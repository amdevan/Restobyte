
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteEmailSettings } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiMail, FiSave, FiCheckCircle } from 'react-icons/fi';

const EmailSettingPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [settings, setSettings] = useState<WebsiteEmailSettings>(websiteSettings.emailSettings);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(websiteSettings.emailSettings);
  }, [websiteSettings.emailSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'port' ? parseInt(value, 10) : value }));
  };

  const handleSave = () => {
    updateWebsiteSettings({ emailSettings: settings });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(websiteSettings.emailSettings);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiMail className="mr-3 text-sky-600"/>Email Settings</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 text-sm flex items-center"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Configure your SMTP settings for sending transactional emails (e.g., order confirmations).</p>
          <div className="space-y-4 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="From Name" name="fromName" value={settings.fromName || ''} onChange={handleChange} placeholder="Your Restaurant Name" />
                <Input label="From Address" name="fromAddress" type="email" value={settings.fromAddress || ''} onChange={handleChange} placeholder="noreply@your-restaurant.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="SMTP Host" name="host" value={settings.host || ''} onChange={handleChange} placeholder="smtp.mailtrap.io" />
                <Input label="SMTP Port" name="port" type="number" value={settings.port || ''} onChange={handleChange} placeholder="2525" />
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                     <select name="encryption" value={settings.encryption || 'none'} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                         <option value="none">None</option>
                         <option value="tls">TLS</option>
                         <option value="ssl">SSL</option>
                     </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="SMTP Username" name="username" value={settings.username || ''} onChange={handleChange} />
                <Input label="SMTP Password" name="password" type="password" value={settings.password || ''} onChange={handleChange} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailSettingPage;
