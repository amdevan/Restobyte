
import React, { useState, useEffect } from 'react';
import { PreMadeFoodItem, Variation } from '@/types'; // Using PreMadeFoodItem (alias of MenuItem)
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { generateMenuItemDescription } from '../../services/geminiService';
import { FiZap } from 'react-icons/fi'; 

interface AddPreMadeFoodFormProps {
  onSubmit: (item: Omit<PreMadeFoodItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => void;
  onUpdate?: (item: PreMadeFoodItem) => void;
  initialData?: PreMadeFoodItem | null;
  onClose: () => void;
}

const AddPreMadeFoodForm: React.FC<AddPreMadeFoodFormProps> = ({ onSubmit, onUpdate, initialData, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [category, setCategory] = useState('Pre-Made Food'); // Default category
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setPrice(initialData.variations[0]?.price || '');
      setCategory(initialData.category || 'Pre-Made Food');
      setImageUrl(initialData.imageUrl || '');
      setIsVeg(initialData.isVeg === undefined ? true : initialData.isVeg);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory('Pre-Made Food');
      setImageUrl('');
      setIsVeg(true);
    }
  }, [initialData]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!name) {
      alert("Please enter item name to generate description.");
      return;
    }
    setIsGeneratingDesc(true);
    // Category is fixed for pre-made, but can be passed if needed
    const generatedDesc = await generateMenuItemDescription(name, category); 
    setDescription(generatedDesc);
    setIsGeneratingDesc(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
        alert("Name and price are required.");
        return;
    }
    const numericPrice = parseFloat(price as string);
    if (isNaN(numericPrice) || numericPrice < 0) {
        alert("Please enter a valid price.");
        return;
    }

    const itemData: Omit<PreMadeFoodItem, 'id' | 'imageUrl'> = { 
        name, 
        description, 
        variations: [{ name: 'Regular', price: numericPrice }],
        category, 
        isVeg 
    };

    if (initialData && onUpdate) {
      onUpdate({ ...initialData, ...itemData, imageUrl: imageUrl || initialData.imageUrl });
    } else {
      onSubmit(itemData, imageUrl, isVeg);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Lasagna Pack, Family Salad Bowl" required />
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="A brief description of the pre-made item"
        />
        <Button 
          type="button" 
          onClick={handleGenerateDescription} 
          variant="secondary" 
          size="sm" 
          className="mt-2"
          isLoading={isGeneratingDesc}
          leftIcon={<FiZap />}
        >
          {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
        </Button>
      </div>
      
      <Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 25.00" step="0.01" required />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
        <input 
            type="file" 
            onChange={handleImageChange} 
            accept="image/*" 
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
        />
        {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md border" />}
      </div>
       <Input 
        label="Category" 
        value={category} 
        onChange={(e) => setCategory(e.target.value)} 
        placeholder="e.g., Pre-Made Food" 
        disabled // Category is fixed for pre-made items in this version
      />
      
      <div className="flex items-center">
        <input
          id="isVegPreMade" 
          type="checkbox"
          checked={isVeg}
          onChange={(e) => setIsVeg(e.target.checked)}
          className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
        />
        <label htmlFor="isVegPreMade" className="ml-2 block text-sm text-gray-900">
          Is Vegetarian?
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">{initialData ? 'Update Item' : 'Add Item'}</Button>
      </div>
    </form>
  );
};

export default AddPreMadeFoodForm;
