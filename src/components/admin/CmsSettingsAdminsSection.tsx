import React, { useState } from 'react';
import { Palette, Shield, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminRole } from '../../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const CmsSettingsSection: React.FC = () => {
  const {
    siteSettings,
    gallery,
    testimonials,
    mediaAssets,
    adminUpsert,
    adminDelete,
    uploadMediaAsset,
    showToast,
  } = useApp();

  const [subTab, setSubTab] = useState<'settings' | 'gallery' | 'media'>('settings');
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Campus',
    caption: '',
    imageUrl: '',
  });
  const [testimonialForm, setTestimonialForm] = useState({
    studentName: '',
    achievement: '',
    cohort: '',
    quote: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    entity: string;
    id: string;
    label: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold text-[#111915]">
          Website Settings, Theme, Gallery &amp; Media
        </h2>
        <div className="flex gap-2">
          {[
            { id: 'settings', label: 'Branding & Theme' },
            { id: 'gallery', label: 'Gallery & Testimonials' },
            { id: 'media', label: `Media Library (${mediaAssets.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                subTab === t.id
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                  : 'bg-white text-[#4E5B53] border-[#DCE2DC]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'settings' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminUpsert('site_settings', settingsForm);
          }}
          className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Institute Name</label>
              <input
                type="text"
                value={settingsForm.instituteName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, instituteName: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Short Brand Mark</label>
              <input
                type="text"
                value={settingsForm.shortName}
                onChange={(e) => setSettingsForm({ ...settingsForm, shortName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Hero Headline</label>
              <input
                type="text"
                value={settingsForm.heroHeadline}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Hero Subheadline</label>
              <textarea
                rows={2}
                value={settingsForm.heroSubheadline}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, heroSubheadline: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Top Announcement Banner</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settingsForm.announcementEnabled}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, announcementEnabled: e.target.checked })
                  }
                />
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Customizable Colors */}
          <div className="border-t border-[#DCE2DC] pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4E5B53] flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#B47B2B]" />
              <span>Theme Color Palette</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <label className="space-y-1">
                <span className="block font-medium">Primary Brand</span>
                <input
                  type="color"
                  value={settingsForm.primaryColor}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, primaryColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block font-medium">Secondary</span>
                <input
                  type="color"
                  value={settingsForm.secondaryColor}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, secondaryColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block font-medium">Accent Gold</span>
                <input
                  type="color"
                  value={settingsForm.accentColor}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, accentColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block font-medium">Background</span>
                <input
                  type="color"
                  value={settingsForm.backgroundColor}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, backgroundColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#DCE2DC] pt-4 text-xs">
            <input
              type="text"
              placeholder="Phone"
              value={settingsForm.contactPhone}
              onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC]"
            />
            <input
              type="text"
              placeholder="Contact Email"
              value={settingsForm.contactEmail}
              onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC]"
            />
            <input
              type="text"
              placeholder="Campus Address"
              value={settingsForm.campusAddress}
              onChange={(e) => setSettingsForm({ ...settingsForm, campusAddress: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC]"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
          >
            Save Website Settings
          </button>
        </form>
      )}

      {subTab === 'gallery' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminUpsert('gallery_items', {
                  ...galleryForm,
                  isPublished: true,
                  displayOrder: gallery.length + 1,
                });
                setGalleryForm({ title: '', category: 'Campus', caption: '', imageUrl: '' });
              }}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-serif text-lg font-bold">Add Gallery Photo</h3>
              <input
                type="text"
                required
                placeholder="Photo Title"
                value={galleryForm.title}
                onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                placeholder="Category (Classroom, Labs, Seminars)"
                value={galleryForm.category}
                onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="Image URL"
                  value={galleryForm.imageUrl}
                  onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
                <label className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const asset = await uploadMediaAsset(f, 'sofs-gallery');
                        setGalleryForm((p) => ({ ...p, imageUrl: asset.publicUrl }));
                      } catch (err: any) {
                        showToast(err?.message || 'Upload error', 'error');
                      }
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Caption"
                value={galleryForm.caption}
                onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
              >
                Add to Gallery
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminUpsert('testimonials', {
                  ...testimonialForm,
                  isPublished: true,
                  displayOrder: testimonials.length + 1,
                });
                setTestimonialForm({ studentName: '', achievement: '', cohort: '', quote: '' });
              }}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-serif text-lg font-bold">Add Student Testimonial</h3>
              <input
                type="text"
                required
                placeholder="Student Name"
                value={testimonialForm.studentName}
                onChange={(e) =>
                  setTestimonialForm({ ...testimonialForm, studentName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                required
                placeholder="Achievement (e.g. Merit #42 BUET)"
                value={testimonialForm.achievement}
                onChange={(e) =>
                  setTestimonialForm({ ...testimonialForm, achievement: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <textarea
                rows={2}
                required
                placeholder="Quote..."
                value={testimonialForm.quote}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#B47B2B] text-white text-xs font-semibold"
              >
                Publish Testimonial
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gallery.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-[#DCE2DC] rounded-xl overflow-hidden flex items-center justify-between p-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={g.imageUrl} alt={g.title} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{g.title}</p>
                      <p className="text-[11px] text-[#4E5B53]">{g.category}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ entity: 'gallery_items', id: g.id, label: g.title })
                    }
                    className="p-2 rounded-lg border border-red-200 text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-[#DCE2DC] rounded-xl p-4 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold">
                      {t.studentName} &middot; {t.achievement}
                    </p>
                    <p className="text-[#4E5B53] mt-1">"{t.quote}"</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ entity: 'testimonials', id: t.id, label: t.studentName })
                    }
                    className="p-1.5 rounded-lg border border-red-200 text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'media' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 flex items-center justify-between gap-4">
            <p className="text-xs text-[#4E5B53]">
              Upload images directly to Supabase Storage (`sofs-media`).
            </p>
            <label className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Asset</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await uploadMediaAsset(f, 'sofs-media');
                }}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaAssets.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-[#DCE2DC] rounded-xl p-4 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.fileName}</p>
                  <p className="text-[11px] text-[#4E5B53]">Bucket: {m.bucket}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({ entity: 'media_assets', id: m.id, label: m.fileName })
                  }
                  className="p-2 rounded-lg border border-red-200 text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Media / CMS Record"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently deletes this record and any associated storage object."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete(deleteTarget.entity, deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export const AdminsAndAuditSection: React.FC = () => {
  const { adminUsers, auditLogs, adminUpsert, adminDelete, authUser } = useApp();
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    role: 'admission_manager' as AdminRole,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-bold text-[#111915]">
        Role-Based Admin Access &amp; Audit Logs
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminUpsert('admin_users', {
              email: form.email.trim().toLowerCase(),
              fullName: form.fullName.trim(),
              role: form.role,
              isActive: true,
            });
            setForm({ email: '', fullName: '', role: 'admission_manager' });
          }}
          className="lg:col-span-5 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3 h-fit"
        >
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0F3D2E]" />
            <span>Grant Admin Role</span>
          </h3>
          <input
            type="text"
            required
            placeholder="Staff Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
          />
          <input
            type="email"
            required
            placeholder="Firebase Sign-In Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
            className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
          >
            <option value="super_admin">super_admin (Full Control)</option>
            <option value="content_manager">content_manager (Courses, Notices, Settings)</option>
            <option value="admission_manager">admission_manager (Admissions, Batches, Support)</option>
            <option value="exam_manager">exam_manager (Questions, Exams, OCR)</option>
            <option value="results_manager">results_manager (Grading &amp; Results)</option>
            <option value="resource_manager">resource_manager (Materials, Notices, Support)</option>
          </select>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
          >
            Save Admin Role
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-2.5">
            {adminUsers.map((adm) => {
              const isSelf = adm.email.toLowerCase() === authUser?.email?.toLowerCase();
              return (
                <div
                  key={adm.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-mono font-semibold text-[#0F3D2E] uppercase">
                      {adm.role.replace('_', ' ')}
                    </p>
                    <h4 className="font-semibold text-sm text-[#111915]">{adm.fullName}</h4>
                    <p className="text-xs text-[#4E5B53]">{adm.email}</p>
                  </div>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ id: adm.id, label: `${adm.fullName} (${adm.email})` })
                      }
                      className="p-2 rounded-lg border border-red-200 text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3">
            <h3 className="font-serif text-lg font-bold">Recent Audit Logs</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-2 border-b border-[#EEF2EE] last:border-0 flex items-center justify-between gap-2"
                >
                  <span>
                    <strong>{log.actorEmail}</strong> ({log.actorRole}) &middot;{' '}
                    <span className="uppercase font-mono text-[#0F3D2E]">{log.action}</span>{' '}
                    {log.entityType}
                  </span>
                  <span className="text-[11px] text-[#4E5B53] tabular-nums shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Revoke Admin Role"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently removes administrative privileges for this account."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete('admin_users', deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
