import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  ArrowUp,
  ArrowDown,
  Search,
  Image as ImageIcon,
  Send,
  CornerDownRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CmsPost,
  CmsPage,
  PostStatus,
  PostType,
  NavigationMenu,
  NavMenuItem,
} from '../../types';
import { MediaPickerModal } from './MediaPickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

// Helper to insert clean formatting markers into plain-text prose
function appendFormattingSnippet(current: string, snippet: string): string {
  if (!current.trim()) return snippet;
  return `${current.trimEnd()}\n\n${snippet}`;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// =====================================================================
// 1. POSTS & BLOG MANAGER
// =====================================================================
export const PostsManagerPanel: React.FC = () => {
  const {
    cmsPosts,
    saveCmsPost,
    deleteCmsPost,
    openPostBySlug,
    setIsPreviewMode,
    currentUser,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [editing, setEditing] = useState<CmsPost | null>(null);
  const [pendingDeletePost, setPendingDeletePost] = useState<CmsPost | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [catInput, setCatInput] = useState('');
  const [mediaTarget, setMediaTarget] = useState<'featured' | 'gallery' | null>(null);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cmsPosts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q && !`${p.title} ${p.slug} ${p.postType}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cmsPosts, search, statusFilter]);

  const startNewPost = () => {
    setEditing({
      id: `post-${Date.now().toString().slice(-6)}`,
      title: '',
      slug: '',
      postType: 'blog',
      excerpt: '',
      content: '## Introduction\n\nWrite your article story here.\n\n- Key takeaway one\n- Key takeaway two',
      featuredImage: '',
      galleryImages: [],
      categories: ['Editorial'],
      tags: [],
      seoTitle: '',
      seoDescription: '',
      status: 'draft',
      publishDate: new Date().toISOString().slice(0, 16),
      authorName: currentUser?.displayName || 'VEYRA Editorial',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const cleanSlug = editing.slug.trim() || slugify(editing.title) || editing.id;
    await saveCmsPost({
      ...editing,
      slug: cleanSlug,
      publishDate: editing.publishDate || new Date().toISOString(),
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Posts, Announcements & Journal
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Create blog articles, product highlights, campaigns, and news. Only published posts appear on the public Journal.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewPost}
          className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="font-serif text-xl font-semibold text-[#171C19]">
              {editing.title ? `Edit Post: ${editing.title}` : 'Create New Post'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs text-[#5C655F] hover:text-[#171C19]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Post Title *
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                placeholder="auto-from-title"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Post Type
              </label>
              <select
                value={editing.postType}
                onChange={(e) =>
                  setEditing({ ...editing, postType: e.target.value as PostType })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              >
                <option value="blog">Blog Article</option>
                <option value="product_highlight">Product Highlight</option>
                <option value="announcement">Announcement</option>
                <option value="campaign">Campaign</option>
                <option value="news">News</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Status
              </label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as PostStatus })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold"
              >
                <option value="draft">Draft (Admin Only)</option>
                <option value="published">Published (Live)</option>
                <option value="scheduled">Scheduled Date</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Publish Date
              </label>
              <input
                type="datetime-local"
                value={(editing.publishDate || '').slice(0, 16)}
                onChange={(e) => setEditing({ ...editing, publishDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={editing.authorName}
                onChange={(e) => setEditing({ ...editing, authorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Short Excerpt
            </label>
            <textarea
              rows={2}
              value={editing.excerpt}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
            />
          </div>

          {/* Formatting helpers + Structured Content */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-[#5C655F]">
                Post Content *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '+ Heading', snip: '## Section Heading' },
                  { label: '+ Subheading', snip: '### Subheading' },
                  { label: '+ Bullet List', snip: '- Bullet item one\n- Bullet item two' },
                  { label: '+ Quote', snip: '> Thoughtful editorial quote.' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        content: appendFormattingSnippet(editing.content, btn.snip),
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-[11px] font-medium hover:bg-[#E9EFEA]"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={8}
              required
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-sans leading-relaxed"
            />
          </div>

          {/* Featured Image & Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E4E0D6]">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#5C655F]">
                Featured Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={editing.featuredImage || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, featuredImage: e.target.value })
                  }
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
                <button
                  type="button"
                  onClick={() => setMediaTarget('featured')}
                  className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Media
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#5C655F]">
                  Gallery Images ({editing.galleryImages.length})
                </label>
                <button
                  type="button"
                  onClick={() => setMediaTarget('gallery')}
                  className="text-xs font-semibold text-[#1B3B2B] hover:underline"
                >
                  + Add from Media
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editing.galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E4E0D6]"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          galleryImages: editing.galleryImages.filter((_, idx) => idx !== i),
                        })
                      }
                      className="absolute top-0.5 right-0.5 px-1 bg-black/70 text-white text-[10px] rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C655F]">
                Categories
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  placeholder="Add category..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!catInput.trim()) return;
                    setEditing({
                      ...editing,
                      categories: [...editing.categories, catInput.trim()],
                    });
                    setCatInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing.categories.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#E9EFEA] text-[#1B3B2B] text-xs inline-flex items-center gap-1"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          categories: editing.categories.filter((_, i) => i !== idx),
                        })
                      }
                      className="hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C655F]">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!tagInput.trim()) return;
                    setEditing({
                      ...editing,
                      tags: [...editing.tags, tagInput.trim()],
                    });
                    setTagInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#F3F0E8] text-[#171C19] text-xs inline-flex items-center gap-1"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          tags: editing.tags.filter((_, i) => i !== idx),
                        })
                      }
                      className="hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E4E0D6]">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={editing.seoTitle || ''}
                onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                SEO Meta Description
              </label>
              <input
                type="text"
                value={editing.seoDescription || ''}
                onChange={(e) =>
                  setEditing({ ...editing, seoDescription: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#142D20]"
          >
            <Save className="w-4 h-4" />
            <span>Save Post</span>
          </button>
        </form>
      )}

      {/* Filter & List */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5C655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by title, slug, or type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#E4E0D6]">
        {filteredPosts.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#5C655F]">
            No posts match your filter.
          </p>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-[#E4E0D6] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#171C19] truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-[#5C655F] flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="uppercase tracking-wider text-[10px] font-semibold text-[#6E8774]">
                      {post.postType.replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        post.status === 'published'
                          ? 'bg-[#E9EFEA] text-[#1B3B2B]'
                          : post.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-[#F3F0E8] text-[#5C655F]'
                      }`}
                    >
                      {post.status}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">#post/{post.slug}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {post.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => saveCmsPost({ ...post, status: 'published' })}
                    className="px-3 py-1.5 rounded-lg bg-[#E9EFEA] text-[#1B3B2B] text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Publish Now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (post.status !== 'published') setIsPreviewMode(true);
                    openPostBySlug(post.slug);
                  }}
                  className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                  title="View Post"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(post)}
                  className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                  title="Edit Post"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeletePost(post)}
                  className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <MediaPickerModal
        isOpen={Boolean(mediaTarget)}
        onClose={() => setMediaTarget(null)}
        defaultFolder="posts"
        title="Choose Post Image"
        onSelect={(url) => {
          if (!editing) return;
          if (mediaTarget === 'featured') {
            setEditing({ ...editing, featuredImage: url });
          } else if (mediaTarget === 'gallery') {
            setEditing({
              ...editing,
              galleryImages: [...editing.galleryImages, url],
            });
          }
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeletePost)}
        onClose={() => setPendingDeletePost(null)}
        title="Delete Blog Post?"
        itemLabel={pendingDeletePost?.title || ''}
        description="This permanently deletes the post from Cloud Firestore, removes it from the public Journal, and cleans up any unreferenced uploaded images."
        onConfirm={async () => {
          if (!pendingDeletePost) return;
          await deleteCmsPost(pendingDeletePost.id);
          if (editing?.id === pendingDeletePost.id) setEditing(null);
        }}
      />
    </div>
  );
};

