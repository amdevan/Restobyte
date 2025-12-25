import React, { useState } from 'react';
import { FiPlusCircle, FiBox } from 'react-icons/fi'; // FiBox for generic item icon
import MenuItemCard from '@/components/menu/MenuItemCard'; // Reusing MenuItemCard
import AddPreMadeFoodForm from './AddPreMadeFoodForm'; // Specific form for pre-made
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PreMadeFoodItem } from '@/types'; // Using PreMadeFoodItem (alias of MenuItem)

const ListPreMadeFoodPage: React.FC = () => {
  const { 
    preMadeFoodItems, 
    addPreMadeFoodItem, 
    updatePreMadeFoodItem, 
    deletePreMadeFoodItem 
  } = useRestaurantData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreMadeFoodItem | null>(null);

  const handleOpenModal = (item?: PreMadeFoodItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitItem = (itemData: Omit<PreMadeFoodItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => {
    addPreMadeFoodItem(itemData, imageUrl, isVeg);
    handleCloseModal();
  };
  
  const handleUpdateItem = (itemData: PreMadeFoodItem) => {
    updatePreMadeFoodItem(itemData);
    handleCloseModal();
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this pre-made food item?")) {
      deletePreMadeFoodItem(itemId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Pre-Made Food</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Item
        </Button>
      </div>

      {preMadeFoodItems.length === 0 ? (
        <div className="text-center py-10">
          <FiBox size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No pre-made food items yet.</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add New Item" to add pre-made dishes or packs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {preMadeFoodItems.map(item => (
            <MenuItemCard // Reusing MenuItemCard for display consistency
              key={item.id} 
              item={item} 
              onEdit={() => handleOpenModal(item)}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem ? "Edit Pre-Made Food Item" : "Add New Pre-Made Food Item"}
        size="lg" // Adjust size if needed for the form
      >
        <AddPreMadeFoodForm 
          onSubmit={handleSubmitItem} 
          onUpdate={handleUpdateItem}
          initialData={editingItem} 
          onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default ListPreMadeFoodPage;