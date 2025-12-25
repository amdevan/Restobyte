


import React, { useState } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FoodMenuCategory } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import AddFoodMenuCategoryPage from './AddFoodMenuCategoryPage'; // Re-use for editing
import { FiPlusCircle, FiEdit, FiTrash2, FiImage } from 'react-icons/fi';

const ListFoodMenuCategoryPage: React.FC = () => {
  const { foodMenuCategories, deleteFoodMenuCategory, updateFoodMenuCategory, addFoodMenuCategory } = useRestaurantData();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodMenuCategory | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (category: FoodMenuCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This might affect menu items using this category.')) {
      deleteFoodMenuCategory(categoryId);
    }
  };
  
  const handleUpdateSubmit = (updatedCategory: FoodMenuCategory) => {
    updateFoodMenuCategory(updatedCategory);
    handleCloseModal();
  };
  
  const handleAddSubmit = (categoryData: Omit<FoodMenuCategory, 'id'>) => {
    addFoodMenuCategory(categoryData);
    handleCloseModal();
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Food Menu Categories</h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Category
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {foodMenuCategories.length === 0 ? (
          <div className="text-center py-10">
            <FiImage size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No food menu categories found.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Category" to get started.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Image</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {foodMenuCategories.map(category => (
                <tr key={category.id} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="py-3 px-4">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        <FiImage size={24} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800 align-top">{category.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 align-top max-w-xs sm:max-w-sm md:max-w-md truncate ...">
                    {category.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm align-top">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(category)} variant="secondary" size="sm" aria-label="Edit Category">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(category.id)} variant="danger" size="sm" aria-label="Delete Category">
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingCategory ? "Edit Food Menu Category" : "Add New Food Menu Category"}
        size="lg"
      >
        <AddFoodMenuCategoryPage
          initialData={editingCategory}
          onUpdate={handleUpdateSubmit}
          onAdd={handleAddSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ListFoodMenuCategoryPage;