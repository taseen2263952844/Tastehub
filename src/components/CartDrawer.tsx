import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Bike, 
  Store,
  ShieldCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    cartSubtotal, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart 
  } = useApp();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Your Order Cart
              </h2>
              <p className="text-xs text-stone-500">
                {cart.length} {cart.length === 1 ? 'dish' : 'dishes'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-red-600 px-2 py-1 transition-colors"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-stone-200/60 text-stone-600 flex items-center justify-center transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 stroke-1" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-800 mb-1">
              Your cart is empty
            </h3>
            <p className="text-sm text-stone-500 max-w-xs mb-6">
              Explore our traditional Bangladeshi menu and pick your favorite biryanis, curries, or kebabs!
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-stone-100">
            {cart.map((item) => (
              <div key={item.menuItem.id} className="pt-3.5 first:pt-0 flex gap-3">
                {/* Item Thumbnail */}
                <img
                  src={item.menuItem.imageUrl}
                  alt={item.menuItem.name}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {item.menuItem.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.menuItem.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors p-0.5"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.specialInstructions && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mb-1.5 inline-block">
                      Note: {item.specialInstructions}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                      <button
                        onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200/60 rounded-l-lg transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200/60 rounded-r-lg transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price calculation */}
                    <div className="text-right">
                      <span className="text-xs text-stone-500 block">
                        ৳{item.menuItem.price} × {item.quantity}
                      </span>
                      <span className="text-sm font-bold text-stone-900">
                        ৳{item.menuItem.price * item.quantity} BDT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer Footer with Totals and Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Dishes Subtotal</span>
                <span className="font-semibold text-stone-900">৳{cartSubtotal} BDT</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery Fee</span>
                <span className="font-semibold text-stone-900">৳60 BDT (Or Free on Pickup)</span>
              </div>
            </div>

            <div className="border-t border-stone-200/80 pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 font-medium block">Total Estimate</span>
                <span className="text-xl font-black text-amber-700">
                  ৳{cartSubtotal + 60} <span className="text-xs font-normal text-stone-500">BDT</span>
                </span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash on Delivery & Pay at Pickup only. Zero card risks.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
