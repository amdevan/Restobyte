
import React from 'react';
import { MenuItem } from '../../types';
import { FiEdit, FiTrash2, FiDollarSign, FiCircle, FiImage } from 'react-icons/fi';
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-24 object-cover" />
        ) : (
          <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
            <FiImage size={20} className="text-gray-300" />
          </div>
        )}
        <div 
          title={itemIsVeg ? "Vegetarian" : "Non-Vegetarian"}
          className={`absolute top-1.5 right-1.5 p-1 rounded-full shadow-sm ${itemIsVeg ? 'bg-green-500' : 'bg-red-500'}`}
        >
          <FiCircle size={8} className="text-white" />
        </div>
      </div>
      <div className="p-2.5 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5 truncate" title={item.name}>{item.name}</h3>
        <p className="text-[10px] text-gray-400 mb-0.5">
          {typeof item.category === 'object' && item.category !== null 
            ? (item.category as any).name 
            : item.category}
        </p>
        <p className="text-gray-500 text-xs mb-1.5 line-clamp-2 flex-grow">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-sm font-bold text-sky-600">
            <FiDollarSign className="mr-0.5" size={12} />
            {getPriceDisplay()}
          </div>
          <div className="flex space-x-1">
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
              <FiEdit size={14} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
