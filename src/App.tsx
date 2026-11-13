import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ShopView } from './components/ShopView';
import { ProductDetailView } from './components/ProductDetailView';
import { CheckoutView } from './components/CheckoutView';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { CustomerAccountView } from './components/CustomerAccountView';
import { OrderTrackerView } from './components/OrderTrackerView';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogListView, PostDetailView } from './components/BlogView';
import { CmsPageView } from './components/CmsPageView';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

const StorefrontShell: React.FC = () => {
  const { activeView, toastMessage } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--veyra-bg)] text-[var(--veyra-text)] font-sans selection:bg-[var(--veyra-primary)] selection:text-[#FAF8F4]">
      <Header />

      <main className="flex-1">
        {activeView === 'home' && <HomeView />}
        {activeView === 'shop' && <ShopView />}
        {activeView === 'product' && <ProductDetailView />}
        {activeView === 'checkout' && <CheckoutView />}
        {activeView === 'confirmation' && <OrderConfirmationView />}
        {activeView === 'account' && <CustomerAccountView />}
        {activeView === 'tracking' && <OrderTrackerView />}
        {activeView === 'blog' && <BlogListView />}
        {activeView === 'post' && <PostDetailView />}
        {activeView === 'page' && <CmsPageView />}
        {activeView === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      <CartDrawer />
      <AuthModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#171C19] text-[#FAF8F4] text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl border border-[#1B3B2B]/40 max-w-sm text-center"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <StorefrontShell />
    </AppProvider>
  );
}
