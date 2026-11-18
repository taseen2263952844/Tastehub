import React, { useState } from 'react';
import { GraduationCap, Menu, Shield, UserCheck, X, ArrowRight, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppView } from '../types';

const PRIMARY_NAV: { label: string; view: AppView }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Courses', view: 'courses' },
  { label: 'Teachers', view: 'teachers' },
  { label: 'Batches', view: 'batches' },
  { label: 'Notices', view: 'notices' },
  { label: 'About', view: 'about' },
  { label: 'Contact', view: 'contact' },
];

export const Header: React.FC = () => {
  const {
    view,
    setView,
    siteSettings,
    authUser,
    isAdmin,
    notifications,
    openAdmissionModal,
    setAuthModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (view === 'exam') {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigateTo = (target: AppView) => {
    setView(target);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9F7]/95 backdrop-blur-md border-b border-[#DCE2DC] print:hidden">
      {siteSettings.announcementEnabled && siteSettings.announcementText && (
        <div
          className="text-white text-xs py-2 px-4 text-center font-medium"
          style={{ backgroundColor: siteSettings.primaryColor || '#0F3D2E' }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
            <span>{siteSettings.announcementText}</span>
            <button
              type="button"
              onClick={() => openAdmissionModal()}
              className="underline underline-offset-2 font-semibold hover:opacity-90 whitespace-nowrap"
            >
              Apply for Admission
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 text-left shrink-0 group"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: siteSettings.primaryColor || '#0F3D2E' }}
          >
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <span className="font-serif text-lg font-bold tracking-tight text-[#111915] block whitespace-nowrap">
              {siteSettings.shortName || 'SOFS'}
            </span>
            <span className="text-[11px] text-[#4E5B53] block whitespace-nowrap">
              Academic Coaching
            </span>
          </div>
        </button>

        {/* Center: Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => navigateTo(item.view)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  active
                    ? 'text-[#0F3D2E] border-b-2 border-[#0F3D2E]'
                    : 'text-[#4E5B53] hover:text-[#111915]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => navigateTo('gallery')}
            className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              view === 'gallery'
                ? 'text-[#0F3D2E] border-b-2 border-[#0F3D2E]'
                : 'text-[#4E5B53] hover:text-[#111915]'
            }`}
          >
            Gallery
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('admission')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: siteSettings.accentColor || '#B47B2B' }}
          >
            <span>SOFS Admission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {authUser ? (
            <>
              <button
                type="button"
                onClick={() => navigateTo('portal')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
                  view === 'portal'
                    ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                    : 'bg-white text-[#111915] border-[#DCE2DC] hover:bg-[#EEF2EE]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Student Portal</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-[#B47B2B] text-white">
                    <Bell className="w-2.5 h-2.5" />
                    {unreadCount}
                  </span>
                )}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
                    view === 'admin'
                      ? 'bg-[#111915] text-white border-[#111915]'
                      : 'bg-[#EEF2EE] text-[#0F3D2E] border-[#C8D4CA] hover:bg-[#DCE5DD]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#DCE2DC] bg-white text-[#111915] hover:bg-[#EEF2EE] whitespace-nowrap shrink-0"
            >
              Student Login
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg border border-[#DCE2DC] bg-white text-[#111915]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE2DC] bg-white px-4 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[...PRIMARY_NAV, { label: 'Gallery', view: 'gallery' as AppView }].map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => navigateTo(item.view)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  view === item.view
                    ? 'bg-[#EEF2EE] text-[#0F3D2E] font-semibold'
                    : 'text-[#111915] hover:bg-[#F8F9F7]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#DCE2DC] flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigateTo('admission')}
              className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold text-white text-center"
              style={{ backgroundColor: siteSettings.accentColor || '#B47B2B' }}
            >
              Apply for SOFS Admission
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="py-2.5 px-4 rounded-lg text-xs font-semibold bg-[#111915] text-white"
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
