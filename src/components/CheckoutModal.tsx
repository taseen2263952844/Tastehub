import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bike, 
  Store, 
  Banknote, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderType, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onOrderSuccess 
}) => {
  const { cart, cartSubtotal, placeOrder, showToast, currentUser, userProfile } = useApp();

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pre-fill saved customer details from Cloud Firestore when modal opens
  useEffect(() => {
    if (isOpen) {
      if (userProfile?.displayName || currentUser?.displayName) {
        setCustomerName(userProfile?.displayName || currentUser?.displayName || '');
      }
      if (userProfile?.phone) {
        setCustomerPhone(userProfile.phone);
      }
      if (userProfile?.deliveryAddress) {
        setDeliveryAddress(userProfile.deliveryAddress);
      }
    }
  }, [isOpen, currentUser, userProfile]);

  if (!isOpen) return null;

  const deliveryFee = orderType === 'delivery' ? 60 : 0;
  const grandTotal = cartSubtotal + deliveryFee;

  // Validate Bangladeshi phone number: 013-019XXXXXXXX or +8801...
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name (at least 2 letters)';
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!cleanPhone) {
      errs.customerPhone = 'Contact phone number is required';
    } else if (!bdPhoneRegex.test(cleanPhone)) {
      errs.customerPhone = 'Enter a valid Bangladeshi phone number (e.g. 01712345678 or +8801812345678)';
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim() || deliveryAddress.trim().length < 6) {
        errs.deliveryAddress = 'Please provide detailed delivery address (House/Road/Area in Dhaka)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'pickup') {
      setPaymentMethod('pay_at_pickup');
    } else {
      setPaymentMethod('cash_on_delivery');
    }
    // Clear delivery address error if switching to pickup
    if (type === 'pickup') {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.deliveryAddress;
        return copy;
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) {
      showToast('Please fix the highlighted fields in the form.');
      return;
    }

    try {
      setIsSubmitting(true);
      await placeOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        orderNotes: orderNotes.trim() ? orderNotes.trim() : undefined,
        paymentMethod
      });
      setIsSubmitting(false);
      onClose();
      onOrderSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || 'Failed to submit order to database.';
      setSubmitError(msg);
      showToast(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="font-serif font-bold text-xl text-stone-900">
              Confirm Your Order
            </h2>
            <p className="text-xs text-stone-500">
              Review items, delivery preference, and payment mode
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-200/60 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Prominent Error Banner if Firestore or network rejected the write */}
          {submitError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Order Not Saved to Database:</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}
          {/* Order Type Toggle: Delivery vs Pickup */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Order Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOrderTypeChange('delivery')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  orderType === 'delivery'
                    ? 'border-amber-600 bg-amber-50/80 text-amber-900 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${orderType === 'delivery' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm block">Home Delivery</span>
                  <span className="text-[11px] font-normal text-stone-500">৳60 fee • 35-45 mins</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOrderTypeChange('pickup')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  orderType === 'pickup'
                    ? 'border-amber-600 bg-amber-50/80 text-amber-900 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${orderType === 'pickup' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm block">Store Pickup</span>
                  <span className="text-[11px] font-normal text-stone-500">Free • Dhanmondi 27</span>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${
                    errors.customerName ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
                  } focus:border-amber-500 focus:outline-hidden`}
                />
              </div>
              {errors.customerName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.customerName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Phone Number (Bangladeshi Mobile) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017XXXXXXXX or +88018XXXXXXXX"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${
                    errors.customerPhone ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
                  } focus:border-amber-500 focus:outline-hidden`}
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Required for delivery rider coordination and order status updates.
              </p>
              {errors.customerPhone && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.customerPhone}
                </p>
              )}
            </div>

            {/* Address Input when delivery is selected */}
            {orderType === 'delivery' ? (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat / Road / Area (e.g. Flat 4B, Road 11, Banani, Dhaka)"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.deliveryAddress ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
                    } focus:border-amber-500 focus:outline-hidden`}
                  />
                </div>
                {errors.deliveryAddress && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.deliveryAddress}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                <Store className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Pickup Counter Address:</span>
                  TasteHub Restaurant, Ground Floor, Concord Regency, Road 27 (Old 16), Dhanmondi, Dhaka.
                  <span className="block text-stone-500 text-[11px] mt-0.5">Your food will be freshly packed and ready in ~25 minutes.</span>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Special Cooking / Delivery Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Please ring bell twice, extra green chilies"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                  maxLength={150}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector: STRICTLY Cash on Delivery or Pay at Pickup */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Payment Method (Secure Local Methods)
            </label>
            <div className="space-y-2">
              {orderType === 'delivery' ? (
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-950 block">Cash on Delivery (COD)</span>
                      <span className="text-[11px] text-emerald-800">Pay cash in hand to our rider upon receiving food</span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-950 block">Pay at Restaurant Counter</span>
                      <span className="text-[11px] text-emerald-800">Pay via Cash, bKash, or Card when collecting order</span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Items Total ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span className="font-semibold text-stone-900">৳{cartSubtotal} BDT</span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>Delivery Charge</span>
              <span className="font-semibold text-stone-900">
                {orderType === 'delivery' ? '৳60 BDT' : '৳0 (Store Pickup)'}
              </span>
            </div>
            <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
              <span className="font-serif font-bold text-sm text-stone-900">Payable Total</span>
              <span className="text-xl font-black text-amber-700">
                ৳{grandTotal} <span className="text-xs font-normal text-stone-500">BDT</span>
              </span>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-[11px] text-stone-500 flex items-start gap-1.5 bg-stone-100 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Authoritative Security: Order items & prices are mathematically checked against our restaurant catalog.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all disabled:bg-stone-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : (
              <span>Confirm Order • ৳{grandTotal} BDT ({orderType === 'delivery' ? 'Cash on Delivery' : 'Pay at Counter'})</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
