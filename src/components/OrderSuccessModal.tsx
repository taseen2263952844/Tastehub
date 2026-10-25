import React from 'react';
import { CheckCircle2, Copy, Compass, ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  onTrackOrder 
}) => {
  const { lastOrder, showToast } = useApp();

  if (!isOpen || !lastOrder) return null;

  const copyOrderId = () => {
    navigator.clipboard.writeText(lastOrder.id);
    showToast(`Order ID #${lastOrder.id} copied to clipboard!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
          Order Placed Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mb-6">
          ধন্যবাদ! TasteHub kitchen has received your order and is getting ready to prepare your meal.
        </p>

        {/* Order ID Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
            Your Unique Order Number
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-900 tracking-wider">
              {lastOrder.id}
            </span>
            <button
              onClick={copyOrderId}
              className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-800 transition-colors"
              title="Copy Order ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            Keep this number handy to track real-time delivery status.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-stone-50 rounded-2xl p-4 text-left text-xs space-y-2 border border-stone-200 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Customer:</span>
            <span className="font-semibold text-stone-900">{lastOrder.customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Phone:</span>
            <span className="font-semibold text-stone-900">{lastOrder.customerPhone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Fulfillment:</span>
            <span className="font-semibold text-stone-900 uppercase">
              {lastOrder.orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Payment:</span>
            <span className="font-semibold text-stone-900">
              {lastOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Pay at Counter'}
            </span>
          </div>
          <div className="border-t border-stone-200 pt-2 flex items-center justify-between font-bold text-sm">
            <span className="text-stone-900">Total Amount:</span>
            <span className="text-amber-700">৳{lastOrder.totalAmount} BDT</span>
          </div>
        </div>

        {/* Estimated Timing */}
        <div className="flex items-center justify-center gap-2 text-xs text-stone-600 mb-6 bg-stone-100 py-2.5 px-4 rounded-xl">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>
            Estimated Time: <strong className="text-stone-900">~{lastOrder.estimatedTimeMinutes} minutes</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              onClose();
              onTrackOrder();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Track Order Live</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-sm transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
