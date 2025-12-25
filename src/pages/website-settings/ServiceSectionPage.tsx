import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteService } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiPlus, FiTrash2, FiSave, FiCheckCircle, FiAward } from 'react-icons/fi';

const ServiceSectionPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [services, setServices] = useState<WebsiteService[]>(websiteSettings.homePageContent.serviceSection.services);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setServices(websiteSettings.homePageContent.serviceSection.services);
  }, [websiteSettings.homePageContent.serviceSection.services]);

  const handleAddService = () => {
    setServices([...services, { id: `new-${Date.now()}`, title: '', description: '', icon: 'FiGift' }]);
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const handleServiceChange = (id: string, field: keyof Omit<WebsiteService, 'id'>, value: string) => {
    setServices(services.map(service => service.id === id ? { ...service, [field]: value } : service));
  };
  
  const handleSave = () => {
    const cleanedServices = services.map(s => ({...s, id: s.id.startsWith('new-') ? `serv-${Date.now()}-${Math.random()}` : s.id}));
    updateWebsiteSettings({ homePageContent: { ...websiteSettings.homePageContent, serviceSection: { services: cleanedServices } } });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };
  
  const isDirty = JSON.stringify(services) !== JSON.stringify(websiteSettings.homePageContent.serviceSection.services);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiAward className="mr-3 text-sky-600"/>Service Section</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage the services you want to highlight on your homepage.</p>
          <div className="space-y-4 border-t pt-6">
            {services.map(service => (
              <div key={service.id} className="p-4 border rounded-lg grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 md:col-span-4"><Input containerClassName='mb-0' label="Title" value={service.title} onChange={e => handleServiceChange(service.id, 'title', e.target.value)} /></div>
                <div className="col-span-12 md:col-span-6"><Input containerClassName='mb-0' label="Description" value={service.description} onChange={e => handleServiceChange(service.id, 'description', e.target.value)} /></div>
                <div className="col-span-12 md:col-span-2 flex justify-end">
                  <Button variant="danger" size="sm" onClick={() => handleRemoveService(service.id)}><FiTrash2/></Button>
                </div>
              </div>
            ))}
            <Button onClick={handleAddService} leftIcon={<FiPlus/>}>Add Service</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServiceSectionPage;