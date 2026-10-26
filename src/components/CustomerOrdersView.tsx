import React from 'react';
import { 
  History, 
  ShoppingBag, 
  Compass, 
  Clock, 
  MapPin, 
  Phone, 
  ChevronLeft, 
  RotateCcw, 
  CheckCircle2, 
  LogIn,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';

export const CustomerOrdersView: React.FC = () => {
  const { 
    currentUser, 
    customerOrders, 
    setActiveView, 
    trackOrder, 
    addToCart, 
    menuItems, 
    loginWithGoogleCustomer,
    showToast 
  } = useApp();

  const handleReorder = (order: Order) => {
    let readdedCount = 0;
    order.items.forEach((item) => {
      const dish = menuItems.find((d) => d.id === item.id);
      if (dish && dish.isAvailable) {
        addToCart(dish, item.quantity, item.specialInstructions);
        readdedCount += item.quantity;
      }
    });

    if (readdedCount > 0) {
      showToast(`Added ${readdedCount} item(s) from order #${order.id} to your cart.`);
      setActiveView('menu');
    } else {
      showToast('Dishes from this order could not be re-added or are currently sold out.');
    }
  };

  const handleTrackLive = (orderId: string) => {
    trackOrder(orderId);
    setActiveView('tracking');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Restaurant Menu</span>
        </button>

        <span className="text-xs text-stone-500 font-medium">
          TasteHub Dhanmondi 27
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Personal Account
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            My Order History
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {currentUser 
              ? `Signed in as ${currentUser.displayName || currentUser.email}. View your past dining orders and track live deliveries.`
              : 'Sign in to access your saved order history, persistent cart, and saved delivery addresses.'}
          </p>
        </div>

        {!currentUser && (
          <button
            onClick={() => loginWithGoogleCustomer()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>

      {/* Unauthenticated State */}
      {!currentUser ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-800">
            Sign in to view your TasteHub orders
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            When you sign in with Google, all your orders are securely linked to your account, your shopping cart is saved across devices, and your delivery address is saved for 1-click checkouts.
          </p>
          <div className="pt-2">
            <button
              onClick={() => loginWithGoogleCustomer()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      ) : customerOrders.length === 0 ? (
        /* Empty Orders for Signed-in user */
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-800">
            No orders placed yet
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            Ready for some authentic Dhakaiya Biryani or Chittagong Kala Bhuna? Check out our menu!
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveView('menu')}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all"
            >
              Browse Restaurant Menu
            </button>
          </div>
        </div>
      ) : (
        /* Customer Orders List */
        <div className="space-y-4">
          {customerOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-stone-900">
                      #{ord.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ord.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 mt-1">
                    Placed on {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total Amount</span>
                  <span className="font-mono font-black text-xl text-amber-700">
                    ৳{ord.totalAmount} <span className="text-xs font-normal text-stone-500">BDT</span>
                  </span>
                </div>
              </div>

              {/* Delivery and payment summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{ord.orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup at Dhanmondi 27'}</span>
                  </div>
                  {ord.deliveryAddress && (
                    <p className="text-stone-600 text-[11px] pl-5">{ord.deliveryAddress}</p>
                  )}
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-stone-500 block">Payment:</span>
                  <span className="font-semibold text-stone-900 uppercase">
                    {ord.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                  Ordered Dishes ({ord.itemCount}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {ord.items.map((item, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 font-medium"
                    >
                      <strong className="text-amber-700">{item.quantity}×</strong>
                      <span>{item.name}</span>
                      <span className="text-stone-400 font-mono text-[11px]">(৳{item.price * item.quantity})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                <button
                  onClick={() => handleTrackLive(ord.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Track Live Order</span>
                </button>

                <button
                  onClick={() => handleReorder(ord)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reorder These Dishes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
