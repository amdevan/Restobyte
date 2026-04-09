
import React from 'react';
import { MenuItem } from '../../types';
import { FiEdit, FiTrash2, FiDollarSign, FiCircle } from 'react-icons/fi';
import Button from '../common/Button';
import Money from '../common/Money';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onEdit, onDelete }) => {
  const itemIsVeg = item.isVegetarian === undefined ? true : item.isVegetarian; // Default to veg if undefined

  const getPriceDisplay = () => {
    if (!item.variations || item.variations.length === 0) {
      return <Money amount={0} />;
    }
    if (item.variations.length === 1) {
      return <Money amount={item.variations[0].price} />;
    }
    const prices = item.variations.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
        return <Money amount={minPrice} />;
    }
    return <span><Money amount={minPrice} /> - <Money amount={maxPrice} /></span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-102 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative">
        <img 
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} 
          alt={item.name} 
          className="w-full h-36 object-cover" 
        />
        <div 
          title={itemIsVeg ? "Vegetarian" : "Non-Vegetarian"}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md ${itemIsVeg ? 'bg-green-500' : 'bg-red-500'}`}
        >
          <FiCircle size={10} className="text-white" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h3>
        <p className="text-xs text-gray-500 mb-1 italic">
          {typeof item.category === 'object' && item.category !== null 
            ? (item.category as any).name 
            : item.category}
        </p>
        <p className="text-gray-600 text-sm mb-2 h-16 overflow-y-auto custom-scrollbar flex-grow">{item.description}</p>
        <div className="flex items-center text-base font-semibold text-sky-600 mb-3">
          <FiDollarSign className="mr-1" />
          {getPriceDisplay()}
        </div>
        <div className="flex space-x-2 mt-auto">
          <Button onClick={() => onEdit(item)} variant="secondary" size="sm" leftIcon={<FiEdit />}>
            Edit
          </Button>
          <Button onClick={() => onDelete(item.id)} variant="danger" size="sm" leftIcon={<FiTrash2 />}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
