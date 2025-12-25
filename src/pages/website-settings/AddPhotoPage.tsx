import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsiteGalleryPhoto } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiCamera, FiSave, FiCheckCircle } from 'react-icons/fi';

const AddPhotoPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = () => {
    if (!url.trim()) {
      alert('Photo is required.');
      return;
    }
    const newPhoto: WebsiteGalleryPhoto = {
      id: `gal-${Date.now()}`,
      url,
      caption: caption.trim() || undefined,
    };
    const newGallery = [...websiteSettings.homePageContent.gallery, newPhoto];
    updateWebsiteSettings({ homePageContent: { ...websiteSettings.homePageContent, gallery: newGallery } });
    
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
    
    // Reset form
    setUrl('');
    setCaption('');
  };

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiCamera className="mr-3 text-sky-600"/>Add Photo to Gallery</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Add a new photo to your website's public gallery. You can manage all photos from the "List Photo" page.</p>
          <div className="space-y-4 border-t pt-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo *</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    required
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
            </div>
            <Input label="Caption (Optional)" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g., Our delicious lasagna" />
            {url && <img src={url} alt="Preview" className="w-full h-48 object-cover rounded-md mt-2 border" />}
             <div className="flex items-center space-x-3 h-10">
                <Button onClick={handleAddPhoto} leftIcon={<FiSave />}>Add Photo</Button>
                {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Photo Added!</span>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AddPhotoPage;
