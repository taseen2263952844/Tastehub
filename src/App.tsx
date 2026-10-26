import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { DishCard } from './components/DishCard';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackerView } from './components/OrderTrackerView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { Footer } from './components/Footer';
import { Utensils, AlertCircle, Sparkles, Bike } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    menuItems, 
    activeCategory, 
    searchQuery, 
    toastMessage 
  } = useApp();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState<boolean>(false);
  const [isDeploymentGuideOpen, setIsDeploymentGuideOpen] = useState<boolean>(false);

  // Filter menu items
  const filteredDishes = menuItems.filter((dish) => {
    const matchesCategory = activeCategory === 'all' || dish.category === activeCategory;
    const matchesSearch = 
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.bengaliName && dish.bengaliName.includes(searchQuery)) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Global Header */}
      <Header 
        onOpenDeploymentGuide={() => setIsDeploymentGuideOpen(true)}
        onOpenTrackModal={() => setActiveView('tracking')}
      />

      {/* Main Body Switcher */}
      <main className="flex-1">
        {activeView === 'menu' && (
          <div>
            {/* Hero Section */}
            <Hero />

            {/* Category Navigation Bar */}
            <CategoryNav />

            {/* Menu Items Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              {/* Section Header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Delicious Kitchen Offerings'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Authentic recipes slow-cooked with fresh local ingredients • Prices in <strong>৳ BDT</strong>
                  </p>
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  Showing <strong className="text-stone-900">{filteredDishes.length}</strong> items
                </div>
              </div>

              {/* Dishes Grid */}
              {filteredDishes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-8 h-8 stroke-1" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-800 mb-1">
                    No dishes found
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mb-4">
                    We couldn't find any dishes matching "{searchQuery}". Try searching for "Kacchi", "Polao", "Kebab", or "Borhani".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredDishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}

              {/* Promotional Strip */}
              <div className="mt-12 bg-linear-to-r from-amber-600 via-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    Special Dhaka Offer
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                    Hosting a Family Feast or Dawat?
                  </h3>
                  <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
                    Get free takeaway containers and priority kitchen preparation for party orders of 5+ biryani platters.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-xl bg-white text-stone-900 font-bold text-xs sm:text-sm hover:bg-stone-100 transition-colors shadow-lg"
                  >
                    Explore Popular Platters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'admin' && (
          <AdminDashboard 
            onOpenDeploymentGuide={() => setIsDeploymentGuideOpen(true)} 
          />
        )}

        {activeView === 'tracking' && (
          <OrderTrackerView />
        )}

        {activeView === 'customer_orders' && (
          <CustomerOrdersView />
        )}
      </main>

      {/* Global Footer */}
      <Footer onOpenDeploymentGuide={() => setIsDeploymentGuideOpen(true)} />

      {/* Modals & Overlays */}
      <DishDetailModal />

      <CustomerProfileModal />

      <CartDrawer 
        onOpenCheckout={() => setIsCheckoutOpen(true)} 
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={() => setIsSuccessOpen(true)}
      />

      <OrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        onTrackOrder={() => setActiveView('tracking')}
      />

      <DeploymentGuideModal
        isOpen={isDeploymentGuideOpen}
        onClose={() => setIsDeploymentGuideOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-stone-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-2 max-w-sm text-center">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
