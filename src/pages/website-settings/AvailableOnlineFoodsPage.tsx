
import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiList, FiSave, FiCheckCircle, FiSearch } from 'react-icons/fi';
import { Variation } from '@/types';
import { getMenuItems } from '@/services/api';

const AvailableOnlineFoodsPage: React.FC = () => {
  const { menuItems, websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>(websiteSettings.availableOnlineFoodIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [serverMenuItems, setServerMenuItems] = useState<typeof menuItems | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFoodIds(websiteSettings.availableOnlineFoodIds);
  }, [websiteSettings.availableOnlineFoodIds]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    getMenuItems()
      .then(items => {
        if (!isMounted) return;
        setServerMenuItems(items);
      })
      .catch(err => {
        if (!isMounted) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const getPriceDisplay = (variations: Variation[]): string => {
    if (!variations || variations.length === 0) {
        return '--.--';
    }
    if (variations.length === 1) {
        return variations[0].price.toFixed(2);
    }
    const prices = variations.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
        return minPrice.toFixed(2);
    }
    return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
  };

  const handleSelectionChange = (itemId: string) => {
    setSelectedFoodIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const sourceMenuItems = serverMenuItems ?? menuItems;
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return sourceMenuItems;
    return sourceMenuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sourceMenuItems, searchTerm]);

  const handleSelectAll = () => setSelectedFoodIds(filteredMenuItems.map(item => item.id));
  const handleDeselectAll = () => setSelectedFoodIds([]);

  const handleSave = () => {
    updateWebsiteSettings({ availableOnlineFoodIds: selectedFoodIds });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify([...selectedFoodIds].sort()) !== JSON.stringify([...websiteSettings.availableOnlineFoodIds].sort());

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiList className="mr-3 text-sky-600"/>Available Online Foods</h2>
             <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Select which menu items should be visible and orderable on your website.</p>
          <div className="text-xs text-gray-600 mb-2">
            {isLoading ? (
              <span>Loading menu items from server…</span>
            ) : loadError ? (
              <span className="text-red-600">Server load failed: {loadError}. Showing local items.</span>
            ) : serverMenuItems ? (
              <span>Loaded {serverMenuItems.length} items from server.</span>
            ) : (
              <span>Showing local items.</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
             <Input placeholder="Search food items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<FiSearch/>} containerClassName="mb-0"/>
             <div className="space-x-2">
                 <Button onClick={handleSelectAll} variant="secondary" size="sm">Select All (Visible)</Button>
                 <Button onClick={handleDeselectAll} variant="secondary" size="sm">Deselect All</Button>
            </div>
          </div>
          <div className="space-y-2 border rounded-lg p-2 max-h-[60vh] overflow-y-auto">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map(item => (
                <label key={item.id} className="flex items-center p-3 hover:bg-gray-100 rounded-md cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    checked={selectedFoodIds.includes(item.id)}
                    onChange={() => handleSelectionChange(item.id)}
                  />
                  <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/40/40`} alt={item.name} className="w-10 h-10 rounded-md object-cover ml-4 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} - ${getPriceDisplay(item.variations)}</p>
                  </div>
                </label>
              ))
            ) : <p className="text-center text-gray-500 py-6">No menu items match your search.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AvailableOnlineFoodsPage;
