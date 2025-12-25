
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteContactUsContent } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiPhone, FiMail, FiMapPin, FiSave, FiCheckCircle } from 'react-icons/fi';

const ContactUsContentPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [content, setContent] = useState<WebsiteContactUsContent>(websiteSettings.contactUsContent);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setContent(websiteSettings.contactUsContent);
  }, [websiteSettings.contactUsContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    updateWebsiteSettings({ contactUsContent: content });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };
  
  const isDirty = JSON.stringify(content) !== JSON.stringify(websiteSettings.contactUsContent);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiMapPin className="mr-3 text-sky-600"/>Contact Us Content</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Update the contact information displayed on your website.</p>
          <div className="space-y-4 border-t pt-6">
            <Input label="Address" name="address" value={content.address} onChange={handleChange} leftIcon={<FiMapPin/>} />
            <Input label="Phone" name="phone" value={content.phone} onChange={handleChange} leftIcon={<FiPhone/>} />
            <Input label="Email" name="email" value={content.email} onChange={handleChange} type="email" leftIcon={<FiMail/>} />
            <Input label="Google Maps Embed URL (Optional)" name="mapUrl" value={content.mapUrl || ''} onChange={handleChange} placeholder="https://www.google.com/maps/embed?..." />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContactUsContentPage;
