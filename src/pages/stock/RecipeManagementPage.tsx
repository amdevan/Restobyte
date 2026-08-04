import React, { useState, useMemo } from 'react';
import { FiEdit, FiPlus, FiTrash2, FiBook } from 'react-icons/fi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Recipe, RecipeIngredient } from '@/types';

const RecipeManagementPage: React.FC = () => {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, menuItems, stockItems, foodMenuCategories } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [yieldQuantity, setYieldQuantity] = useState(1);
  const [yieldUnit, setYieldUnit] = useState('portions');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter menu items that don't have recipes yet (when adding new)
  const availableMenuItems = useMemo(() => {
    const existingRecipeMenuIds = recipes.map(r => r.menuItemId);
    let items = menuItems.filter(mi => mi.isAvailable && !existingRecipeMenuIds.includes(mi.id));
    if (selectedCategory) {
      items = items.filter(mi => mi.categoryId === selectedCategory);
    }
    return items;
  }, [menuItems, recipes, selectedCategory]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const term = searchTerm.toLowerCase();
    return recipes.filter(r =>
      r.menuItemName.toLowerCase().includes(term) ||
      r.ingredients.some(i => i.stockItemName.toLowerCase().includes(term))
    );
  }, [recipes, searchTerm]);

  const openAddModal = () => {
    setEditingRecipe(null);
    setSelectedMenuItemId('');
    setSelectedCategory('');
    setIngredients([]);
    setYieldQuantity(1);
    setYieldUnit('portions');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSelectedMenuItemId(recipe.menuItemId);
    setSelectedCategory('');
    setIngredients([...recipe.ingredients]);
    setYieldQuantity(recipe.yieldQuantity);
    setYieldUnit(recipe.yieldUnit);
    setNotes(recipe.notes);
    setIsModalOpen(true);
  };

  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stockItemId: '',
      stockItemName: '',
      quantityRequired: 1,
      unit: 'pcs',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === 'stockItemId') {
      const stockItem = stockItems.find(si => si.id === value);
      updated[index] = {
        ...updated[index],
        stockItemId: value as string,
        stockItemName: stockItem?.name || '',
        unit: stockItem?.unit || 'pcs',
      };
    } else {
      (updated[index] as any)[field] = value;
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedMenuItemId || ingredients.length === 0) {
      alert('Please select a menu item and add at least one ingredient.');
      return;
    }

    const menuItem = menuItems.find(mi => mi.id === selectedMenuItemId);
    const recipeData = {
      menuItemId: selectedMenuItemId,
      menuItemName: menuItem?.name || '',
      category: foodMenuCategories.find(c => c.id === menuItem?.categoryId)?.name || '',
      ingredients: ingredients.filter(i => i.stockItemId),
      yieldQuantity,
      yieldUnit,
      notes,
    };

    if (editingRecipe) {
      updateRecipe({ ...editingRecipe, ...recipeData });
    } else {
      addRecipe(recipeData as Omit<Recipe, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (recipeId: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteRecipe(recipeId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiBook className="mr-3 text-amber-600" /> Recipe Management
        </h1>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <FiPlus /> Add Recipe
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map(recipe => (
          <Card key={recipe.id}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{recipe.menuItemName}</h3>
                  <p className="text-sm text-gray-500">{recipe.category}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(recipe)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <FiEdit size={14} />
                  </button>
                  <button onClick={() => handleDelete(recipe.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Yield: {recipe.yieldQuantity} {recipe.yieldUnit}
              </div>
              <div className="space-y-1">
                {recipe.ingredients.map(ing => {
                  const stockItem = stockItems.find(si => si.id === ing.stockItemId);
                  const isLow = stockItem && stockItem.quantity <= (stockItem.lowStockThreshold || 0);
                  const isOut = stockItem && stockItem.quantity <= 0;
                  return (
                    <div key={ing.id} className="flex justify-between text-sm">
                      <span className={isOut ? 'text-red-600 font-medium' : isLow ? 'text-amber-600' : 'text-gray-700'}>
                        {ing.stockItemName}
                      </span>
                      <span className="text-gray-500">
                        {ing.quantityRequired} {ing.unit}
                        {stockItem && (
                          <span className={`ml-2 text-xs ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-green-500'}`}>
                            (Stock: {stockItem.quantity})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <FiBook className="mx-auto mb-4 text-4xl text-gray-300" />
            <p>No recipes found. Click "Add Recipe" to create your first recipe.</p>
            <p className="text-sm mt-2">Recipes link menu items to stock ingredients, enabling automatic stock tracking.</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="">All Categories</option>
                  {foodMenuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item *</label>
                <select value={selectedMenuItemId} onChange={e => setSelectedMenuItemId(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="">Select Menu Item</option>
                  {(editingRecipe ? menuItems.filter(mi => mi.id === editingRecipe.menuItemId || !recipes.some(r => r.menuItemId === mi.id)) : availableMenuItems).map(mi => (
                    <option key={mi.id} value={mi.id}>{mi.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yield Quantity</label>
                  <input type="number" min="1" value={yieldQuantity} onChange={e => setYieldQuantity(Number(e.target.value))} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yield Unit</label>
                  <select value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} className="w-full p-2 border rounded-lg">
                    <option value="portions">Portions</option>
                    <option value="plates">Plates</option>
                    <option value="servings">Servings</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
                  <Button onClick={addIngredient} size="sm" className="flex items-center gap-1">
                    <FiPlus size={12} /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={ing.id} className="flex gap-2 items-center">
                      <select value={ing.stockItemId} onChange={e => updateIngredient(idx, 'stockItemId', e.target.value)} className="flex-1 p-2 border rounded">
                        <option value="">Select Stock Item</option>
                        {stockItems.map(si => <option key={si.id} value={si.id}>{si.name} ({si.quantity} {si.unit} available)</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" value={ing.quantityRequired} onChange={e => updateIngredient(idx, 'quantityRequired', Number(e.target.value))} className="w-20 p-2 border rounded" placeholder="Qty" />
                      <span className="text-sm text-gray-500 w-16">{ing.unit}</span>
                      <button onClick={() => removeIngredient(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {ingredients.length === 0 && <p className="text-sm text-gray-400">No ingredients added yet.</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-lg" rows={2} placeholder="Optional notes about this recipe..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingRecipe ? 'Update Recipe' : 'Save Recipe'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagementPage;
