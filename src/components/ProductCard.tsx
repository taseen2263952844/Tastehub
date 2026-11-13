import React, { useState } from 'react';
import { Plus, ImageOff } from 'lucide-react';
import { Product } from '../types';
import { useApp, formatBDT } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openProductDetail, addToCart } = useApp();
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = product.stock <= 0 || !product.isActive;
  const primaryImage = product.images?.[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, product.variations?.[0]?.id);
  };

  return (
    <article
      onClick={() => openProductDetail(product)}
      className="group cursor-pointer flex flex-col bg-transparent"
    >
      {/* Clean 4:3 Product Frame on Soft Stone-Ivory */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#F3F0E8] border border-[#E4E0D6]/80">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#5C655F]/60 gap-2">
            <ImageOff className="w-6 h-6 stroke-1" />
            <span className="text-[11px] uppercase tracking-wider">VEYRA Studio</span>
          </div>
        )}

        {/* Maximum 1 subtle tag if Out of Stock or New */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#FAF8F4]/95 text-[#5C655F] text-[10px] font-semibold uppercase tracking-wider border border-[#E4E0D6]">
            Sold Out
          </span>
        ) : product.isNewArrival ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#FAF8F4]/95 text-[#1B3B2B] text-[10px] font-semibold uppercase tracking-wider border border-[#E4E0D6]">
            New
          </span>
        ) : null}

        {/* Subtle Quick Add Action */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 h-9 px-3 rounded-lg bg-[#FAF8F4]/95 text-[#171C19] hover:bg-[#1B3B2B] hover:text-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            aria-label={`Quick add ${product.name} to bag`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Minimalist Typography Stack: Category, Title, Price */}
      <div className="pt-3.5 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[#6E8774] font-medium">
          {product.categoryName}
        </span>

        <h3 className="text-[15px] font-semibold text-[#171C19] leading-snug group-hover:text-[#1B3B2B] transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2.5 mt-0.5">
          <span className="font-mono text-sm font-medium text-[#171C19] tabular-nums">
            {formatBDT(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="font-mono text-xs text-[#5C655F] line-through tabular-nums">
              {formatBDT(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
