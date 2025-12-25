import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Variation, Addon, SaleItem, AddonGroup } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FiPlus, FiCheck } from 'react-icons/fi';

interface ItemCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onSave: (configuredItem: SaleItem) => void;
}

const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const { addonGroups: allAddonGroups } = useRestaurantData();
  
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, Addon[]>>({});

  useEffect(() => {
    if (isOpen && item) {
      // Set default variation
      setSelectedVariation(item.variations?.[0] || null);
      // Reset selected addons
      setSelectedAddons({});
    }
  }, [isOpen, item]);

  const itemAddonGroups = useMemo(() => {
    return (item.addonGroupIds || [])
      .map(id => allAddonGroups.find(g => g.id === id))
      .filter((g): g is AddonGroup => !!g);
  }, [item.addonGroupIds, allAddonGroups]);

  const handleAddonToggle = (group: AddonGroup, addon: Addon) => {
    setSelectedAddons(prev => {
      const currentGroupAddons = prev[group.id] || [];
      const isSelected = currentGroupAddons.some(a => a.id === addon.id);
      
      let newGroupAddons;
      if (isSelected) {
        newGroupAddons = currentGroupAddons.filter(a => a.id !== addon.id);
      } else {
        newGroupAddons = [...currentGroupAddons, addon];
      }
      
      return { ...prev, [group.id]: newGroupAddons };
    });
  };

  const totalAddonPrice = useMemo(() => {
    return Object.values(selectedAddons).flat().reduce((sum, addon) => sum + addon.price, 0);
  }, [selectedAddons]);

  const totalItemPrice = useMemo(() => {
    return (selectedVariation?.price || 0) + totalAddonPrice;
  }, [selectedVariation, totalAddonPrice]);
  
  const handleSaveClick = () => {
    if (!selectedVariation) {
      alert("Please select a variation.");
      return;
    }

    const addons = Object.values(selectedAddons).flat();
    let itemName = item.name;
    if (item.variations.length > 1) {
      itemName += ` (${selectedVariation.name})`;
    }
    
    // Create a detailed note from addons
    const addonNotes = addons.map(a => `+ ${a.name} ($${a.price.toFixed(2)})`).join('\n');
    
    const configuredItem: SaleItem = {
      id: item.id,
      name: itemName,
      price: totalItemPrice,
      basePrice: selectedVariation.price,
      quantity: 1,
      isVeg: item.isVeg,
      notes: addonNotes,
    };

    onSave(configuredItem);
  };
  
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Customize ${item.name}`} size="lg">
      <div className="space-y-6">
        {/* Variations */}
        {item.variations && item.variations.length > 1 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Size/Variation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {item.variations.map(variation => (
                <button
                  key={variation.name}
                  onClick={() => setSelectedVariation(variation)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedVariation?.name === variation.name
                      ? 'bg-sky-600 text-white border-sky-700 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-sky-500'
                  }`}
                >
                  <p className="font-semibold">{variation.name}</p>
                  <p className="text-sm">${variation.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {itemAddonGroups.map(group => (
          <div key={group.id}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{group.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {group.addons.map(addon => {
                const isSelected = selectedAddons[group.id]?.some(a => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => handleAddonToggle(group, addon)}
                     className={`p-3 rounded-lg border-2 text-left transition-all relative ${
                        isSelected
                          ? 'bg-sky-100 text-sky-800 border-sky-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-sky-400'
                      }`}
                  >
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-xs">+${addon.price.toFixed(2)}</p>
                    {isSelected && <FiCheck className="absolute top-2 right-2 text-sky-600"/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Footer with total and actions */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div>
            <p className="text-gray-600">Total Price</p>
            <p className="text-3xl font-bold text-sky-700">${totalItemPrice.toFixed(2)}</p>
          </div>
          <Button onClick={handleSaveClick} size="lg" className="!text-base" leftIcon={<FiPlus />}>
            Add to Order
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemCustomizationModal;