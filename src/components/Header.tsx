import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    navigateTarget,
    searchQuery,
    setSearchQuery,
    cartItemCount,
    setIsCartOpen,
    currentUser,
    isAdmin,
    setIsAuthModalOpen,
    storeSettings,
    navigationMenus,
    isPreviewMode,
    setIsPreviewMode,
    publishWebsiteChanges,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [publishingFromPreview, setPublishingFromPreview] = useState(false);

  const activeHeaderMenu =
    navigationMenus.find((m) => m.id === storeSettings.headerMenuId) ||
    navigationMenus.find((m) => m.location === 'header') ||
    navigationMenus[0];

  const menuItems = activeHeaderMenu?.items || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setActiveView('shop');
    setIsSearchOpen(false);
    setMobileNavOpen(false);
  };

  const handlePreviewPublish = async () => {
    setPublishingFromPreview(true);
    try {
      await publishWebsiteChanges('Published from Live Preview');
    } finally {
      setPublishingFromPreview(false);
    }
  };

  const headerSticky = storeSettings.headerSticky !== false;
  const headerBg = storeSettings.headerBgColor || '#FAF8F4';
  const headerText = storeSettings.headerTextColor || '#171C19';
  const primaryColor = storeSettings.primaryColor || '#1B3B2B';

  return (
    <>
      {/* Admin Draft Live Preview Bar */}
      {isAdmin && isPreviewMode && (
        <div className="bg-[#171C19] text-[#FAF8F4] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#E9EFEA]" />
            <span>
              <strong>Draft Preview Mode</strong> — You are viewing unpublished Website Customizer & Homepage Builder edits.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(false);
                setActiveView('admin');
              }}
              className="px-3 py-1 rounded-md border border-white/25 hover:bg-white/10 transition-colors"
            >
              Back to Editor
            </button>
            <button
              type="button"
              disabled={publishingFromPreview}
              onClick={handlePreviewPublish}
              className="px-3 py-1 rounded-md bg-[#E9EFEA] text-[#1B3B2B] font-semibold hover:bg-white transition-colors"
            >
              {publishingFromPreview ? 'Publishing...' : 'Publish Live'}
            </button>
          </div>
        </div>
      )}

      {/* Configurable Announcement Bar */}
      {storeSettings.announcementEnabled && storeSettings.announcementText && (
        <div
          className="px-4 py-2 text-center text-xs font-medium"
          style={{
            backgroundColor: storeSettings.announcementBgColor || primaryColor,
            color: storeSettings.announcementTextColor || '#FAF8F4',
          }}
        >
          {storeSettings.announcementLink ? (
            <button
              type="button"
              onClick={() =>
                navigateTarget(
                  storeSettings.announcementLink?.startsWith('http') ? 'url' : 'shop',
                  storeSettings.announcementLink || 'all'
                )
              }
              className="hover:underline underline-offset-2"
            >
              {storeSettings.announcementText}
            </button>
          ) : (
            <span>{storeSettings.announcementText}</span>
          )}
        </div>
      )}

      <header
        className={`${
          headerSticky ? 'sticky top-0' : 'relative'
        } z-40 backdrop-blur-md border-b border-[#E4E0D6]`}
        style={{ backgroundColor: `${headerBg}f2`, color: headerText }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark / Logo + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 -ml-2 hover:opacity-75 transition-opacity"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                navigateTarget('home', '');
                setMobileNavOpen(false);
              }}
              className="text-left focus:outline-none flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              {storeSettings.logoUrl ? (
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.storeName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <span
                className="font-serif text-2xl sm:text-[26px] font-semibold tracking-[0.14em] leading-none"
                style={{ color: primaryColor }}
              >
                {storeSettings.storeName || 'VEYRA'}
              </span>
            </button>
          </div>

          {/* Zone 2: Single-Row Desktop Navigation (Dynamic CMS Menu + Dropdowns) */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
            {menuItems.slice(0, 5).map((item) => {
              const hasChildren = Boolean(item.children && item.children.length > 0);
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => hasChildren && setOpenDropdownId(item.id)}
                  onMouseLeave={() => hasChildren && setOpenDropdownId(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigateTarget(item.targetType, item.targetValue);
                      setOpenDropdownId(null);
                    }}
                    className="text-sm font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1 hover:opacity-75 transition-opacity py-2"
                  >
                    <span>{item.label}</span>
                    {hasChildren && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </button>

                  {hasChildren && openDropdownId === item.id && (
                    <div className="absolute left-0 top-full pt-1 z-50 min-w-[210px]">
                      <div className="bg-white border border-[#E4E0D6] rounded-xl shadow-lg py-2">
                        {item.children!.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              navigateTarget(sub.targetType, sub.targetValue);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-[#171C19] hover:bg-[#F3F0E8] transition-colors"
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`text-sm font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-opacity ${
                activeView === 'admin' ? 'font-semibold underline underline-offset-4' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
              <span>Admin</span>
            </button>
          </nav>

          {/* Zone 3: Action Controls (Configurable Search, Account, Shopping Bag) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {storeSettings.headerShowSearch !== false && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:opacity-75 transition-opacity"
                aria-label="Search products"
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>
            )}

            {storeSettings.headerShowAccount !== false && (
              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    setActiveView('account');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 transition-colors"
                aria-label={currentUser ? 'Account & orders' : 'Sign in'}
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-[#E4E0D6]"
                  />
                ) : (
                  <User className="w-5 h-5 stroke-[1.75]" />
                )}
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {currentUser ? currentUser.displayName.split(' ')[0] : 'Sign In'}
                </span>
              </button>
            )}

            {storeSettings.headerShowCart !== false && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-lg text-[#FAF8F4] transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                aria-label={`Shopping bag with ${cartItemCount} items`}
              >
                <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
                <span className="font-mono text-xs font-medium tabular-nums">
                  {cartItemCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Search Bar */}
        {isSearchOpen && storeSettings.headerShowSearch !== false && (
          <div className="border-t border-[#E4E0D6] bg-[#FAF8F4]">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-[#5C655F] shrink-0" />
              <input
                type="text"
                autoFocus
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products, collections, or materials..."
                className="flex-1 bg-transparent text-sm text-[#171C19] placeholder:text-[#5C655F]/70 focus:outline-none"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#5C655F] hover:text-[#171C19]"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-[#FAF8F4] text-xs font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E4E0D6] bg-[#FAF8F4] text-[#171C19] px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigateTarget(item.targetType, item.targetValue);
                    setMobileNavOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F3F0E8]"
                >
                  {item.label}
                </button>
                {item.children && item.children.length > 0 && (
                  <div className="pl-5 space-y-1">
                    {item.children.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigateTarget(sub.targetType, sub.targetValue);
                          setMobileNavOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[#5C655F] hover:bg-[#F3F0E8]"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                if (currentUser) setActiveView('account');
                else setIsAuthModalOpen(true);
                setMobileNavOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F3F0E8]"
            >
              {currentUser ? 'My Account & Orders' : 'Sign In / Create Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('admin');
                setMobileNavOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#F3F0E8]"
              style={{ color: primaryColor }}
            >
              Admin Console
            </button>
          </div>
        )}
      </header>
    </>
  );
};
