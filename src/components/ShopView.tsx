import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { SortOption } from '../types';

export const ShopView: React.FC = () => {
  const {
    products,
    categories,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  } = useApp();

  const [inStockOnly, setInStockOnly] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'featured' | 'new' | 'bestseller'>('all');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = products.filter((p) => {
      if (!p.isActive) return false;
      if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (badgeFilter === 'featured' && !p.isFeatured) return false;
      if (badgeFilter === 'new' && !p.isNewArrival) return false;
      if (badgeFilter === 'bestseller' && !p.isBestSeller) return false;
      if (q) {
        const hay = `${p.name} ${p.categoryName} ${p.shortDescription} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        sorted.sort((a, b) => b.popularityScore - a.popularityScore);
        break;
      case 'newest':
        sorted.sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
        break;
      case 'featured':
      default:
        sorted.sort(
          (a, b) =>
            Number(b.isFeatured) - Number(a.isFeatured) || b.popularityScore - a.popularityScore
        );
        break;
    }

    return sorted;
  }, [products, activeCategory, searchQuery, sortBy, inStockOnly, badgeFilter]);

  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E4E0D6] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
            VEYRA Catalog
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#171C19] mt-1">
            {activeCategoryObj ? activeCategoryObj.name : 'All Products'}
          </h1>
          <p className="text-sm text-[#5C655F] mt-1 max-w-2xl">
            {activeCategoryObj
              ? activeCategoryObj.description
              : 'Browse every thoughtfully curated item across Electronics, Fashion, Home & Living, Accessories, and Beauty.'}
          </p>
        </div>

        <span className="font-mono text-xs text-[#5C655F] tabular-nums">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Filter & Sort Controls */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCategory === 'all'
                ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                : 'bg-white text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter((c) => c.isActive)
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === cat.slug
                    ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                    : 'bg-white text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>

        {/* Search + Refinement Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#5C655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, material, or tag..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-sm text-[#171C19] placeholder:text-[#5C655F]/70 focus:outline-none focus:border-[#1B3B2B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C655F] hover:text-[#171C19]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            {(['all', 'featured', 'new', 'bestseller'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setBadgeFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  badgeFilter === tab
                    ? 'bg-[#E9EFEA] text-[#1B3B2B] border-[#6E8774]/40'
                    : 'bg-transparent text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'featured'
                  ? 'Featured'
                  : tab === 'new'
                  ? 'New Arrivals'
                  : 'Best Sellers'}
              </button>
            ))}

            <label className="inline-flex items-center gap-1.5 text-xs text-[#5C655F] cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-[#E4E0D6] text-[#1B3B2B] focus:ring-[#1B3B2B]"
              />
              <span>In stock</span>
            </label>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#5C655F] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-xs sm:text-sm text-[#171C19] focus:outline-none focus:border-[#1B3B2B]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="popularity">Sort: Most Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            No matching products
          </h2>
          <p className="text-sm text-[#5C655F] mt-2">
            Try clearing your search query or switching back to all categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setBadgeFilter('all');
              setInStockOnly(false);
            }}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
