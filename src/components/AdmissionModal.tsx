import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdmissionApplication } from '../types';

interface AdmissionFormProps {
  initialCourse?: string;
  onSuccess?: (app: AdmissionApplication) => void;
  compact?: boolean;
}

export const AdmissionApplicationForm: React.FC<AdmissionFormProps> = ({
  initialCourse = '',
  onSuccess,
}) => {
  const { courses, batches, submitPublicAdmission, siteSettings } = useApp();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [academicLevel, setAcademicLevel] = useState('HSC');
  const [academicGroup, setAcademicGroup] = useState('Science');
  const [desiredCourse, setDesiredCourse] = useState(
    initialCourse || courses[0]?.title || 'HSC Physics & Higher Math Full Course'
  );
  const [preferredBatch, setPreferredBatch] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot spam field
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<AdmissionApplication | null>(null);

  useEffect(() => {
    if (initialCourse) setDesiredCourse(initialCourse);
  }, [initialCourse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const record = await submitPublicAdmission({
        fullName,
        phone,
        whatsapp,
        academicLevel,
        academicGroup,
        desiredCourse,
        preferredBatch,
        message,
        website,
      });
      setSubmittedRecord(record);
      onSuccess?.(record);
    } catch (err: any) {
      setError(err?.message || 'Could not submit admission inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRecord) {
    return (
      <div className="p-6 rounded-2xl bg-[#EEF2EE] border border-[#C8D4CA] space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#0F3D2E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-[#111915]">
              Admission Application Received
            </h3>
            <p className="text-sm text-[#4E5B53]">
              Thank you, <span className="font-semibold text-[#111915]">{submittedRecord.fullName}</span>. Your application reference is{' '}
              <span className="font-mono font-semibold text-[#0F3D2E] tabular-nums">
                {submittedRecord.referenceCode}
              </span>
              .
            </p>
          </div>
        </div>
        <div className="text-xs text-[#4E5B53] bg-white rounded-xl p-4 border border-[#DCE2DC] space-y-1">
          <p>
            Program: <span className="font-medium text-[#111915]">{submittedRecord.desiredCourse}</span>
          </p>
          <p>
            Level &amp; Group:{' '}
            <span className="font-medium text-[#111915]">
              {submittedRecord.academicLevel} · {submittedRecord.academicGroup}
            </span>
          </p>
          <p>
            Our admission counselor will contact{' '}
            <span className="font-mono tabular-nums text-[#111915]">{submittedRecord.phone}</span>{' '}
            during office hours ({siteSettings.officeHours}).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmittedRecord(null);
            setFullName('');
            setPhone('');
            setWhatsapp('');
            setMessage('');
          }}
          className="text-xs font-semibold text-[#0F3D2E] hover:underline"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hidden honeypot for anti-spam */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Student Full Name *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Tasnim Rahman"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Mobile Phone Number *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+880 17XX-XXXXXX"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            WhatsApp (Optional)
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+880 17XX-XXXXXX"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Class / Academic Level *
          </label>
          <select
            value={academicLevel}
            onChange={(e) => setAcademicLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          >
            <option value="Class 9">Class 9</option>
            <option value="SSC">SSC Candidate</option>
            <option value="HSC">HSC (1st / 2nd Year)</option>
            <option value="University Admission">University Admission</option>
            <option value="Medical Admission">Medical Admission</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Academic Group *
          </label>
          <select
            value={academicGroup}
            onChange={(e) => setAcademicGroup(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          >
            <option value="Science">Science</option>
            <option value="Engineering">Engineering Focus</option>
            <option value="Medical">Medical Focus</option>
            <option value="Business Studies">Business Studies</option>
            <option value="Humanities">Humanities</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Desired Course / Subject *
          </label>
          <select
            value={desiredCourse}
            onChange={(e) => setDesiredCourse(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
              </option>
            ))}
            <option value="Subject-Wise Coaching Inquiry">Subject-Wise Coaching Inquiry</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111915] mb-1">
            Preferred Batch (Optional)
          </label>
          <select
            value={preferredBatch}
            onChange={(e) => setPreferredBatch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          >
            <option value="">Any suitable batch slot</option>
            {batches.map((b) => (
              <option key={b.id} value={`${b.name} (${b.scheduleSummary})`}>
                {b.name} — {b.scheduleSummary}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#111915] mb-1">
          Optional Note / Questions for Faculty
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mention school/college name, weak subjects, or preferred timing..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-xs text-[#4E5B53]">No login or online payment required to apply.</p>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-[#0F3D2E] hover:bg-[#16503D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Submit Admission Request</span>
        </button>
      </div>
    </form>
  );
};

export const AdmissionModal: React.FC = () => {
  const { admissionModalOpen, setAdmissionModalOpen, preselectedCourseTitle } = useApp();

  if (!admissionModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => setAdmissionModalOpen(false)}
    >
      <div
        className="bg-[#F8F9F7] border border-[#DCE2DC] rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DCE2DC] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B47B2B]">
              SOFS Admission Desk
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#111915]">
              Apply for Admission — No Account Required
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAdmissionModalOpen(false)}
            className="p-1.5 rounded-lg text-[#4E5B53] hover:text-[#111915]"
            aria-label="Close admission modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdmissionApplicationForm initialCourse={preselectedCourseTitle} />
      </div>
    </div>
  );
};
