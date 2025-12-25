
import React from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiTrash2, FiImage } from 'react-icons/fi';

const ListPhotoPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const { gallery } = websiteSettings.homePageContent;

  const handleDelete = (photoId: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      const newGallery = gallery.filter(photo => photo.id !== photoId);
      updateWebsiteSettings({ homePageContent: { ...websiteSettings.homePageContent, gallery: newGallery } });
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4"><FiImage className="mr-3 text-sky-600"/>Photo Gallery</h2>
          {gallery.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No photos in the gallery. Go to "Add Photo" to upload images.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map(photo => (
                <div key={photo.id} className="relative group border rounded-lg overflow-hidden">
                  <img src={photo.url} alt={photo.caption || 'Gallery photo'} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex flex-col justify-between p-2">
                    <Button
                      onClick={() => handleDelete(photo.id)}
                      variant="danger"
                      size="sm"
                      className="p-1.5 aspect-square self-end opacity-0 group-hover:opacity-100"
                      aria-label="Delete Photo"
                    >
                      <FiTrash2 size={14} />
                    </Button>
                    {photo.caption && (
                      <p className="text-white text-xs bg-black bg-opacity-60 p-1 rounded self-start opacity-0 group-hover:opacity-100">{photo.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ListPhotoPage;
