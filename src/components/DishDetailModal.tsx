import React, { useState } from 'react';
import { X, Plus, Minus, Clock, Flame, Sparkles, Check, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DishDetailModal: React.FC = () => {
  const { selectedDish, setSelectedDish, addToCart } = useApp();
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  if (!selectedDish) return null;

  const handleClose = () => {
    setSelectedDish(null);
    setQuantity(1);
    setSpecialInstructions('');
  };

  const handleAddToCart = () => {
    addToCart(selectedDish, quantity, specialInstructions);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
          <img
            src={selectedDish.imageUrl}
            alt={selectedDish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone-950/80 via-transparent to-transparent"></div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            {selectedDish.isChefSpecial && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-md mb-1.5 shadow-sm">
                <Sparkles className="w-3 h-3" />
                Chef's Signature Recommendation
              </span>
            )}
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              {selectedDish.name}
            </h2>
            {selectedDish.bengaliName && (
              <p className="text-amber-300 text-sm font-medium">
                {selectedDish.bengaliName}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1 font-semibold text-stone-900">
              <span className="text-amber-600">৳</span>
              <span className="text-lg font-bold">{selectedDish.price}</span>
              <span className="text-stone-500 font-normal">BDT</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Prep: {selectedDish.prepTimeMinutes} mins</span>
            </div>
            {selectedDish.spiceLevel && (
              <>
                <span className="text-stone-300">|</span>
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Spice: {selectedDish.spiceLevel}</span>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              About This Dish
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed">
              {selectedDish.description}
            </p>
          </div>

          {/* Ingredients */}
          {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Key Spices & Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDish.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-900 border border-amber-200/60 px-2.5 py-1 rounded-lg"
                  >
                    <Check className="w-3 h-3 text-amber-600" />
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cooking instructions note input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Special Kitchen Request (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, extra salad, separate gravy..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
              maxLength={150}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-sm text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedDish.isAvailable}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all disabled:bg-stone-300"
          >
            <span>Add to Order</span>
            <span>•</span>
            <span>৳{selectedDish.price * quantity} BDT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
