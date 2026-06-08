import React from 'react';
import { FiGrid } from 'react-icons/fi';

interface PosCategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const PosCategorySidebar: React.FC<PosCategorySidebarProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <nav className="space-y-1">
      <button
        onClick={() => onSelectCategory('All')}
        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200 text-left text-sm leading-tight ${
          selectedCategory === 'All'
            ? 'bg-sky-600 text-white shadow'
            : 'text-gray-600 hover:bg-sky-100 hover:text-sky-700'
        }`}
      >
        <FiGrid className="flex-shrink-0" size={16} />
        <span className="font-medium truncate">All Items</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200 text-left text-sm leading-tight truncate ${
            selectedCategory === cat
              ? 'bg-sky-600 text-white shadow'
              : 'text-gray-600 hover:bg-sky-100 hover:text-sky-700'
          }`}
        >
          <span className="w-4 h-4 flex-shrink-0"></span> {/* Placeholder for category icon */}
          <span className="font-medium">{cat}</span>
        </button>
      ))}
    </nav>
  );
};

export default PosCategorySidebar;
