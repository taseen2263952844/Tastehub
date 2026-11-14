import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Monitor,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WebsiteSection, WebsiteSectionType, SectionItemEntry } from '../../types';
import { MediaPickerModal } from './MediaPickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const SECTION_CATALOG: { type: WebsiteSectionType; label: string; desc: string }[] = [
  { type: 'hero_banner', label: 'Hero Banner', desc: 'Full-width editorial focal banner & CTA' },
  { type: 'promotional_banner', label: 'Promotional Banner', desc: 'Compact campaign spotlight strip' },
  { type: 'image_text', label: 'Image + Text Split', desc: 'Asymmetric photo and brand storytelling' },
  { type: 'featured_products', label: 'Featured Products Grid', desc: 'Highlight curated or featured products' },
  { type: 'new_arrivals', label: 'New Arrivals Grid', desc: 'Latest additions to your catalog' },
  { type: 'best_sellers', label: 'Best Sellers Grid', desc: 'Highest popularity essentials' },
  { type: 'category_grid', label: 'Category Grid', desc: 'Showcase shoppable collections' },
  { type: 'promotional_product_grid', label: 'Promotional Product Grid', desc: 'Discounted & campaign product grid' },
  { type: 'collection_showcase', label: 'Collection Showcase', desc: 'Products filtered by one category' },
  { type: 'image_gallery', label: 'Image Gallery', desc: 'Multi-image visual showcase grid' },
  { type: 'brand_intro', label: 'Brand Introduction', desc: 'Editorial philosophy & mission block' },
  { type: 'testimonials', label: 'Testimonials', desc: 'Press or community quotes' },
  { type: 'customer_reviews', label: 'Customer Reviews', desc: 'Rated 5-star buyer feedback cards' },
  { type: 'newsletter', label: 'Newsletter Subscription', desc: 'Email capture wired to Firestore' },
  { type: 'social_showcase', label: 'Social Showcase', desc: 'Community gallery & social profile CTA' },
  { type: 'rich_text', label: 'Custom Text Block', desc: 'Structured headings, paragraphs & lists' },
  { type: 'countdown_promo', label: 'Countdown Promo', desc: 'Timed campaign countdown banner' },
];

