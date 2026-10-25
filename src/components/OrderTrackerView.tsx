import React, { useState } from 'react';
import { 
  Search, 
  Compass, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  Store, 
  MapPin, 
  Phone, 
  AlertCircle,
  PackageCheck,
  ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';

export const OrderTrackerView: React.FC = () => {
  const { trackedOrder, trackOrder, setActiveView, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notFound, setNotFound] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = trackOrder(searchQuery.trim());
    if (!found) {
      setNotFound(true);
      showToast('No order found with that ID or Phone number.');
    } else {
      setNotFound(false);
      showToast(`Found order #${found.id}!`);
    }
  };

  const getStepState = (currentStatus: OrderStatus, stepIndex: number) => {
    const statusOrder: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      trackedOrder?.orderType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
      'completed'
    ];

    const currentIdx = statusOrder.indexOf(currentStatus);
    if (currentStatus === 'cancelled') return 'cancelled';
    if (currentIdx > stepIndex) return 'completed';
    if (currentIdx === stepIndex) return 'current';
    return 'upcoming';
  };

  const steps = [
    { title: 'Order Placed', desc: 'Received in system', icon: Clock },
    { title: 'Confirmed', desc: 'Verified by manager', icon: CheckCircle2 },
    { title: 'In Kitchen', desc: 'Cooking with fresh spices', icon: ChefHat },
    { 
      title: trackedOrder?.orderType === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery', 
      desc: trackedOrder?.orderType === 'pickup' ? 'Waiting at counter' : 'Rider on the way', 
      icon: trackedOrder?.orderType === 'pickup' ? Store : Bike 
    },
    { title: 'Completed', desc: 'Meal delivered / collected', icon: PackageCheck }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
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
          Hotline: +880 1711-TASTEHUB
        </span>
      </div>

      {/* Tracker Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
            Track Your Food Order Live
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Enter your unique Order Number (e.g. <strong>TH-78421</strong>) or your customer phone number to check live kitchen status.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setNotFound(false);
              }}
              placeholder="e.g. TH-78421 or 017XXXXXXXX"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all"
          >
            Track
          </button>
        </form>

        {notFound && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No order found for "{searchQuery}". Please check your order ID or phone number.</span>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {trackedOrder ? (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-lg space-y-6 p-6 sm:p-8">
          {/* Order Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Order Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  trackedOrder.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : trackedOrder.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-900 animate-pulse'
                }`}>
                  {trackedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-mono text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                #{trackedOrder.id}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-500 block">Placed on</span>
              <span className="text-xs sm:text-sm font-semibold text-stone-900">
                {new Date(trackedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(trackedOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Visual Step Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-6">
              Live Preparation Timeline
            </h4>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-stone-200 z-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {steps.map((st, idx) => {
                  const state = getStepState(trackedOrder.status, idx);
                  const Icon = st.icon;

                  let circleStyle = 'bg-stone-100 border-stone-300 text-stone-400';
                  if (state === 'completed') {
                    circleStyle = 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30';
                  } else if (state === 'current') {
                    circleStyle = 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-200 animate-bounce shadow-md shadow-amber-500/30';
                  }

                  return (
                    <div 
                      key={idx}
                      className={`flex md:flex-col items-center gap-3 p-3 rounded-2xl border transition-all ${
                        state === 'current'
                          ? 'bg-amber-50/60 border-amber-300'
                          : 'bg-white border-stone-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${circleStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="md:text-center">
                        <span className={`text-xs font-bold block ${state === 'current' ? 'text-amber-900' : 'text-stone-900'}`}>
                          {st.title}
                        </span>
                        <span className="text-[11px] text-stone-500 leading-tight block">
                          {st.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Fulfillment Details
              </span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">
                    {trackedOrder.orderType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}:
                  </span>
                  <p className="text-stone-700 mt-0.5">
                    {trackedOrder.orderType === 'delivery'
                      ? trackedOrder.deliveryAddress
                      : 'TasteHub Dhanmondi Branch, Ground Floor, Concord Regency, Road 27, Dhaka-1209'}
                  </p>
                </div>
              </div>

              {trackedOrder.orderNotes && (
                <div className="pt-2 border-t border-stone-200/60">
                  <span className="font-bold text-stone-900">Order Note: </span>
                  <span className="text-stone-600">{trackedOrder.orderNotes}</span>
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Payment & Customer
              </span>
              <div className="flex justify-between">
                <span className="text-stone-500">Customer Name:</span>
                <span className="font-semibold text-stone-900">{trackedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Contact Phone:</span>
                <a href={`tel:${trackedOrder.customerPhone}`} className="font-semibold text-amber-700 hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {trackedOrder.customerPhone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Mode:</span>
                <span className="font-semibold text-stone-900 uppercase">
                  {trackedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter'}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200/60 pt-2 font-bold text-sm">
                <span className="text-stone-900">Total Payable:</span>
                <span className="text-amber-700">৳{trackedOrder.totalAmount} BDT</span>
              </div>
            </div>
          </div>

          {/* Itemized summary */}
          <div className="pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
              Ordered Items
            </span>
            <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl p-4 border border-stone-200">
              {trackedOrder.items.map((item, i) => (
                <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700">{item.quantity}×</span>
                    <span className="font-semibold text-stone-900">{item.name}</span>
                    {item.specialInstructions && (
                      <span className="text-[11px] text-stone-500 italic">({item.specialInstructions})</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-stone-800">
                    ৳{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-stone-500 bg-stone-100/60 rounded-3xl border border-dashed border-stone-300">
          <Clock className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="text-sm font-medium">
            Search for an order number above to view real-time kitchen progress.
          </p>
        </div>
      )}
    </div>
  );
};
