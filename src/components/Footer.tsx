import React from 'react';
import { ChefHat, MapPin, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC<{ onOpenDeploymentGuide: () => void }> = ({ onOpenDeploymentGuide }) => {
  const { setActiveView } = useApp();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl text-white tracking-tight">
                TasteHub
              </span>
              <p className="text-[11px] text-amber-400 font-medium">
                Restaurant & Takeaway
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Honoring time-tested Bangladeshi culinary traditions with pure ghee, authentic hand-ground spices, and unforgettable Dhakaiya hospitality.
          </p>
        </div>

        {/* Location & Hours */}
        <div className="space-y-3 text-xs">
          <h4 className="font-serif font-bold text-white text-sm uppercase tracking-wider text-amber-400">
            Visit & Contact
          </h4>
          <div className="flex items-start gap-2 text-stone-300">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>Ground Floor, Concord Regency, Road 27 (Old 16), Dhanmondi, Dhaka-1209</span>
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span>+880 1711-TASTEHUB / 02-9876543</span>
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Every Day: 11:30 AM – 11:00 PM</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-3 text-xs">
          <h4 className="font-serif font-bold text-white text-sm uppercase tracking-wider text-amber-400">
            Quick Services
          </h4>
          <ul className="space-y-2 text-stone-400">
            <li>
              <button 
                onClick={() => {
                  setActiveView('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-amber-400 transition-colors"
              >
                Full Restaurant Menu (৳ BDT)
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  setActiveView('tracking');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-amber-400 transition-colors"
              >
                Track Live Order Status
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  setActiveView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-amber-400 transition-colors"
              >
                Authorized Management Portal
              </button>
            </li>
            <li>
              <button 
                onClick={onOpenDeploymentGuide} 
                className="hover:text-amber-400 transition-colors"
              >
                Cloudflare Pages & Firebase Guide
              </button>
            </li>
          </ul>
        </div>

        {/* Payment & Security */}
        <div className="space-y-3 text-xs">
          <h4 className="font-serif font-bold text-white text-sm uppercase tracking-wider text-amber-400">
            Secure Payment
          </h4>
          <p className="text-stone-400 text-xs">
            We strictly accept <strong>Cash on Delivery (COD)</strong> for online orders and <strong>Cash/Card/bKash at Counter</strong> for pickups.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-stone-400 bg-stone-900 p-2.5 rounded-xl border border-stone-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authoritative price validation & privacy protection active.</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
        <p>© {new Date().getFullYear()} TasteHub Restaurant. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Built with React, TypeScript & Vite • Optimized for Android & Cloudflare Pages
        </p>
      </div>
    </footer>
  );
};
