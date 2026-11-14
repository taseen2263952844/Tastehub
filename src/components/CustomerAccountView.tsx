import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Package,
  LogOut,
  Plus,
  Trash2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp, formatBDT, isValidBDPhone } from '../context/AppContext';
import { SavedAddress } from '../types';
import { ConfirmDeleteModal } from './admin/ConfirmDeleteModal';

export const CustomerAccountView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    customerOrders,
    setIsAuthModalOpen,
    logout,
    updateProfileInfo,
    saveAddress,
    deleteAddress,
    lookupOrder,
    setActiveView,
  } = useApp();

  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pendingDeleteAddr, setPendingDeleteAddr] = useState<SavedAddress | null>(null);

  // New Address Form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrCity, setAddrCity] = useState('Dhaka');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDefault, setAddrDefault] = useState(true);
  const [addrError, setAddrError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || currentUser?.displayName || '');
      setPhone(userProfile.phone || '');
      setAddrName(userProfile.displayName || currentUser?.displayName || '');
      setAddrPhone(userProfile.phone || '');
    }
  }, [userProfile, currentUser?.displayName]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#F3F0E8] border border-[#E4E0D6] flex items-center justify-center mx-auto text-[#1B3B2B]">
          <User className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
          Sign in to your VEYRA account
        </h1>
        <p className="text-sm text-[#5C655F]">
          View order history, track live deliveries, and manage your saved shipping addresses.
        </p>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20]"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileInfo({ displayName, phone });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);
    if (!isValidBDPhone(addrPhone)) {
      setAddrError('Enter a valid Bangladeshi phone number (01XXXXXXXXX).');
      return;
    }
    if (!addrArea.trim() || !addrStreet.trim()) {
      setAddrError('Please enter both area and street address.');
      return;
    }
    await saveAddress({
      label: addrLabel,
      fullName: addrName,
      phone: addrPhone,
      city: addrCity,
      area: addrArea,
      streetAddress: addrStreet,
      isDefault: addrDefault,
    });
    setShowAddrForm(false);
    setAddrArea('');
    setAddrStreet('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E0D6]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
            Customer Account
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#171C19] mt-0.5">
            {userProfile?.displayName || currentUser.displayName}
          </h1>
          <p className="text-xs text-[#5C655F] mt-1">{currentUser.email}</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#F3F0E8] inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6]">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            tab === 'orders'
              ? 'border-[#1B3B2B] text-[#1B3B2B]'
              : 'border-transparent text-[#5C655F] hover:text-[#171C19]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders ({customerOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('addresses')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            tab === 'addresses'
              ? 'border-[#1B3B2B] text-[#1B3B2B]'
              : 'border-transparent text-[#5C655F] hover:text-[#171C19]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({userProfile?.savedAddresses?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            tab === 'profile'
              ? 'border-[#1B3B2B] text-[#1B3B2B]'
              : 'border-transparent text-[#5C655F] hover:text-[#171C19]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {customerOrders.length === 0 ? (
            <div className="bg-white border border-[#E4E0D6] rounded-2xl p-10 text-center space-y-3">
              <p className="font-serif text-2xl font-semibold text-[#171C19]">
                No orders yet
              </p>
              <p className="text-sm text-[#5C655F]">
                Orders you place while signed in will appear here with live status updates.
              </p>
            </div>
          ) : (
            customerOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#E4E0D6] rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#171C19]">
                      {order.orderNumber}
                    </span>
                    <p className="text-xs text-[#5C655F] mt-0.5">
                      Placed {new Date(order.createdAt).toLocaleDateString()} · {order.itemCount} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-[#E9EFEA] text-[#1B3B2B] text-xs font-semibold">
                      {order.status}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#F3F0E8] text-[#5C655F] text-xs font-medium">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-[#171C19]">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-mono text-[#5C655F] tabular-nums">
                        {formatBDT(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4E0D6]">
                  <span className="font-mono text-sm font-semibold text-[#1B3B2B] tabular-nums">
                    Total: {formatBDT(order.totalAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      lookupOrder(order.orderNumber);
                      setActiveView('tracking');
                    }}
                    className="text-xs font-semibold text-[#1B3B2B] hover:underline underline-offset-4 inline-flex items-center gap-1"
                  >
                    <span>Track Progress</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {tab === 'addresses' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
              Delivery Addresses
            </h2>
            <button
              type="button"
              onClick={() => setShowAddrForm(!showAddrForm)}
              className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Address</span>
            </button>
          </div>

          {showAddrForm && (
            <form
              onSubmit={handleAddAddress}
              className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4"
            >
              {addrError && (
                <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg">{addrError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Label (Home / Office)"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
                <input
                  type="text"
                  required
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  placeholder="Recipient Name"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="City (e.g. Dhaka)"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
                <input
                  type="text"
                  required
                  value={addrArea}
                  onChange={(e) => setAddrArea(e.target.value)}
                  placeholder="Area (e.g. Gulshan 2)"
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <input
                type="text"
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Street, House, Floor / Apartment"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
              />
              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-[#5C655F]">
                  <input
                    type="checkbox"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                  />
                  <span>Set as default shipping address</span>
                </label>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(userProfile?.savedAddresses || []).map((addr) => (
              <div
                key={addr.id}
                className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1B3B2B]">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#6E8774] font-medium">
                        <Check className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#171C19]">{addr.fullName}</p>
                  <p className="text-xs text-[#5C655F]">{addr.phone}</p>
                  <p className="text-xs text-[#5C655F]">
                    {addr.streetAddress}, {addr.area}, {addr.city}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingDeleteAddr(addr)}
                  className="p-2 h-fit text-[#5C655F] hover:text-red-700 transition-colors"
                  aria-label="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-[#E4E0D6] rounded-2xl p-6 max-w-lg space-y-4"
        >
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Account Details
          </h2>
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Default Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] disabled:opacity-60"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteAddr)}
        onClose={() => setPendingDeleteAddr(null)}
        title="Delete Saved Address?"
        itemLabel={
          pendingDeleteAddr
            ? `${pendingDeleteAddr.label} — ${pendingDeleteAddr.streetAddress}, ${pendingDeleteAddr.area}, ${pendingDeleteAddr.city}`
            : ''
        }
        description="Removes this delivery address from your account."
        onConfirm={async () => {
          if (!pendingDeleteAddr) return;
          await deleteAddress(pendingDeleteAddr.id);
        }}
      />
    </div>
  );
};
