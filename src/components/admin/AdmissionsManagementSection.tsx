import React, { useState } from 'react';
import { MessageCircle, Phone, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdmissionStatus } from '../../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const AdmissionsManagementSection: React.FC = () => {
  const { admissions, adminUpsert, adminDelete } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdmissionStatus>('all');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const filtered = admissions.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      a.fullName.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.referenceCode.toLowerCase().includes(q) ||
      a.desiredCourse.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            SOFS Admission Inquiries ({admissions.length})
          </h2>
          <p className="text-xs text-[#4E5B53]">
            Public applicants require no login. Contact prospects manually via Phone or WhatsApp
            and track status here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4E5B53] absolute left-3 top-2.5" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, code..."
              className="pl-9 pr-3 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="counseling">Counseling</option>
            <option value="admitted">Admitted</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 text-sm text-[#4E5B53]">
            No admission applications match the current filter.
          </div>
        ) : (
          filtered.map((adm) => {
            const whatsappDigits = (adm.whatsapp || adm.phone).replace(/[^0-9]/g, '');
            const currentNotes = notesDraft[adm.id] ?? (adm.staffNotes || '');

            return (
              <div
                key={adm.id}
                className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-[#B47B2B] font-semibold">
                      {adm.referenceCode} &middot; {adm.academicLevel} ({adm.academicGroup}) &middot;{' '}
                      Submitted {new Date(adm.createdAt).toLocaleString()}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-[#111915]">
                      {adm.fullName}
                    </h3>
                    <p className="text-xs text-[#111915]">
                      Desired Course: <span className="font-semibold">{adm.desiredCourse}</span>
                      {adm.preferredBatch && ` · Batch: ${adm.preferredBatch}`}
                    </p>
                    {adm.message && (
                      <p className="text-xs text-[#4E5B53] bg-[#F8F9F7] p-2.5 rounded-lg border border-[#DCE2DC] mt-1">
                        "{adm.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`tel:${adm.phone}`}
                      className="px-3 py-2 rounded-lg border border-[#DCE2DC] text-xs font-semibold text-[#111915] inline-flex items-center gap-1.5 hover:bg-[#F8F9F7]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0F3D2E]" />
                      <span className="tabular-nums">{adm.phone}</span>
                    </a>
                    {whatsappDigits && (
                      <a
                        href={`https://wa.me/${whatsappDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-[#EEF2EE] text-[#0F3D2E] text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          id: adm.id,
                          label: `${adm.fullName} (${adm.referenceCode})`,
                        })
                      }
                      className="p-2 rounded-lg border border-red-200 text-red-700"
                      aria-label="Delete application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE2DC] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-3">
                    <select
                      value={adm.status}
                      onChange={(e) =>
                        void adminUpsert('admissions', {
                          id: adm.id,
                          status: e.target.value,
                          staffNotes: currentNotes,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs font-semibold bg-[#F8F9F7]"
                    >
                      <option value="new">New Inquiry</option>
                      <option value="contacted">Contacted</option>
                      <option value="counseling">Counseling Scheduled</option>
                      <option value="admitted">Admitted</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="md:col-span-7">
                    <input
                      type="text"
                      value={currentNotes}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [adm.id]: e.target.value }))
                      }
                      placeholder="Staff call notes / diagnostic test score / batch decision..."
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        void adminUpsert('admissions', {
                          id: adm.id,
                          status: adm.status,
                          staffNotes: currentNotes,
                        })
                      }
                      className="w-full py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Admission Application"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently deletes this public admission inquiry from Supabase."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete('admissions', deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
