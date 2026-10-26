import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  LogOut, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerProfileModal: React.FC = () => {
  const { 
    currentUser, 
    userProfile, 
    saveCustomerDetails, 
    logoutCustomer, 
    isProfileModalOpen, 
    setIsProfileModalOpen,
    setActiveView,
    customerOrders,
    showToast 
  } = useApp();

  const [displayName, setDisplayName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(userProfile?.displayName || currentUser.displayName || '');
      setPhone(userProfile?.phone || '');
      setDeliveryAddress(userProfile?.deliveryAddress || '');
    }
  }, [currentUser, userProfile, isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveCustomerDetails({
        displayName: displayName.trim(),
        phone: phone.trim(),
        deliveryAddress: deliveryAddress.trim()
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setIsSaving(false);
      showToast(err?.message || 'Failed to save profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                My Customer Account
              </h2>
              <p className="text-xs text-stone-500 truncate max-w-[200px]">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-stone-200/60 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Account Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setActiveView('customer_orders');
              }}
              className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left hover:bg-amber-100/70 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <History className="w-4 h-4 text-amber-700" />
                <span className="font-mono font-bold text-xs bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full">
                  {customerOrders.length}
                </span>
              </div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-amber-800">
                Order History
              </span>
              <span className="text-[11px] text-stone-500">View past orders & reorder</span>
            </button>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-left">
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-xs font-bold text-stone-900 block">
                Google Verified
              </span>
              <span className="text-[11px] text-stone-500">Encrypted Cloud Profile</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Default Contact Phone (Bangladeshi Mobile)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX or +8801XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Used to pre-fill your checkout and coordinate food delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Default Delivery Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House, Flat, Road, Area (e.g. Flat 3A, Road 27, Dhanmondi, Dhaka)"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Saved in your private Firestore profile to save time on future orders.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your profile details have been saved to Cloud Firestore.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Cloud Firestore...' : 'Save Profile & Address'}</span>
            </button>
          </form>

          {/* Sign Out Button */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">Need to switch accounts?</span>
            <button
              type="button"
              onClick={async () => {
                setIsProfileModalOpen(false);
                await logoutCustomer();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/80 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
