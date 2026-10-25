import React from 'react';
import { 
  Utensils, 
  Flame, 
  Soup, 
  Sparkles, 
  Cookie, 
  Coffee 
} from 'lucide-react';
import { MENU_CATEGORIES } from '../data/sampleMenu';
import { useApp } from '../context/AppContext';
import { MenuCategoryId } from '../types';

export const CategoryNav: React.FC = () => {
  const { activeCategory, setActiveCategory, menuItems } = useApp();

  const getIcon = (name: string) => {
    switch (name) {
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Soup': return <Soup className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Cookie': return <Cookie className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const getCount = (categoryId: MenuCategoryId) => {
    if (categoryId === 'all') return menuItems.length;
    return menuItems.filter((item) => item.category === categoryId).length;
  };

  return (
    <div className="sticky top-[57px] sm:top-[65px] z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {MENU_CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          const count = getCount(category.id);

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-[1.02]'
                  : 'bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-amber-600'}>
                {getIcon(category.iconName)}
              </span>
              <span>{category.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-amber-700/60 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
