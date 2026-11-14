import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  Tag,
  Mail,
  Upload,
  Search,
  Copy,
  Download,
  Globe,
  Image as ImageIcon,
  Megaphone,
} from 'lucide-react';
import { useApp, formatBDT } from '../../context/AppContext';
import {
  Promotion,
  DiscountType,
  Banner,
  MediaAsset,
  MediaFolder,
  NewsletterSubscriber,
} from '../../types';
import { uploadAssetWithPath } from '../../services/firebase';
import { MediaPickerModal } from './MediaPickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

// =====================================================================
// 1. PROMOTIONS, BANNERS & NEWSLETTER SUBSCRIBERS
// =====================================================================
export const PromotionsPanel: React.FC = () => {
  const {
    promotions,
    savePromotion,
    deletePromotion,
    banners,
    saveBanner,
    deleteBanner,
    categories,
    newsletterSubscribers,
    removeNewsletterSubscriber,
    showToast,
  } = useApp();

  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerMediaOpen, setBannerMediaOpen] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'promo'; promo: Promotion }
    | { kind: 'banner'; banner: Banner }
    | { kind: 'subscriber'; subscriber: NewsletterSubscriber }
    | null
  >(null);

  const filteredSubs = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return newsletterSubscribers.filter((s) =>
      q ? s.email.toLowerCase().includes(q) : true
    );
  }, [newsletterSubscribers, subSearch]);

  const startNewPromo = () => {
    setEditingPromo({
      id: `promo-${Date.now().toString().slice(-6)}`,
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 1000,
      saleLabel: 'LIMITED OFFER',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: true,
    });
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    await savePromotion({
      ...editingPromo,
      code: editingPromo.code.trim().toUpperCase(),
    });
    setEditingPromo(null);
  };

  const handleExportSubscribersCsv = () => {
    const rows = [
      ['Email', 'Source', 'Status', 'Subscribed At'],
      ...filteredSubs.map((s) => [s.email, s.source, s.status, s.createdAt || '']),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veyra-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported subscriber list CSV');
  };

  return (
    <div className="space-y-8">
      {/* Discount Codes Section */}
      <section className="space-y-4">
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
              Discount Codes & Promotions
            </h2>
            <p className="text-xs text-[#5C655F] mt-0.5">
              Active codes validate automatically on Customer Checkout (percentage, fixed BDT, or free delivery).
            </p>
          </div>
          <button
            type="button"
            onClick={startNewPromo}
            className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>

        {editingPromo && (
          <form
            onSubmit={handleSavePromo}
            className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                {editingPromo.code ? `Edit Code: ${editingPromo.code}` : 'New Promotion'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPromo(null)}
                className="text-xs text-[#5C655F]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  value={editingPromo.code}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="EID20"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingPromo.title}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Sale Badge Label
                </label>
                <input
                  type="text"
                  value={editingPromo.saleLabel || ''}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, saleLabel: e.target.value })
                  }
                  placeholder="WELCOME OFFER"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Discount Type
                </label>
                <select
                  value={editingPromo.discountType}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      discountType: e.target.value as DiscountType,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={editingPromo.discountType === 'free_delivery'}
                  value={editingPromo.discountValue}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      discountValue: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Min Order (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingPromo.minOrderAmount}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      minOrderAmount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPromo.isActive}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, isActive: e.target.checked })
                    }
                  />
                  <span>Active on Checkout</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editingPromo.startDate}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editingPromo.endDate}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingPromo.description}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Promo Code</span>
            </button>
          </form>
        )}

        <div className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#E4E0D6]">
          {promotions.map((p) => (
            <div
              key={p.id}
              className="p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold px-2.5 py-0.5 rounded-lg bg-[#E9EFEA] text-[#1B3B2B]">
                    {p.code}
                  </span>
                  <span className="text-sm font-semibold text-[#171C19]">{p.title}</span>
                  {p.saleLabel && (
                    <span className="text-[10px] uppercase tracking-wider text-[#6E8774] font-semibold">
                      {p.saleLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5C655F] mt-1">
                  {p.discountType === 'percentage'
                    ? `${p.discountValue}% OFF`
                    : p.discountType === 'fixed'
                    ? `${formatBDT(p.discountValue)} OFF`
                    : 'Free Delivery'}{' '}
                  · Min Order: {formatBDT(p.minOrderAmount)} ·{' '}
                  {p.isActive ? 'Active' : 'Inactive'} · {p.startDate} to {p.endDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPromo(p)}
                  className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete({ kind: 'promo', promo: p })}
                  className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                  title="Delete promo code"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promotional Banners Section */}
      <section className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#1B3B2B]" />
            <span>Promotional Banners</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              setEditingBanner({
                id: `banner-${Date.now().toString().slice(-4)}`,
                title: '',
                subtitle: '',
                ctaText: 'Shop Offer',
                targetCategory: 'all',
                imageUrl: '',
                isActive: true,
                displayOrder: banners.length + 1,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Banner
          </button>
        </div>

        {editingBanner && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveBanner(editingBanner);
              setEditingBanner(null);
            }}
            className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Banner Title"
                value={editingBanner.title}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, title: e.target.value })
                }
                className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
              />
              <input
                type="text"
                placeholder="Subtitle"
                value={editingBanner.subtitle}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                }
                className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="CTA Text"
                value={editingBanner.ctaText}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, ctaText: e.target.value })
                }
                className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
              />
              <select
                value={editingBanner.targetCategory}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, targetCategory: e.target.value })
                }
                className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Image URL"
                  value={editingBanner.imageUrl}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, imageUrl: e.target.value })
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
                />
                <button
                  type="button"
                  onClick={() => setBannerMediaOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
                >
                  Media
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium"
              >
                Save Banner
              </button>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="text-xs text-[#5C655F]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {b.imageUrl && (
                  <img
                    src={b.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-[#E4E0D6] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#171C19] truncate">{b.title}</p>
                  <p className="text-[11px] text-[#5C655F] truncate">{b.subtitle}</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBanner(b)}
                  className="p-1.5 rounded-lg bg-white border border-[#E4E0D6] text-[#5C655F]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete({ kind: 'banner', banner: b })}
                  className="p-1.5 rounded-lg bg-white border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                  title="Delete banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Subscribers Section */}
      <section className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1B3B2B]" />
              <span>Newsletter Subscribers ({newsletterSubscribers.length})</span>
            </h3>
            <p className="text-xs text-[#5C655F] mt-0.5">
              Emails collected from the storefront footer and newsletter homepage block.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder="Filter email..."
              className="px-3 py-1.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
            />
            <button
              type="button"
              onClick={handleExportSubscribersCsv}
              className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {filteredSubs.length === 0 ? (
          <p className="text-sm text-[#5C655F] py-6 text-center">
            No newsletter subscribers recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-[#E4E0D6]">
            {filteredSubs.map((s) => (
              <div
                key={s.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-medium text-[#171C19]">{s.email}</span>
                  <span className="text-[#5C655F] ml-2">· via {s.source}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete({ kind: 'subscriber', subscriber: s })}
                  className="text-[#5C655F] hover:text-red-700 p-1"
                  aria-label="Remove subscriber"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <MediaPickerModal
        isOpen={bannerMediaOpen}
        onClose={() => setBannerMediaOpen(false)}
        defaultFolder="banners"
        title="Select Banner Image"
        onSelect={(url) => {
          if (editingBanner) setEditingBanner({ ...editingBanner, imageUrl: url });
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={
          pendingDelete?.kind === 'promo'
            ? 'Delete Promotion Code?'
            : pendingDelete?.kind === 'banner'
            ? 'Delete Promotional Banner?'
            : 'Remove Newsletter Subscriber?'
        }
        itemLabel={
          pendingDelete?.kind === 'promo'
            ? `${pendingDelete.promo.code} — ${pendingDelete.promo.title}`
            : pendingDelete?.kind === 'banner'
            ? pendingDelete.banner.title
            : pendingDelete?.kind === 'subscriber'
            ? pendingDelete.subscriber.email
            : ''
        }
        description={
          pendingDelete?.kind === 'promo'
            ? 'Customers will no longer be able to apply this discount code at checkout.'
            : pendingDelete?.kind === 'banner'
            ? 'Removes this promotional banner from Cloud Firestore and cleans up any unreferenced uploaded banner image.'
            : 'Permanently removes this subscriber email from Cloud Firestore.'
        }
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === 'promo') {
            await deletePromotion(pendingDelete.promo.id);
            if (editingPromo?.id === pendingDelete.promo.id) setEditingPromo(null);
          } else if (pendingDelete.kind === 'banner') {
            await deleteBanner(pendingDelete.banner.id);
            if (editingBanner?.id === pendingDelete.banner.id) setEditingBanner(null);
          } else {
            await removeNewsletterSubscriber(pendingDelete.subscriber.id);
          }
        }}
      />
    </div>
  );
};

// =====================================================================
// 2. CENTRALIZED MEDIA LIBRARY
// =====================================================================
export const MediaLibraryPanel: React.FC = () => {
  const {
    mediaAssets,
    saveMediaAsset,
    deleteMediaAsset,
    getMediaAssetUsages,
    currentUser,
    showToast,
  } = useApp();

  const [folderFilter, setFolderFilter] = useState<MediaFolder | 'all'>('all');
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>('general');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<MediaAsset | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mediaAssets.filter((a) => {
      if (folderFilter !== 'all' && a.folder !== folderFilter) return false;
      if (q && !`${a.name} ${a.folder}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mediaAssets, folderFilter, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url, storagePath } = await uploadAssetWithPath(file, uploadFolder);
        await saveMediaAsset({
          id: `media-${Date.now()}-${Math.floor(Math.random() * 999)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url,
          folder: uploadFolder,
          mimeType: file.type,
          sizeBytes: file.size,
          storagePath,
          uploadedBy: currentUser?.email || '',
          createdAt: new Date().toISOString(),
        });
      }
      showToast('Uploaded image(s) to Media Library');
    } catch (err: any) {
      showToast(err?.message || 'Firebase Storage upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    await saveMediaAsset({
      id: `media-${Date.now()}`,
      name: newName.trim() || 'Linked Image',
      url: newUrl.trim(),
      folder: uploadFolder,
      mimeType: 'image/external',
      uploadedBy: currentUser?.email || '',
      createdAt: new Date().toISOString(),
    });
    setNewUrl('');
    setNewName('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Centralized Media Library
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Upload, organize by folder, rename, copy URLs, and reuse images across products, pages, posts, and banners.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
            className="px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
          >
            <option value="products">Folder: Products</option>
            <option value="banners">Folder: Banners</option>
            <option value="posts">Folder: Posts</option>
            <option value="pages">Folder: Pages</option>
            <option value="branding">Folder: Branding</option>
            <option value="general">Folder: General</option>
          </select>

          <label className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:bg-[#142D20]">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add External Image URL Bar */}
      <form
        onSubmit={handleAddUrl}
        className="bg-white border border-[#E4E0D6] rounded-2xl p-4 flex flex-wrap gap-2.5"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Asset Name (e.g. Summer Hero)"
          className="w-48 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
        />
        <input
          type="url"
          required
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste HTTPS image URL to save into Media Library..."
          className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-semibold text-[#171C19]"
        >
          Save URL to Library
        </button>
      </form>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'products', 'banners', 'posts', 'pages', 'branding', 'general'] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolderFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border capitalize ${
                  folderFilter === f
                    ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                    : 'bg-white text-[#5C655F] border-[#E4E0D6]'
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#5C655F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
          />
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((asset: MediaAsset) => (
          <div
            key={asset.id}
            className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="aspect-square bg-[#F3F0E8] overflow-hidden">
              <img
                src={asset.url}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
              {renamingId === asset.id ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-[#E4E0D6] text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await saveMediaAsset({ ...asset, name: renameText.trim() || asset.name });
                      setRenamingId(null);
                    }}
                    className="px-2 py-1 rounded bg-[#1B3B2B] text-white text-[10px]"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-[#171C19] truncate">
                    {asset.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#6E8774]">
                    {asset.folder}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(asset.url);
                    showToast('Copied image URL');
                  }}
                  className="text-[11px] font-medium text-[#1B3B2B] inline-flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(asset.id);
                      setRenameText(asset.name);
                    }}
                    className="p-1 text-[#5C655F] hover:text-[#1B3B2B]"
                    title="Rename"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteAsset(asset)}
                    className="p-1 text-[#5C655F] hover:text-red-700"
                    title="Delete asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteAsset)}
        onClose={() => setPendingDeleteAsset(null)}
        title="Delete Media File?"
        itemLabel={pendingDeleteAsset?.name || ''}
        description="Permanently deletes this media library record and removes its associated file from Firebase Storage (if hosted there)."
        warningText={
          pendingDeleteAsset && getMediaAssetUsages(pendingDeleteAsset.url).length > 0
            ? `Warning: This file is currently used by ${getMediaAssetUsages(pendingDeleteAsset.url).join(', ')}. Deleting it may break images on your storefront.`
            : undefined
        }
        onConfirm={async () => {
          if (!pendingDeleteAsset) return;
          await deleteMediaAsset(pendingDeleteAsset.id, pendingDeleteAsset.storagePath);
        }}
      />
    </div>
  );
};

// =====================================================================
// 3. SEO SETTINGS & SITEMAP / ROBOTS GENERATOR
// =====================================================================
export const SeoSettingsPanel: React.FC = () => {
  const { draftSettings, updateDraftSettings, products, cmsPages, cmsPosts, showToast } =
    useApp();

  const [metaTitle, setMetaTitle] = useState(draftSettings.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(
    draftSettings.metaDescription || ''
  );
  const [ogImageUrl, setOgImageUrl] = useState(draftSettings.ogImageUrl || '');
  const [robotsAllowIndex, setRobotsAllowIndex] = useState(
    draftSettings.robotsAllowIndex !== false
  );
  const [robotsCustomText, setRobotsCustomText] = useState(
    draftSettings.robotsCustomText || 'User-agent: *\nAllow: /'
  );
  const [ogMediaOpen, setOgMediaOpen] = useState(false);

  useEffect(() => {
    setMetaTitle(draftSettings.metaTitle || '');
    setMetaDescription(draftSettings.metaDescription || '');
    setOgImageUrl(draftSettings.ogImageUrl || '');
    setRobotsAllowIndex(draftSettings.robotsAllowIndex !== false);
    setRobotsCustomText(draftSettings.robotsCustomText || 'User-agent: *\nAllow: /');
  }, [draftSettings]);

  const baseOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://veyra.store';

  const generatedSitemapXml = useMemo(() => {
    const urls: string[] = [`${baseOrigin}/`, `${baseOrigin}/#shop`, `${baseOrigin}/#blog`];
    products
      .filter((p) => p.isActive)
      .forEach((p) => urls.push(`${baseOrigin}/#product/${p.slug || p.id}`));
    cmsPages
      .filter((p) => p.status === 'published')
      .forEach((p) => urls.push(`${baseOrigin}/#page/${p.slug}`));
    cmsPosts
      .filter((p) => p.status === 'published')
      .forEach((p) => urls.push(`${baseOrigin}/#post/${p.slug}`));

    const entries = urls
      .map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  }, [baseOrigin, products, cmsPages, cmsPosts]);

  const generatedRobotsTxt = useMemo(() => {
    const base = robotsAllowIndex
      ? robotsCustomText.trim() || 'User-agent: *\nAllow: /'
      : 'User-agent: *\nDisallow: /';
    return `${base}\n\nSitemap: ${baseOrigin}/sitemap.xml`;
  }, [robotsAllowIndex, robotsCustomText, baseOrigin]);

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDraftSettings({
      ...draftSettings,
      metaTitle,
      metaDescription,
      ogImageUrl,
      robotsAllowIndex,
      robotsCustomText,
    });
  };

  return (
    <form onSubmit={handleSaveSeo} className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Global SEO, Social Cards & Indexing
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Configure site-wide search titles, social OpenGraph sharing cards, and download robots.txt / sitemap.xml for Cloudflare Pages.
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#142D20]"
        >
          <Save className="w-4 h-4" />
          <span>Save SEO Draft</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
            Default Search & OpenGraph Metadata
          </h3>
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Global Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Global Meta Description
            </label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Default Social Share Image (og:image)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
              <button
                type="button"
                onClick={() => setOgMediaOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={robotsAllowIndex}
              onChange={(e) => setRobotsAllowIndex(e.target.checked)}
            />
            <span>Allow search engines to index this storefront</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Custom robots.txt Directives
            </label>
            <textarea
              rows={3}
              value={robotsCustomText}
              onChange={(e) => setRobotsCustomText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
            />
          </div>
        </div>

        {/* Live Search Snippet Preview + Exports */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-[#6E8774] font-semibold inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Search Engine Snippet Preview
            </p>
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-1">
              <p className="text-xs text-[#5C655F] truncate">{baseOrigin}</p>
              <p className="text-base font-semibold text-[#1B3B2B] hover:underline">
                {metaTitle || `${draftSettings.storeName} — ${draftSettings.tagline}`}
              </p>
              <p className="text-xs text-[#5C655F] line-clamp-2">
                {metaDescription || 'Everyday thoughtfully curated essentials.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[#171C19]">
                Generated Sitemap & Robots Files
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadFile('robots.txt', generatedRobotsTxt, 'text/plain')
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> robots.txt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile('sitemap.xml', generatedSitemapXml, 'application/xml')
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> sitemap.xml
                </button>
              </div>
            </div>
            <pre className="max-h-48 overflow-auto p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-[11px] font-mono text-[#171C19]">
              {generatedSitemapXml}
            </pre>
          </div>
        </div>
      </div>

      <MediaPickerModal
        isOpen={ogMediaOpen}
        onClose={() => setOgMediaOpen(false)}
        defaultFolder="branding"
        title="Choose Default Social Share Image"
        onSelect={(url) => setOgImageUrl(url)}
      />
    </form>
  );
};
