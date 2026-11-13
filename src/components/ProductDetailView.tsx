import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  ImageOff,
} from 'lucide-react';
import { useApp, formatBDT } from '../context/AppContext';
import { ProductCard } from './ProductCard';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProduct,
    products,
    setActiveView,
    navigateToShop,
    addToCart,
    setIsCartOpen,
    storeSettings,
  } = useApp();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedImageIdx(0);
      setSelectedVariationId(selectedProduct.variations?.[0]?.id);
      setQuantity(1);
      setImgError(false);
    }
  }, [selectedProduct?.id]);

  if (!selectedProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-[#5C655F]">No product selected.</p>
        <button
          type="button"
          onClick={() => navigateToShop('all', '')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const activeVariation = selectedProduct.variations.find(
    (v) => v.id === selectedVariationId
  );
  const effectivePrice =
    selectedProduct.price + (activeVariation ? activeVariation.priceAdjustment : 0);
  const effectiveStock = activeVariation ? activeVariation.stock : selectedProduct.stock;
  const isInStock = selectedProduct.isActive && effectiveStock > 0;

  const images = selectedProduct.images.length > 0 ? selectedProduct.images : [''];
  const currentImage = images[selectedImageIdx] || images[0];

  const relatedProducts = products
    .filter(
      (p) =>
        p.isActive &&
        p.id !== selectedProduct.id &&
        (p.categoryId === selectedProduct.categoryId || p.isFeatured)
    )
    .slice(0, 3);

  const handleAddToBag = () => {
    const ok = addToCart(selectedProduct, quantity, selectedVariationId);
    if (ok) {
      setIsCartOpen(true);
    }
  };

  const handleBuyNow = () => {
    const ok = addToCart(selectedProduct, quantity, selectedVariationId);
    if (ok) {
      setIsCartOpen(false);
      setActiveView('checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5C655F]">
        <button
          type="button"
          onClick={() => navigateToShop('all', '')}
          className="inline-flex items-center gap-1.5 hover:text-[#171C19] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Shop</span>
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigateToShop(selectedProduct.categoryId, '')}
          className="hover:text-[#171C19] transition-colors"
        >
          {selectedProduct.categoryName}
        </button>
        <span>/</span>
        <span className="text-[#171C19] font-medium truncate">{selectedProduct.name}</span>
      </div>

      {/* Asymmetric Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Sticky Gallery */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-4/3 w-full rounded-2xl bg-[#F3F0E8] border border-[#E4E0D6] overflow-hidden">
            {currentImage && !imgError ? (
              <img
                src={currentImage}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#5C655F]/60 gap-2">
                <ImageOff className="w-8 h-8 stroke-1" />
                <span className="text-xs uppercase tracking-wider">VEYRA Studio</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedImageIdx(idx);
                    setImgError(false);
                  }}
                  className={`w-20 h-20 rounded-xl overflow-hidden border transition-colors shrink-0 bg-[#F3F0E8] ${
                    selectedImageIdx === idx
                      ? 'border-[#1B3B2B] ring-1 ring-[#1B3B2B]'
                      : 'border-[#E4E0D6] opacity-75 hover:opacity-100'
                  }`}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={`${selectedProduct.name} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2 border-b border-[#E4E0D6] pb-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
                {selectedProduct.categoryName}
              </span>
              {selectedProduct.sku && (
                <span className="font-mono text-[11px] text-[#5C655F]">
                  SKU: {selectedProduct.sku}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#171C19] leading-tight">
              {selectedProduct.name}
            </h1>

            <p className="text-sm text-[#5C655F] leading-relaxed">
              {selectedProduct.shortDescription}
            </p>

            <div className="pt-3 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold text-[#171C19] tabular-nums">
                {formatBDT(effectivePrice)}
              </span>
              {selectedProduct.compareAtPrice &&
                selectedProduct.compareAtPrice > effectivePrice && (
                  <span className="font-mono text-sm text-[#5C655F] line-through tabular-nums">
                    {formatBDT(selectedProduct.compareAtPrice)}
                  </span>
                )}
              <span
                className={`ml-auto text-xs font-medium ${
                  isInStock ? 'text-[#1B3B2B]' : 'text-red-700'
                }`}
              >
                {isInStock ? `${effectiveStock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Variations */}
          {selectedProduct.variations.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171C19] uppercase tracking-wider">
                  Select {selectedProduct.variations[0].type}
                </span>
                {activeVariation && (
                  <span className="text-[#5C655F]">{activeVariation.name}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.variations.map((v) => {
                  const active = v.id === selectedVariationId;
                  const out = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={out}
                      onClick={() => {
                        setSelectedVariationId(v.id);
                        setQuantity(1);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                          : out
                          ? 'bg-[#F3F0E8] text-[#5C655F]/50 border-[#E4E0D6] line-through cursor-not-allowed'
                          : 'bg-white text-[#171C19] border-[#E4E0D6] hover:border-[#1B3B2B]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{v.name}</span>
                      {v.priceAdjustment !== 0 && (
                        <span className="font-mono opacity-80">
                          ({v.priceAdjustment > 0 ? '+' : ''}
                          {formatBDT(v.priceAdjustment)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + CTAs */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-[#E4E0D6] bg-white h-12">
                <button
                  type="button"
                  disabled={!isInStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 h-full text-[#5C655F] hover:text-[#171C19] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-mono text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={!isInStock || quantity >= effectiveStock}
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  className="px-3.5 h-full text-[#5C655F] hover:text-[#171C19] disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!isInStock}
                onClick={handleAddToBag}
                className="flex-1 h-12 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isInStock ? 'Add to Bag' : 'Out of Stock'}</span>
              </button>
            </div>

            {isInStock && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full h-11 rounded-xl bg-white border border-[#1B3B2B] text-[#1B3B2B] text-sm font-medium hover:bg-[#E9EFEA] transition-colors"
              >
                Buy Now · Express Checkout
              </button>
            )}
          </div>

          {/* Product Details */}
          <div className="pt-4 border-t border-[#E4E0D6] space-y-4">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#5C655F]">
              Product Notes
            </h2>
            <p className="text-sm text-[#171C19]/85 leading-relaxed">
              {selectedProduct.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#5C655F]">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6]">
                <Truck className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                <span>
                  Dhaka {formatBDT(storeSettings.insideDhakaDeliveryFee)} · Nationwide{' '}
                  {formatBDT(storeSettings.outsideDhakaDeliveryFee)}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6]">
                <ShieldCheck className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                <span>COD & Manual bKash/Nagad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-[#E4E0D6]">
          <div className="mb-7">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
              Pair With
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#171C19] mt-1">
              Related Essentials
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
