export type AppView =
  | 'home'
  | 'about'
  | 'courses'
  | 'teachers'
  | 'batches'
  | 'gallery'
  | 'notices'
  | 'contact'
  | 'admission'
  | 'portal'
  | 'exam'
  | 'admin';

export type AdminRole =
  | 'super_admin'
  | 'content_manager'
  | 'admission_manager'
  | 'exam_manager'
  | 'results_manager'
  | 'resource_manager';

export interface AdminUser {
  id: string;
  firebaseUid?: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface SiteSettings {
  id: string;
  instituteName: string;
  shortName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  aboutTitle: string;
  aboutBody: string;
  aboutImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  announcementEnabled: boolean;
  announcementText: string;
  contactPhone: string;
  whatsappNumber: string;
  contactEmail: string;
  campusAddress: string;
  officeHours: string;
  seoTitle: string;
  seoDescription: string;
  socialLinks: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  department: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  photoUrl: string;
  email?: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  academicLevel: string;
  academicGroup: string;
  summary: string;
  description: string;
  durationLabel: string;
  feeBdt: number;
  feeLabel: string;
  syllabusHighlights: string[];
  coverImageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}

export interface Subject {
  id: string;
  courseId: string;
  name: string;
  code: string;
  academicLevel: string;
  teacherId?: string;
  description: string;
  isPublished: boolean;
}

export interface Batch {
  id: string;
  courseId: string;
  name: string;
  code: string;
  academicLevel: string;
  academicGroup: string;
  leadTeacherId?: string;
  scheduleSummary: string;
  roomOrMode: string;
  seatCapacity: number;
  enrolledCount: number;
  startDate: string;
  status: 'open' | 'ongoing' | 'full' | 'archived';
  isPublished: boolean;
}

export interface BatchSchedule {
  id: string;
  batchId: string;
  subjectId?: string;
  teacherId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomLabel: string;
  topicNote: string;
}

export interface StudentProfile {
  id: string;
  firebaseUid: string;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  academicLevel: string;
  academicGroup: string;
  institutionName: string;
  guardianName: string;
  guardianPhone: string;
  photoUrl?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId?: string;
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
}

export type AdmissionStatus = 'new' | 'contacted' | 'counseling' | 'admitted' | 'archived';

export interface AdmissionApplication {
  id: string;
  referenceCode: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  academicLevel: string;
  academicGroup: string;
  desiredCourse: string;
  preferredBatch?: string;
  message?: string;
  status: AdmissionStatus;
  staffNotes?: string;
  handledBy?: string;
  createdAt: string;
}

export interface QuestionCategory {
  id: string;
  name: string;
  subjectName: string;
  academicLevel: string;
  description?: string;
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
  equation?: string;
}

export interface Question {
  id: string;
  categoryId?: string;
  subjectId?: string;
  questionType: 'mcq' | 'written';
  language: 'en' | 'bn' | 'bilingual';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  equationLatex?: string;
  diagramSvg?: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctOption?: string; // Stripped by server for active student exams
  explanation?: string;
  marks: number;
  tags: string[];
  createdBy?: string;
  createdAt?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId?: string;
  subjectId?: string;
  description: string;
  instructions: string;
  examType: 'mcq' | 'written' | 'mixed';
  targetBatchIds: string[];
  targetStudentIds: string[];
  questionIds: string[];
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarkValue: number;
  gradingScale: 'gpa_5' | 'percentage';
  isPublished: boolean;
  resultsPublished: boolean;
  allowAnswerReview: boolean;
  createdAt?: string;
}

export interface ExamAnswerRecord {
  questionId: string;
  selectedOption?: string;
  writtenText?: string;
  attachmentUrl?: string;
  isCorrect?: boolean | null;
  autoMarks: number;
  manualMarks?: number | null;
  graderFeedback?: string;
  gradedBy?: string;
}

export type ExamSubmissionReason = 'normal' | 'fullscreen_violation' | 'time_expired';

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  questionOrder: string[];
  optionOrders: Record<string, string[]>;
  autosavedAnswers: Record<string, { selectedOption?: string; writtenText?: string; attachmentUrl?: string }>;
  answers: ExamAnswerRecord[];
  startedAt: string;
  expiresAt: string;
  lastSavedAt: string;
  submittedAt?: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded';
  submissionReason?: ExamSubmissionReason;
  violationReason?: string;
  violationTimestamp?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  attemptId: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  batchId?: string;
  batchName?: string;
  totalMarks: number;
  obtainedMarks: number;
  mcqMarks: number;
  writtenMarks: number;
  negativeDeducted: number;
  percentage: number;
  letterGrade: string;
  gpa: number;
  rankInBatch?: number;
  rankOverall?: number;
  isPublished: boolean;
  hallOfFame: boolean;
  remarks?: string;
  publishedAt?: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  resourceType: 'pdf' | 'note' | 'image' | 'video' | 'link';
  category: string;
  courseId?: string;
  subjectId?: string;
  batchId?: string;
  accessLevel: 'public' | 'enrolled' | 'batch_specific';
  fileUrl: string;
  storagePath?: string;
  fileSizeBytes?: number;
  isPublished: boolean;
  uploadedBy?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: 'General' | 'Exam' | 'Schedule' | 'Admission' | 'Result' | string;
  targetBatchId?: string;
  attachmentUrl?: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
}

export interface NotificationItem {
  id: string;
  studentId: string;
  title: string;
  body: string;
  linkView: AppView;
  isRead: boolean;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderRole: 'student' | 'staff';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  studentId: string;
  studentName?: string;
  subject: string;
  category: 'Academic' | 'Exam' | 'Batch' | 'Technical' | string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  caption: string;
  imageUrl: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface Testimonial {
  id: string;
  studentName: string;
  achievement: string;
  cohort: string;
  quote: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  bucket: string;
  storagePath?: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}
