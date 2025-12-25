
import React, { useState, useEffect } from 'react';
import { MenuItem, FoodMenuCategory, Variation } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { generateMenuItemDescription } from '../../services/geminiService';
import { FiZap, FiPlus, FiTrash2, FiTag } from 'react-icons/fi'; 
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface AddMenuItemFormProps {
  onSubmit: (item: Omit<MenuItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => void;
  onUpdate?: (item: MenuItem) => void;
  initialData?: MenuItem | null;
  onClose: () => void;
  categories: FoodMenuCategory[];
}

const AddMenuItemForm: React.FC<AddMenuItemFormProps> = ({ onSubmit, onUpdate, initialData, onClose, categories }) => {
  const { addonGroups } = useRestaurantData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variations, setVariations] = useState<Array<Partial<Variation> & { id: number }>>([{ id: Date.now(), name: 'Regular', price: undefined }]);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [selectedAddonGroupIds, setSelectedAddonGroupIds] = useState<string[]>([]);

  const noCategoriesExist = categories.length === 0;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setVariations(initialData.variations.map((v, i) => ({...v, id: i})));
      const categoryExists = categories.some(c => c.name === initialData.category);
      setCategory(categoryExists ? initialData.category : (categories[0]?.name || ''));
      setImageUrl(initialData.imageUrl || '');
      setIsVeg(initialData.isVeg === undefined ? true : initialData.isVeg);
      setSelectedAddonGroupIds(initialData.addonGroupIds || []);
    } else {
      setName('');
      setDescription('');
      setVariations([{ id: Date.now(), name: 'Regular', price: undefined }]);
      setCategory(categories[0]?.name || '');
      setImageUrl('');
      setIsVeg(true);
      setSelectedAddonGroupIds([]);
    }
  }, [initialData, categories]);
  
  const handleVariationChange = (id: number, field: 'name' | 'price', value: string) => {
    setVariations(prev => prev.map(v => v.id === id ? {...v, [field]: value} : v));
  };
  
  const handleAddVariation = () => setVariations(prev => [...prev, {id: Date.now(), name: '', price: undefined}]);
  const handleRemoveVariation = (id: number) => { if(variations.length > 1) setVariations(prev => prev.filter(v => v.id !== id))};

  const handleAddonToggle = (groupId: string) => {
    setSelectedAddonGroupIds(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  }

  const handleGenerateDescription = async () => {
    if (!name || !category) {
      alert("Please enter item name and category to generate description.");
      return;
    }
    setIsGeneratingDesc(true);
    const generatedDesc = await generateMenuItemDescription(name, category);
    setDescription(generatedDesc);
    setIsGeneratingDesc(false);
  };
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
        alert("Name and category are required.");
        return;
    }
    const finalVariations: Variation[] = [];
    for(const v of variations) {
        if (!v.name?.trim() || v.price === undefined || String(v.price).trim() === '') {
            alert('All variations must have a name and a price.');
            return;
        }
        const numericPrice = parseFloat(String(v.price));
        if (isNaN(numericPrice) || numericPrice < 0) {
            alert(`Invalid price for variation "${v.name}". Please enter a valid price.`);
            return;
        }
        finalVariations.push({name: v.name, price: numericPrice});
    }

    const itemData = { name, description, variations: finalVariations, category, isVeg, addonGroupIds: selectedAddonGroupIds };

    if (initialData && onUpdate) {
      onUpdate({ ...initialData, ...itemData, imageUrl: imageUrl || initialData.imageUrl });
    } else {
      onSubmit(itemData, imageUrl, isVeg);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Spaghetti Carbonara" required />
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" required disabled={noCategoriesExist}>
          {noCategoriesExist && <option value="">No categories available</option>}
          {categories.map(cat => ( <option key={cat.id} value={cat.name}>{cat.name}</option>))}
        </select>
        {noCategoriesExist && <p className="mt-1 text-xs text-amber-600">Please add a food category first via Item Management.</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="A brief description of the item" />
        <Button type="button" onClick={handleGenerateDescription} variant="secondary" size="sm" className="mt-2" isLoading={isGeneratingDesc} leftIcon={<FiZap />} disabled={noCategoriesExist || !name || !category}>
          {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
        </Button>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Pricing Variations</h4>
        <div className="space-y-3">
          {variations.map((v, index) => (
            <div key={v.id} className="flex items-end space-x-2 p-2 border rounded-md bg-gray-50/50">
              <Input label="Variation Name" value={v.name || ''} onChange={(e) => handleVariationChange(v.id, 'name', e.target.value)} placeholder="e.g., Regular, Large" containerClassName="mb-0 flex-grow" required/>
              <Input label="Price" type="number" value={v.price === undefined ? '' : v.price} onChange={(e) => handleVariationChange(v.id, 'price', e.target.value)} placeholder="e.g., 12.99" step="0.01" containerClassName="mb-0 flex-grow" required/>
              {variations.length > 1 && <Button type="button" variant="danger" size="sm" className="!p-2.5" onClick={() => handleRemoveVariation(v.id)}><FiTrash2 size={16}/></Button>}
            </div>
          ))}
        </div>
        <Button type="button" onClick={handleAddVariation} leftIcon={<FiPlus/>} size="sm" variant="secondary" className="mt-2">Add Variation</Button>
      </div>

       <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Add-on Groups</h4>
        {addonGroups.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md">
                {addonGroups.map(group => (
                    <label key={group.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                        <input type="checkbox" checked={selectedAddonGroupIds.includes(group.id)} onChange={() => handleAddonToggle(group.id)} className="h-4 w-4 text-sky-600 rounded" />
                        <span className="text-sm text-gray-800">{group.name}</span>
                    </label>
                ))}
            </div>
        ) : (
            <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-md">No add-on groups created. Go to Item Management &rarr; Manage Add-ons to create them.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
        <input type="file" onChange={handleImageChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
        {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md border" />}
      </div>
      
      <div className="flex items-center">
        <input id="isVeg" type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
        <label htmlFor="isVeg" className="ml-2 block text-sm text-gray-900">Is Vegetarian?</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={noCategoriesExist}>{initialData ? 'Update Item' : 'Add Item'}</Button>
      </div>
    </form>
  );
};

export default AddMenuItemForm;
