import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdmissionStatus } from '../../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const PAGE_SIZE = 25;

export const AdmissionsManagementSection: React.FC = () => {
  const {
    admissions,
    adminAdmissionsLoading,
    adminAdmissionsError,
    adminAdmissionsTotal,
    adminAdmissionsPage,
    adminAdmissionsTotalPages,
    supabaseConfigured,
    fetchAdminAdmissions,
    adminUpsert,
    adminDelete,
  } = useApp();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdmissionStatus>('all');
  const [page, setPage] = useState(1);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    void fetchAdminAdmissions({
      page,
      pageSize: PAGE_SIZE,
      status: statusFilter,
      search: debouncedSearch,
    });
  }, [supabaseConfigured, page, statusFilter, debouncedSearch, fetchAdminAdmissions]);

  // Client-side filter fallback when running in offline local preview mode (no Supabase)
  const visibleAdmissions = supabaseConfigured
    ? admissions
    : admissions.filter((a) => {
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

  const displayTotal = supabaseConfigured ? adminAdmissionsTotal : visibleAdmissions.length;

  const handleRefresh = () => {
    if (supabaseConfigured) {
      void fetchAdminAdmissions({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        search: debouncedSearch,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            SOFS Admission Inquiries ({displayTotal})
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
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | AdmissionStatus);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="counseling">Counseling</option>
            <option value="admitted">Admitted</option>
            <option value="archived">Archived</option>
          </select>
          {supabaseConfigured && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={adminAdmissionsLoading}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs font-semibold text-[#111915] hover:bg-[#F8F9F7] inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${adminAdmissionsLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {adminAdmissionsError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to retrieve admission records from Supabase</p>
              <p className="text-red-800 mt-0.5">{adminAdmissionsError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg bg-red-800 text-white font-semibold shrink-0 self-start sm:self-center"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {adminAdmissionsLoading && visibleAdmissions.length === 0 ? (
          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-8 flex items-center justify-center gap-2.5 text-sm text-[#4E5B53]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0F3D2E]" />
            <span>Loading admission records from Supabase...</span>
          </div>
        ) : visibleAdmissions.length === 0 ? (
          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 text-sm text-[#4E5B53]">
            {adminAdmissionsError
              ? 'Admission records could not be loaded. Check the error details above and click Retry.'
              : 'No admission applications match the current filter.'}
          </div>
        ) : (
          visibleAdmissions.map((adm) => {
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
                      onChange={async (e) => {
                        await adminUpsert('admissions', {
                          id: adm.id,
                          status: e.target.value,
                          staffNotes: currentNotes,
                        });
                        handleRefresh();
                      }}
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
                      onClick={async () => {
                        await adminUpsert('admissions', {
                          id: adm.id,
                          status: adm.status,
                          staffNotes: currentNotes,
                        });
                        handleRefresh();
                      }}
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

      {supabaseConfigured && adminAdmissionsTotalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#DCE2DC] rounded-2xl px-4 py-3 text-xs text-[#4E5B53]">
          <span className="tabular-nums">
            Page {adminAdmissionsPage} of {adminAdmissionsTotalPages} ({adminAdmissionsTotal} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={adminAdmissionsPage <= 1 || adminAdmissionsLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-[#DCE2DC] text-[#111915] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={adminAdmissionsPage >= adminAdmissionsTotalPages || adminAdmissionsLoading}
              onClick={() => setPage((p) => Math.min(adminAdmissionsTotalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-[#DCE2DC] text-[#111915] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Admission Application"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently deletes this public admission inquiry from Supabase."
        onConfirm={async () => {
          if (deleteTarget) {
            await adminDelete('admissions', deleteTarget.id);
            handleRefresh();
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
