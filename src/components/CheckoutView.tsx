import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Banknote,
  Smartphone,
  AlertCircle,
  Lock,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import {
  useApp,
  formatBDT,
  isValidBDPhone,
} from '../context/AppContext';
import { PaymentMethod, SavedAddress } from '../types';

const BD_CITIES = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
  'Other',
];

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    calculateDeliveryFee,
    validatePromoCode,
    storeSettings,
    currentUser,
    userProfile,
    setIsAuthModalOpen,
    setActiveView,
    navigateToShop,
    placeOrder,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [paymentReference, setPaymentReference] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && !customerEmail) {
      setCustomerEmail(currentUser.email || '');
    }
    if (userProfile) {
      if (!customerName && userProfile.displayName) {
        setCustomerName(userProfile.displayName);
      }
      if (!customerPhone && userProfile.phone) {
        setCustomerPhone(userProfile.phone);
      }
      const defAddr =
        userProfile.savedAddresses?.find((a) => a.isDefault) ||
        userProfile.savedAddresses?.[0];
      if (defAddr && !deliveryAddress && !area) {
        setCustomerName(defAddr.fullName || userProfile.displayName || '');
        setCustomerPhone(defAddr.phone || userProfile.phone || '');
        setCity(defAddr.city || 'Dhaka');
        setArea(defAddr.area || '');
        setDeliveryAddress(defAddr.streetAddress || '');
      }
    }
  }, [currentUser?.uid, userProfile]);

  const applySavedAddress = (addr: SavedAddress) => {
    setCustomerName(addr.fullName);
    setCustomerPhone(addr.phone);
    setCity(addr.city);
    setArea(addr.area);
    setDeliveryAddress(addr.streetAddress);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
          Your shopping bag is empty
        </h1>
        <p className="text-sm text-[#5C655F]">
          Add items to your bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigateToShop('all', '')}
          className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20]"
        >
          Browse Collection
        </button>
      </div>
    );
  }

  const promoCheck = appliedPromoCode
    ? validatePromoCode(appliedPromoCode, cartSubtotal)
    : { valid: false, discountAmount: 0, freeDelivery: false, message: '' };

  const discountAmount = promoCheck.valid ? promoCheck.discountAmount : 0;
  const deliveryFee = calculateDeliveryFee(city, cartSubtotal, appliedPromoCode || undefined);
  const totalAmount = Math.max(0, cartSubtotal - discountAmount + deliveryFee);

  const handleApplyPromo = () => {
    const res = validatePromoCode(promoInput, cartSubtotal);
    if (res.valid && res.promo) {
      setAppliedPromoCode(res.promo.code);
      setPromoFeedback({ ok: true, msg: res.message });
    } else {
      setAppliedPromoCode('');
      setPromoFeedback({ ok: false, msg: res.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidBDPhone(customerPhone)) {
      setErrorMsg('Please enter a valid Bangladeshi mobile number (e.g., 01712345678).');
      return;
    }
    if (area.trim().length < 2) {
      setErrorMsg('Please enter your area or thana (e.g., Banani, Dhanmondi).');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      setErrorMsg('Please enter your complete street/house delivery address.');
      return;
    }
    if (
      (paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual') &&
      paymentReference.trim().length < 4
    ) {
      setErrorMsg(
        'Please enter your bKash/Nagad Transaction ID (TrxID) or sender number for manual verification.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await placeOrder({
        customerName,
        customerPhone,
        customerEmail,
        city,
        area,
        deliveryAddress,
        deliveryInstructions,
        paymentMethod,
        paymentReference:
          paymentMethod === 'cash_on_delivery' ? undefined : paymentReference,
        promoCode: appliedPromoCode || undefined,
        saveAddressToProfile: Boolean(currentUser && saveAddressToProfile),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to place order right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => setActiveView('shop')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C655F] hover:text-[#171C19] mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Continue Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D6]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
                VEYRA Checkout
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#171C19] mt-0.5">
                Shipping & Payment
              </h1>
            </div>
            {!currentUser && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-medium text-[#1B3B2B] underline underline-offset-4 self-start sm:self-auto"
              >
                Sign in to use saved addresses & track orders
              </button>
            )}
          </div>

          {userProfile?.savedAddresses && userProfile.savedAddresses.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5C655F]">
                Saved Addresses
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userProfile.savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => applySavedAddress(addr)}
                    className="text-left p-3.5 rounded-xl bg-white border border-[#E4E0D6] hover:border-[#1B3B2B] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1B3B2B] inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase tracking-wider text-[#6E8774] font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#171C19] mt-1">
                      {addr.fullName} · {addr.phone}
                    </p>
                    <p className="text-xs text-[#5C655F] mt-0.5 line-clamp-1">
                      {addr.streetAddress}, {addr.area}, {addr.city}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#171C19]">
              1. Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Arif Hasan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Phone Number (Bangladesh) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  City / District *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                >
                  {BD_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Area / Thana *
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Banani / Dhanmondi / Uttara"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Full Delivery Address *
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House, Road, Block/Sector, Flat / Floor number"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Call before arriving / Leave with guard"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm text-[#171C19]"
                />
              </div>
            </div>

            {currentUser && (
              <label className="inline-flex items-center gap-2 text-xs text-[#5C655F] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                />
                <span>Save this delivery address to my profile</span>
              </label>
            )}
          </div>

          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#171C19]">
              2. Payment Method
            </h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-[#1B3B2B] bg-[#E9EFEA]/50'
                    : 'border-[#E4E0D6] bg-[#FAF8F4] hover:border-[#6E8774]'
                }`}
              >
                <Banknote className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#171C19]">
                      Cash on Delivery (COD)
                    </span>
                    {paymentMethod === 'cash_on_delivery' && (
                      <CheckCircle2 className="w-4 h-4 text-[#1B3B2B]" />
                    )}
                  </div>
                  <p className="text-xs text-[#5C655F] mt-0.5">
                    Pay in cash when your parcel arrives at your doorstep.
                  </p>
                </div>
              </button>

              {storeSettings.bkashEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash_manual')}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                    paymentMethod === 'bkash_manual'
                      ? 'border-[#1B3B2B] bg-[#E9EFEA]/50'
                      : 'border-[#E4E0D6] bg-[#FAF8F4] hover:border-[#6E8774]'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#171C19]">
                        bKash (Manual Verification)
                      </span>
                      {paymentMethod === 'bkash_manual' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1B3B2B]" />
                      )}
                    </div>
                    <p className="text-xs text-[#5C655F] mt-0.5">
                      Send {formatBDT(totalAmount)} to {storeSettings.bkashNumber} and enter your TrxID below.
                    </p>
                  </div>
                </button>
              )}

              {storeSettings.nagadEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad_manual')}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                    paymentMethod === 'nagad_manual'
                      ? 'border-[#1B3B2B] bg-[#E9EFEA]/50'
                      : 'border-[#E4E0D6] bg-[#FAF8F4] hover:border-[#6E8774]'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#171C19]">
                        Nagad (Manual Verification)
                      </span>
                      {paymentMethod === 'nagad_manual' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1B3B2B]" />
                      )}
                    </div>
                    <p className="text-xs text-[#5C655F] mt-0.5">
                      Send {formatBDT(totalAmount)} to {storeSettings.nagadNumber} and enter your TrxID below.
                    </p>
                  </div>
                </button>
              )}
            </div>

            {(paymentMethod === 'bkash_manual' || paymentMethod === 'nagad_manual') && (
              <div className="p-4 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] space-y-3">
                <p className="text-xs text-[#171C19] leading-relaxed">
                  {storeSettings.paymentInstructions}
                </p>
                <p className="font-mono text-xs font-semibold text-[#1B3B2B]">
                  {paymentMethod === 'bkash_manual'
                    ? `bKash Account: ${storeSettings.bkashNumber}`
                    : `Nagad Account: ${storeSettings.nagadNumber}`}
                </p>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Transaction ID (TrxID) & Sender Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. TrxID 9HG4K21M / From 017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-sm text-[#171C19]"
                  />
                  <p className="text-[11px] text-[#5C655F] mt-1">
                    Note: Manual mobile payments remain in “Pending Verification” until verified by our admin team.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-semibold hover:bg-[#142D20] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            <span>
              {submitting ? 'Confirming Order...' : `Place Order · ${formatBDT(totalAmount)}`}
            </span>
          </button>
        </form>

        {/* Right: Order Summary + Promo Code */}
        <aside className="lg:col-span-5 bg-[#F3F0E8] border border-[#E4E0D6] rounded-2xl p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl font-semibold text-[#171C19] pb-3 border-b border-[#E4E0D6]">
            Order Summary
          </h2>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.variationId || 'def'}`}
                className="flex items-center gap-3.5"
              >
                <div className="w-14 h-14 rounded-lg bg-white border border-[#E4E0D6] overflow-hidden shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#171C19] truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[#5C655F]">
                    Qty {item.quantity}
                    {item.variationLabel ? ` · ${item.variationLabel}` : ''}
                  </p>
                </div>
                <span className="font-mono text-sm font-medium text-[#171C19] tabular-nums">
                  {formatBDT(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Discount / Promo Code Box */}
          <div className="pt-3 border-t border-[#E4E0D6] space-y-2">
            <label className="text-xs font-medium text-[#5C655F] inline-flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Promo / Discount Code</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="e.g. VEYRA10"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium"
              >
                Apply
              </button>
            </div>
            {promoFeedback && (
              <p
                className={`text-xs ${
                  promoFeedback.ok ? 'text-[#1B3B2B] font-medium' : 'text-red-700'
                }`}
              >
                {promoFeedback.msg}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[#E4E0D6] space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#5C655F]">Subtotal</span>
              <span className="font-mono font-medium text-[#171C19] tabular-nums">
                {formatBDT(cartSubtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-[#1B3B2B]">
                <span>Promo ({appliedPromoCode})</span>
                <span className="font-mono font-medium tabular-nums">
                  -{formatBDT(discountAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[#5C655F]">
                Delivery ({city.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Nationwide'})
              </span>
              <span className="font-mono font-medium text-[#171C19] tabular-nums">
                {deliveryFee === 0 ? 'Complimentary' : formatBDT(deliveryFee)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E4E0D6] text-base font-semibold">
              <span className="text-[#171C19]">Total</span>
              <span className="font-mono text-lg text-[#1B3B2B] tabular-nums">
                {formatBDT(totalAmount)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