export const HomepageBuilderPanel: React.FC = () => {
  const {
    draftSections,
    updateDraftSections,
    deleteWebsiteSection,
    products,
    categories,
    showToast,
  } = useApp();
  const [sections, setSections] = useState<WebsiteSection[]>(draftSections);
  const [selectedId, setSelectedId] = useState<string>(draftSections[0]?.id || '');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [urlToAdd, setUrlToAdd] = useState('');
  const [pendingDeleteSection, setPendingDeleteSection] = useState<WebsiteSection | null>(null);

  useEffect(() => {
    setSections(draftSections);
    if (!draftSections.some((s) => s.id === selectedId) && draftSections[0]) {
      setSelectedId(draftSections[0].id);
    }
  }, [draftSections]);

  const selected = sections.find((s) => s.id === selectedId) || null;

  const persistOrder = async (next: WebsiteSection[]) => {
    const normalized = next.map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    setSections(normalized);
    setSaving(true);
    try {
      await updateDraftSections(normalized);
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedField = (patch: Partial<WebsiteSection>) => {
    if (!selected) return;
    setSections((prev) => prev.map((s) => (s.id === selected.id ? { ...s, ...patch } : s)));
  };

  const handleSaveInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistOrder(sections);
    showToast('Homepage section draft saved');
  };

  const handleAddSection = async (type: WebsiteSectionType) => {
    const meta = SECTION_CATALOG.find((c) => c.type === type);
    const id = `sec-${type.slice(0, 8)}-${Date.now().toString().slice(-4)}`;
    const newSec: WebsiteSection = {
      id,
      type,
      name: meta?.label || type,
      heading: meta?.label || 'New Section',
      subtitle: 'Curated Section',
      description: 'Customize this heading, copy, layout, and imagery in the section inspector.',
      images: [],
      backgroundColor: '#FAF8F4',
      textColor: '#171C19',
      buttonText: 'Explore Collection',
      buttonTargetType: 'shop',
      buttonDestination: 'all',
      productCount: 4,
      productIds: [],
      categorySlug: categories[0]?.slug || 'all',
      layout: 'grid',
      alignment: 'left',
      isVisible: true,
      visibleDesktop: true,
      visibleMobile: true,
      displayOrder: sections.length + 1,
      countdownEndAt:
        type === 'countdown_promo'
          ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
          : undefined,
      items:
        type === 'testimonials' || type === 'customer_reviews'
          ? [
              {
                id: `item-${Date.now().toString().slice(-4)}`,
                title: 'Verified Buyer',
                body: 'Thoughtful design and reliable delivery right to my door.',
                author: 'Verified Customer',
                role: 'Dhaka',
                rating: 5,
              },
            ]
          : undefined,
    };
    const next = [...sections, newSec];
    setSelectedId(id);
    setIsAddOpen(false);
    await persistOrder(next);
    showToast(`Added "${newSec.name}" section to draft`);
  };

  const handleDuplicate = async (sec: WebsiteSection) => {
    const copy: WebsiteSection = {
      ...sec,
      id: `sec-copy-${Date.now().toString().slice(-5)}`,
      name: `${sec.name} (Copy)`,
      images: [...sec.images],
      productIds: sec.productIds ? [...sec.productIds] : [],
    };
    const idx = sections.findIndex((s) => s.id === sec.id);
    const next = [...sections.slice(0, idx + 1), copy, ...sections.slice(idx + 1)];
    setSelectedId(copy.id);
    await persistOrder(next);
    showToast('Section duplicated');
  };

  const requestDeleteSection = (sec: WebsiteSection) => {
    if (sections.length <= 1) {
      showToast('Keep at least one homepage section.');
      return;
    }
    setPendingDeleteSection(sec);
  };

  const moveSection = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return;
    const next = [...sections];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await persistOrder(next);
  };

  const toggleProductSelection = (productId: string) => {
    if (!selected) return;
    const current = selected.productIds || [];
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    updateSelectedField({ productIds: next });
  };

  const addEntryItem = () => {
    if (!selected) return;
    const current = selected.items || [];
    const entry: SectionItemEntry = {
      id: `item-${Date.now().toString().slice(-4)}`,
      title: 'Featured Highlight',
      body: 'Add review quote or editorial testimonial here.',
      author: 'Customer Name',
      role: 'Dhaka',
      rating: 5,
    };
    updateSelectedField({ items: [...current, entry] });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Visual Homepage Builder
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Drag to reorder sections, toggle desktop/mobile visibility, pick featured products, and customize copy live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Add Section Picker */}
      {isAddOpen && (
        <div className="bg-white border border-[#1B3B2B]/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#171C19]">
              Choose a Homepage Section Block
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-[#5C655F] hover:text-[#171C19]"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SECTION_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAddSection(item.type)}
                className="text-left p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] hover:border-[#1B3B2B] transition-colors"
              >
                <p className="text-xs font-semibold text-[#171C19]">{item.label}</p>
                <p className="text-[11px] text-[#5C655F] mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Draggable Section Stack */}
        <div className="lg:col-span-5 bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-2.5">
          <p className="text-[11px] uppercase tracking-wider text-[#6E8774] font-semibold px-1">
            Page Sections ({sections.length})
          </p>

          <div className="space-y-2">
            {sections.map((sec, idx) => {
              const active = sec.id === selectedId;
              return (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) {
                      moveSection(dragIndex, idx);
                    }
                    setDragIndex(null);
                  }}
                  onClick={() => setSelectedId(sec.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-[#E9EFEA]/70 border-[#1B3B2B]'
                      : 'bg-[#FAF8F4] border-[#E4E0D6] hover:border-[#6E8774]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GripVertical className="w-4 h-4 text-[#5C655F] shrink-0 cursor-grab" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171C19] truncate">
                        {sec.name || sec.heading}
                      </p>
                      <p className="text-[10px] font-mono text-[#5C655F] truncate">
                        {sec.type} {!sec.isVisible ? '· Hidden' : ''}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => moveSection(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-white text-[#5C655F] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, idx + 1)}
                      disabled={idx === sections.length - 1}
                      className="p-1 rounded hover:bg-white text-[#5C655F] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = sections.map((s) =>
                          s.id === sec.id ? { ...s, isVisible: !s.isVisible } : s
                        );
                        persistOrder(next);
                      }}
                      className="p-1 rounded hover:bg-white text-[#5C655F]"
                      aria-label="Toggle visibility"
                    >
                      {sec.isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-[#1B3B2B]" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(sec)}
                      className="p-1 rounded hover:bg-white text-[#5C655F]"
                      aria-label="Duplicate section"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDeleteSection(sec)}
                      className="p-1 rounded hover:bg-white text-[#5C655F] hover:text-red-700"
                      aria-label="Delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Section Inspector */}
        <div className="lg:col-span-7 bg-white border border-[#E4E0D6] rounded-2xl p-6">
          {!selected ? (
            <p className="text-sm text-[#5C655F] py-12 text-center">
              Select a section on the left to customize its content and styling.
            </p>
          ) : (
            <form onSubmit={handleSaveInspector} className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E8774]">
                    Editing {selected.type}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                    {selected.name}
                  </h3>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Section Draft'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Internal Section Name
                  </label>
                  <input
                    type="text"
                    required
                    value={selected.name}
                    onChange={(e) => updateSelectedField({ name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Subtitle / Eyebrow
                  </label>
                  <input
                    type="text"
                    value={selected.subtitle}
                    onChange={(e) => updateSelectedField({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={selected.heading}
                  onChange={(e) => updateSelectedField({ heading: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Description / Content (supports ## Heading, ### Subheading, - Bullet lines)
                </label>
                <textarea
                  rows={selected.type === 'rich_text' ? 6 : 3}
                  value={selected.description}
                  onChange={(e) => updateSelectedField({ description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>

              {/* Colors, Layout & Device Visibility */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Background
                  </label>
                  <input
                    type="color"
                    value={selected.backgroundColor || '#FAF8F4'}
                    onChange={(e) =>
                      updateSelectedField({ backgroundColor: e.target.value })
                    }
                    className="w-full h-9 rounded-lg border border-[#E4E0D6] p-0.5 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={selected.textColor || '#171C19'}
                    onChange={(e) => updateSelectedField({ textColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-[#E4E0D6] p-0.5 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Layout
                  </label>
                  <select
                    value={selected.layout}
                    onChange={(e) =>
                      updateSelectedField({ layout: e.target.value as any })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  >
                    <option value="split">Split</option>
                    <option value="centered">Centered</option>
                    <option value="grid">Grid</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Alignment
                  </label>
                  <select
                    value={selected.alignment}
                    onChange={(e) =>
                      updateSelectedField({ alignment: e.target.value as any })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 text-xs text-[#171C19] pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.isVisible}
                    onChange={(e) => updateSelectedField({ isVisible: e.target.checked })}
                  />
                  <span>Section Visible</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.visibleDesktop !== false}
                    onChange={(e) =>
                      updateSelectedField({ visibleDesktop: e.target.checked })
                    }
                  />
                  <Monitor className="w-3.5 h-3.5 text-[#5C655F]" />
                  <span>Show on Desktop</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.visibleMobile !== false}
                    onChange={(e) =>
                      updateSelectedField({ visibleMobile: e.target.checked })
                    }
                  />
                  <Smartphone className="w-3.5 h-3.5 text-[#5C655F]" />
                  <span>Show on Mobile</span>
                </label>
              </div>

              {/* CTA Button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E4E0D6]">
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={selected.buttonText}
                    onChange={(e) => updateSelectedField({ buttonText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Button Target Type
                  </label>
                  <select
                    value={selected.buttonTargetType}
                    onChange={(e) =>
                      updateSelectedField({ buttonTargetType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  >
                    <option value="shop">Shop Catalog</option>
                    <option value="category">Category</option>
                    <option value="product">Product</option>
                    <option value="page">Custom Page</option>
                    <option value="blog">Blog / Post</option>
                    <option value="url">External URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Destination Slug / URL
                  </label>
                  <input
                    type="text"
                    value={selected.buttonDestination}
                    onChange={(e) =>
                      updateSelectedField({ buttonDestination: e.target.value })
                    }
                    placeholder="all, fashion, about-us..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2.5 pt-2 border-t border-[#E4E0D6]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#5C655F]">
                    Section Images ({selected.images.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Pick from Media Library
                  </button>
                </div>
                {selected.images.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
                    {selected.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-xl border border-[#E4E0D6] overflow-hidden bg-[#F3F0E8]"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedField({
                              images: selected.images.filter((_, i) => i !== idx),
                            })
                          }
                          className="absolute top-1 right-1 px-1.5 rounded bg-black/75 text-white text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlToAdd}
                    onChange={(e) => setUrlToAdd(e.target.value)}
                    placeholder="Paste HTTPS image URL..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!urlToAdd.trim()) return;
                      updateSelectedField({
                        images: [...selected.images, urlToAdd.trim()],
                      });
                      setUrlToAdd('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Countdown Date */}
              {selected.type === 'countdown_promo' && (
                <div className="pt-2 border-t border-[#E4E0D6]">
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Countdown End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={(selected.countdownEndAt || '').slice(0, 16)}
                    onChange={(e) =>
                      updateSelectedField({ countdownEndAt: e.target.value })
                    }
                    className="px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                  />
                </div>
              )}

              {/* Product Selection for Product/Collection Sections */}
              {(selected.type === 'featured_products' ||
                selected.type === 'new_arrivals' ||
                selected.type === 'best_sellers' ||
                selected.type === 'promotional_product_grid' ||
                selected.type === 'collection_showcase') && (
                <div className="space-y-3 pt-2 border-t border-[#E4E0D6]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5C655F] mb-1">
                        Max Products to Show
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={selected.productCount}
                        onChange={(e) =>
                          updateSelectedField({ productCount: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                      />
                    </div>
                    {selected.type === 'collection_showcase' && (
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Collection Category
                        </label>
                        <select
                          value={selected.categorySlug || 'all'}
                          onChange={(e) =>
                            updateSelectedField({ categorySlug: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#5C655F] mb-1.5">
                      Hand-Pick Specific Products (optional — overrides auto filter)
                    </p>
                    <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
                      {products.map((p) => {
                        const checked = (selected.productIds || []).includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                              checked ? 'bg-[#E9EFEA] text-[#1B3B2B] font-medium' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProductSelection(p.id)}
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Testimonials / Customer Reviews Items */}
              {(selected.type === 'testimonials' ||
                selected.type === 'customer_reviews') && (
                <div className="space-y-3 pt-2 border-t border-[#E4E0D6]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#5C655F]">
                      Review / Testimonial Entries ({(selected.items || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={addEntryItem}
                      className="text-xs font-semibold text-[#1B3B2B] hover:underline"
                    >
                      + Add Entry
                    </button>
                  </div>
                  {(selected.items || []).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={entry.author || ''}
                          onChange={(e) => {
                            const next = [...(selected.items || [])];
                            next[idx] = { ...entry, author: e.target.value };
                            updateSelectedField({ items: next });
                          }}
                          placeholder="Author"
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                        />
                        <input
                          type="text"
                          value={entry.role || ''}
                          onChange={(e) => {
                            const next = [...(selected.items || [])];
                            next[idx] = { ...entry, role: e.target.value };
                            updateSelectedField({ items: next });
                          }}
                          placeholder="City / Role"
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={entry.rating || 5}
                            onChange={(e) => {
                              const next = [...(selected.items || [])];
                              next[idx] = { ...entry, rating: Number(e.target.value) };
                              updateSelectedField({ items: next });
                            }}
                            className="w-16 px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = (selected.items || []).filter((_, i) => i !== idx);
                              updateSelectedField({ items: next });
                            }}
                            className="text-xs text-red-700 hover:underline ml-auto"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={entry.body}
                        onChange={(e) => {
                          const next = [...(selected.items || [])];
                          next[idx] = { ...entry, body: e.target.value };
                          updateSelectedField({ items: next });
                        }}
                        placeholder="Quote / review body..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        defaultFolder="banners"
        title="Add Image to Homepage Section"
        onSelect={(url) => {
          if (selected) {
            updateSelectedField({ images: [...selected.images, url] });
          }
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteSection)}
        onClose={() => setPendingDeleteSection(null)}
        title="Delete Homepage Section?"
        itemLabel={pendingDeleteSection?.name || pendingDeleteSection?.heading || ''}
        description="This permanently removes the section from Cloud Firestore, your Admin Draft, and your live public storefront, and cleans up any unreferenced uploaded section images."
        onConfirm={async () => {
          if (!pendingDeleteSection) return;
          const targetId = pendingDeleteSection.id;
          await deleteWebsiteSection(targetId, true);
          const remaining = sections.filter((s) => s.id !== targetId);
          setSections(remaining);
          if (selectedId === targetId && remaining[0]) {
            setSelectedId(remaining[0].id);
          }
        }}
      />
    </div>
  );
};
