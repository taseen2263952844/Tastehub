import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Search,
  Pin,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdmissionApplicationForm } from './AdmissionModal';

export const AboutView: React.FC = () => {
  const { siteSettings, teachers, courses, openAdmissionModal } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            About {siteSettings.instituteName}
          </p>
          <h1 className="font-serif text-4xl font-bold text-[#111915] leading-tight">
            {siteSettings.aboutTitle}
          </h1>
          <p className="text-base text-[#4E5B53] leading-relaxed">{siteSettings.aboutBody}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3">
            <div className="p-4 rounded-xl bg-white border border-[#DCE2DC]">
              <p className="font-serif text-2xl font-bold text-[#0F3D2E] tabular-nums">
                {courses.filter((c) => c.isPublished).length}+
              </p>
              <p className="text-xs text-[#4E5B53] mt-1">Structured Academic Programs</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#DCE2DC]">
              <p className="font-serif text-2xl font-bold text-[#0F3D2E] tabular-nums">
                {teachers.filter((t) => t.isPublished).length}+
              </p>
              <p className="text-xs text-[#4E5B53] mt-1">Core Subject Mentors</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#DCE2DC]">
              <p className="font-serif text-2xl font-bold text-[#0F3D2E] tabular-nums">Weekly</p>
              <p className="text-xs text-[#4E5B53] mt-1">Board &amp; Admission Exams</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAdmissionModal()}
            className="px-6 py-3 rounded-xl bg-[#0F3D2E] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <span>Apply for Admission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:col-span-6">
          <img
            src={siteSettings.aboutImageUrl}
            alt="Small-batch academic mentoring session at SOFS"
            className="w-full h-[380px] object-cover rounded-2xl border border-[#DCE2DC]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Conceptual Lectures First',
            body: 'Every topic starts from physical intuition and mathematical derivations before introducing fast board or admission shortcuts.',
          },
          {
            title: 'Bilingual MCQ & Written Rigor',
            body: 'Students practice both Bangla and English versions with KaTeX-formatted problems, vector diagrams, and creative structured scripts.',
          },
          {
            title: 'Published Performance Cards',
            body: 'MCQ scores grade automatically while written scripts receive rubric comments, GPA calculation, and batch merit rankings.',
          },
        ].map((pillar) => (
          <div key={pillar.title} className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-2">
            <h3 className="font-serif text-xl font-bold text-[#111915]">{pillar.title}</h3>
            <p className="text-sm text-[#4E5B53] leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CoursesView: React.FC = () => {
  const { courses, subjects, openAdmissionModal } = useApp();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const levels = ['All', ...Array.from(new Set(courses.map((c) => c.academicLevel)))];
  const filtered = courses.filter((c) => {
    if (!c.isPublished) return false;
    const matchLevel = levelFilter === 'All' || c.academicLevel === levelFilter;
    const matchQuery =
      !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.summary.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE2DC] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            Curriculum Directory
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
            Courses &amp; Academic Tracks
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4E5B53] absolute left-3 top-2.5" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="pl-9 pr-3 py-2 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] bg-white text-sm focus:outline-none focus:border-[#0F3D2E]"
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'All' ? 'All Levels' : lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((course) => {
          const courseSubjects = subjects.filter((s) => s.courseId === course.id && s.isPublished);
          return (
            <div
              key={course.id}
              className="bg-white border border-[#DCE2DC] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {course.coverImageUrl && (
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-52 object-cover border-b border-[#DCE2DC]"
                  />
                )}
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#4E5B53]">
                    <span>
                      {course.academicLevel} &middot; {course.academicGroup} &middot;{' '}
                      {course.durationLabel}
                    </span>
                    <span className="font-semibold text-[#0F3D2E] tabular-nums">
                      {course.feeLabel}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#111915]">{course.title}</h2>
                  <p className="text-sm text-[#4E5B53] leading-relaxed">{course.description}</p>

                  {courseSubjects.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#4E5B53]">
                        Included Subjects
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#111915]">
                        {courseSubjects.map((sub) => (
                          <span key={sub.id} className="font-medium">
                            &bull; {sub.name} ({sub.code})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4E5B53]">
                      Key Highlights
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {course.syllabusHighlights.map((h, i) => (
                        <li key={i} className="text-xs text-[#111915] flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#EEF2EE]/50 border-t border-[#DCE2DC] flex items-center justify-between">
                <span className="text-xs text-[#4E5B53]">Small-batch enrollment available</span>
                <button
                  type="button"
                  onClick={() => openAdmissionModal(course.title)}
                  className="px-4 py-2 rounded-lg bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Apply for This Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TeachersView: React.FC = () => {
  const { teachers } = useApp();
  const published = teachers.filter((t) => t.isPublished);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#DCE2DC] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
          Academic Faculty
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
          Teachers &amp; Subject Specialists
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {published.map((teacher) => (
          <div key={teacher.id} className="bg-white border border-[#DCE2DC] rounded-2xl overflow-hidden">
            <img
              src={teacher.photoUrl}
              alt={teacher.name}
              className="w-full h-72 object-cover object-top border-b border-[#DCE2DC]"
            />
            <div className="p-6 space-y-2.5">
              <p className="text-xs font-semibold text-[#B47B2B]">
                {teacher.department} &middot; {teacher.experienceYears} years experience
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#111915]">{teacher.name}</h2>
              <p className="text-xs font-medium text-[#0F3D2E]">{teacher.title}</p>
              <p className="text-xs text-[#4E5B53]">{teacher.qualifications}</p>
              <p className="text-sm text-[#4E5B53] leading-relaxed pt-1">{teacher.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BatchesView: React.FC = () => {
  const { batches, schedules, subjects, teachers, openAdmissionModal, courses } = useApp();
  const publishedBatches = batches.filter((b) => b.isPublished);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#DCE2DC] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            Schedules &amp; Cohorts
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
            Batches &amp; Weekly Routine
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openAdmissionModal()}
          className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold self-start sm:self-auto"
        >
          Reserve Batch Seat
        </button>
      </div>

      <div className="space-y-6">
        {publishedBatches.map((batch) => {
          const course = courses.find((c) => c.id === batch.courseId);
          const batchRoutine = schedules.filter((s) => s.batchId === batch.id);
          const seatsLeft = Math.max(0, batch.seatCapacity - batch.enrolledCount);
          return (
            <div key={batch.id} className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE2DC] pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-[#B47B2B] font-semibold">
                    {batch.code} &middot; {batch.academicLevel} ({batch.academicGroup}) &middot; Status:{' '}
                    <span className="uppercase">{batch.status}</span>
                  </p>
                  <h2 className="font-serif text-2xl font-bold text-[#111915]">{batch.name}</h2>
                  <p className="text-xs text-[#4E5B53]">
                    {course?.title} &middot; {batch.roomOrMode}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right tabular-nums">
                    <p className="text-xs text-[#4E5B53]">Available Seats</p>
                    <p className="text-lg font-bold text-[#0F3D2E]">
                      {seatsLeft} of {batch.seatCapacity}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdmissionModal(course?.title || batch.name)}
                    className="px-4 py-2.5 rounded-xl bg-[#B47B2B] text-white text-xs font-semibold"
                  >
                    Apply for Batch
                  </button>
                </div>
              </div>

              {batchRoutine.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE2DC] text-[#4E5B53]">
                        <th className="py-2 pr-4 font-semibold">Day</th>
                        <th className="py-2 pr-4 font-semibold">Time</th>
                        <th className="py-2 pr-4 font-semibold">Subject</th>
                        <th className="py-2 pr-4 font-semibold">Faculty</th>
                        <th className="py-2 pr-4 font-semibold">Room / Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRoutine.map((slot) => {
                        const sub = subjects.find((s) => s.id === slot.subjectId);
                        const tch = teachers.find((t) => t.id === slot.teacherId);
                        return (
                          <tr key={slot.id} className="border-b border-[#EEF2EE] last:border-0">
                            <td className="py-2.5 pr-4 font-semibold text-[#111915]">
                              {slot.dayOfWeek}
                            </td>
                            <td className="py-2.5 pr-4 tabular-nums text-[#4E5B53]">
                              {slot.startTime} – {slot.endTime}
                            </td>
                            <td className="py-2.5 pr-4 font-medium text-[#0F3D2E]">
                              {sub?.name || 'Academic Clinic'}
                            </td>
                            <td className="py-2.5 pr-4 text-[#111915]">{tch?.name || 'SOFS Faculty'}</td>
                            <td className="py-2.5 pr-4 text-[#4E5B53]">
                              {slot.roomLabel} &middot; {slot.topicNote}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#4E5B53] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0F3D2E]" />
                  <span>{batch.scheduleSummary}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GalleryView: React.FC = () => {
  const { gallery } = useApp();
  const [category, setCategory] = useState('All');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const published = gallery.filter((g) => g.isPublished);
  const categories = ['All', ...Array.from(new Set(published.map((g) => g.category)))];
  const visible = published.filter((g) => category === 'All' || g.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCE2DC] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            Campus Life
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
            SOFS Photo Gallery
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${
                category === cat
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                  : 'bg-white text-[#4E5B53] border-[#DCE2DC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((item) => (
          <div
            key={item.id}
            onClick={() => setLightboxUrl(item.imageUrl)}
            className="bg-white border border-[#DCE2DC] rounded-2xl overflow-hidden cursor-pointer group"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-56 object-cover group-hover:scale-[1.02] transition-transform"
            />
            <div className="p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B47B2B]">
                {item.category}
              </p>
              <h3 className="font-serif text-lg font-bold text-[#111915]">{item.title}</h3>
              <p className="text-xs text-[#4E5B53]">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white text-[#111915]"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Gallery preview"
            className="max-w-4xl max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

export const NoticesView: React.FC = () => {
  const { notices } = useApp();
  const [catFilter, setCatFilter] = useState('All');

  const publicNotices = notices.filter((n) => n.isPublished && !n.targetBatchId);
  const categories = ['All', ...Array.from(new Set(publicNotices.map((n) => n.category)))];
  const filtered = publicNotices.filter((n) => catFilter === 'All' || n.category === catFilter);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCE2DC] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            Official Announcements
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
            SOFS Notice Board
          </h1>
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] bg-white text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((notice) => (
          <article
            key={notice.id}
            className={`bg-white border rounded-2xl p-6 space-y-2.5 ${
              notice.isPinned ? 'border-[#0F3D2E]' : 'border-[#DCE2DC]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4E5B53]">
              <div className="flex items-center gap-2">
                {notice.isPinned && <Pin className="w-3.5 h-3.5 text-[#0F3D2E]" />}
                <span className="font-semibold uppercase tracking-wider text-[#B47B2B]">
                  {notice.category}
                </span>
              </div>
              <span className="tabular-nums">
                Published {new Date(notice.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#111915]">{notice.title}</h2>
            <p className="text-sm text-[#4E5B53] leading-relaxed whitespace-pre-line">
              {notice.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const { siteSettings } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
            Campus Helpdesk
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915] mt-1">
            Contact {siteSettings.shortName}
          </h1>
          <p className="text-sm text-[#4E5B53] mt-2 leading-relaxed">
            Visit our Dhanmondi campus for diagnostic tests and printed lecture modules, or message
            us directly via phone or WhatsApp.
          </p>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#111915]">Campus Address</p>
              <p className="text-[#4E5B53]">{siteSettings.campusAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#111915]">Admissions Phone &amp; WhatsApp</p>
              <p className="text-[#4E5B53] tabular-nums">{siteSettings.contactPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#111915]">Official Email</p>
              <p className="text-[#4E5B53]">{siteSettings.contactEmail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#111915]">Office Hours</p>
              <p className="text-[#4E5B53]">{siteSettings.officeHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white border border-[#DCE2DC] rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            Admission &amp; Counseling Request
          </h2>
          <p className="text-xs text-[#4E5B53] mt-1">
            No login required — submit your preferred program and our team will reach out.
          </p>
        </div>
        <AdmissionApplicationForm />
      </div>
    </div>
  );
};

export const AdmissionDedicatedView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
          SOFS Admission Form
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111915]">
          Apply for Upcoming SOFS Batches
        </h1>
        <p className="text-sm text-[#4E5B53]">
          Complete this form in under two minutes with zero login required. You will receive an
          instant application reference code for tracking.
        </p>
      </div>

      <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 sm:p-8">
        <AdmissionApplicationForm />
      </div>
    </div>
  );
};
