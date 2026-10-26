import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ChefHat, 
  Compass,
  AlertCircle,
  User,
  History,
  LogIn
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
    adminUser,
    currentUser,
    customerOrders,
    loginWithGoogleCustomer,
    setIsProfileModalOpen
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
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Customer Orders Shortcut (when signed in) */}
          {currentUser && (
            <button
              onClick={() => setActiveView('customer_orders')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'customer_orders'
                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500/30'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="My Order History"
            >
              <History className="w-4 h-4 text-amber-600" />
              <span className="hidden lg:inline">My Orders</span>
              {customerOrders.length > 0 && (
                <span className="w-4 h-4 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {customerOrders.length}
                </span>
              )}
            </button>
          )}

          {/* Track Order Button */}
          <button
            onClick={() => {
              setActiveView('tracking');
              onOpenTrackModal();
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'tracking'
                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500/30'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Track Order</span>
          </button>

          {/* Customer Auth Button: Sign In with Google OR Profile */}
          {currentUser ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-white text-stone-800 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              title="Manage saved address & profile"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  currentUser.displayName?.[0] || 'U'
                )}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {currentUser.displayName?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => loginWithGoogleCustomer()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:border-amber-500 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Admin Dashboard Switch */}
          <button
            onClick={() => setActiveView(activeView === 'admin' ? 'menu' : 'admin')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'admin'
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="hidden xl:inline">
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
