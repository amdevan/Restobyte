import React from 'react';
import { MenuItem } from '../../types';
import { FiPlus } from 'react-icons/fi';

const PosMenuItemCard: React.FC<{ item: MenuItem; onAddItem: (item: MenuItem) => void }> = ({ item, onAddItem }) => {
  const hasOptions = (item.variations && item.variations.length > 1) || (item.addonGroupIds && item.addonGroupIds.length > 0);

  const displayPriceRange = () => {
    if (!item.variations || item.variations.length === 0) return '$--.--';
    if (item.variations.length === 1) return `$${item.variations[0].price.toFixed(2)}`;
    const min = Math.min(...item.variations.map(v => v.price));
    const max = Math.max(...item.variations.map(v => v.price));
    if (min === max) return `$${min.toFixed(2)}`;
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 cursor-pointer group border border-gray-200/80"
      onClick={() => onAddItem(item)}
      role="button"
      aria-label={`Add ${item.name} to order`}
    >
      <div className="relative">
        <img 
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} 
          alt={item.name} 
          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" 
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-2 right-2 bg-sky-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
          <FiPlus size={16}/>
        </div>
         {hasOptions && (
            <div className="absolute bottom-2 left-2 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                + options
            </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h3>
        <p className="text-sm font-bold text-sky-600 mt-1">{displayPriceRange()}</p>
      </div>
    </div>
  );
};

export default PosMenuItemCard;