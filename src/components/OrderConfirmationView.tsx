import React from 'react';
import { CheckCircle2, Package, ArrowRight, MapPin } from 'lucide-react';
import { useApp, formatBDT } from '../context/AppContext';

export const OrderConfirmationView: React.FC = () => {
  const { lastOrder, setActiveView, navigateToShop, currentUser, setIsAuthModalOpen } = useApp();

  if (!lastOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
          No recent order found
        </h1>
        <button
          type="button"
          onClick={() => navigateToShop('all', '')}
          className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium"
        >
          Browse Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-white border border-[#E4E0D6] rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E9EFEA] text-[#1B3B2B] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
              Order Recorded
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#171C19] mt-0.5">
              Thank you, {lastOrder.customerName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-[#5C655F] mt-1">
              Your order has been saved to VEYRA and assigned order number{' '}
              <strong className="font-mono text-[#171C19]">{lastOrder.orderNumber}</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs">
          <div>
            <p className="text-[#5C655F] uppercase tracking-wider text-[10px] font-semibold">
              Order Number
            </p>
            <p className="font-mono text-sm font-semibold text-[#171C19] mt-1">
              {lastOrder.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-[#5C655F] uppercase tracking-wider text-[10px] font-semibold">
              Order Status
            </p>
            <p className="text-sm font-semibold text-[#1B3B2B] mt-1">
              {lastOrder.status}
            </p>
          </div>
          <div>
            <p className="text-[#5C655F] uppercase tracking-wider text-[10px] font-semibold">
              Payment Status
            </p>
            <p className="text-sm font-semibold text-[#171C19] mt-1">
              {lastOrder.paymentStatus}
            </p>
          </div>
        </div>

        {/* Shipping & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1.5">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#5C655F] inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Address</span>
            </h2>
            <p className="font-medium text-[#171C19]">{lastOrder.customerName}</p>
            <p className="text-[#5C655F]">{lastOrder.customerPhone}</p>
            <p className="text-[#5C655F]">
              {lastOrder.deliveryAddress}, {lastOrder.area}, {lastOrder.city}
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#5C655F] inline-flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Payment Method</span>
            </h2>
            <p className="font-medium text-[#171C19]">
              {lastOrder.paymentMethod === 'cash_on_delivery'
                ? 'Cash on Delivery'
                : lastOrder.paymentMethod === 'bkash_manual'
                ? 'bKash (Manual Verification)'
                : 'Nagad (Manual Verification)'}
            </p>
            {lastOrder.paymentReference && (
              <p className="font-mono text-xs text-[#5C655F]">
                Reference: {lastOrder.paymentReference}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-[#E4E0D6] pt-5 space-y-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#5C655F]">
            Items ({lastOrder.itemCount})
          </h2>
          {lastOrder.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-[#171C19]">
                  {item.productName} × {item.quantity}
                </p>
                {item.variationLabel && (
                  <p className="text-xs text-[#5C655F]">{item.variationLabel}</p>
                )}
              </div>
              <span className="font-mono text-[#171C19] tabular-nums">
                {formatBDT(item.lineTotal)}
              </span>
            </div>
          ))}

          <div className="pt-3 border-t border-[#E4E0D6] space-y-1.5 text-sm">
            <div className="flex justify-between text-[#5C655F]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatBDT(lastOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#5C655F]">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {lastOrder.deliveryFee === 0 ? 'Complimentary' : formatBDT(lastOrder.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base text-[#171C19] pt-1">
              <span>Total Amount</span>
              <span className="font-mono text-[#1B3B2B] tabular-nums">
                {formatBDT(lastOrder.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {!currentUser && (
          <div className="p-4 rounded-xl bg-[#E9EFEA] border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#1B3B2B]">
            <span>
              Create or sign in to a VEYRA account next time to access permanent cross-device order history.
            </span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="font-semibold underline underline-offset-2 shrink-0"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('tracking')}
            className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors inline-flex items-center gap-2"
          >
            <span>Track Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateToShop('all', '')}
            className="px-6 py-3 rounded-xl bg-white border border-[#E4E0D6] text-[#171C19] text-sm font-medium hover:bg-[#F3F0E8] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
