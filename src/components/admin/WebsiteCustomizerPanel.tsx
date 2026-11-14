import React, { useState, useEffect } from 'react';
import {
  Palette,
  PanelTop,
  PanelBottom,
  Truck,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoreSettings, FooterColumn, FooterLink } from '../../types';
import { MediaPickerModal } from './MediaPickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const WebsiteCustomizerPanel: React.FC = () => {
  const { draftSettings, updateDraftSettings, draftMenus, cmsPages, categories } = useApp();
  const [form, setForm] = useState<StoreSettings>(draftSettings);
  const [subTab, setSubTab] = useState<'global' | 'header' | 'footer' | 'operations'>('global');
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'logoUrl' | 'faviconUrl' | null>(null);
  const [pendingFooterDelete, setPendingFooterDelete] = useState<
    | { type: 'column'; colIdx: number; label: string }
    | { type: 'link'; colIdx: number; lnkIdx: number; label: string }
    | null
  >(null);

  useEffect(() => {
    setForm(draftSettings);
  }, [draftSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDraftSettings(form);
    } finally {
      setSaving(false);
    }
  };

  const addFooterColumn = () => {
    const cols = form.footerColumns || [];
    setForm({
      ...form,
      footerColumns: [
        ...cols,
        { id: `col-${Date.now().toString().slice(-5)}`, title: 'New Column', links: [] },
      ],
    });
  };

  const updateFooterColumn = (idx: number, nextCol: FooterColumn) => {
    const cols = [...(form.footerColumns || [])];
    cols[idx] = nextCol;
    setForm({ ...form, footerColumns: cols });
  };

  const addFooterLink = (colIdx: number) => {
    const cols = [...(form.footerColumns || [])];
    const col = cols[colIdx];
    if (!col) return;
    const nextLink: FooterLink = {
      id: `fl-${Date.now().toString().slice(-5)}`,
      label: 'New Link',
      targetType: 'shop',
      targetValue: 'all',
    };
    cols[colIdx] = { ...col, links: [...col.links, nextLink] };
    setForm({ ...form, footerColumns: cols });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
            Website Customizer
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Changes save to your Admin Draft first. Preview your draft or click Publish Live in the top bar.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#142D20] disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Draft...' : 'Save Draft Settings'}</span>
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'global', label: 'Global Branding & Theme', icon: Palette },
          { id: 'header', label: 'Header Appearance', icon: PanelTop },
          { id: 'footer', label: 'Footer & Columns', icon: PanelBottom },
          { id: 'operations', label: 'Delivery & Payments', icon: Truck },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium border inline-flex items-center gap-2 transition-colors ${
                active
                  ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                  : 'bg-white text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GLOBAL BRANDING, COLORS, FONTS, LAYOUT, ANNOUNCEMENT, SOCIAL */}
      {subTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
              Brand Identity & Assets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Website Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Logo Image URL (optional, replaces text wordmark if set)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.logoUrl || ''}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerTarget('logoUrl')}
                    className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1 shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Media
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Favicon Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.faviconUrl || ''}
                    onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerTarget('faviconUrl')}
                    className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1 shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Media
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colors & Typography */}
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
              Colors, Typography & Layout
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { key: 'primaryColor', label: 'Primary Color', fallback: '#1B3B2B' },
                { key: 'secondaryColor', label: 'Secondary Color', fallback: '#6E8774' },
                { key: 'backgroundColor', label: 'Background', fallback: '#FAF8F4' },
                { key: 'surfaceColor', label: 'Surface Card', fallback: '#F3F0E8' },
                { key: 'textColor', label: 'Body Text', fallback: '#171C19' },
              ].map((c) => {
                const val = ((form as any)[c.key] as string) || c.fallback;
                return (
                  <div key={c.key}>
                    <label className="block text-xs font-medium text-[#5C655F] mb-1">
                      {c.label}
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
                      <input
                        type="color"
                        value={val}
                        onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                        className="w-full text-xs font-mono bg-transparent outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Heading Font
                </label>
                <select
                  value={form.headingFont || 'Cormorant Garamond'}
                  onChange={(e) =>
                    setForm({ ...form, headingFont: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  <option value="Cormorant Garamond">Cormorant Garamond</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Fraunces">Fraunces</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Body Font
                </label>
                <select
                  value={form.bodyFont || 'Plus Jakarta Sans'}
                  onChange={(e) =>
                    setForm({ ...form, bodyFont: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="DM Sans">DM Sans</option>
                  <option value="Manrope">Manrope</option>
                  <option value="Lora">Lora</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Button Style
                </label>
                <select
                  value={form.buttonStyle || 'solid'}
                  onChange={(e) =>
                    setForm({ ...form, buttonStyle: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  <option value="solid">Solid Fill</option>
                  <option value="outline">Architectural Outline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Corner Radius
                </label>
                <select
                  value={form.borderRadius || 'soft'}
                  onChange={(e) =>
                    setForm({ ...form, borderRadius: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  <option value="sharp">Sharp (Minimal)</option>
                  <option value="soft">Soft Editorial</option>
                  <option value="rounded">Rounded Organic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Container Width
                </label>
                <select
                  value={form.layoutWidth || 'standard'}
                  onChange={(e) =>
                    setForm({ ...form, layoutWidth: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  <option value="compact">Compact (1024px)</option>
                  <option value="standard">Standard (1280px)</option>
                  <option value="wide">Wide Showcase (1440px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                Top Announcement Bar
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.announcementEnabled)}
                  onChange={(e) =>
                    setForm({ ...form, announcementEnabled: e.target.checked })
                  }
                />
                <span>Enable Announcement Bar</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={form.announcementText || ''}
                  onChange={(e) =>
                    setForm({ ...form, announcementText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Optional Link Hash / URL
                </label>
                <input
                  type="text"
                  value={form.announcementLink || ''}
                  onChange={(e) =>
                    setForm({ ...form, announcementLink: e.target.value })
                  }
                  placeholder="#shop or https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Bar Background
                </label>
                <input
                  type="color"
                  value={form.announcementBgColor || '#1B3B2B'}
                  onChange={(e) =>
                    setForm({ ...form, announcementBgColor: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] p-1 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Bar Text Color
                </label>
                <input
                  type="color"
                  value={form.announcementTextColor || '#FAF8F4'}
                  onChange={(e) =>
                    setForm({ ...form, announcementTextColor: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] p-1 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Contact & Social Media */}
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
              Contact Details & Social Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={form.supportPhone}
                  onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['instagram', 'facebook', 'youtube', 'tiktok'] as const).map((net) => (
                <div key={net}>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1 capitalize">
                    {net} URL
                  </label>
                  <input
                    type="url"
                    value={form.socialLinks?.[net] || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        socialLinks: { ...(form.socialLinks || {}), [net]: e.target.value },
                      })
                    }
                    placeholder={`https://${net}.com/...`}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HEADER CUSTOMIZATION */}
      {subTab === 'header' && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
            Header Layout & Elements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Active Header Navigation Menu
              </label>
              <select
                value={form.headerMenuId || 'menu-header-main'}
                onChange={(e) => setForm({ ...form, headerMenuId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
              >
                {draftMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.location})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#5C655F] mt-1">
                Add, rename, reorder, or create dropdown menus in the Navigation Menus tab.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Header Background
              </label>
              <input
                type="color"
                value={form.headerBgColor || '#FAF8F4'}
                onChange={(e) => setForm({ ...form, headerBgColor: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] p-1 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Header Text Color
              </label>
              <input
                type="color"
                value={form.headerTextColor || '#171C19'}
                onChange={(e) => setForm({ ...form, headerTextColor: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] p-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-xs font-medium text-[#171C19]">
            {[
              { key: 'headerSticky', label: 'Sticky Header on Scroll' },
              { key: 'headerShowSearch', label: 'Show Search Icon' },
              { key: 'headerShowAccount', label: 'Show Account Button' },
              { key: 'headerShowCart', label: 'Show Shopping Bag Icon' },
            ].map((toggle) => (
              <label key={toggle.key} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[toggle.key] !== false}
                  onChange={(e) =>
                    setForm({ ...form, [toggle.key]: e.target.checked })
                  }
                />
                <span>{toggle.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FOOTER CUSTOMIZATION */}
      {subTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
              Footer Content & Appearance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Footer Brand Description
                </label>
                <textarea
                  rows={3}
                  value={form.footerDescription || ''}
                  onChange={(e) =>
                    setForm({ ...form, footerDescription: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Copyright Line
                  </label>
                  <input
                    type="text"
                    value={form.footerCopyright || ''}
                    onChange={(e) =>
                      setForm({ ...form, footerCopyright: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5C655F] mb-1">
                      Footer Background
                    </label>
                    <input
                      type="color"
                      value={form.footerBgColor || '#171C19'}
                      onChange={(e) =>
                        setForm({ ...form, footerBgColor: e.target.value })
                      }
                      className="w-full h-9 rounded-lg border border-[#E4E0D6] p-0.5 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C655F] mb-1">
                      Footer Text Color
                    </label>
                    <input
                      type="color"
                      value={form.footerTextColor || '#FAF8F4'}
                      onChange={(e) =>
                        setForm({ ...form, footerTextColor: e.target.value })
                      }
                      className="w-full h-9 rounded-lg border border-[#E4E0D6] p-0.5 cursor-pointer"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.footerShowNewsletter !== false}
                    onChange={(e) =>
                      setForm({ ...form, footerShowNewsletter: e.target.checked })
                    }
                  />
                  <span>Show Newsletter Subscription Box in Footer</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Columns Manager */}
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                Footer Columns & Links
              </h3>
              <button
                type="button"
                onClick={addFooterColumn}
                className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Column
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(form.footerColumns || []).map((col, colIdx) => (
                <div
                  key={col.id}
                  className="border border-[#E4E0D6] rounded-xl p-4 bg-[#FAF8F4] space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) =>
                        updateFooterColumn(colIdx, { ...col, title: e.target.value })
                      }
                      placeholder="Column Title"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => addFooterLink(colIdx)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-[11px] font-medium"
                    >
                      + Link
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingFooterDelete({
                          type: 'column',
                          colIdx,
                          label: col.title || `Column ${colIdx + 1}`,
                        })
                      }
                      className="p-1.5 rounded-lg text-[#5C655F] hover:text-red-700"
                      aria-label="Delete column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {col.links.map((lnk, lnkIdx) => (
                      <div key={lnk.id} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          value={lnk.label}
                          onChange={(e) => {
                            const nextLinks = [...col.links];
                            nextLinks[lnkIdx] = { ...lnk, label: e.target.value };
                            updateFooterColumn(colIdx, { ...col, links: nextLinks });
                          }}
                          placeholder="Label"
                          className="col-span-4 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                        />
                        <select
                          value={lnk.targetType}
                          onChange={(e) => {
                            const nextLinks = [...col.links];
                            nextLinks[lnkIdx] = {
                              ...lnk,
                              targetType: e.target.value as any,
                            };
                            updateFooterColumn(colIdx, { ...col, links: nextLinks });
                          }}
                          className="col-span-3 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                        >
                          <option value="shop">Shop</option>
                          <option value="category">Category</option>
                          <option value="page">Page</option>
                          <option value="blog">Blog</option>
                          <option value="tracking">Track</option>
                          <option value="url">URL</option>
                        </select>
                        {lnk.targetType === 'page' ? (
                          <select
                            value={lnk.targetValue}
                            onChange={(e) => {
                              const nextLinks = [...col.links];
                              nextLinks[lnkIdx] = { ...lnk, targetValue: e.target.value };
                              updateFooterColumn(colIdx, { ...col, links: nextLinks });
                            }}
                            className="col-span-4 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                          >
                            <option value="">Select page</option>
                            {cmsPages.map((p) => (
                              <option key={p.id} value={p.slug}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        ) : lnk.targetType === 'category' ? (
                          <select
                            value={lnk.targetValue}
                            onChange={(e) => {
                              const nextLinks = [...col.links];
                              nextLinks[lnkIdx] = { ...lnk, targetValue: e.target.value };
                              updateFooterColumn(colIdx, { ...col, links: nextLinks });
                            }}
                            className="col-span-4 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                          >
                            <option value="all">All Categories</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.slug}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={lnk.targetValue}
                            onChange={(e) => {
                              const nextLinks = [...col.links];
                              nextLinks[lnkIdx] = { ...lnk, targetValue: e.target.value };
                              updateFooterColumn(colIdx, { ...col, links: nextLinks });
                            }}
                            placeholder="Target slug / URL"
                            className="col-span-4 px-2 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFooterDelete({
                              type: 'link',
                              colIdx,
                              lnkIdx,
                              label: lnk.label || 'Untitled Link',
                            })
                          }
                          className="col-span-1 text-[#5C655F] hover:text-red-700 flex justify-center"
                          aria-label="Remove footer link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONS (DELIVERY & PAYMENTS) */}
      {subTab === 'operations' && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] border-b border-[#E4E0D6] pb-3">
            Delivery Pricing & Payment Methods
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Inside Dhaka Fee (৳)
              </label>
              <input
                type="number"
                value={form.insideDhakaDeliveryFee}
                onChange={(e) =>
                  setForm({ ...form, insideDhakaDeliveryFee: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Outside Dhaka Fee (৳)
              </label>
              <input
                type="number"
                value={form.outsideDhakaDeliveryFee}
                onChange={(e) =>
                  setForm({ ...form, outsideDhakaDeliveryFee: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Free Delivery Threshold (৳)
              </label>
              <input
                type="number"
                value={form.freeDeliveryThreshold}
                onChange={(e) =>
                  setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bkashEnabled}
                  onChange={(e) => setForm({ ...form, bkashEnabled: e.target.checked })}
                />
                <span>Enable Manual bKash Payment</span>
              </label>
              <input
                type="text"
                value={form.bkashNumber}
                onChange={(e) => setForm({ ...form, bkashNumber: e.target.value })}
                placeholder="bKash Merchant / Personal Number"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-mono"
              />
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.nagadEnabled}
                  onChange={(e) => setForm({ ...form, nagadEnabled: e.target.checked })}
                />
                <span>Enable Manual Nagad Payment</span>
              </label>
              <input
                type="text"
                value={form.nagadNumber}
                onChange={(e) => setForm({ ...form, nagadNumber: e.target.value })}
                placeholder="Nagad Merchant / Personal Number"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Checkout Payment Instructions
            </label>
            <textarea
              rows={2}
              value={form.paymentInstructions}
              onChange={(e) =>
                setForm({ ...form, paymentInstructions: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
            />
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        defaultFolder="branding"
        title="Choose Brand Asset"
        onSelect={(url) => {
          if (pickerTarget) {
            setForm({ ...form, [pickerTarget]: url });
          }
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(pendingFooterDelete)}
        onClose={() => setPendingFooterDelete(null)}
        title={
          pendingFooterDelete?.type === 'column'
            ? 'Delete Footer Column?'
            : 'Delete Footer Link?'
        }
        itemLabel={pendingFooterDelete?.label || ''}
        description="Removes this item and saves the updated footer layout to your Admin Draft."
        onConfirm={async () => {
          if (!pendingFooterDelete) return;
          let nextForm: StoreSettings;
          if (pendingFooterDelete.type === 'column') {
            const cols = (form.footerColumns || []).filter(
              (_, i) => i !== pendingFooterDelete.colIdx
            );
            nextForm = { ...form, footerColumns: cols };
          } else {
            const cols = [...(form.footerColumns || [])];
            const targetCol = cols[pendingFooterDelete.colIdx];
            if (!targetCol) return;
            cols[pendingFooterDelete.colIdx] = {
              ...targetCol,
              links: targetCol.links.filter((_, i) => i !== pendingFooterDelete.lnkIdx),
            };
            nextForm = { ...form, footerColumns: cols };
          }
          setForm(nextForm);
          await updateDraftSettings(nextForm);
        }}
      />
    </form>
  );
};
