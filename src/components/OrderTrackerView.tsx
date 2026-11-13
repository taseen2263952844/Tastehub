import React, { useState } from 'react';
import { Search, Package, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { useApp, formatBDT } from '../context/AppContext';
import { OrderStatus } from '../types';

const PIPELINE: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export const OrderTrackerView: React.FC = () => {
  const {
    trackedOrder,
    lookupOrder,
    customerOrders,
    currentUser,
    setIsAuthModalOpen,
  } = useApp();

  const [queryId, setQueryId] = useState(trackedOrder?.orderNumber || '');
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNotFoundMsg(null);
    const found = lookupOrder(queryId);
    if (!found) {
      setNotFoundMsg(
        currentUser
          ? `No order matching "${queryId}" was found in your account.`
          : 'For customer privacy, Firestore restricts order reads to signed-in account owners. Sign in to view and track your orders across sessions.'
      );
    }
  };

  const activeOrder = trackedOrder || customerOrders[0] || null;
  const currentStepIndex = activeOrder
    ? PIPELINE.indexOf(activeOrder.status)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2 border-b border-[#E4E0D6] pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
          Fulfillment Status
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#171C19]">
          Track Your Order
        </h1>
        <p className="text-sm text-[#5C655F]">
          Enter your VEYRA order number (e.g., <span className="font-mono">VY-482910</span>) or select one of your signed-in orders below.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5C655F] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Order number (e.g., VY-123456)"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#E4E0D6] text-sm text-[#171C19] focus:outline-none focus:border-[#1B3B2B]"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors"
        >
          Look Up Order
        </button>
      </form>

      {notFoundMsg && (
        <div className="p-4 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-sm text-[#171C19] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{notFoundMsg}</span>
          {!currentUser && (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Signed-in user recent orders quick chips */}
      {customerOrders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C655F]">
            Your Orders
          </p>
          <div className="flex flex-wrap gap-2">
            {customerOrders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setQueryId(o.orderNumber);
                  lookupOrder(o.orderNumber);
                  setNotFoundMsg(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-colors ${
                  activeOrder?.id === o.id
                    ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                    : 'bg-white text-[#171C19] border-[#E4E0D6] hover:border-[#1B3B2B]'
                }`}
              >
                {o.orderNumber} · {o.status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Order Tracking Card */}
      {activeOrder ? (
        <div className="bg-white border border-[#E4E0D6] rounded-3xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E4E0D6]">
            <div>
              <p className="text-xs text-[#5C655F]">Order Number</p>
              <h2 className="font-mono text-2xl font-semibold text-[#171C19]">
                {activeOrder.orderNumber}
              </h2>
              <p className="text-xs text-[#5C655F] mt-1">
                Shipping to {activeOrder.area}, {activeOrder.city} · Payment:{' '}
                <strong>{activeOrder.paymentStatus}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3.5 py-1.5 rounded-lg bg-[#E9EFEA] text-[#1B3B2B] text-xs font-semibold">
                {activeOrder.status}
              </span>
              <p className="font-mono text-sm font-semibold text-[#171C19] mt-2 tabular-nums">
                {formatBDT(activeOrder.totalAmount)}
              </p>
            </div>
          </div>

          {activeOrder.status === 'Cancelled' ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>This order has been cancelled. Contact care@veyra.store for assistance.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {PIPELINE.map((step, idx) => {
                const completed = idx <= currentStepIndex;
                const Icon =
                  idx === 0
                    ? Clock
                    : idx === 1
                    ? CheckCircle2
                    : idx === 2
                    ? Package
                    : idx === 3
                    ? Truck
                    : CheckCircle2;
                return (
                  <div
                    key={step}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      completed
                        ? 'bg-[#E9EFEA]/70 border-[#1B3B2B]/40 text-[#1B3B2B]'
                        : 'bg-[#FAF8F4] border-[#E4E0D6] text-[#5C655F]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-2" />
                    <p className="text-xs font-semibold">{step}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items Summary */}
          <div className="space-y-2 pt-2 border-t border-[#E4E0D6]">
            {activeOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#171C19]">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-mono text-[#5C655F] tabular-nums">
                  {formatBDT(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
