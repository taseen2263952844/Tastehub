import React from 'react';
import { Plus, Flame, Clock, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';
import { useApp } from '../context/AppContext';

interface DishCardProps {
  dish: MenuItem;
}

export const DishCard: React.FC<DishCardProps> = ({ dish }) => {
  const { addToCart, setSelectedDish, cart } = useApp();

  const cartItem = cart.find((item) => item.menuItem.id === dish.id);

  const getSpiceBadge = (level?: string) => {
    switch (level) {
      case 'Mild':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Mild</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">🌶️ Medium</span>;
      case 'Spicy':
        return <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">🌶️🌶️ Spicy</span>;
      case 'Extra Spicy':
        return <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">🔥 Extra Hot</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={() => setSelectedDish(dish)}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-200 transition-all flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Dish Image Container */}
        <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Sold Out / Hidden Overlay */}
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-md">
                Sold Out Today
              </span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
            {dish.isChefSpecial && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-stone-900 px-2 py-0.5 rounded-md shadow-sm">
                <Sparkles className="w-3 h-3 text-stone-900" />
                Chef's Special
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 pointer-events-none">
            {getSpiceBadge(dish.spiceLevel)}
          </div>

          {/* Prep Time pill */}
          <div className="absolute bottom-2.5 right-2.5 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{dish.prepTimeMinutes} min</span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
              {dish.name}
            </h3>
          </div>

          {dish.bengaliName && (
            <p className="text-xs font-medium text-amber-800/80 mb-2 font-sans">
              {dish.bengaliName}
            </p>
          )}

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">
            {dish.description}
          </p>

          {dish.portion && (
            <p className="text-[11px] text-stone-500 font-medium mb-3">
              Portion: <span className="text-stone-700">{dish.portion}</span>
            </p>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Add Button */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center justify-between border-t border-stone-100/80 mt-1">
        <div>
          <span className="text-[11px] text-stone-500 font-medium block">Price</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-bold text-amber-700">৳</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {dish.price}
            </span>
            <span className="text-[10px] text-stone-500 ml-1">BDT</span>
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          disabled={!dish.isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            addToCart(dish);
          }}
          className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
            !dish.isAvailable
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-amber-600/25'
          }`}
          aria-label={`Add ${dish.name} to cart`}
        >
          <Plus className="w-4 h-4" />
          <span>{cartItem ? `Add More (${cartItem.quantity})` : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};
