import React from 'react';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ChefHat, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenDeploymentGuide: () => void;
  onOpenTrackModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenDeploymentGuide, 
  onOpenTrackModal 
}) => {
  const { 
    cartItemCount, 
    cartSubtotal, 
    setIsCartOpen, 
    activeView, 
    setActiveView, 
    firebaseStatus,
    adminUser 
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Notification / Information Bar */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              Road 27, Dhanmondi, Dhaka-1209
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Kitchen Open: 11:30 AM – 11:00 PM Daily
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenDeploymentGuide}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                firebaseStatus.isConfigured 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              {firebaseStatus.isConfigured ? 'Firebase: Connected' : 'Firebase: Unconfigured (Preview Mode)'}
            </button>
            <span className="text-stone-400">Hotline: +880 1711-TASTEHUB</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">
                TasteHub
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                Restaurant
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Authentic Bangladeshi Heritage Dining & Delivery
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Track Order Button */}
          <button
            onClick={() => {
              setActiveView('tracking');
              onOpenTrackModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'tracking'
                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500/30'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Track Order</span>
          </button>

          {/* Admin Dashboard Switch */}
          <button
            onClick={() => setActiveView(activeView === 'admin' ? 'menu' : 'admin')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'admin'
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">
              {adminUser?.isAuthorized ? 'Admin Panel' : 'Staff Login'}
            </span>
            {adminUser?.isAuthorized && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-600/25 active:scale-95 transition-all"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-amber-700 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="hidden xs:inline">
              {cartItemCount > 0 ? `৳${cartSubtotal}` : 'Cart'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Notice Bar */}
      {!firebaseStatus.isConfigured && (
        <div className="sm:hidden bg-amber-50 border-t border-amber-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-900">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Demo Preview Mode (Firebase Unconfigured)
          </span>
          <button 
            onClick={onOpenDeploymentGuide}
            className="font-bold underline text-amber-800"
          >
            Setup Guide
          </button>
        </div>
      )}
    </header>
  );
};
