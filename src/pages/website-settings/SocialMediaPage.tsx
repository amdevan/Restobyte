
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteSocialMediaLink } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiPlus, FiTrash2, FiSave, FiCheckCircle, FiShare2 } from 'react-icons/fi';

const SOCIAL_PLATFORMS: WebsiteSocialMediaLink['platform'][] = ['Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn'];

const SocialMediaPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [links, setLinks] = useState<WebsiteSocialMediaLink[]>(websiteSettings.homePageContent.socialMedia);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setLinks(websiteSettings.homePageContent.socialMedia);
  }, [websiteSettings.homePageContent.socialMedia]);

  const handleAddLink = () => {
    setLinks([...links, { id: `new-${Date.now()}`, platform: 'Facebook', url: '' }]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const handleLinkChange = (id: string, field: keyof Omit<WebsiteSocialMediaLink, 'id'>, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, [field]: value } : link));
  };

  const handleSave = () => {
    const cleanedLinks = links
      .filter(l => l.url.trim() !== '')
      .map(l => ({ ...l, id: l.id.startsWith('new-') ? `sm-${Date.now()}-${Math.random()}` : l.id }));
    updateWebsiteSettings({ homePageContent: { ...websiteSettings.homePageContent, socialMedia: cleanedLinks } });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(links) !== JSON.stringify(websiteSettings.homePageContent.socialMedia);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiShare2 className="mr-3 text-sky-600"/>Social Media Links</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 text-sm flex items-center"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage the social media profile links for your website's footer or contact section.</p>
          <div className="space-y-3 border-t pt-6">
            {links.map(link => (
              <div key={link.id} className="p-3 border rounded-lg grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-medium text-gray-600">Platform</label>
                    <select
                        value={link.platform}
                        onChange={e => handleLinkChange(link.id, 'platform', e.target.value as WebsiteSocialMediaLink['platform'])}
                        className="w-full p-2 border border-gray-300 rounded-md sm:text-sm"
                    >
                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="col-span-12 md:col-span-7"><Input containerClassName='mb-0' label="URL" value={link.url} onChange={e => handleLinkChange(link.id, 'url', e.target.value)} /></div>
                <div className="col-span-12 md:col-span-1 flex justify-end">
                  <Button variant="danger" size="sm" onClick={() => handleRemoveLink(link.id)}><FiTrash2/></Button>
                </div>
              </div>
            ))}
            <Button onClick={handleAddLink} leftIcon={<FiPlus/>}>Add Link</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SocialMediaPage;
