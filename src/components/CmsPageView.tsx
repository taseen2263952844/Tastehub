import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RichContentRenderer } from './RichContentRenderer';

export const CmsPageView: React.FC = () => {
  const { selectedPage, setActiveView, isAdmin, isPreviewMode } = useApp();

  if (!selectedPage || (selectedPage.status !== 'published' && !(isAdmin && isPreviewMode))) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
          Page not found
        </h1>
        <p className="text-sm text-[#5C655F]">
          This page is either unpublished or does not exist.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        type="button"
        onClick={() => setActiveView('home')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C655F] hover:text-[#171C19]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Storefront</span>
      </button>

      <header className="space-y-2 border-b border-[#E4E0D6] pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
          VEYRA Information
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#171C19]">
          {selectedPage.title}
        </h1>
      </header>

      {selectedPage.featuredImage && (
        <div className="aspect-16/9 w-full rounded-2xl overflow-hidden bg-[#F3F0E8] border border-[#E4E0D6]">
          <img
            src={selectedPage.featuredImage}
            alt={selectedPage.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="bg-white border border-[#E4E0D6] rounded-3xl p-6 sm:p-10">
        <RichContentRenderer content={selectedPage.content} />
      </div>
    </div>
  );
};
