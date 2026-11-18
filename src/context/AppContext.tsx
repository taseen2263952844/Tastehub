import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppView,
  AdminRole,
  AdminUser,
  SiteSettings,
  Teacher,
  Course,
  Subject,
  Batch,
  BatchSchedule,
  StudentProfile,
  Enrollment,
  AdmissionApplication,
  AdmissionStatus,
  QuestionCategory,
  Question,
  Exam,
  ExamAttempt,
  ExamResult,
  StudyResource,
  Notice,
  NotificationItem,
  SupportTicket,
  GalleryItem,
  Testimonial,
  MediaAsset,
  AuditLog,
  AuthUser,
} from '../types';
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_ADMIN_USERS,
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_SUBJECTS,
  INITIAL_BATCHES,
  INITIAL_SCHEDULES,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_ADMISSIONS,
  INITIAL_QUESTION_CATEGORIES,
  INITIAL_QUESTIONS,
  INITIAL_EXAMS,
  INITIAL_RESULTS,
  INITIAL_RESOURCES,
  INITIAL_NOTICES,
  INITIAL_GALLERY,
  INITIAL_TESTIMONIALS,
  INITIAL_TICKETS,
  INITIAL_MEDIA_ASSETS,
  INITIAL_AUDIT_LOGS,
} from '../data/sofsSeed';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendPasswordReset,
  signOutUser,
  subscribeToAuthState,
  firebaseAuthStatus,
} from '../services/firebase';
import { sofsApiFetch, subscribeSofsRealtime } from '../services/supabase';

const LOCAL_PREVIEW_STORAGE_KEY = 'sofs_academic_preview_state_v1';

export type AdminModule =
  | 'overview'
  | 'academics'
  | 'admissions'
  | 'exams'
  | 'results'
  | 'resources'
  | 'notices'
  | 'support'
  | 'settings'
  | 'admins';

