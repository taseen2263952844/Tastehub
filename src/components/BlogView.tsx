import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Calendar, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostType } from '../types';
import { RichContentRenderer } from './RichContentRenderer';

export const BlogListView: React.FC = () => {
  const { cmsPosts, openPostBySlug, isAdmin, isPreviewMode } = useApp();
  const [typeFilter, setTypeFilter] = useState<PostType | 'all'>('all');
  const [search, setSearch] = useState('');

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cmsPosts.filter((p) => {
      const canSee = (isAdmin && isPreviewMode) || p.status === 'published';
      if (!canSee) return false;
      if (typeFilter !== 'all' && p.postType !== typeFilter) return false;
      if (q) {
        const hay = `${p.title} ${p.excerpt} ${p.tags.join(' ')} ${p.categories.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cmsPosts, typeFilter, search, isAdmin, isPreviewMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#E4E0D6] pb-6 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
          Editorial & Updates
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#171C19]">
          VEYRA Journal & News
        </h1>
        <p className="text-sm text-[#5C655F] max-w-2xl">
          Stories on tactile living, material guides, product launches, and seasonal announcements.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Posts' },
              { id: 'blog', label: 'Blog Articles' },
              { id: 'product_highlight', label: 'Product Highlights' },
              { id: 'announcement', label: 'Announcements' },
              { id: 'campaign', label: 'Campaigns' },
              { id: 'news', label: 'News' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                typeFilter === tab.id
                  ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                  : 'bg-white text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#5C655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search journal..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
          />
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-12 text-center text-sm text-[#5C655F]">
          No published posts match your current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              onClick={() => openPostBySlug(post.slug)}
              className="group cursor-pointer flex flex-col bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden hover:border-[#1B3B2B]/50 transition-colors"
            >
              {post.featuredImage && (
                <div className="aspect-4/3 w-full bg-[#F3F0E8] overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#6E8774] font-semibold">
                    <span>{post.postType.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-[#171C19] group-hover:text-[#1B3B2B] leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#5C655F] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#1B3B2B] group-hover:underline underline-offset-4">
                  Read Article →
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export const PostDetailView: React.FC = () => {
  const { selectedPost, setActiveView, isAdmin, isPreviewMode } = useApp();

  if (!selectedPost || (selectedPost.status !== 'published' && !(isAdmin && isPreviewMode))) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
          Post not found or not published
        </h1>
        <button
          type="button"
          onClick={() => setActiveView('blog')}
          className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium"
        >
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        type="button"
        onClick={() => {
          window.location.hash = 'blog';
          setActiveView('blog');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C655F] hover:text-[#171C19]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Journal & News</span>
      </button>

      <header className="space-y-4 border-b border-[#E4E0D6] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E8774] font-medium">
          <span className="uppercase tracking-wider">{selectedPost.postType.replace('_', ' ')}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(selectedPost.publishDate).toLocaleDateString()}
          </span>
          <span>·</span>
          <span>By {selectedPost.authorName || 'VEYRA Editorial'}</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#171C19] leading-tight">
          {selectedPost.title}
        </h1>
        {selectedPost.excerpt && (
          <p className="text-base text-[#5C655F] leading-relaxed">{selectedPost.excerpt}</p>
        )}
      </header>

      {selectedPost.featuredImage && (
        <div className="aspect-16/9 w-full rounded-2xl overflow-hidden bg-[#F3F0E8] border border-[#E4E0D6]">
          <img
            src={selectedPost.featuredImage}
            alt={selectedPost.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose-like max-w-none">
        <RichContentRenderer content={selectedPost.content} />
      </div>

      {selectedPost.galleryImages && selectedPost.galleryImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {selectedPost.galleryImages.map((img, i) => (
            <div key={i} className="aspect-4/3 rounded-xl overflow-hidden bg-[#F3F0E8] border border-[#E4E0D6]">
              <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {selectedPost.tags && selectedPost.tags.length > 0 && (
        <div className="pt-6 border-t border-[#E4E0D6] flex flex-wrap items-center gap-3 text-xs text-[#5C655F]">
          <Tag className="w-3.5 h-3.5" />
          <span>{selectedPost.tags.join(' · ')}</span>
        </div>
      )}
    </article>
  );
};
