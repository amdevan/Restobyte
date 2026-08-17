

import React, { useState, useEffect, useRef } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { FiUpload, FiArrowLeft, FiImage, FiSave, FiX } from 'react-icons/fi';
import { FoodMenuCategory } from '@/types';
import { processImage } from '@/utils/imageUpload';

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
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setIsProcessing(true);
    try {
      const result = await processImage(file);
      if ('message' in result) {
        setImageError(result.message);
      } else {
        setImagePreview(result.dataUrl);
        setImageFileName(result.fileName);
      }
    } catch {
      setImageError('Failed to process image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName('No file chosen');
    setImageError(null);
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
                Category Image (Optional)
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Category Preview" className="w-32 h-32 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                    >
                      <FiX size={12} />
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">{imageFileName}</p>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${isProcessing ? 'border-sky-300 bg-sky-50' : 'border-gray-300'}`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      {isProcessing ? (
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiImage size={24} className="text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Click to upload image</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Max 5MB</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      id="categoryImage"
                      name="categoryImage"
                      type="file"
                      className="hidden"
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </label>
                )}
                {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
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