import React from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdmissionApplicationForm } from './AdmissionModal';

export const HomeView: React.FC = () => {
  const {
    siteSettings,
    courses,
    teachers,
    batches,
    notices,
    testimonials,
    results,
    authUser,
    setView,
    openAdmissionModal,
    setAuthModalOpen,
  } = useApp();

  const publishedCourses = courses.filter((c) => c.isPublished).slice(0, 3);
  const publishedTeachers = teachers.filter((t) => t.isPublished).slice(0, 3);
  const publishedBatches = batches.filter((b) => b.isPublished).slice(0, 4);
  const publishedNotices = notices.filter((n) => n.isPublished && !n.targetBatchId).slice(0, 3);
  const hallOfFame = results.filter((r) => r.isPublished && r.hallOfFame).slice(0, 4);
  const publishedTestimonials = testimonials.filter((t) => t.isPublished).slice(0, 3);

  return (
    <div className="bg-[#F8F9F7] text-[#111915]">
      {/* Hero Section */}
      <section className="border-b border-[#DCE2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
              {siteSettings.instituteName}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#111915] leading-[1.12]">
              {siteSettings.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-[#4E5B53] leading-relaxed max-w-xl">
              {siteSettings.heroSubheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => openAdmissionModal()}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: siteSettings.primaryColor || '#0F3D2E' }}
              >
                <span>Apply for SOFS Admission</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => (authUser ? setView('portal') : setAuthModalOpen(true))}
                className="px-6 py-3.5 rounded-xl border border-[#DCE2DC] bg-white hover:bg-[#EEF2EE] text-sm font-semibold text-[#111915] inline-flex items-center gap-2 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-[#0F3D2E]" />
                <span>{authUser ? 'Open Student Portal' : 'Student Portal Login'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-5 border-t border-[#DCE2DC]">
              <div>
                <p className="font-serif text-2xl font-bold tabular-nums text-[#0F3D2E]">35 Max</p>
                <p className="text-xs text-[#4E5B53] mt-0.5">Students per batch</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold tabular-nums text-[#0F3D2E]">
                  Weekly
                </p>
                <p className="text-xs text-[#4E5B53] mt-0.5">MCQ + Written evaluation</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold tabular-nums text-[#0F3D2E]">
                  BN + EN
                </p>
                <p className="text-xs text-[#4E5B53] mt-0.5">Bilingual exam support</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-[#DCE2DC] bg-white shadow-sm">
              <img
                src={siteSettings.heroImageUrl}
                alt="SOFS Academic Coaching lecture classroom in Dhaka"
                className="w-full h-[320px] sm:h-[420px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
              Academic Tracks
            </p>
            <h2 className="font-serif text-3xl font-bold text-[#111915] mt-1">
              Structured Courses for Board &amp; Admission Excellence
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setView('courses')}
            className="text-sm font-semibold text-[#0F3D2E] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Explore all courses</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishedCourses.map((course) => (
            <article
              key={course.id}
              className="bg-white border border-[#DCE2DC] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#0F3D2E]/50 transition-colors"
            >
              <div>
                {course.coverImageUrl && (
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-44 object-cover border-b border-[#DCE2DC]"
                  />
                )}
                <div className="p-6 space-y-3">
                  <p className="text-xs font-medium text-[#4E5B53]">
                    {course.academicLevel} &middot; {course.academicGroup} &middot;{' '}
                    {course.durationLabel}
                  </p>
                  <h3 className="font-serif text-xl font-bold text-[#111915] leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#4E5B53] leading-relaxed">{course.summary}</p>
                  <ul className="space-y-1.5 pt-2">
                    {course.syllabusHighlights.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-xs text-[#111915] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#EEF2EE]/50 border-t border-[#DCE2DC] flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#111915] tabular-nums">
                  {course.feeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => openAdmissionModal(course.title)}
                  className="text-xs font-semibold text-[#0F3D2E] hover:underline inline-flex items-center gap-1"
                >
                  <span>Apply now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Open Batches & Routine Snapshot */}
      <section className="bg-[#EEF2EE]/60 border-y border-[#DCE2DC] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
                Live Batch Slots
              </p>
              <h2 className="font-serif text-3xl font-bold text-[#111915] mt-1">
                Active Batches &amp; Seat Availability
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setView('batches')}
              className="text-sm font-semibold text-[#0F3D2E] hover:underline inline-flex items-center gap-1.5"
            >
              <span>View weekly schedules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {publishedBatches.map((batch) => {
              const seatsLeft = Math.max(0, batch.seatCapacity - batch.enrolledCount);
              return (
                <div
                  key={batch.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-[#4E5B53]">
                      <span className="font-mono">{batch.code}</span>
                      <span className="uppercase text-[#0F3D2E] font-semibold">
                        {batch.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#111915]">{batch.name}</h3>
                    <p className="text-xs text-[#4E5B53] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#B47B2B]" />
                      <span>{batch.scheduleSummary}</span>
                    </p>
                    <p className="text-xs text-[#4E5B53]">{batch.roomOrMode}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#DCE2DC]">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-[#4E5B53]">Seats Remaining</span>
                      <span className="font-semibold text-[#111915]">
                        {seatsLeft} / {batch.seatCapacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#EEF2EE] overflow-hidden">
                      <div
                        className="h-full bg-[#0F3D2E] rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((batch.enrolledCount / Math.max(1, batch.seatCapacity)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Faculty Mentors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
              Academic Faculty
            </p>
            <h2 className="font-serif text-3xl font-bold text-[#111915] mt-1">
              Mentors Who Teach From First Principles
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setView('teachers')}
            className="text-sm font-semibold text-[#0F3D2E] hover:underline inline-flex items-center gap-1.5"
          >
            <span>Meet all instructors</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishedTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border border-[#DCE2DC] rounded-2xl overflow-hidden"
            >
              <img
                src={teacher.photoUrl}
                alt={teacher.name}
                className="w-full h-64 object-cover object-top border-b border-[#DCE2DC]"
              />
              <div className="p-6 space-y-2">
                <p className="text-xs font-medium text-[#B47B2B]">
                  {teacher.department} &middot; {teacher.experienceYears} yrs experience
                </p>
                <h3 className="font-serif text-xl font-bold text-[#111915]">{teacher.name}</h3>
                <p className="text-xs font-medium text-[#0F3D2E]">{teacher.qualifications}</p>
                <p className="text-sm text-[#4E5B53] leading-relaxed pt-1">{teacher.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hall of Fame & Notices */}
      <section className="bg-white border-y border-[#DCE2DC] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Merit Hall of Fame & Testimonials */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
                Merit &amp; Student Outcomes
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111915] mt-1">
                Recent Assessment Leaders &amp; Alumni Voices
              </h2>
            </div>

            {hallOfFame.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hallOfFame.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-[#EEF2EE]/70 border border-[#DCE2DC] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Award className="w-5 h-5 text-[#B47B2B] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111915] truncate">
                          {entry.studentName || 'SOFS Scholar'}
                        </p>
                        <p className="text-xs text-[#4E5B53] truncate">
                          {entry.batchName || entry.studentCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-sm font-bold text-[#0F3D2E]">{entry.percentage}%</p>
                      <p className="text-[11px] text-[#4E5B53]">
                        {entry.letterGrade} &middot; GPA {entry.gpa.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {publishedTestimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="p-5 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] space-y-2"
                >
                  <p className="text-sm text-[#111915] leading-relaxed">"{item.quote}"</p>
                  <footer className="text-xs text-[#4E5B53]">
                    <span className="font-semibold text-[#111915]">{item.studentName}</span>{' '}
                    &middot; {item.achievement} &middot; {item.cohort}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>

          {/* Right: Latest Notices */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#111915] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#B47B2B]" />
                <span>Notice Board</span>
              </h2>
              <button
                type="button"
                onClick={() => setView('notices')}
                className="text-xs font-semibold text-[#0F3D2E] hover:underline"
              >
                All notices
              </button>
            </div>

            <div className="space-y-3">
              {publishedNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#4E5B53]">
                    <span className="uppercase tracking-wider text-[#B47B2B]">
                      {notice.category}
                    </span>
                    <span className="tabular-nums">
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111915]">{notice.title}</h3>
                  <p className="text-xs text-[#4E5B53] leading-relaxed line-clamp-3">
                    {notice.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-[#0F3D2E] text-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F2DFBE]">
                <ClipboardList className="w-4 h-4" />
                <span>Online Exam &amp; Study Portal</span>
              </div>
              <p className="text-sm text-[#DCE2DC] leading-relaxed">
                Already enrolled at SOFS? Sign in to take scheduled MCQ &amp; written tests, view
                published result cards, and download batch sheets.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => (authUser ? setView('portal') : setAuthModalOpen(true))}
                  className="px-4 py-2 rounded-lg bg-white text-[#0F3D2E] text-xs font-semibold hover:bg-[#EEF2EE]"
                >
                  {authUser ? 'Go to Student Portal' : 'Sign In to Portal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public SOFS Admission Desk Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
              SOFS Admission
            </p>
            <h2 className="font-serif text-3xl font-bold text-[#111915]">
              Request Seat Counseling &amp; Batch Placement
            </h2>
            <p className="text-sm text-[#4E5B53] leading-relaxed">
              Submit your academic level, group, and preferred batch below. No account creation is
              required—our academic coordinator calls or WhatsApps you directly with available batch
              slots and diagnostic test timing.
            </p>
            <div className="space-y-2.5 pt-2 text-xs text-[#4E5B53]">
              <p className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0F3D2E]" />
                <span>Diagnostic evaluation before batch allocation</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F3D2E]" />
                <span>Parent orientation &amp; transparent attendance updates</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AdmissionApplicationForm />
          </div>
        </div>
      </section>
    </div>
  );
};
