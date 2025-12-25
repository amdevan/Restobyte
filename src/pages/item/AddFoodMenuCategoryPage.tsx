

import React, { useState, useEffect } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { FiUpload, FiArrowLeft, FiImage, FiSave } from 'react-icons/fi';
import { FoodMenuCategory } from '@/types';

interface AddFoodMenuCategoryPageProps {
  initialData?: FoodMenuCategory | null;
  onUpdate?: (category: FoodMenuCategory) => void;
  onAdd?: (categoryData: Omit<FoodMenuCategory, 'id'>) => void;
  onClose?: () => void; // For use in modal
}

const AddFoodMenuCategoryPage: React.FC<AddFoodMenuCategoryPageProps> = ({ initialData, onUpdate, onAdd, onClose }) => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('No file chosen');
  
  const { addFoodMenuCategory: defaultAddFunction } = useRestaurantData(); // For standalone page usage
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setCategoryName(initialData.name);
      setDescription(initialData.description || '');
      setImagePreview(initialData.imageUrl || null);
      setImageFileName(initialData.imageUrl ? 'Existing image' : 'No file chosen');
    } else {
      setCategoryName('');
      setDescription('');
      setImagePreview(null);
      setImageFileName('No file chosen');
    }
  }, [initialData]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFileName('No file chosen');
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert('Category Name is required.');
      return;
    }

    const categoryDataPayload = {
      name: categoryName,
      description: description,
      imageUrl: imagePreview || undefined, // Keep existing image if not changed
    };

    if (initialData && onUpdate) {
      onUpdate({ ...initialData, ...categoryDataPayload });
      if (onClose) onClose(); // Close modal if applicable
    } else if (onAdd) {
      onAdd(categoryDataPayload);
      if (onClose) onClose(); // Close modal if applicable
    } else { // Standalone page usage
      defaultAddFunction(categoryDataPayload);
      alert('Food menu category added successfully!');
      // Reset form for standalone page after adding
      setCategoryName('');
      setDescription('');
      setImagePreview(null);
      setImageFileName('No file chosen');
    }
  };
  
  const handleBackOrClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/app/item/list-food-menu-category');
    }
  };

  const isEditing = !!initialData;

  return (
    // If used in a modal, Card might be redundant, but keep for standalone page consistency
    // Consider passing a prop to disable Card if in modal for better UI
    <div className={onClose ? "" : "p-4 sm:p-6"}> 
      <Card>
        <div className="p-5">
            {!onClose && <h1 className="text-2xl font-semibold text-gray-800 mb-6">{isEditing ? 'Edit' : 'Add'} Food Menu Category</h1>}
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Input
                label="Category Name *"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Appetizers, Main Course, Desserts"
                required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
                </label>
                <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="A brief description of the category"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image (Width: 200px, Height: 200px)
                </label>
                <div className="mt-1 flex items-center space-x-3">
                <label
                    htmlFor="categoryImage"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    <FiImage className="inline-block mr-2" /> Choose File
                </label>
                <input id="categoryImage" name="categoryImage" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                <span className="text-sm text-gray-500">{imageFileName}</span>
                </div>
                {imagePreview && (
                <div className="mt-3 w-32 h-32 border border-gray-200 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Category Preview" className="w-full h-full object-cover" />
                </div>
                )}
            </div>

            <div className="flex items-center justify-start space-x-3 pt-4">
                <Button type="submit" variant="primary" leftIcon={isEditing ? <FiSave size={16}/> : <FiUpload size={16}/>}>
                  {isEditing ? 'Update Category' : 'Submit'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleBackOrClose} leftIcon={<FiArrowLeft size={16}/>}>
                  {onClose ? 'Cancel' : 'Back'}
                </Button>
            </div>
            </form>
        </div>
      </Card>
    </div>
  );
};

export default AddFoodMenuCategoryPage;