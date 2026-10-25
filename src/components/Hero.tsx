import React from 'react';
import { Search, Flame, Sparkles, CheckCircle2, Bike, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Hero: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-stone-900 via-stone-900 to-stone-800 text-white pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6">
      {/* Decorative Warm Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center space-y-6">
        {/* Heritage Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>খাঁটি স্বাদের ঐতিহ্যবাহী বাংলাদেশি খাবার • Dhanmondi 27</span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-100 max-w-4xl mx-auto leading-tight">
          Taste the Royal Heritage of <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-300 to-amber-200">Bangladeshi Cuisine</span>
        </h1>

        <p className="text-stone-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          From slow-dum Mutton Kacchi & fragrant Morog Polao to Chittagong Kala Bhuna and fresh Padma Shorshe Ilish. Prepared with pure ghee and freshly ground spices.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Kacchi Biryani, Kala Bhuna, Borhani, Haleem)..."
              className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-stone-800/90 text-white placeholder-stone-400 border border-stone-700/80 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm sm:text-base shadow-xl backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-xs font-bold bg-stone-700 text-stone-300 hover:text-white px-2 py-1 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Value Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm text-stone-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Halal Ingredients</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-amber-400" />
            <span>Fast Home Delivery (৳60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-orange-400" />
            <span>Instant Counter Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-400" />
            <span>Cash on Delivery & Pickup</span>
          </div>
        </div>
      </div>
    </div>
  );
};
