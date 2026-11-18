import React, { useState } from 'react';
import { Bell, FileText, MessageSquare, Plus, Send, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ResourcesSection: React.FC = () => {
  const {
    resources,
    courses,
    batches,
    adminUpsert,
    adminDelete,
    uploadMediaAsset,
    showToast,
  } = useApp();

  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'pdf' as 'pdf' | 'note' | 'image' | 'video' | 'link',
    category: 'Lecture Sheet',
    courseId: courses[0]?.id || '',
    batchId: '',
    accessLevel: 'enrolled' as 'public' | 'enrolled' | 'batch_specific',
    fileUrl: '',
    storagePath: '',
    isPublished: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const handleUpload = async (file: File) => {
    try {
      const asset = await uploadMediaAsset(file, 'sofs-resources');
      setForm((p) => ({
        ...p,
        fileUrl: asset.publicUrl,
        storagePath: asset.storagePath || '',
      }));
    } catch (err: any) {
      showToast(err?.message || 'Upload failed.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminUpsert('resources', {
      ...form,
      courseId: form.courseId || undefined,
      batchId: form.batchId || undefined,
      createdAt: new Date().toISOString(),
    });
    setForm({
      ...form,
      title: '',
      description: '',
      fileUrl: '',
      storagePath: '',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-bold text-[#111915]">
        Study Resources &amp; Access Permissions
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
        >
          <h3 className="font-serif text-lg font-bold text-[#111915]">Add Study Resource</h3>
          <input
            type="text"
            required
            placeholder="Resource Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.resourceType}
              onChange={(e) => setForm({ ...form, resourceType: e.target.value as any })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              <option value="pdf">PDF Sheet</option>
              <option value="note">Note</option>
              <option value="image">Diagram Image</option>
              <option value="video">Video Lecture</option>
              <option value="link">External Link</option>
            </select>
            <select
              value={form.accessLevel}
              onChange={(e) => setForm({ ...form, accessLevel: e.target.value as any })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              <option value="enrolled">Enrolled Course Students</option>
              <option value="batch_specific">Specific Batch Only</option>
              <option value="public">Public Sample</option>
            </select>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              required
              placeholder="File URL or external link"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <label className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs cursor-pointer inline-flex items-center gap-1 hover:bg-[#F8F9F7]">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
            </label>
          </div>
          <textarea
            rows={2}
            placeholder="Brief chapter description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Study Resource</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase text-[#B47B2B]">
                  {r.resourceType} &middot; {r.accessLevel.replace('_', ' ')} &middot; {r.category}
                </p>
                <h4 className="font-serif text-lg font-bold text-[#111915] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0F3D2E]" />
                  <span>{r.title}</span>
                </h4>
                <p className="text-xs text-[#4E5B53]">{r.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget({ id: r.id, label: r.title })}
                className="p-2 rounded-lg border border-red-200 text-red-700 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Study Resource"
        itemLabel={deleteTarget?.label || ''}
        description="Deletes this study resource and removes any linked uploaded storage asset."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete('resources', deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export const NoticesSection: React.FC = () => {
  const { notices, batches, students, adminUpsert, adminDelete } = useApp();
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'General',
    targetBatchId: '',
    isPinned: false,
    isPublished: true,
  });
  const [notifStudentId, setNotifStudentId] = useState(students[0]?.id || '');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-bold text-[#111915]">
        Notice Board &amp; Direct Student Notifications
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await adminUpsert('notices', {
                ...form,
                targetBatchId: form.targetBatchId || undefined,
                publishedAt: new Date().toISOString(),
              });
              setForm({ ...form, title: '', body: '', isPinned: false });
            }}
            className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
          >
            <h3 className="font-serif text-lg font-bold text-[#111915] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#B47B2B]" />
              <span>Publish Institute / Batch Notice</span>
            </h3>
            <input
              type="text"
              required
              placeholder="Notice Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              >
                <option value="General">General</option>
                <option value="Exam">Exam</option>
                <option value="Schedule">Schedule</option>
                <option value="Admission">Admission</option>
                <option value="Result">Result</option>
              </select>
              <select
                value={form.targetBatchId}
                onChange={(e) => setForm({ ...form, targetBatchId: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              >
                <option value="">Public (All Visitors)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch: {b.code}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              required
              placeholder="Announcement body..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
              <span>Pin notice to top</span>
            </label>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
            >
              Publish Notice
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!notifStudentId) return;
              await adminUpsert('notifications', {
                studentId: notifStudentId,
                title: notifTitle,
                body: notifBody,
                linkView: 'portal',
              });
              setNotifTitle('');
              setNotifBody('');
            }}
            className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
          >
            <h4 className="font-serif text-base font-bold text-[#111915]">
              Send Personal Student Alert
            </h4>
            <select
              value={notifStudentId}
              onChange={(e) => setNotifStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Alert title"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <textarea
              rows={2}
              required
              placeholder="Alert details..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-[#B47B2B] text-white text-xs font-semibold"
            >
              Send Student Alert
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase text-[#B47B2B]">
                  {n.category} {n.isPinned ? '· Pinned' : ''} &middot;{' '}
                  {new Date(n.publishedAt).toLocaleDateString()}
                </p>
                <h4 className="font-serif text-lg font-bold text-[#111915]">{n.title}</h4>
                <p className="text-xs text-[#4E5B53]">{n.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget({ id: n.id, label: n.title })}
                className="p-2 rounded-lg border border-red-200 text-red-700 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Notice"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently removes this notice from the public & portal boards."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete('notices', deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export const SupportTicketsAdminSection: React.FC = () => {
  const { tickets, replySupportTicket, updateSupportTicketStatus } = useApp();
  const [selectedId, setSelectedId] = useState<string>(tickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const selected = tickets.find((t) => t.id === selectedId) || tickets[0] || null;

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-bold text-[#111915]">
        Student Support Conversations ({tickets.length})
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2.5">
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                selected?.id === t.id
                  ? 'bg-[#EEF2EE] border-[#0F3D2E]'
                  : 'bg-white border-[#DCE2DC]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#B47B2B] uppercase">{t.category}</span>
                <span className="uppercase text-[#0F3D2E]">{t.status.replace('_', ' ')}</span>
              </div>
              <p className="font-serif text-base font-bold text-[#111915] mt-1">{t.subject}</p>
              <p className="text-xs text-[#4E5B53]">{t.studentName || 'Student'}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-7 bg-white border border-[#DCE2DC] rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
          {selected ? (
            <>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE2DC] pb-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#111915] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#0F3D2E]" />
                      <span>{selected.subject}</span>
                    </h3>
                    <p className="text-xs text-[#4E5B53]">From: {selected.studentName}</p>
                  </div>
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      void updateSupportTicketStatus(selected.id, e.target.value as any)
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#DCE2DC] text-xs font-semibold"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selected.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        m.senderRole === 'staff'
                          ? 'bg-[#EEF2EE] border-[#C8D4CA]'
                          : 'bg-[#F8F9F7] border-[#DCE2DC]'
                      }`}
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{m.senderName}</span>
                        <span className="text-[11px] font-normal text-[#4E5B53] tabular-nums">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p>{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!replyText.trim()) return;
                  await replySupportTicket(selected.id, replyText, true);
                  setReplyText('');
                }}
                className="pt-4 border-t border-[#DCE2DC] flex gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write official staff response..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-[#4E5B53]">No support tickets to display.</p>
          )}
        </div>
      </div>
    </div>
  );
};
