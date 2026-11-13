import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck } from 'lucide-react';
import { useApp, formatBDT } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartItemCount,
    storeSettings,
    setActiveView,
    navigateToShop,
  } = useApp();

  if (!isCartOpen) return null;

  const freeThreshold = storeSettings.freeDeliveryThreshold;
  const remainingForFreeDelivery = Math.max(0, freeThreshold - cartSubtotal);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setActiveView('checkout');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#171C19]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-[#FAF8F4] h-full flex flex-col border-l border-[#E4E0D6] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E4E0D6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#1B3B2B]" />
            <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
              Shopping Bag
            </h2>
            <span className="font-mono text-xs text-[#5C655F] tabular-nums">
              ({cartItemCount})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg text-[#5C655F] hover:text-[#171C19] hover:bg-[#F3F0E8] transition-colors"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free delivery note */}
        {cart.length > 0 && freeThreshold > 0 && (
          <div className="px-6 py-3 bg-[#E9EFEA] border-b border-[#E4E0D6] flex items-center gap-2.5 text-xs text-[#1B3B2B]">
            <Truck className="w-4 h-4 shrink-0" />
            {remainingForFreeDelivery > 0 ? (
              <span>
                Add <strong className="font-mono tabular-nums">{formatBDT(remainingForFreeDelivery)}</strong> more for complimentary nationwide delivery.
              </span>
            ) : (
              <span className="font-medium">
                You have unlocked complimentary nationwide delivery.
              </span>
            )}
          </div>
        )}

        {/* Line Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-full bg-[#F3F0E8] border border-[#E4E0D6] flex items-center justify-center text-[#5C655F] mb-4">
                <ShoppingBag className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                Your bag is empty
              </h3>
              <p className="text-sm text-[#5C655F] mt-1 max-w-xs">
                Explore curated tech, breathable linen, stoneware, and daily lifestyle essentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigateToShop('all', '');
                }}
                className="mt-6 px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variationId || 'default'}`}
                className="flex gap-4 pb-5 border-b border-[#E4E0D6] last:border-b-0"
              >
                <div className="w-20 h-20 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] overflow-hidden shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6E8774] font-medium">
                        {item.categoryName}
                      </p>
                      <h3 className="text-sm font-semibold text-[#171C19] leading-snug line-clamp-1">
                        {item.productName}
                      </h3>
                      {item.variationLabel && (
                        <p className="text-xs text-[#5C655F] mt-0.5">
                          {item.variationLabel}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variationId)}
                      className="p-1 text-[#5C655F] hover:text-red-700 transition-colors"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center rounded-lg border border-[#E4E0D6] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variationId, item.quantity - 1)
                        }
                        className="p-1.5 text-[#5C655F] hover:text-[#171C19]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-mono text-xs font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variationId, item.quantity + 1)
                        }
                        className="p-1.5 text-[#5C655F] hover:text-[#171C19]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-sm font-medium text-[#171C19] tabular-nums">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E4E0D6] bg-[#F3F0E8]/60 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#5C655F]">Subtotal</span>
                <span className="font-mono font-semibold text-[#171C19] tabular-nums">
                  {formatBDT(cartSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#5C655F]">
                <span>Delivery</span>
                <span>
                  Calculated at checkout ({formatBDT(storeSettings.insideDhakaDeliveryFee)} Dhaka /{' '}
                  {formatBDT(storeSettings.outsideDhakaDeliveryFee)} Nationwide)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
