import React from 'react';
import { ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useApp, formatBDT } from '../context/AppContext';
import { DynamicSectionRenderer } from './DynamicSectionRenderer';

export const HomeView: React.FC = () => {
  const { websiteSections, storeSettings } = useApp();

  const sortedSections = [...websiteSections].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className="space-y-16 sm:space-y-20">
      {sortedSections.map((section) => (
        <DynamicSectionRenderer key={section.id} section={section} />
      ))}

      {/* Quiet 3-column Service Commitments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#E4E0D6]">
          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#F3F0E8]/70 border border-[#E4E0D6]">
            <Truck className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#171C19]">
                Complimentary Delivery Over {formatBDT(storeSettings.freeDeliveryThreshold)}
              </h3>
              <p className="text-xs text-[#5C655F] mt-1 leading-relaxed">
                Standard {formatBDT(storeSettings.insideDhakaDeliveryFee)} inside Dhaka and{' '}
                {formatBDT(storeSettings.outsideDhakaDeliveryFee)} nationwide across Bangladesh.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#F3F0E8]/70 border border-[#E4E0D6]">
            <ShieldCheck className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#171C19]">
                COD & Verified Mobile Pay
              </h3>
              <p className="text-xs text-[#5C655F] mt-1 leading-relaxed">
                Pay Cash on Delivery at your doorstep or submit a bKash / Nagad reference for manual verification.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#F3F0E8]/70 border border-[#E4E0D6]">
            <Sparkles className="w-5 h-5 text-[#1B3B2B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#171C19]">
                Quality Checked Before Dispatch
              </h3>
              <p className="text-xs text-[#5C655F] mt-1 leading-relaxed">
                Every piece is inspected, securely packaged, and tracked from confirmation to delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
