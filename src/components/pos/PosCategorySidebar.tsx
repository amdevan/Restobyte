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
        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-left ${
          selectedCategory === 'All'
            ? 'bg-sky-600 text-white shadow'
            : 'text-gray-600 hover:bg-sky-100 hover:text-sky-700'
        }`}
      >
        <FiGrid className="flex-shrink-0" />
        <span className="font-medium">All Items</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-left truncate ${
            selectedCategory === cat
              ? 'bg-sky-600 text-white shadow'
              : 'text-gray-600 hover:bg-sky-100 hover:text-sky-700'
          }`}
        >
          <span className="w-5 h-5 flex-shrink-0"></span> {/* Placeholder for category icon */}
          <span className="font-medium">{cat}</span>
        </button>
      ))}
    </nav>
  );
};

export default PosCategorySidebar;
