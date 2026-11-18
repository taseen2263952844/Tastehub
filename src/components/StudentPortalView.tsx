import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  LogOut,
  MessageSquare,
  Play,
  Send,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExamResult } from '../types';
import { ResultCardView } from './ResultCardView';

type PortalTab =
  | 'overview'
  | 'courses'
  | 'exams'
  | 'results'
  | 'resources'
  | 'notices'
  | 'support'
  | 'profile';

export const StudentPortalView: React.FC = () => {
  const {
    authUser,
    setAuthModalOpen,
    logout,
    currentStudent,
    enrollments,
    courses,
    batches,
    schedules,
    subjects,
    exams,
    attempts,
    results,
    questions,
    resources,
    notices,
    notifications,
    tickets,
    siteSettings,
    openExamWorkspace,
    markNotificationsRead,
    createSupportTicket,
    replySupportTicket,
    updateStudentProfile,
  } = useApp();

  const [tab, setTab] = useState<PortalTab>('overview');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [resourceFilter, setResourceFilter] = useState('All');

  // Support ticket composer
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Academic');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [ticketMessage, setTicketMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: currentStudent?.fullName || '',
    phone: currentStudent?.phone || '',
    whatsapp: currentStudent?.whatsapp || '',
    academicLevel: currentStudent?.academicLevel || 'HSC',
    academicGroup: currentStudent?.academicGroup || 'Science',
    institutionName: currentStudent?.institutionName || '',
    guardianName: currentStudent?.guardianName || '',
    guardianPhone: currentStudent?.guardianPhone || '',
  });

  if (!authUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF2EE] text-[#0F3D2E] flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111915]">SOFS Student Portal</h1>
        <p className="text-sm text-[#4E5B53] leading-relaxed">
          Sign in with your student Google or email account to access your enrolled batches, take
          scheduled exams, download study materials, and view official result cards.
        </p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-[#0F3D2E] text-white text-sm font-semibold"
        >
          Sign In to Student Portal
        </button>
      </div>
    );
  }

  const myEnrollments = enrollments.filter(
    (e) => e.studentId === currentStudent?.id || (!enrollments.some((x) => x.studentId === currentStudent?.id) && e.studentId === 'stu-1')
  );
  const myCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const myBatchIds = new Set(myEnrollments.map((e) => e.batchId).filter(Boolean));

  const myCourses = courses.filter((c) => myCourseIds.has(c.id));
  const myBatches = batches.filter((b) => myBatchIds.has(b.id));
  const mySchedules = schedules.filter((s) => myBatchIds.has(s.batchId));

  const myExams = exams.filter((ex) => {
    if (!ex.isPublished) return false;
    if (ex.targetBatchIds.length === 0 && ex.targetStudentIds.length === 0) return true;
    if (currentStudent && ex.targetStudentIds.includes(currentStudent.id)) return true;
    return ex.targetBatchIds.some((bId) => myBatchIds.has(bId));
  });

  const myResults = results.filter(
    (r) => r.isPublished && (r.studentId === currentStudent?.id || r.studentId === 'stu-1')
  );
  const hallOfFame = results.filter((r) => r.isPublished && r.hallOfFame).slice(0, 6);

  const visibleResources = resources.filter((r) => {
    if (!r.isPublished) return false;
    if (resourceFilter !== 'All' && r.resourceType !== resourceFilter) return false;
    if (r.accessLevel === 'public') return true;
    if (r.accessLevel === 'enrolled') return !r.courseId || myCourseIds.has(r.courseId);
    if (r.accessLevel === 'batch_specific') return Boolean(r.batchId && myBatchIds.has(r.batchId));
    return false;
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const myTickets = tickets.filter(
    (t) => t.studentId === currentStudent?.id || (!tickets.some((x) => x.studentId === currentStudent?.id) && t.studentId === 'stu-1')
  );

  const selectedTicket = myTickets.find((t) => t.id === activeTicketId) || myTickets[0] || null;

  const avgPct = myResults.length
    ? Math.round((myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length) * 10) / 10
    : 0;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStudentProfile(profileForm);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    await createSupportTicket(ticketSubject, ticketCategory, ticketPriority, ticketMessage);
    setTicketSubject('');
    setTicketMessage('');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    await replySupportTicket(selectedTicket.id, replyText, false);
    setReplyText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portal Top Header */}
      <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-mono text-[#B47B2B] font-semibold">
            {currentStudent?.studentCode} &middot; {currentStudent?.academicLevel} (
            {currentStudent?.academicGroup})
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111915]">
            Welcome, {currentStudent?.fullName}
          </h1>
          <p className="text-xs text-[#4E5B53]">{authUser.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTab('notices')}
            className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] bg-[#F8F9F7] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#B47B2B]" />
            <span>Notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="font-mono tabular-nums text-[#0F3D2E] font-bold">
                ({unreadNotifications.length})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-xs font-semibold text-[#4E5B53] hover:text-[#111915] inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#DCE2DC]">
        {[
          { id: 'overview', label: 'Dashboard', icon: GraduationCap },
          { id: 'courses', label: 'Courses & Routine', icon: BookOpen },
          { id: 'exams', label: 'Exams', icon: ClipboardList },
          { id: 'results', label: 'Results & Merit', icon: Award },
          { id: 'resources', label: 'Study Library', icon: FileText },
          { id: 'notices', label: 'Notices & Alerts', icon: Bell },
          { id: 'support', label: 'Support Desk', icon: MessageSquare },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as PortalTab)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-b-2 transition-colors ${
                active
                  ? 'border-[#0F3D2E] text-[#0F3D2E] bg-[#EEF2EE]/70'
                  : 'border-transparent text-[#4E5B53] hover:text-[#111915]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5">
              <p className="text-xs text-[#4E5B53]">Active Courses</p>
              <p className="font-serif text-3xl font-bold text-[#0F3D2E] tabular-nums mt-1">
                {myCourses.length}
              </p>
            </div>
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5">
              <p className="text-xs text-[#4E5B53]">Scheduled Exams</p>
              <p className="font-serif text-3xl font-bold text-[#111915] tabular-nums mt-1">
                {myExams.length}
              </p>
            </div>
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5">
              <p className="text-xs text-[#4E5B53]">Average Score</p>
              <p className="font-serif text-3xl font-bold text-[#B47B2B] tabular-nums mt-1">
                {avgPct}%
              </p>
            </div>
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5">
              <p className="text-xs text-[#4E5B53]">Study Resources</p>
              <p className="font-serif text-3xl font-bold text-[#111915] tabular-nums mt-1">
                {visibleResources.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-[#111915]">
                  Available Online Exams
                </h2>
                <button
                  type="button"
                  onClick={() => setTab('exams')}
                  className="text-xs font-semibold text-[#0F3D2E] hover:underline"
                >
                  View all exams
                </button>
              </div>
              <div className="space-y-3">
                {myExams.slice(0, 3).map((ex) => {
                  const att = attempts.find((a) => a.examId === ex.id);
                  const canResume = att?.status === 'in_progress';
                  const finished = att && att.status !== 'in_progress';
                  return (
                    <div
                      key={ex.id}
                      className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111915] truncate">{ex.title}</p>
                        <p className="text-xs text-[#4E5B53] tabular-nums">
                          {ex.durationMinutes} mins &middot; {ex.totalMarks} marks &middot;{' '}
                          {ex.examType.toUpperCase()}
                        </p>
                      </div>
                      {finished ? (
                        <span className="text-xs font-semibold text-[#0F3D2E] shrink-0">
                          Submitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openExamWorkspace(ex.id)}
                          className="px-3.5 py-2 rounded-lg bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                        >
                          <Play className="w-3 h-3" />
                          <span>{canResume ? 'Resume' : 'Start'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-[#111915]">Recent Results</h2>
                <button
                  type="button"
                  onClick={() => setTab('results')}
                  className="text-xs font-semibold text-[#0F3D2E] hover:underline"
                >
                  Open transcripts
                </button>
              </div>
              <div className="space-y-3">
                {myResults.length === 0 ? (
                  <p className="text-xs text-[#4E5B53]">No published results yet.</p>
                ) : (
                  myResults.slice(0, 3).map((res) => {
                    const ex = exams.find((e) => e.id === res.examId);
                    return (
                      <div
                        key={res.id}
                        className="p-4 rounded-xl bg-[#EEF2EE]/60 border border-[#DCE2DC] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111915] truncate">
                            {ex?.title || 'Assessment'}
                          </p>
                          <p className="text-xs text-[#4E5B53] tabular-nums">
                            {res.obtainedMarks}/{res.totalMarks} ({res.percentage}%) &middot; Grade{' '}
                            {res.letterGrade}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedResult(res)}
                          className="px-3 py-1.5 rounded-lg border border-[#0F3D2E] text-[#0F3D2E] text-xs font-semibold shrink-0"
                        >
                          Result Card
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURSES & ROUTINE TAB */}
      {tab === 'courses' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            Enrolled Courses &amp; Weekly Batch Routine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCourses.map((course) => {
              const batch = myBatches.find((b) => b.courseId === course.id);
              const batchRoutine = mySchedules.filter((s) => s.batchId === batch?.id);
              return (
                <div
                  key={course.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4"
                >
                  <div>
                    <p className="text-xs font-mono text-[#B47B2B] font-semibold">
                      {batch?.code || course.academicLevel} &middot; {course.durationLabel}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-[#111915] mt-1">
                      {course.title}
                    </h3>
                    {batch && (
                      <p className="text-xs text-[#4E5B53] mt-1">
                        Batch: <span className="font-medium text-[#111915]">{batch.name}</span>{' '}
                        &middot; {batch.roomOrMode}
                      </p>
                    )}
                  </div>

                  {batchRoutine.length > 0 && (
                    <div className="border-t border-[#DCE2DC] pt-3 space-y-2">
                      <p className="text-xs font-semibold text-[#4E5B53] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0F3D2E]" />
                        <span>Class Schedule</span>
                      </p>
                      {batchRoutine.map((slot) => {
                        const sub = subjects.find((s) => s.id === slot.subjectId);
                        return (
                          <div
                            key={slot.id}
                            className="text-xs flex items-center justify-between py-1.5 border-b border-[#EEF2EE] last:border-0"
                          >
                            <span className="font-semibold text-[#111915]">{slot.dayOfWeek}</span>
                            <span className="tabular-nums text-[#4E5B53]">
                              {slot.startTime}–{slot.endTime}
                            </span>
                            <span className="text-[#0F3D2E] font-medium">
                              {sub?.name || slot.topicNote}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXAMS TAB */}
      {tab === 'exams' && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            Scheduled Exams &amp; Assessment History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myExams.map((ex) => {
              const att = attempts.find((a) => a.examId === ex.id);
              const now = Date.now();
              const starts = new Date(ex.startsAt).getTime();
              const ends = new Date(ex.endsAt).getTime();
              const isBefore = now < starts;
              const isAfter = now > ends;
              const res = myResults.find((r) => r.examId === ex.id);

              return (
                <div
                  key={ex.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-[#4E5B53]">
                      <span className="uppercase font-semibold text-[#B47B2B]">
                        {ex.examType} Exam
                      </span>
                      <span className="font-mono tabular-nums">
                        {ex.durationMinutes} mins &middot; {ex.totalMarks} marks
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#111915]">{ex.title}</h3>
                    <p className="text-xs text-[#4E5B53] leading-relaxed">{ex.description}</p>
                    <p className="text-[11px] text-[#4E5B53] tabular-nums">
                      Window: {new Date(ex.startsAt).toLocaleString()} –{' '}
                      {new Date(ex.endsAt).toLocaleString()}
                    </p>
                    {ex.negativeMarkingEnabled && (
                      <p className="text-[11px] text-amber-800 font-medium">
                        Negative marking applies: -{ex.negativeMarkValue} per wrong MCQ choice
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DCE2DC] flex items-center justify-between">
                    {att && att.status !== 'in_progress' ? (
                      <>
                        <span className="text-xs font-semibold text-[#0F3D2E] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Completed ({att.status.replace('_', ' ')})
                        </span>
                        {res && (
                          <button
                            type="button"
                            onClick={() => setSelectedResult(res)}
                            className="px-3.5 py-2 rounded-lg bg-[#EEF2EE] text-[#0F3D2E] text-xs font-semibold"
                          >
                            View Result Card
                          </button>
                        )}
                      </>
                    ) : isBefore ? (
                      <span className="text-xs text-[#4E5B53]">Opens on scheduled time</span>
                    ) : isAfter && !att ? (
                      <span className="text-xs text-red-700">Submission window closed</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openExamWorkspace(ex.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{att?.status === 'in_progress' ? 'Resume Exam' : 'Start Exam'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {tab === 'results' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#111915]">
              Published Result Cards &amp; Transcripts
            </h2>
            {myResults.length === 0 ? (
              <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 text-sm text-[#4E5B53]">
                No published exam results available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myResults.map((res) => {
                  const ex = exams.find((e) => e.id === res.examId);
                  return (
                    <div
                      key={res.id}
                      className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#B47B2B]">
                            Grade {res.letterGrade} &middot; GPA {res.gpa.toFixed(2)}
                          </p>
                          <h3 className="font-serif text-xl font-bold text-[#111915] mt-0.5">
                            {ex?.title || 'Assessment Result'}
                          </h3>
                        </div>
                        <span className="font-serif text-2xl font-bold text-[#0F3D2E] tabular-nums">
                          {res.percentage}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs tabular-nums bg-[#F8F9F7] p-3 rounded-xl border border-[#DCE2DC]">
                        <div>
                          <p className="text-[#4E5B53]">Obtained</p>
                          <p className="font-bold text-[#111915]">
                            {res.obtainedMarks}/{res.totalMarks}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#4E5B53]">MCQ / Written</p>
                          <p className="font-bold text-[#111915]">
                            {res.mcqMarks} / {res.writtenMarks}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#4E5B53]">Batch Rank</p>
                          <p className="font-bold text-[#0F3D2E]">
                            {res.rankInBatch ? `#${res.rankInBatch}` : 'Published'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedResult(res)}
                        className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
                      >
                        Open Printable PDF Card &amp; Answer Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hallOfFame.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-[#111915]">
                SOFS Hall of Fame Merit Board
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-[#DCE2DC] rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#111915]">{entry.studentName}</p>
                      <p className="text-xs text-[#4E5B53]">
                        {entry.batchName} &middot; Rank #{entry.rankInBatch || 1}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="font-bold text-sm text-[#0F3D2E]">{entry.percentage}%</p>
                      <p className="text-[11px] text-[#B47B2B]">GPA {entry.gpa.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === 'resources' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111915]">
              Study Materials &amp; Resource Library
            </h2>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] bg-white text-sm"
            >
              <option value="All">All Resource Types</option>
              <option value="pdf">PDF Sheets</option>
              <option value="note">Notes</option>
              <option value="video">Video Lectures</option>
              <option value="image">Diagrams &amp; Charts</option>
              <option value="link">External Links</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleResources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-[#DCE2DC] rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B47B2B]">
                    {res.category} &middot; {res.resourceType.toUpperCase()} &middot;{' '}
                    {res.accessLevel.replace('_', ' ')}
                  </p>
                  <h3 className="font-serif text-lg font-bold text-[#111915]">{res.title}</h3>
                  <p className="text-xs text-[#4E5B53] leading-relaxed">{res.description}</p>
                </div>
                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-[#EEF2EE] text-[#0F3D2E] text-xs font-semibold inline-flex items-center gap-1 shrink-0 hover:bg-[#DCE5DD]"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTICES & NOTIFICATIONS TAB */}
      {tab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#111915]">Personal Alerts</h2>
              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => void markNotificationsRead()}
                  className="text-xs font-semibold text-[#0F3D2E] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    n.isRead
                      ? 'bg-white border-[#DCE2DC]'
                      : 'bg-[#EEF2EE] border-[#0F3D2E]/40'
                  }`}
                >
                  <p className="font-semibold text-[#111915]">{n.title}</p>
                  <p className="text-[#4E5B53]">{n.body}</p>
                  <p className="text-[11px] text-[#4E5B53] tabular-nums">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#111915]">
              Institute &amp; Batch Notices
            </h2>
            <div className="space-y-3">
              {notices
                .filter((n) => n.isPublished && (!n.targetBatchId || myBatchIds.has(n.targetBatchId)))
                .map((n) => (
                  <div
                    key={n.id}
                    className="bg-white border border-[#DCE2DC] rounded-xl p-5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#4E5B53]">
                      <span className="font-semibold uppercase text-[#B47B2B]">{n.category}</span>
                      <span className="tabular-nums">
                        {new Date(n.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#111915]">{n.title}</h3>
                    <p className="text-xs text-[#4E5B53] leading-relaxed whitespace-pre-line">
                      {n.body}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT DESK TAB */}
      {tab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={handleCreateTicket}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3.5"
            >
              <h2 className="font-serif text-xl font-bold text-[#111915] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0F3D2E]" />
                <span>Open New Support Ticket</span>
              </h2>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Subject (e.g., Missed Physics Lecture Sheet)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="Academic">Academic Help</option>
                  <option value="Exam">Exam &amp; Result</option>
                  <option value="Batch">Batch / Routine</option>
                  <option value="Technical">Technical Support</option>
                </select>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your academic or portal question..."
                className="w-full p-3.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
              >
                Submit Support Ticket
              </button>
            </form>

            <div className="space-y-2">
              {myTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedTicket?.id === t.id
                      ? 'bg-[#EEF2EE] border-[#0F3D2E]'
                      : 'bg-white border-[#DCE2DC]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#4E5B53]">
                    <span className="uppercase font-semibold text-[#B47B2B]">{t.category}</span>
                    <span className="uppercase font-semibold">{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="font-semibold text-sm text-[#111915] mt-1">{t.subject}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#DCE2DC] rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
            {selectedTicket ? (
              <>
                <div className="space-y-4">
                  <div className="border-b border-[#DCE2DC] pb-3">
                    <p className="text-xs font-semibold uppercase text-[#B47B2B]">
                      {selectedTicket.category} &middot; {selectedTicket.status.replace('_', ' ')}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-[#111915]">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl text-xs space-y-1 ${
                          m.senderRole === 'staff'
                            ? 'bg-[#EEF2EE] border border-[#C8D4CA]'
                            : 'bg-[#F8F9F7] border border-[#DCE2DC]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-[#111915]">
                          <span>
                            {m.senderName}{' '}
                            <span className="text-[#4E5B53] font-normal">
                              ({m.senderRole === 'staff' ? 'SOFS Staff' : 'Student'})
                            </span>
                          </span>
                          <span className="text-[11px] font-normal text-[#4E5B53] tabular-nums">
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[#111915] leading-relaxed">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="pt-4 border-t border-[#DCE2DC] flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a follow-up reply..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-[#4E5B53]">Select or create a support ticket to message staff.</p>
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-[#DCE2DC] rounded-2xl p-6 sm:p-8 max-w-2xl space-y-4"
        >
          <h2 className="font-serif text-2xl font-bold text-[#111915]">Student Academic Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">WhatsApp</label>
              <input
                type="tel"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">School / College</label>
              <input
                type="text"
                value={profileForm.institutionName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, institutionName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Academic Level</label>
              <input
                type="text"
                value={profileForm.academicLevel}
                onChange={(e) => setProfileForm({ ...profileForm, academicLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Group</label>
              <input
                type="text"
                value={profileForm.academicGroup}
                onChange={(e) => setProfileForm({ ...profileForm, academicGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Guardian Name</label>
              <input
                type="text"
                value={profileForm.guardianName}
                onChange={(e) => setProfileForm({ ...profileForm, guardianName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Guardian Phone</label>
              <input
                type="tel"
                value={profileForm.guardianPhone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, guardianPhone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-sm font-semibold"
          >
            Save Student Profile
          </button>
        </form>
      )}

      {/* Printable Result Card Modal */}
      {selectedResult && (
        <ResultCardView
          result={selectedResult}
          exam={exams.find((e) => e.id === selectedResult.examId)}
          attempt={attempts.find((a) => a.id === selectedResult.attemptId)}
          questions={questions}
          student={currentStudent}
          siteSettings={siteSettings}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
};