// =====================================================================
// 2. CUSTOM PAGES BUILDER
// =====================================================================
export const PagesManagerPanel: React.FC = () => {
  const {
    cmsPages,
    saveCmsPage,
    deleteCmsPage,
    openPageBySlug,
    setIsPreviewMode,
  } = useApp();

  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [pendingDeletePage, setPendingDeletePage] = useState<CmsPage | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  const startNewPage = () => {
    setEditing({
      id: `page-${Date.now().toString().slice(-6)}`,
      title: '',
      slug: '',
      featuredImage: '',
      content: '## Page Heading\n\nWrite structured information for this custom page.\n\n- Detail point one\n- Detail point two',
      seoTitle: '',
      seoDescription: '',
      status: 'draft',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const cleanSlug = editing.slug.trim() || slugify(editing.title) || editing.id;
    await saveCmsPage({ ...editing, slug: cleanSlug });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Custom Pages Builder
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Create About Us, FAQ, Shipping Policy, Contact Us, or custom landing pages at #page/your-slug.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewPage}
          className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Page</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="font-serif text-xl font-semibold text-[#171C19]">
              {editing.title ? `Edit Page: ${editing.title}` : 'New Custom Page'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs text-[#5C655F] hover:text-[#171C19]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Page Title *
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                URL Slug (#page/slug)
              </label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                placeholder="about-us"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Publication Status
              </label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold"
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="published">Published (Public)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Banner Image URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={editing.featuredImage || ''}
                onChange={(e) =>
                  setEditing({ ...editing, featuredImage: e.target.value })
                }
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-[#5C655F]">
                Page Content *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '+ Heading', snip: '## Section Title' },
                  { label: '+ Subheading', snip: '### Subheading' },
                  { label: '+ Bullet List', snip: '- List item one\n- List item two' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        content: appendFormattingSnippet(editing.content, btn.snip),
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-[11px] font-medium"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={9}
              required
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E4E0D6]">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                SEO Title
              </label>
              <input
                type="text"
                value={editing.seoTitle || ''}
                onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                SEO Description
              </label>
              <input
                type="text"
                value={editing.seoDescription || ''}
                onChange={(e) =>
                  setEditing({ ...editing, seoDescription: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#142D20]"
          >
            <Save className="w-4 h-4" />
            <span>Save Page</span>
          </button>
        </form>
      )}

      <div className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#E4E0D6]">
        {cmsPages.map((page) => (
          <div
            key={page.id}
            className="p-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-[#171C19]">{page.title}</p>
              <p className="text-xs text-[#5C655F] mt-0.5 flex items-center gap-2">
                <span className="font-mono">#page/{page.slug}</span>
                <span>·</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    page.status === 'published'
                      ? 'bg-[#E9EFEA] text-[#1B3B2B]'
                      : 'bg-[#F3F0E8] text-[#5C655F]'
                  }`}
                >
                  {page.status}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  saveCmsPage({
                    ...page,
                    status: page.status === 'published' ? 'draft' : 'published',
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#FAF8F4]"
              >
                {page.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (page.status !== 'published') setIsPreviewMode(true);
                  openPageBySlug(page.slug);
                }}
                className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                title="View Page"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditing(page)}
                className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                title="Edit Page"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDeletePage(page)}
                className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                title="Delete Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        defaultFolder="pages"
        title="Select Page Banner Image"
        onSelect={(url) => {
          if (editing) setEditing({ ...editing, featuredImage: url });
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeletePage)}
        onClose={() => setPendingDeletePage(null)}
        title="Delete Custom Page?"
        itemLabel={pendingDeletePage ? `${pendingDeletePage.title} (#page/${pendingDeletePage.slug})` : ''}
        description="This permanently deletes the custom page from Cloud Firestore and removes unreferenced page banner imagery."
        onConfirm={async () => {
          if (!pendingDeletePage) return;
          await deleteCmsPage(pendingDeletePage.id);
          if (editing?.id === pendingDeletePage.id) setEditing(null);
        }}
      />
    </div>
  );
};

// =====================================================================
// 3. NAVIGATION MENUS MANAGER
// =====================================================================
export const NavigationManagerPanel: React.FC = () => {
  const {
    draftMenus,
    updateDraftMenus,
    deleteNavigationMenu,
    persistNavigationMenusLiveAndDraft,
    cmsPages,
    categories,
    products,
  } = useApp();
  const [menus, setMenus] = useState<NavigationMenu[]>(draftMenus);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(draftMenus[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [pendingNavDelete, setPendingNavDelete] = useState<
    | { type: 'menu'; menu: NavigationMenu }
    | { type: 'item'; menuId: string; itemIdx: number; label: string }
    | { type: 'child'; menuId: string; itemIdx: number; childIdx: number; label: string }
    | null
  >(null);

  useEffect(() => {
    setMenus(draftMenus);
    if (!draftMenus.some((m) => m.id === selectedMenuId) && draftMenus[0]) {
      setSelectedMenuId(draftMenus[0].id);
    }
  }, [draftMenus]);

  const activeMenu = menus.find((m) => m.id === selectedMenuId) || null;

  const updateActiveMenu = (next: NavigationMenu) => {
    setMenus((prev) => prev.map((m) => (m.id === next.id ? next : m)));
  };

  const handleSaveMenus = async () => {
    setSaving(true);
    try {
      await updateDraftMenus(menus);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMenu = async () => {
    const newMenu: NavigationMenu = {
      id: `menu-${Date.now().toString().slice(-5)}`,
      name: 'Custom Menu',
      location: 'custom',
      items: [
        {
          id: `nav-${Date.now().toString().slice(-4)}`,
          label: 'Shop All',
          targetType: 'shop',
          targetValue: 'all',
        },
      ],
    };
    const next = [...menus, newMenu];
    setMenus(next);
    setSelectedMenuId(newMenu.id);
    await updateDraftMenus(next);
  };

  const addTopItem = () => {
    if (!activeMenu) return;
    const item: NavMenuItem = {
      id: `nav-${Date.now().toString().slice(-5)}`,
      label: 'New Link',
      targetType: 'shop',
      targetValue: 'all',
    };
    updateActiveMenu({ ...activeMenu, items: [...activeMenu.items, item] });
  };

  const addChildItem = (parentIdx: number) => {
    if (!activeMenu) return;
    const nextItems = [...activeMenu.items];
    const parent = nextItems[parentIdx];
    const child: NavMenuItem = {
      id: `nav-c-${Date.now().toString().slice(-5)}`,
      label: 'Sub-Link',
      targetType: 'category',
      targetValue: categories[0]?.slug || 'all',
    };
    nextItems[parentIdx] = {
      ...parent,
      children: [...(parent.children || []), child],
    };
    updateActiveMenu({ ...activeMenu, items: nextItems });
  };

  const moveTopItem = (from: number, to: number) => {
    if (!activeMenu || to < 0 || to >= activeMenu.items.length) return;
    const next = [...activeMenu.items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateActiveMenu({ ...activeMenu, items: next });
  };

  const renderTargetValueControl = (
    item: NavMenuItem,
    onChangeVal: (val: string) => void
  ) => {
    if (item.targetType === 'page') {
      return (
        <select
          value={item.targetValue}
          onChange={(e) => onChangeVal(e.target.value)}
          className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs"
        >
          <option value="">Select page...</option>
          {cmsPages.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      );
    }
    if (item.targetType === 'category') {
      return (
        <select
          value={item.targetValue}
          onChange={(e) => onChangeVal(e.target.value)}
          className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }
    if (item.targetType === 'product') {
      return (
        <select
          value={item.targetValue}
          onChange={(e) => onChangeVal(e.target.value)}
          className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs"
        >
          <option value="">Select product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={item.targetValue}
        onChange={(e) => onChangeVal(e.target.value)}
        placeholder="Value / slug / URL"
        className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Navigation Menus & Dropdowns
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Create header or custom menus, link to pages, categories, products, or external URLs, and organize nested dropdown links.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreateMenu}
            className="px-4 py-2.5 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Menu</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveMenus}
            className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Navigation Draft'}</span>
          </button>
        </div>
      </div>

      {/* Menu Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {menus.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMenuId(m.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border ${
              m.id === selectedMenuId
                ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                : 'bg-white text-[#5C655F] border-[#E4E0D6]'
            }`}
          >
            {m.name} ({m.location})
          </button>
        ))}
      </div>

      {activeMenu && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#E4E0D6] items-end">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Menu Name
              </label>
              <input
                type="text"
                value={activeMenu.name}
                onChange={(e) =>
                  updateActiveMenu({ ...activeMenu, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Location
              </label>
              <select
                value={activeMenu.location}
                onChange={(e) =>
                  updateActiveMenu({ ...activeMenu, location: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={addTopItem}
                className="px-4 py-2 rounded-xl bg-[#E9EFEA] text-[#1B3B2B] text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
              {menus.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPendingNavDelete({ type: 'menu', menu: activeMenu })
                  }
                  className="px-3 py-2 rounded-xl border border-[#E4E0D6] text-xs text-red-700 hover:bg-red-50"
                >
                  Delete Menu
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {activeMenu.items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...activeMenu.items];
                      next[idx] = { ...item, label: e.target.value };
                      updateActiveMenu({ ...activeMenu, items: next });
                    }}
                    placeholder="Link Label"
                    className="md:col-span-3 px-3 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs font-semibold"
                  />

                  <select
                    value={item.targetType}
                    onChange={(e) => {
                      const next = [...activeMenu.items];
                      next[idx] = {
                        ...item,
                        targetType: e.target.value as any,
                        targetValue: '',
                      };
                      updateActiveMenu({ ...activeMenu, items: next });
                    }}
                    className="md:col-span-3 px-2.5 py-2 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                  >
                    <option value="home">Home</option>
                    <option value="shop">Shop Catalog</option>
                    <option value="category">Category</option>
                    <option value="product">Product</option>
                    <option value="page">Custom Page</option>
                    <option value="blog">Blog / Journal</option>
                    <option value="tracking">Track Order</option>
                    <option value="url">External URL</option>
                  </select>

                  <div className="md:col-span-4">
                    {renderTargetValueControl(item, (val) => {
                      const next = [...activeMenu.items];
                      next[idx] = { ...item, targetValue: val };
                      updateActiveMenu({ ...activeMenu, items: next });
                    })}
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveTopItem(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded bg-white border border-[#E4E0D6] text-[#5C655F] disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTopItem(idx, idx + 1)}
                      disabled={idx === activeMenu.items.length - 1}
                      className="p-1.5 rounded bg-white border border-[#E4E0D6] text-[#5C655F] disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => addChildItem(idx)}
                      className="px-2 py-1.5 rounded bg-white border border-[#E4E0D6] text-[11px] font-medium text-[#1B3B2B]"
                      title="Add dropdown child"
                    >
                      + Sub
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingNavDelete({
                          type: 'item',
                          menuId: activeMenu.id,
                          itemIdx: idx,
                          label: item.label || 'Untitled Link',
                        })
                      }
                      className="p-1.5 rounded bg-white border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nested Dropdown Items */}
                {item.children && item.children.length > 0 && (
                  <div className="pl-6 space-y-2 border-l border-[#E4E0D6] ml-2">
                    {item.children.map((child, cIdx) => (
                      <div
                        key={child.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                      >
                        <div className="md:col-span-3 flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-[#6E8774] shrink-0" />
                          <input
                            type="text"
                            value={child.label}
                            onChange={(e) => {
                              const next = [...activeMenu.items];
                              const children = [...(item.children || [])];
                              children[cIdx] = { ...child, label: e.target.value };
                              next[idx] = { ...item, children };
                              updateActiveMenu({ ...activeMenu, items: next });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                          />
                        </div>
                        <select
                          value={child.targetType}
                          onChange={(e) => {
                            const next = [...activeMenu.items];
                            const children = [...(item.children || [])];
                            children[cIdx] = {
                              ...child,
                              targetType: e.target.value as any,
                              targetValue: '',
                            };
                            next[idx] = { ...item, children };
                            updateActiveMenu({ ...activeMenu, items: next });
                          }}
                          className="md:col-span-3 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                        >
                          <option value="shop">Shop Catalog</option>
                          <option value="category">Category</option>
                          <option value="product">Product</option>
                          <option value="page">Custom Page</option>
                          <option value="blog">Blog</option>
                          <option value="url">External URL</option>
                        </select>
                        <div className="md:col-span-5">
                          {renderTargetValueControl(child, (val) => {
                            const next = [...activeMenu.items];
                            const children = [...(item.children || [])];
                            children[cIdx] = { ...child, targetValue: val };
                            next[idx] = { ...item, children };
                            updateActiveMenu({ ...activeMenu, items: next });
                          })}
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setPendingNavDelete({
                                type: 'child',
                                menuId: activeMenu.id,
                                itemIdx: idx,
                                childIdx: cIdx,
                                label: child.label || 'Untitled Sub-Link',
                              })
                            }
                            className="p-1.5 text-[#5C655F] hover:text-red-700"
                            title="Remove sub-link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingNavDelete)}
        onClose={() => setPendingNavDelete(null)}
        title={
          pendingNavDelete?.type === 'menu'
            ? 'Delete Navigation Menu?'
            : pendingNavDelete?.type === 'child'
            ? 'Delete Dropdown Sub-Link?'
            : 'Delete Navigation Link?'
        }
        itemLabel={
          pendingNavDelete?.type === 'menu'
            ? `${pendingNavDelete.menu.name} (${pendingNavDelete.menu.location})`
            : pendingNavDelete?.label || ''
        }
        description={
          pendingNavDelete?.type === 'menu'
            ? 'This permanently removes the menu from Cloud Firestore, your draft, and your live website navigation.'
            : 'This permanently deletes the navigation item and immediately updates both your draft and live website menu.'
        }
        onConfirm={async () => {
          if (!pendingNavDelete) return;
          if (pendingNavDelete.type === 'menu') {
            await deleteNavigationMenu(pendingNavDelete.menu.id, true);
            const remaining = menus.filter((m) => m.id !== pendingNavDelete.menu.id);
            setMenus(remaining);
            if (selectedMenuId === pendingNavDelete.menu.id) {
              setSelectedMenuId(remaining[0]?.id || '');
            }
          } else if (pendingNavDelete.type === 'item') {
            const nextMenus = menus.map((m) =>
              m.id === pendingNavDelete.menuId
                ? {
                    ...m,
                    items: m.items.filter((_, i) => i !== pendingNavDelete.itemIdx),
                  }
                : m
            );
            await persistNavigationMenusLiveAndDraft(nextMenus, true);
            setMenus(nextMenus);
          } else {
            const nextMenus = menus.map((m) => {
              if (m.id !== pendingNavDelete.menuId) return m;
              const nextItems = m.items.map((it, idx) =>
                idx === pendingNavDelete.itemIdx
                  ? {
                      ...it,
                      children: (it.children || []).filter(
                        (_, ci) => ci !== pendingNavDelete.childIdx
                      ),
                    }
                  : it
              );
              return { ...m, items: nextItems };
            });
            await persistNavigationMenusLiveAndDraft(nextMenus, true);
            setMenus(nextMenus);
          }
        }}
      />
    </div>
  );
};
