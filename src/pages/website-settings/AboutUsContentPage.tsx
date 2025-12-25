import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteAboutUsContent } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiBookOpen, FiSave, FiCheckCircle } from 'react-icons/fi';

const AboutUsContentPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [content, setContent] = useState<WebsiteAboutUsContent>(websiteSettings.aboutUsContent);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setContent(websiteSettings.aboutUsContent);
  }, [websiteSettings.aboutUsContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setContent(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateWebsiteSettings({ aboutUsContent: content });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(content) !== JSON.stringify(websiteSettings.aboutUsContent);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiBookOpen className="mr-3 text-sky-600"/>About Us Content</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage the content for your website's "About Us" page.</p>
          <div className="space-y-4 border-t pt-6">
            <Input label="Title" name="title" value={content.title} onChange={handleChange} />
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                    id="content"
                    name="content"
                    value={content.content}
                    onChange={handleChange}
                    rows={8}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
            </div>
            {content.imageUrl && <img src={content.imageUrl} alt="About us preview" className="w-full h-48 object-cover rounded-md mt-2" />}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutUsContentPage;
