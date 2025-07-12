
import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-3 rounded-magical text-lg font-bold whitespace-nowrap transition-all duration-200 ${
            selectedCategory === category
              ? 'bg-gradient-magical text-white shadow-magical scale-105'
              : 'bg-white text-magical-primary hover:bg-magical-background border-2 border-magical-primary/10'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