export const ROLE_MODULE_ACCESS: Record<AdminRole, AdminModule[]> = {
  super_admin: [
    'overview',
    'academics',
    'admissions',
    'exams',
    'results',
    'resources',
    'notices',
    'support',
    'settings',
    'admins',
  ],
  content_manager: ['overview', 'academics', 'notices', 'settings'],
  admission_manager: ['overview', 'admissions', 'academics', 'notices', 'support'],
  exam_manager: ['overview', 'exams', 'academics'],
  results_manager: ['overview', 'results', 'exams'],
  resource_manager: ['overview', 'resources', 'notices', 'support'],
};

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextValue {
  view: AppView;
  setView: (v: AppView) => void;
  activeExamId: string | null;
  openExamWorkspace: (examId: string) => void;
  admissionModalOpen: boolean;
  setAdmissionModalOpen: (open: boolean) => void;
  preselectedCourseTitle: string;
  openAdmissionModal: (courseTitle?: string) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Auth & RBAC
  authUser: AuthUser | null;
  authLoading: boolean;
  adminRole: AdminRole | null;
  isAdmin: boolean;
  hasAdminModuleAccess: (mod: AdminModule) => boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerAccount: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  // Environment / Backend Status
  supabaseConfigured: boolean;
  geminiConfigured: boolean;
  firebaseProjectId?: string;
  syncingBackend: boolean;
  refreshBackendData: () => Promise<void>;

  // Core Data Collections
  siteSettings: SiteSettings;
  adminUsers: AdminUser[];
  teachers: Teacher[];
  courses: Course[];
  subjects: Subject[];
  batches: Batch[];
  schedules: BatchSchedule[];
  students: StudentProfile[];
  currentStudent: StudentProfile | null;
  enrollments: Enrollment[];
  admissions: AdmissionApplication[];
  questionCategories: QuestionCategory[];
  questions: Question[];
  exams: Exam[];
  attempts: ExamAttempt[];
  results: ExamResult[];
  resources: StudyResource[];
  notices: Notice[];
  notifications: NotificationItem[];
  tickets: SupportTicket[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  mediaAssets: MediaAsset[];
  auditLogs: AuditLog[];

  // Actions
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  submitPublicAdmission: (payload: {
    fullName: string;
    phone: string;
    whatsapp?: string;
    academicLevel: string;
    academicGroup: string;
    desiredCourse: string;
    preferredBatch?: string;
    message?: string;
    website?: string;
  }) => Promise<AdmissionApplication>;
  updateStudentProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  startOrResumeExam: (examId: string) => Promise<{ attempt: ExamAttempt; questions: Question[] }>;
  autosaveExamAnswers: (
    attemptId: string,
    autosavedAnswers: Record<string, { selectedOption?: string; writtenText?: string; attachmentUrl?: string }>
  ) => Promise<void>;
  submitExamAttempt: (
    attemptId: string,
    answers: Record<string, { selectedOption?: string; writtenText?: string; attachmentUrl?: string }>,
    autoSubmitted?: boolean
  ) => Promise<{ resultPublished: boolean; result: ExamResult | null }>;
  markNotificationsRead: () => Promise<void>;
  createSupportTicket: (subject: string, category: string, priority: 'low' | 'normal' | 'high', initialMessage: string) => Promise<void>;
  replySupportTicket: (ticketId: string, message: string, asStaff?: boolean) => Promise<void>;
  updateSupportTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  adminUpsert: (entity: string, data: Record<string, any>) => Promise<void>;
  adminDelete: (entity: string, id: string) => Promise<void>;
  uploadMediaAsset: (file: File, bucket: string) => Promise<MediaAsset>;
  extractQuestionsWithGemini: (file: File, subjectHint: string) => Promise<Partial<Question>[]>;
}

const AppContext = createContext<AppContextValue | null>(null);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function loadLocalFallbackState() {
  try {
    const raw = localStorage.getItem(LOCAL_PREVIEW_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted localStorage
  }
  return null;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>('home');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [preselectedCourseTitle, setPreselectedCourseTitle] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);

  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [syncingBackend, setSyncingBackend] = useState(false);

  const cached = useMemo(() => loadLocalFallbackState(), []);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    cached?.siteSettings || INITIAL_SITE_SETTINGS
  );
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(
    cached?.adminUsers || INITIAL_ADMIN_USERS
  );
  const [teachers, setTeachers] = useState<Teacher[]>(cached?.teachers || INITIAL_TEACHERS);
  const [courses, setCourses] = useState<Course[]>(cached?.courses || INITIAL_COURSES);
  const [subjects, setSubjects] = useState<Subject[]>(cached?.subjects || INITIAL_SUBJECTS);
  const [batches, setBatches] = useState<Batch[]>(cached?.batches || INITIAL_BATCHES);
  const [schedules, setSchedules] = useState<BatchSchedule[]>(
    cached?.schedules || INITIAL_SCHEDULES
  );
  const [students, setStudents] = useState<StudentProfile[]>(
    cached?.students || INITIAL_STUDENTS
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>(
    cached?.enrollments || INITIAL_ENROLLMENTS
  );
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(
    cached?.admissions || INITIAL_ADMISSIONS
  );
  const [questionCategories, setQuestionCategories] = useState<QuestionCategory[]>(
    cached?.questionCategories || INITIAL_QUESTION_CATEGORIES
  );
  const [questions, setQuestions] = useState<Question[]>(cached?.questions || INITIAL_QUESTIONS);
  const [exams, setExams] = useState<Exam[]>(cached?.exams || INITIAL_EXAMS);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(cached?.attempts || []);
  const [results, setResults] = useState<ExamResult[]>(cached?.results || INITIAL_RESULTS);
  const [resources, setResources] = useState<StudyResource[]>(
    cached?.resources || INITIAL_RESOURCES
  );
  const [notices, setNotices] = useState<Notice[]>(cached?.notices || INITIAL_NOTICES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    cached?.notifications || [
      {
        id: 'notif-1',
        studentId: 'stu-1',
        title: 'Physics Weekly Mock Exam Window Open',
        body: 'Chapter 1–3 Bilingual MCQ + Written script is open in your Student Portal.',
        linkView: 'portal',
        isRead: false,
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
      },
    ]
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(cached?.tickets || INITIAL_TICKETS);
  const [gallery, setGallery] = useState<GalleryItem[]>(cached?.gallery || INITIAL_GALLERY);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    cached?.testimonials || INITIAL_TESTIMONIALS
  );
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(
    cached?.mediaAssets || INITIAL_MEDIA_ASSETS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(cached?.auditLogs || INITIAL_AUDIT_LOGS);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // Sync live theme colors & SEO document metadata
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sofs-primary', siteSettings.primaryColor || '#0F3D2E');
    root.style.setProperty('--sofs-secondary', siteSettings.secondaryColor || '#2B5E4A');
    root.style.setProperty('--sofs-accent', siteSettings.accentColor || '#B47B2B');
    root.style.setProperty('--sofs-bg', siteSettings.backgroundColor || '#F8F9F7');
    if (siteSettings.seoTitle) {
      document.title = siteSettings.seoTitle;
    }
  }, [siteSettings]);

  // Persist preview fallback locally only when Supabase backend isn't active
  useEffect(() => {
    if (supabaseConfigured) return;
    try {
      localStorage.setItem(
        LOCAL_PREVIEW_STORAGE_KEY,
        JSON.stringify({
          siteSettings,
          adminUsers,
          teachers,
          courses,
          subjects,
          batches,
          schedules,
          students,
          enrollments,
          admissions,
          questionCategories,
          questions,
          exams,
          attempts,
          results,
          resources,
          notices,
          notifications,
          tickets,
          gallery,
          testimonials,
          mediaAssets,
          auditLogs,
        })
      );
    } catch {
      // ignore quota limits
    }
  }, [
    supabaseConfigured,
    siteSettings,
    adminUsers,
    teachers,
    courses,
    subjects,
    batches,
    schedules,
    students,
    enrollments,
    admissions,
    questionCategories,
    questions,
    exams,
    attempts,
    results,
    resources,
    notices,
    notifications,
    tickets,
    gallery,
    testimonials,
    mediaAssets,
    auditLogs,
  ]);

  const currentStudent = useMemo<StudentProfile | null>(() => {
    if (!authUser) return null;
    const match = students.find(
      (s) =>
        s.firebaseUid === authUser.uid ||
        s.email.toLowerCase() === authUser.email.toLowerCase()
    );
    if (match) return match;
    return {
      id: `stu-${authUser.uid.slice(0, 8)}`,
      firebaseUid: authUser.uid,
      studentCode: `SOFS-${new Date().getFullYear().toString().slice(-2)}-NEW`,
      fullName: authUser.displayName,
      email: authUser.email,
      phone: '',
      whatsapp: '',
      academicLevel: 'HSC',
      academicGroup: 'Science',
      institutionName: '',
      guardianName: '',
      guardianPhone: '',
      photoUrl: authUser.photoURL,
      status: 'active',
    };
  }, [authUser, students]);

  const isAdmin = Boolean(adminRole);

  const hasAdminModuleAccess = useCallback(
    (mod: AdminModule) => {
      if (!adminRole) return false;
      return ROLE_MODULE_ACCESS[adminRole]?.includes(mod) || false;
    },
    [adminRole]
  );

  const refreshBackendData = useCallback(async () => {
    setSyncingBackend(true);
    try {
      const health = await sofsApiFetch<{
        supabaseConfigured: boolean;
        geminiConfigured: boolean;
      }>('health');
      setSupabaseConfigured(health.supabaseConfigured);
      setGeminiConfigured(health.geminiConfigured);

      const pub = await sofsApiFetch<any>('public');
      if (pub.supabaseConfigured && !pub.fallback) {
        if (pub.siteSettings) setSiteSettings(pub.siteSettings);
        if (pub.teachers) setTeachers(pub.teachers);
        if (pub.courses) setCourses(pub.courses);
        if (pub.subjects) setSubjects(pub.subjects);
        if (pub.batches) setBatches(pub.batches);
        if (pub.schedules) setSchedules(pub.schedules);
        if (pub.notices) setNotices(pub.notices);
        if (pub.gallery) setGallery(pub.gallery);
        if (pub.testimonials) setTestimonials(pub.testimonials);
        if (pub.publicResources) setResources(pub.publicResources);
      }

      if (authUser) {
        const stuRes = await sofsApiFetch<any>('student/dashboard', { requireAuth: true });
        if (stuRes.adminRole) {
          setAdminRole(stuRes.adminRole);
        } else {
          // Check local fallback admin registry when running without Supabase env
          const localAdm = adminUsers.find(
            (a) => a.email.toLowerCase() === authUser.email.toLowerCase() && a.isActive
          );
          setAdminRole(localAdm ? localAdm.role : null);
        }

        if (stuRes.supabaseConfigured) {
          if (stuRes.studentProfile) {
            setStudents((prev) => {
              const filtered = prev.filter((s) => s.id !== stuRes.studentProfile.id);
              return [stuRes.studentProfile, ...filtered];
            });
          }
          if (stuRes.enrollments) setEnrollments(stuRes.enrollments);
          if (stuRes.exams) setExams(stuRes.exams);
          if (stuRes.questions) setQuestions(stuRes.questions);
          if (stuRes.attempts) setAttempts(stuRes.attempts);
          if (stuRes.results) setResults(stuRes.results);
          if (stuRes.resources) setResources(stuRes.resources);
          if (stuRes.notices) setNotices(stuRes.notices);
          if (stuRes.notifications) setNotifications(stuRes.notifications);
          if (stuRes.tickets) setTickets(stuRes.tickets);
        }

        // If user has an admin role and Supabase is configured, load full admin workspace
        if ((stuRes.adminRole || adminRole) && stuRes.supabaseConfigured) {
          const admRes = await sofsApiFetch<any>('admin/workspace', { requireAuth: true });
          if (admRes.supabaseConfigured) {
            if (admRes.siteSettings) setSiteSettings(admRes.siteSettings);
            if (admRes.adminUsers) setAdminUsers(admRes.adminUsers);
            if (admRes.teachers) setTeachers(admRes.teachers);
            if (admRes.courses) setCourses(admRes.courses);
            if (admRes.subjects) setSubjects(admRes.subjects);
            if (admRes.batches) setBatches(admRes.batches);
            if (admRes.schedules) setSchedules(admRes.schedules);
            if (admRes.students) setStudents(admRes.students);
            if (admRes.enrollments) setEnrollments(admRes.enrollments);
            if (admRes.admissions) setAdmissions(admRes.admissions);
            if (admRes.questionCategories) setQuestionCategories(admRes.questionCategories);
            if (admRes.questions) setQuestions(admRes.questions);
            if (admRes.exams) setExams(admRes.exams);
            if (admRes.attempts) setAttempts(admRes.attempts);
            if (admRes.results) setResults(admRes.results);
            if (admRes.resources) setResources(admRes.resources);
            if (admRes.notices) setNotices(admRes.notices);
            if (admRes.tickets) setTickets(admRes.tickets);
            if (admRes.gallery) setGallery(admRes.gallery);
            if (admRes.testimonials) setTestimonials(admRes.testimonials);
            if (admRes.mediaAssets) setMediaAssets(admRes.mediaAssets);
            if (admRes.auditLogs) setAuditLogs(admRes.auditLogs);
          }
        }
      }
    } catch {
      // Initial load stays resilient with seed state if API unreachable
    } finally {
      setSyncingBackend(false);
    }
  }, [authUser, adminUsers, adminRole]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = subscribeToAuthState((fbUser) => {
      if (fbUser) {
        const mapped: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'SOFS User'),
          photoURL: fbUser.photoURL || undefined,
          emailVerified: fbUser.emailVerified,
        };
        setAuthUser(mapped);
        const matchedAdmin = adminUsers.find(
          (a) => a.email.toLowerCase() === mapped.email.toLowerCase() && a.isActive
        );
        setAdminRole(matchedAdmin ? matchedAdmin.role : null);
      } else {
        setAuthUser(null);
        setAdminRole(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [adminUsers]);

  useEffect(() => {
    void refreshBackendData();
  }, [authUser?.uid]);

  useEffect(() => {
    return subscribeSofsRealtime(() => {
      void refreshBackendData();
    });
  }, [refreshBackendData]);

  const openAdmissionModal = (courseTitle = '') => {
    setPreselectedCourseTitle(courseTitle);
    setAdmissionModalOpen(true);
  };

  const openExamWorkspace = (examId: string) => {
    setActiveExamId(examId);
    setView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
    setAuthModalOpen(false);
    showToast('Signed in successfully with Google.', 'success');
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmail(email, password);
    setAuthModalOpen(false);
    showToast('Welcome back to SOFS Academic Coaching.', 'success');
  };

  const registerAccount = async (name: string, email: string, password: string) => {
    await registerWithEmail(name, email, password);
    setAuthModalOpen(false);
    showToast('Student account created successfully.', 'success');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordReset(email);
    showToast('Password reset link sent to your email address.', 'success');
  };

  const logout = async () => {
    await signOutUser();
    setAdminRole(null);
    if (view === 'admin' || view === 'portal' || view === 'exam') {
      setView('home');
    }
    showToast('You have signed out.', 'info');
  };

  const submitPublicAdmission: AppContextValue['submitPublicAdmission'] = async (payload) => {
    const res = await sofsApiFetch<{ admission: AdmissionApplication; localFallback?: boolean }>(
      'admissions',
      { method: 'POST', body: payload }
    );
    setAdmissions((prev) => [res.admission, ...prev]);
    showToast(
      `Admission request ${res.admission.referenceCode} submitted! Our academic coordinator will contact you shortly.`,
      'success'
    );
    return res.admission;
  };

  const updateStudentProfile = async (updates: Partial<StudentProfile>) => {
    if (!currentStudent) return;
    if (supabaseConfigured) {
      const res = await sofsApiFetch<{ studentProfile: StudentProfile }>('student/profile', {
        method: 'POST',
        body: updates,
        requireAuth: true,
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === res.studentProfile.id ? res.studentProfile : s))
      );
    } else {
      setStudents((prev) => {
        const exists = prev.some((s) => s.id === currentStudent.id);
        const updated = { ...currentStudent, ...updates };
        return exists
          ? prev.map((s) => (s.id === currentStudent.id ? updated : s))
          : [updated, ...prev];
      });
    }
    showToast('Student profile updated.', 'success');
  };

  const startOrResumeExam = async (
    examId: string
  ): Promise<{ attempt: ExamAttempt; questions: Question[] }> => {
    if (supabaseConfigured) {
      const res = await sofsApiFetch<{ attempt: ExamAttempt; questions: Question[] }>(
        'student/exams/start',
        { method: 'POST', body: { examId }, requireAuth: true }
      );
      setAttempts((prev) => [res.attempt, ...prev.filter((a) => a.id !== res.attempt.id)]);
      return res;
    }

    // Fallback preview exam engine when Supabase isn't connected yet
    if (!currentStudent) throw new Error('Please sign in to take an exam.');
    const exam = exams.find((e) => e.id === examId);
    if (!exam) throw new Error('Exam not found.');

    const existing = attempts.find((a) => a.examId === examId && a.studentId === currentStudent.id);
    const examQs = questions
      .filter((q) => exam.questionIds.includes(q.id))
      .map((q) =>
        exam.resultsPublished && exam.allowAnswerReview
          ? q
          : { ...q, correctOption: undefined, explanation: undefined }
      );

    if (existing) {
      return { attempt: existing, questions: examQs };
    }

    const qOrder = exam.randomizeQuestions
      ? [...exam.questionIds].sort(() => Math.random() - 0.5)
      : [...exam.questionIds];
    const optOrders: Record<string, string[]> = {};
    examQs.forEach((q) => {
      const keys = q.options.map((o) => o.key);
      optOrders[q.id] = exam.randomizeOptions ? [...keys].sort(() => Math.random() - 0.5) : keys;
    });

    const newAttempt: ExamAttempt = {
      id: `att-${crypto.randomUUID().slice(0, 8)}`,
      examId,
      studentId: currentStudent.id,
      questionOrder: qOrder,
      optionOrders: optOrders,
      autosavedAnswers: {},
      answers: [],
      startedAt: new Date().toISOString(),
      expiresAt: new Date(
        Math.min(Date.now() + exam.durationMinutes * 60_000, new Date(exam.endsAt).getTime())
      ).toISOString(),
      lastSavedAt: new Date().toISOString(),
      status: 'in_progress',
    };
    setAttempts((prev) => [newAttempt, ...prev]);
    return { attempt: newAttempt, questions: examQs };
  };

  const autosaveExamAnswers: AppContextValue['autosaveExamAnswers'] = async (
    attemptId,
    autosavedAnswers
  ) => {
    if (supabaseConfigured) {
      await sofsApiFetch('student/exams/autosave', {
        method: 'POST',
        body: { attemptId, autosavedAnswers },
        requireAuth: true,
      });
    }
    setAttempts((prev) =>
      prev.map((a) =>
        a.id === attemptId
          ? { ...a, autosavedAnswers, lastSavedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const submitExamAttempt: AppContextValue['submitExamAttempt'] = async (
    attemptId,
    answers,
    autoSubmitted = false
  ) => {
    if (supabaseConfigured) {
      const res = await sofsApiFetch<{ resultPublished: boolean; result: ExamResult | null }>(
        'student/exams/submit',
        { method: 'POST', body: { attemptId, answers, autoSubmitted }, requireAuth: true }
      );
      await refreshBackendData();
      return res;
    }

    const attempt = attempts.find((a) => a.id === attemptId);
    const exam = exams.find((e) => e.id === attempt?.examId);
    if (!attempt || !exam || !currentStudent) {
      throw new Error('Active attempt not found.');
    }

    const examQs = questions.filter((q) => exam.questionIds.includes(q.id));
    let mcqMarks = 0;
    let negativeDeducted = 0;

    const answerRecords = examQs.map((q) => {
      const ans = answers[q.id] || {};
      if (q.questionType === 'mcq') {
        const selected = (ans.selectedOption || '').trim();
        let isCorrect: boolean | null = null;
        let autoMarks = 0;
        if (selected) {
          if (selected === (q.correctOption || '').trim()) {
            isCorrect = true;
            autoMarks = q.marks;
            mcqMarks += q.marks;
          } else {
            isCorrect = false;
            if (exam.negativeMarkingEnabled) {
              autoMarks = -exam.negativeMarkValue;
              negativeDeducted += exam.negativeMarkValue;
            }
          }
        }
        return {
          questionId: q.id,
          selectedOption: selected,
          isCorrect,
          autoMarks,
        };
      }
      return {
        questionId: q.id,
        writtenText: ans.writtenText || '',
        attachmentUrl: ans.attachmentUrl || '',
        isCorrect: null,
        autoMarks: 0,
      };
    });

    const obtained = Math.max(0, Number((mcqMarks - negativeDeducted).toFixed(2)));
    const pct = Math.min(100, Math.round((obtained / Math.max(1, exam.totalMarks)) * 10000) / 100);
    const letterGrade =
      pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-' : pct >= 50 ? 'B' : pct >= 40 ? 'C' : pct >= 33 ? 'D' : 'F';
    const gpa =
      pct >= 80 ? 5.0 : pct >= 70 ? 4.0 : pct >= 60 ? 3.5 : pct >= 50 ? 3.0 : pct >= 40 ? 2.0 : pct >= 33 ? 1.0 : 0.0;

    const submittedAt = new Date().toISOString();
    setAttempts((prev) =>
      prev.map((a) =>
        a.id === attemptId
          ? {
              ...a,
              autosavedAnswers: answers,
              answers: answerRecords,
              submittedAt,
              status: autoSubmitted ? 'auto_submitted' : 'submitted',
            }
          : a
      )
    );

    const newResult: ExamResult = {
      id: `res-${crypto.randomUUID().slice(0, 8)}`,
      examId: exam.id,
      attemptId,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      studentCode: currentStudent.studentCode,
      totalMarks: exam.totalMarks,
      obtainedMarks: obtained,
      mcqMarks,
      writtenMarks: 0,
      negativeDeducted,
      percentage: pct,
      letterGrade,
      gpa,
      isPublished: exam.resultsPublished,
      hallOfFame: false,
      publishedAt: exam.resultsPublished ? submittedAt : undefined,
    };

    setResults((prev) => [newResult, ...prev.filter((r) => r.attemptId !== attemptId)]);
    return { resultPublished: exam.resultsPublished, result: exam.resultsPublished ? newResult : null };
  };

  const markNotificationsRead = async () => {
    if (supabaseConfigured) {
      await sofsApiFetch('student/notifications/read', { method: 'POST', requireAuth: true });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const createSupportTicket: AppContextValue['createSupportTicket'] = async (
    subject,
    category,
    priority,
    initialMessage
  ) => {
    if (!currentStudent) return;
    if (supabaseConfigured) {
      await sofsApiFetch('student/tickets', {
        method: 'POST',
        body: { subject, category, priority, initialMessage },
        requireAuth: true,
      });
      await refreshBackendData();
    } else {
      const now = new Date().toISOString();
      const tId = `tkt-${crypto.randomUUID().slice(0, 8)}`;
      const newTicket: SupportTicket = {
        id: tId,
        studentId: currentStudent.id,
        studentName: currentStudent.fullName,
        subject,
        category,
        priority,
        status: 'open',
        messages: [
          {
            id: `msg-${crypto.randomUUID().slice(0, 8)}`,
            ticketId: tId,
            senderRole: 'student',
            senderName: currentStudent.fullName,
            message: initialMessage,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      setTickets((prev) => [newTicket, ...prev]);
    }
    showToast('Support conversation started.', 'success');
  };

  const replySupportTicket = async (ticketId: string, message: string, asStaff = false) => {
    if (supabaseConfigured) {
      if (asStaff) {
        await sofsApiFetch('admin/mutate', {
          method: 'POST',
          body: { entity: 'support_messages', action: 'upsert', data: { ticketId, message } },
          requireAuth: true,
        });
      } else {
        await sofsApiFetch('student/tickets', {
          method: 'POST',
          body: { ticketId, message },
          requireAuth: true,
        });
      }
      await refreshBackendData();
      return;
    }

    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: asStaff ? 'in_review' : 'open',
              updatedAt: now,
              messages: [
                ...t.messages,
                {
                  id: `msg-${crypto.randomUUID().slice(0, 8)}`,
                  ticketId,
                  senderRole: asStaff ? 'staff' : 'student',
                  senderName: asStaff ? 'SOFS Academic Coordinator' : currentStudent?.fullName || 'Student',
                  message,
                  createdAt: now,
                },
              ],
            }
          : t
      )
    );
  };

  const updateSupportTicketStatus = async (
    ticketId: string,
    status: SupportTicket['status']
  ) => {
    if (supabaseConfigured) {
      await sofsApiFetch('admin/mutate', {
        method: 'POST',
        body: { entity: 'support_tickets', action: 'upsert', data: { id: ticketId, status } },
        requireAuth: true,
      });
      await refreshBackendData();
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
      );
    }
    showToast(`Ticket status updated to ${status.replace('_', ' ')}.`, 'success');
  };

  const adminUpsert = async (entity: string, data: Record<string, any>) => {
    if (supabaseConfigured) {
      await sofsApiFetch('admin/mutate', {
        method: 'POST',
        body: { entity, action: 'upsert', data },
        requireAuth: true,
      });
      await refreshBackendData();
      showToast('Saved changes to database.', 'success');
      return;
    }

    // Local preview mutation fallback
    const id = data.id || `${entity.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`;
    const rec = { ...data, id };
    const upsertById = <T extends { id: string }>(arr: T[]) =>
      arr.some((x) => x.id === id) ? arr.map((x) => (x.id === id ? (rec as T) : x)) : [rec as T, ...arr];

    switch (entity) {
      case 'site_settings':
        setSiteSettings(rec as SiteSettings);
        break;
      case 'teachers':
        setTeachers((p) => upsertById(p));
        break;
      case 'courses':
        setCourses((p) => upsertById(p));
        break;
      case 'subjects':
        setSubjects((p) => upsertById(p));
        break;
      case 'batches':
        setBatches((p) => upsertById(p));
        break;
      case 'batch_schedules':
        setSchedules((p) => upsertById(p));
        break;
      case 'students':
        setStudents((p) => upsertById(p));
        break;
      case 'enrollments':
        setEnrollments((p) => upsertById(p));
        break;
      case 'admissions':
        setAdmissions((p) =>
          p.map((a) =>
            a.id === id
              ? { ...a, status: data.status as AdmissionStatus, staffNotes: data.staffNotes, handledBy: authUser?.email }
              : a
          )
        );
        break;
      case 'question_categories':
        setQuestionCategories((p) => upsertById(p));
        break;
      case 'questions':
        setQuestions((p) => upsertById(p));
        break;
      case 'exams':
        setExams((p) => upsertById(p));
        if (typeof data.resultsPublished === 'boolean') {
          setResults((prev) =>
            prev.map((r) =>
              r.examId === id
                ? {
                    ...r,
                    isPublished: Boolean(data.resultsPublished),
                    publishedAt: data.resultsPublished ? new Date().toISOString() : undefined,
                  }
                : r
            )
          );
        }
        break;
      case 'exam_answers': {
        const { attemptId, questionId, manualMarks, graderFeedback } = data;
        setAttempts((prev) =>
          prev.map((a) => {
            if (a.id !== attemptId) return a;
            const exists = a.answers.some((x) => x.questionId === questionId);
            const updatedAnswers = exists
              ? a.answers.map((x) =>
                  x.questionId === questionId
                    ? { ...x, manualMarks: Number(manualMarks), graderFeedback }
                    : x
                )
              : [
                  ...a.answers,
                  {
                    questionId,
                    autoMarks: 0,
                    manualMarks: Number(manualMarks),
                    graderFeedback,
                  },
                ];
            return { ...a, answers: updatedAnswers, status: 'graded' };
          })
        );
        // Recalculate local result
        setResults((prev) =>
          prev.map((r) => {
            if (r.attemptId !== attemptId) return r;
            const targetAtt = attempts.find((a) => a.id === attemptId);
            let wMarks = Number(manualMarks || 0);
            if (targetAtt) {
              wMarks = targetAtt.answers
                .filter((x) => x.questionId !== questionId)
                .reduce((sum, x) => sum + Number(x.manualMarks || 0), Number(manualMarks || 0));
            }
            const obtained = Math.max(0, Number((r.mcqMarks - r.negativeDeducted + wMarks).toFixed(2)));
            const pct = Math.min(100, Number(((obtained / Math.max(1, r.totalMarks)) * 100).toFixed(2)));
            const letterGrade =
              pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-' : pct >= 50 ? 'B' : pct >= 40 ? 'C' : pct >= 33 ? 'D' : 'F';
            const gpa =
              pct >= 80 ? 5.0 : pct >= 70 ? 4.0 : pct >= 60 ? 3.5 : pct >= 50 ? 3.0 : pct >= 40 ? 2.0 : pct >= 33 ? 1.0 : 0.0;
            return { ...r, writtenMarks: wMarks, obtainedMarks: obtained, percentage: pct, letterGrade, gpa };
          })
        );
        break;
      }
      case 'exam_results':
        setResults((p) => p.map((r) => (r.id === id ? { ...r, ...data } : r)));
        break;
      case 'resources':
        setResources((p) => upsertById(p));
        break;
      case 'notices':
        setNotices((p) => upsertById(p));
        break;
      case 'notifications':
        setNotifications((p) => [
          {
            id,
            studentId: data.studentId,
            title: data.title,
            body: data.body,
            linkView: data.linkView || 'portal',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...p,
        ]);
        break;
      case 'gallery_items':
        setGallery((p) => upsertById(p));
        break;
      case 'testimonials':
        setTestimonials((p) => upsertById(p));
        break;
      case 'admin_users':
        setAdminUsers((p) => upsertById(p));
        break;
    }

    setAuditLogs((prev) => [
      {
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        actorEmail: authUser?.email || 'admin',
        actorRole: adminRole || 'super_admin',
        action: data.id ? 'update' : 'create',
        entityType: entity,
        entityId: id,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    showToast('Record saved successfully.', 'success');
  };

  const adminDelete = async (entity: string, id: string) => {
    if (supabaseConfigured) {
      await sofsApiFetch('admin/mutate', {
        method: 'POST',
        body: { entity, action: 'delete', id },
        requireAuth: true,
      });
      await refreshBackendData();
      showToast('Record permanently deleted.', 'success');
      return;
    }

    const del = <T extends { id: string }>(arr: T[]) => arr.filter((x) => x.id !== id);
    switch (entity) {
      case 'teachers':
        setTeachers(del);
        break;
      case 'courses':
        setCourses(del);
        break;
      case 'subjects':
        setSubjects(del);
        break;
      case 'batches':
        setBatches(del);
        break;
      case 'batch_schedules':
        setSchedules(del);
        break;
      case 'students':
        setStudents(del);
        break;
      case 'enrollments':
        setEnrollments(del);
        break;
      case 'admissions':
        setAdmissions(del);
        break;
      case 'question_categories':
        setQuestionCategories(del);
        break;
      case 'questions':
        setQuestions(del);
        break;
      case 'exams':
        setExams(del);
        break;
      case 'resources':
        setResources(del);
        break;
      case 'notices':
        setNotices(del);
        break;
      case 'gallery_items':
        setGallery(del);
        break;
      case 'testimonials':
        setTestimonials(del);
        break;
      case 'media_assets':
        setMediaAssets(del);
        break;
      case 'admin_users':
        setAdminUsers(del);
        break;
    }
    showToast('Record permanently deleted.', 'success');
  };

  const uploadMediaAsset = async (file: File, bucket: string): Promise<MediaAsset> => {
    const base64Data = await fileToBase64(file);
    if (supabaseConfigured) {
      const res = await sofsApiFetch<{ publicUrl: string; storagePath: string; asset: MediaAsset }>(
        'storage/upload',
        {
          method: 'POST',
          body: {
            bucket,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
          },
          requireAuth: true,
        }
      );
      if (res.asset) {
        setMediaAssets((prev) => [res.asset, ...prev]);
      }
      showToast(`Uploaded ${file.name} to Supabase Storage (${bucket}).`, 'success');
      return (
        res.asset || {
          id: crypto.randomUUID(),
          fileName: file.name,
          bucket,
          storagePath: res.storagePath,
          publicUrl: res.publicUrl,
          mimeType: file.type,
          sizeBytes: file.size,
          createdAt: new Date().toISOString(),
        }
      );
    }

    // Preview data URL fallback when Supabase Storage env is not yet attached
    const asset: MediaAsset = {
      id: `med-${crypto.randomUUID().slice(0, 8)}`,
      fileName: file.name,
      bucket,
      publicUrl: base64Data,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: authUser?.email,
      createdAt: new Date().toISOString(),
    };
    setMediaAssets((prev) => [asset, ...prev]);
    showToast(`Attached ${file.name} (connect Supabase Storage env vars for cloud CDN hosting).`, 'info');
    return asset;
  };

  const extractQuestionsWithGemini = async (
    file: File,
    subjectHint: string
  ): Promise<Partial<Question>[]> => {
    const base64Data = await fileToBase64(file);
    const res = await sofsApiFetch<{ questions: Partial<Question>[] }>('ocr/extract', {
      method: 'POST',
      body: {
        base64Data,
        mimeType: file.type || 'image/jpeg',
        subjectHint,
      },
      requireAuth: true,
    });
    return res.questions || [];
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        activeExamId,
        openExamWorkspace,
        admissionModalOpen,
        setAdmissionModalOpen,
        preselectedCourseTitle,
        openAdmissionModal,
        authModalOpen,
        setAuthModalOpen,
        authUser,
        authLoading,
        adminRole,
        isAdmin,
        hasAdminModuleAccess,
        loginWithGoogle,
        loginWithEmail,
        registerAccount,
        resetPassword,
        logout,
        supabaseConfigured,
        geminiConfigured,
        firebaseProjectId: firebaseAuthStatus.projectId,
        syncingBackend,
        refreshBackendData,
        siteSettings,
        adminUsers,
        teachers,
        courses,
        subjects,
        batches,
        schedules,
        students,
        currentStudent,
        enrollments,
        admissions,
        questionCategories,
        questions,
        exams,
        attempts,
        results,
        resources,
        notices,
        notifications,
        tickets,
        gallery,
        testimonials,
        mediaAssets,
        auditLogs,
        showToast,
        submitPublicAdmission,
        updateStudentProfile,
        startOrResumeExam,
        autosaveExamAnswers,
        submitExamAttempt,
        markNotificationsRead,
        createSupportTicket,
        replySupportTicket,
        updateSupportTicketStatus,
        adminUpsert,
        adminDelete,
        uploadMediaAsset,
        extractQuestionsWithGemini,
      }}
    >
      {children}

      {/* Global Toast Feed */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-xs font-medium shadow-lg border backdrop-blur-xs transition-all ${
              t.type === 'success'
                ? 'bg-[#0F3D2E] text-white border-[#2B5E4A]'
                : t.type === 'error'
                ? 'bg-red-800 text-white border-red-900'
                : 'bg-white text-[#111915] border-[#DCE2DC]'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
