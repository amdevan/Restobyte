import React, { useState } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import MenuItemCard from '@/components/menu/MenuItemCard';
import AddMenuItemForm from '@/components/menu/AddMenuItemForm';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { MenuItem } from '../types';

const MenuPage: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem: removeMenuItem, foodMenuCategories } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleOpenModal = (item?: MenuItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitMenuItem = (itemData: Omit<MenuItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => {
    addMenuItem(itemData, imageUrl, isVeg);
    handleCloseModal();
  };
  
  const handleUpdateMenuItem = (itemData: MenuItem) => {
    updateMenuItem(itemData);
    handleCloseModal();
  };

  const handleDeleteMenuItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      removeMenuItem(itemId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">Food Menu</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Item
        </Button>
      </div>

      {menuItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No menu items yet. Add your first dish!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onEdit={() => handleOpenModal(item)}
              onDelete={handleDeleteMenuItem}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}>
        <AddMenuItemForm 
          onSubmit={handleSubmitMenuItem} 
          onUpdate={handleUpdateMenuItem}
          initialData={editingItem} 
          onClose={handleCloseModal} 
          categories={foodMenuCategories}
        />
      </Modal>
    </div>
  );
};

export default MenuPage;