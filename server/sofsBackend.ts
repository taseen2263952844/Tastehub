import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

export interface SofsBackendEnv {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_API_KEY?: string;
  FIREBASE_WEB_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  [key: string]: string | undefined;
}

// Public Firebase Web API key from firebase-applet-config.json (client config; not a secret)
const FALLBACK_FIREBASE_WEB_API_KEY = 'AIzaSyA3Gj_VVly7_6DToQlXkLofmN_bKH8SDk4';
const SUPER_ADMIN_BOOTSTRAP_EMAIL = 'bdtaseengaming@gmail.com';

const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type AdminRole =
  | 'super_admin'
  | 'content_manager'
  | 'admission_manager'
  | 'exam_manager'
  | 'results_manager'
  | 'resource_manager';

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoUrl: string;
}

interface VerifiedAdmin {
  user: VerifiedFirebaseUser;
  role: AdminRole;
  fullName: string;
}

// Sliding window in-memory rate limit for public admissions (per worker isolate)
const admissionRateLimiter = new Map<string, number[]>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function errorResponse(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return jsonResponse({ ok: false, status, message, ...(extra || {}) }, status);
}

function getEnvValue(env: SofsBackendEnv, ...keys: string[]): string {
  for (const key of keys) {
    const val = env[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return '';
}

function createServiceSupabase(env: SofsBackendEnv): SupabaseClient | null {
  const url = getEnvValue(env, 'SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceKey = getEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function verifyFirebaseIdToken(
  req: Request,
  env: SofsBackendEnv
): Promise<VerifiedFirebaseUser | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;

  const idToken = match[1].trim();
  const apiKey =
    getEnvValue(env, 'FIREBASE_WEB_API_KEY', 'VITE_FIREBASE_API_KEY') ||
    FALLBACK_FIREBASE_WEB_API_KEY;

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!lookupRes.ok) return null;
    const data = (await lookupRes.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        photoUrl?: string;
      }>;
    };

    const account = data.users?.[0];
    if (!account?.localId || !account.email) return null;

    return {
      uid: account.localId,
      email: account.email.toLowerCase(),
      emailVerified: Boolean(account.emailVerified),
      displayName: account.displayName || account.email.split('@')[0],
      photoUrl: account.photoUrl || '',
    };
  } catch {
    return null;
  }
}

async function resolveAdminRole(
  user: VerifiedFirebaseUser,
  supabase: SupabaseClient | null
): Promise<VerifiedAdmin | null> {
  if (supabase) {
    const { data: byUid } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, firebase_uid')
      .eq('firebase_uid', user.uid)
      .maybeSingle();

    if (byUid) {
      if (!byUid.is_active) return null;
      return {
        user,
        role: byUid.role as AdminRole,
        fullName: byUid.full_name || user.displayName,
      };
    }

    const { data: byEmail } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, firebase_uid')
      .ilike('email', user.email)
      .maybeSingle();

    if (byEmail) {
      if (!byEmail.is_active) return null;
      if (!byEmail.firebase_uid && user.emailVerified) {
        await supabase
          .from('admin_users')
          .update({ firebase_uid: user.uid })
          .eq('id', byEmail.id);
      }
      return {
        user,
        role: byEmail.role as AdminRole,
        fullName: byEmail.full_name || user.displayName,
      };
    }

    if (user.email === SUPER_ADMIN_BOOTSTRAP_EMAIL && user.emailVerified) {
      await supabase.from('admin_users').upsert(
        {
          firebase_uid: user.uid,
          email: user.email,
          full_name: user.displayName || 'SOFS Principal Director',
          role: 'super_admin',
          is_active: true,
          created_by: 'system_bootstrap',
        },
        { onConflict: 'email' }
      );
      return {
        user,
        role: 'super_admin',
        fullName: user.displayName || 'SOFS Principal Director',
      };
    }
    return null;
  }

  // Fallback when Supabase env is not yet attached in preview sandbox
  if (user.email === SUPER_ADMIN_BOOTSTRAP_EMAIL && user.emailVerified) {
    return {
      user,
      role: 'super_admin',
      fullName: user.displayName || 'SOFS Principal Director',
    };
  }
  return null;
}

const ENTITY_ALLOWED_ROLES: Record<string, AdminRole[]> = {
  site_settings: ['super_admin', 'content_manager'],
  teachers: ['super_admin', 'content_manager'],
  courses: ['super_admin', 'content_manager'],
  subjects: ['super_admin', 'content_manager', 'exam_manager'],
  batches: ['super_admin', 'content_manager', 'admission_manager'],
  batch_schedules: ['super_admin', 'content_manager', 'admission_manager'],
  gallery_items: ['super_admin', 'content_manager'],
  testimonials: ['super_admin', 'content_manager'],
  media_assets: ['super_admin', 'content_manager', 'resource_manager', 'exam_manager'],
  admissions: ['super_admin', 'admission_manager'],
  students: ['super_admin', 'admission_manager'],
  enrollments: ['super_admin', 'admission_manager'],
  question_categories: ['super_admin', 'exam_manager'],
  questions: ['super_admin', 'exam_manager'],
  exams: ['super_admin', 'exam_manager', 'results_manager'],
  exam_answers: ['super_admin', 'exam_manager', 'results_manager'],
  exam_results: ['super_admin', 'results_manager'],
  resources: ['super_admin', 'resource_manager'],
  notices: ['super_admin', 'content_manager', 'admission_manager', 'resource_manager'],
  notifications: ['super_admin', 'admission_manager', 'exam_manager', 'results_manager', 'resource_manager'],
  support_tickets: ['super_admin', 'admission_manager', 'resource_manager'],
  support_messages: ['super_admin', 'admission_manager', 'resource_manager'],
  admin_users: ['super_admin'],
};

function canRoleManageEntity(role: AdminRole, entity: string): boolean {
  if (role === 'super_admin') return true;
  const allowed = ENTITY_ALLOWED_ROLES[entity];
  return Boolean(allowed && allowed.includes(role));
}

async function logAudit(
  supabase: SupabaseClient,
  admin: VerifiedAdmin,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      actor_email: admin.user.email,
      actor_role: admin.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch {
    // Audit logging should not abort valid administrative action if log table write warns
  }
}

function computeLetterGradeAndGpa(percentage: number): { letterGrade: string; gpa: number } {
  if (percentage >= 80) return { letterGrade: 'A+', gpa: 5.0 };
  if (percentage >= 70) return { letterGrade: 'A', gpa: 4.0 };
  if (percentage >= 60) return { letterGrade: 'A-', gpa: 3.5 };
  if (percentage >= 50) return { letterGrade: 'B', gpa: 3.0 };
  if (percentage >= 40) return { letterGrade: 'C', gpa: 2.0 };
  if (percentage >= 33) return { letterGrade: 'D', gpa: 1.0 };
  return { letterGrade: 'F', gpa: 0.0 };
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Mappers between snake_case SQL and camelCase TypeScript interfaces
function mapSiteSettings(row: Record<string, any>) {
  return {
    id: row.id || 'main',
    instituteName: row.institute_name,
    shortName: row.short_name,
    tagline: row.tagline,
    heroHeadline: row.hero_headline,
    heroSubheadline: row.hero_subheadline,
    heroImageUrl: row.hero_image_url,
    aboutTitle: row.about_title,
    aboutBody: row.about_body,
    aboutImageUrl: row.about_image_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    backgroundColor: row.background_color,
    announcementEnabled: row.announcement_enabled,
    announcementText: row.announcement_text,
    contactPhone: row.contact_phone,
    whatsappNumber: row.whatsapp_number,
    contactEmail: row.contact_email,
    campusAddress: row.campus_address,
    officeHours: row.office_hours,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    socialLinks: row.social_links || {},
    updatedAt: row.updated_at,
  };
}

function mapTeacher(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    department: row.department,
    qualifications: row.qualifications || '',
    experienceYears: Number(row.experience_years || 0),
    bio: row.bio || '',
    photoUrl: row.photo_url || '',
    email: row.email || '',
    isPublished: Boolean(row.is_published),
    displayOrder: Number(row.display_order || 0),
  };
}

function mapCourse(row: Record<string, any>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    academicLevel: row.academic_level,
    academicGroup: row.academic_group,
    summary: row.summary || '',
    description: row.description || '',
    durationLabel: row.duration_label || '',
    feeBdt: Number(row.fee_bdt || 0),
    feeLabel: row.fee_label || '',
    syllabusHighlights: Array.isArray(row.syllabus_highlights) ? row.syllabus_highlights : [],
    coverImageUrl: row.cover_image_url || '',
    isFeatured: Boolean(row.is_featured),
    isPublished: Boolean(row.is_published),
    displayOrder: Number(row.display_order || 0),
  };
}

function mapSubject(row: Record<string, any>) {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    code: row.code || '',
    academicLevel: row.academic_level || 'HSC',
    teacherId: row.teacher_id || undefined,
    description: row.description || '',
    isPublished: Boolean(row.is_published),
  };
}

function mapBatch(row: Record<string, any>) {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    code: row.code,
    academicLevel: row.academic_level,
    academicGroup: row.academic_group,
    leadTeacherId: row.lead_teacher_id || undefined,
    scheduleSummary: row.schedule_summary || '',
    roomOrMode: row.room_or_mode || '',
    seatCapacity: Number(row.seat_capacity || 40),
    enrolledCount: Number(row.enrolled_count || 0),
    startDate: row.start_date || '',
    status: row.status || 'open',
    isPublished: Boolean(row.is_published),
  };
}

function mapSchedule(row: Record<string, any>) {
  return {
    id: row.id,
    batchId: row.batch_id,
    subjectId: row.subject_id || undefined,
    teacherId: row.teacher_id || undefined,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    roomLabel: row.room_label || '',
    topicNote: row.topic_note || '',
  };
}

function mapQuestion(row: Record<string, any>, includeAnswers: boolean) {
  return {
    id: row.id,
    categoryId: row.category_id || undefined,
    subjectId: row.subject_id || undefined,
    questionType: row.question_type,
    language: row.language || 'en',
    difficulty: row.difficulty || 'medium',
    questionText: row.question_text,
    equationLatex: row.equation_latex || '',
    diagramSvg: row.diagram_svg || '',
    imageUrl: row.image_url || '',
    options: Array.isArray(row.options) ? row.options : [],
    ...(includeAnswers
      ? {
          correctOption: row.correct_option || '',
          explanation: row.explanation || '',
        }
      : {}),
    marks: Number(row.marks || 1),
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

function mapExam(row: Record<string, any>, questionIds: string[]) {
  return {
    id: row.id,
    title: row.title,
    courseId: row.course_id || undefined,
    subjectId: row.subject_id || undefined,
    description: row.description || '',
    instructions: row.instructions || '',
    examType: row.exam_type || 'mixed',
    targetBatchIds: Array.isArray(row.target_batch_ids) ? row.target_batch_ids : [],
    targetStudentIds: Array.isArray(row.target_student_ids) ? row.target_student_ids : [],
    questionIds,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: Number(row.duration_minutes || 30),
    totalMarks: Number(row.total_marks || 0),
    passMarks: Number(row.pass_marks || 0),
    randomizeQuestions: Boolean(row.randomize_questions),
    randomizeOptions: Boolean(row.randomize_options),
    negativeMarkingEnabled: Boolean(row.negative_marking_enabled),
    negativeMarkValue: Number(row.negative_mark_value || 0),
    gradingScale: row.grading_scale || 'gpa_5',
    isPublished: Boolean(row.is_published),
    resultsPublished: Boolean(row.results_published),
    allowAnswerReview: Boolean(row.allow_answer_review),
    createdAt: row.created_at,
  };
}

function mapResource(row: Record<string, any>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    resourceType: row.resource_type,
    category: row.category || 'Lecture Sheet',
    courseId: row.course_id || undefined,
    subjectId: row.subject_id || undefined,
    batchId: row.batch_id || undefined,
    accessLevel: row.access_level || 'enrolled',
    fileUrl: row.file_url,
    storagePath: row.storage_path || '',
    fileSizeBytes: Number(row.file_size_bytes || 0),
    isPublished: Boolean(row.is_published),
    uploadedBy: row.uploaded_by || undefined,
    createdAt: row.created_at,
  };
}

function mapNotice(row: Record<string, any>) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category || 'General',
    targetBatchId: row.target_batch_id || undefined,
    attachmentUrl: row.attachment_url || '',
    isPinned: Boolean(row.is_pinned),
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at,
  };
}

function mapStudent(row: Record<string, any>) {
  return {
    id: row.id,
    firebaseUid: row.firebase_uid,
    studentCode: row.student_code,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    academicLevel: row.academic_level || 'HSC',
    academicGroup: row.academic_group || 'Science',
    institutionName: row.institution_name || '',
    guardianName: row.guardian_name || '',
    guardianPhone: row.guardian_phone || '',
    photoUrl: row.photo_url || '',
    status: row.status || 'active',
    createdAt: row.created_at,
  };
}

function mapResult(row: Record<string, any>, studentMap?: Map<string, any>, batchMap?: Map<string, any>) {
  const st = studentMap?.get(row.student_id);
  const bt = row.batch_id ? batchMap?.get(row.batch_id) : undefined;
  return {
    id: row.id,
    examId: row.exam_id,
    attemptId: row.attempt_id,
    studentId: row.student_id,
    studentName: st?.full_name || row.student_name,
    studentCode: st?.student_code || row.student_code,
    batchId: row.batch_id || undefined,
    batchName: bt?.name || row.batch_name,
    totalMarks: Number(row.total_marks || 0),
    obtainedMarks: Number(row.obtained_marks || 0),
    mcqMarks: Number(row.mcq_marks || 0),
    writtenMarks: Number(row.written_marks || 0),
    negativeDeducted: Number(row.negative_deducted || 0),
    percentage: Number(row.percentage || 0),
    letterGrade: row.letter_grade || 'F',
    gpa: Number(row.gpa || 0),
    rankInBatch: row.rank_in_batch ?? undefined,
    rankOverall: row.rank_overall ?? undefined,
    isPublished: Boolean(row.is_published),
    hallOfFame: Boolean(row.hall_of_fame),
    remarks: row.remarks || '',
    publishedAt: row.published_at || undefined,
  };
}

async function handlePublicBootstrap(env: SofsBackendEnv): Promise<Response> {
  const supabase = createServiceSupabase(env);
  if (!supabase) {
    return jsonResponse({
      ok: true,
      supabaseConfigured: false,
      fallback: true,
    });
  }

  const [
    settingsRes,
    teachersRes,
    coursesRes,
    subjectsRes,
    batchesRes,
    schedulesRes,
    noticesRes,
    galleryRes,
    testimonialsRes,
    resourcesRes,
    hallRes,
  ] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('teachers').select('*').eq('is_published', true).order('display_order'),
    supabase.from('courses').select('*').eq('is_published', true).order('display_order'),
    supabase.from('subjects').select('*').eq('is_published', true),
    supabase.from('batches').select('*').eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('batch_schedules').select('*'),
    supabase.from('notices').select('*').eq('is_published', true).is('target_batch_id', null).order('is_pinned', { ascending: false }).order('published_at', { ascending: false }),
    supabase.from('gallery_items').select('*').eq('is_published', true).order('display_order'),
    supabase.from('testimonials').select('*').eq('is_published', true).order('display_order'),
    supabase.from('resources').select('*').eq('is_published', true).eq('access_level', 'public').order('created_at', { ascending: false }),
    supabase.from('exam_results').select('*').eq('is_published', true).eq('hall_of_fame', true).order('percentage', { ascending: false }).limit(12),
  ]);

  // Lookup minimal student names/batches for hall of fame only
  const hallRows = hallRes.data || [];
  let studentMap = new Map<string, any>();
  let batchMap = new Map<string, any>();
  if (hallRows.length > 0) {
    const sIds = Array.from(new Set(hallRows.map((r) => r.student_id)));
    const bIds = Array.from(new Set(hallRows.map((r) => r.batch_id).filter(Boolean)));
    const [stRes, btRes] = await Promise.all([
      sIds.length ? supabase.from('students').select('id, full_name, student_code').in('id', sIds) : Promise.resolve({ data: [] }),
      bIds.length ? supabase.from('batches').select('id, name').in('id', bIds) : Promise.resolve({ data: [] }),
    ]);
    (stRes.data || []).forEach((s: any) => studentMap.set(s.id, s));
    (btRes.data || []).forEach((b: any) => batchMap.set(b.id, b));
  }

  return jsonResponse({
    ok: true,
    supabaseConfigured: true,
    fallback: false,
    siteSettings: settingsRes.data ? mapSiteSettings(settingsRes.data) : null,
    teachers: (teachersRes.data || []).map(mapTeacher),
    courses: (coursesRes.data || []).map(mapCourse),
    subjects: (subjectsRes.data || []).map(mapSubject),
    batches: (batchesRes.data || []).map(mapBatch),
    schedules: (schedulesRes.data || []).map(mapSchedule),
    notices: (noticesRes.data || []).map(mapNotice),
    gallery: (galleryRes.data || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      caption: g.caption || '',
      imageUrl: g.image_url,
      isPublished: Boolean(g.is_published),
      displayOrder: Number(g.display_order || 0),
    })),
    testimonials: (testimonialsRes.data || []).map((t: any) => ({
      id: t.id,
      studentName: t.student_name,
      achievement: t.achievement,
      cohort: t.cohort || '',
      quote: t.quote,
      isPublished: Boolean(t.is_published),
      displayOrder: Number(t.display_order || 0),
    })),
    publicResources: (resourcesRes.data || []).map(mapResource),
    hallOfFame: hallRows.map((r) => mapResult(r, studentMap, batchMap)),
  });
}

async function handlePublicAdmissionSubmit(req: Request, env: SofsBackendEnv): Promise<Response> {
  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local';

  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = (admissionRateLimiter.get(clientIp) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= 6) {
    return errorResponse('Too many admission submissions received from this device. Please wait a few minutes.', 429);
  }
  timestamps.push(now);
  admissionRateLimiter.set(clientIp, timestamps);

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return errorResponse('Invalid JSON submission payload.', 400);
  }

  // Honeypot anti-spam field check
  if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
    return errorResponse('Automated spam submission rejected.', 400);
  }

  const fullName = String(payload.fullName || '').trim();
  const phone = String(payload.phone || '').trim();
  const whatsapp = String(payload.whatsapp || '').trim();
  const academicLevel = String(payload.academicLevel || '').trim();
  const academicGroup = String(payload.academicGroup || 'Science').trim();
  const desiredCourse = String(payload.desiredCourse || '').trim();
  const preferredBatch = String(payload.preferredBatch || '').trim();
  const message = String(payload.message || '').trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return errorResponse('Full Name must be between 2 and 120 characters.', 400);
  }
  if (!/^[+0-9\s-]{8,24}$/.test(phone)) {
    return errorResponse('Please provide a valid mobile phone number.', 400);
  }
  if (!academicLevel || !desiredCourse) {
    return errorResponse('Class / Academic Level and Desired Course are required.', 400);
  }
  if (message.length > 1500) {
    return errorResponse('Message is too long (maximum 1500 characters).', 400);
  }

  const referenceCode = `SOFS-ADM-${Math.floor(100000 + Math.random() * 900000)}`;
  const supabase = createServiceSupabase(env);

  if (!supabase) {
    return jsonResponse({
      ok: true,
      localFallback: true,
      admission: {
        id: crypto.randomUUID(),
        referenceCode,
        fullName,
        phone,
        whatsapp,
        academicLevel,
        academicGroup,
        desiredCourse,
        preferredBatch,
        message,
        status: 'new',
        createdAt: new Date().toISOString(),
      },
    });
  }

  const { data, error } = await supabase
    .from('admissions')
    .insert({
      reference_code: referenceCode,
      full_name: fullName,
      phone,
      whatsapp,
      academic_level: academicLevel,
      academic_group: academicGroup,
      desired_course: desiredCourse,
      preferred_batch: preferredBatch,
      message,
      status: 'new',
    })
    .select('*')
    .single();

  if (error) {
    return errorResponse(`Database insert failed: ${error.message}`, 500);
  }

  return jsonResponse({
    ok: true,
    localFallback: false,
    admission: {
      id: data.id,
      referenceCode: data.reference_code,
      fullName: data.full_name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      academicLevel: data.academic_level,
      academicGroup: data.academic_group,
      desiredCourse: data.desired_course,
      preferredBatch: data.preferred_batch,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
    },
  });
}

async function ensureStudentRecord(
  supabase: SupabaseClient,
  user: VerifiedFirebaseUser
) {
  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (existing) return existing;

  const studentCode = `SOFS-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: inserted, error } = await supabase
    .from('students')
    .insert({
      firebase_uid: user.uid,
      student_code: studentCode,
      full_name: user.displayName,
      email: user.email,
      photo_url: user.photoUrl,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}

async function handleStudentDashboard(req: Request, env: SofsBackendEnv): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required. Please sign in.', 401);

  const supabase = createServiceSupabase(env);
  if (!supabase) {
    // Still return verified session role metadata for fallback preview
    const fallbackAdmin = await resolveAdminRole(user, null);
    return jsonResponse({
      ok: true,
      supabaseConfigured: false,
      adminRole: fallbackAdmin?.role || null,
    });
  }

  const [adminMeta, studentRow] = await Promise.all([
    resolveAdminRole(user, supabase),
    ensureStudentRecord(supabase, user),
  ]);

  const [enrollmentsRes, examsRes, attemptsRes, resultsRes, resourcesRes, noticesRes, notifRes, ticketsRes] =
    await Promise.all([
      supabase.from('enrollments').select('*').eq('student_id', studentRow.id),
      supabase.from('exams').select('*').eq('is_published', true).order('starts_at', { ascending: false }),
      supabase.from('exam_attempts').select('*').eq('student_id', studentRow.id),
      supabase.from('exam_results').select('*').eq('student_id', studentRow.id).eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('resources').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').eq('is_published', true).order('is_pinned', { ascending: false }).order('published_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('student_id', studentRow.id).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('student_id', studentRow.id).order('updated_at', { ascending: false }),
    ]);

  const enrollments = enrollmentsRes.data || [];
  const activeCourseIds = new Set(enrollments.filter((e: any) => e.status === 'active').map((e: any) => e.course_id));
  const activeBatchIds = new Set(enrollments.filter((e: any) => e.status === 'active' && e.batch_id).map((e: any) => e.batch_id));

  // Filter exams targeted to student or their batches or open (both target arrays empty)
  const eligibleExamsRaw = (examsRes.data || []).filter((ex: any) => {
    const batchTargets: string[] = Array.isArray(ex.target_batch_ids) ? ex.target_batch_ids : [];
    const studentTargets: string[] = Array.isArray(ex.target_student_ids) ? ex.target_student_ids : [];
    if (batchTargets.length === 0 && studentTargets.length === 0) return true;
    if (studentTargets.includes(studentRow.id)) return true;
    return batchTargets.some((bId) => activeBatchIds.has(bId));
  });

  // Load exam_questions mapping and questions ONLY for eligible exams; STRIP correct_option unless results_published && allow_answer_review!
  const eligibleExamIds = eligibleExamsRaw.map((e: any) => e.id);
  const examQuestionsMap = new Map<string, string[]>();
  const allQuestionIds = new Set<string>();
  const reviewableQuestionIds = new Set<string>();

  if (eligibleExamIds.length > 0) {
    const { data: eqRows } = await supabase
      .from('exam_questions')
      .select('exam_id, question_id, sort_order')
      .in('exam_id', eligibleExamIds)
      .order('sort_order');

    const examById = new Map(eligibleExamsRaw.map((e: any) => [e.id, e]));
    (eqRows || []).forEach((row: any) => {
      const list = examQuestionsMap.get(row.exam_id) || [];
      list.push(row.question_id);
      examQuestionsMap.set(row.exam_id, list);
      allQuestionIds.add(row.question_id);
      const ex = examById.get(row.exam_id);
      if (ex?.results_published && ex?.allow_answer_review) {
        reviewableQuestionIds.add(row.question_id);
      }
    });
  }

  let sanitizedQuestions: any[] = [];
  if (allQuestionIds.size > 0) {
    const { data: qRows } = await supabase
      .from('questions')
      .select('*')
      .in('id', Array.from(allQuestionIds));

    sanitizedQuestions = (qRows || []).map((q: any) =>
      mapQuestion(q, reviewableQuestionIds.has(q.id))
    );
  }

  const attempts = attemptsRes.data || [];
  const attemptIds = attempts.map((a: any) => a.id);
  let answersByAttempt = new Map<string, any[]>();
  if (attemptIds.length > 0) {
    const { data: ansRows } = await supabase
      .from('exam_answers')
      .select('*')
      .in('attempt_id', attemptIds);

    (ansRows || []).forEach((ans: any) => {
      const arr = answersByAttempt.get(ans.attempt_id) || [];
      arr.push({
        questionId: ans.question_id,
        selectedOption: ans.selected_option || '',
        writtenText: ans.written_text || '',
        attachmentUrl: ans.attachment_url || '',
        isCorrect: ans.is_correct,
        autoMarks: Number(ans.auto_marks || 0),
        manualMarks: ans.manual_marks !== null && ans.manual_marks !== undefined ? Number(ans.manual_marks) : null,
        graderFeedback: ans.grader_feedback || '',
      });
      answersByAttempt.set(ans.attempt_id, arr);
    });
  }

  const resources = (resourcesRes.data || [])
    .filter((r: any) => {
      if (r.access_level === 'public') return true;
      if (r.access_level === 'enrolled') {
        return !r.course_id || activeCourseIds.has(r.course_id);
      }
      if (r.access_level === 'batch_specific') {
        return r.batch_id && activeBatchIds.has(r.batch_id);
      }
      return false;
    })
    .map(mapResource);

  const notices = (noticesRes.data || [])
    .filter((n: any) => !n.target_batch_id || activeBatchIds.has(n.target_batch_id))
    .map(mapNotice);

  const ticketRows = ticketsRes.data || [];
  const ticketIds = ticketRows.map((t: any) => t.id);
  const messagesByTicket = new Map<string, any[]>();
  if (ticketIds.length > 0) {
    const { data: msgRows } = await supabase
      .from('support_messages')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at');

    (msgRows || []).forEach((m: any) => {
      const arr = messagesByTicket.get(m.ticket_id) || [];
      arr.push({
        id: m.id,
        ticketId: m.ticket_id,
        senderRole: m.sender_role,
        senderName: m.sender_name,
        message: m.message,
        createdAt: m.created_at,
      });
      messagesByTicket.set(m.ticket_id, arr);
    });
  }

  return jsonResponse({
    ok: true,
    supabaseConfigured: true,
    adminRole: adminMeta?.role || null,
    studentProfile: mapStudent(studentRow),
    enrollments: enrollments.map((e: any) => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      batchId: e.batch_id || undefined,
      status: e.status,
      enrolledAt: e.enrolled_at,
    })),
    exams: eligibleExamsRaw.map((ex: any) => mapExam(ex, examQuestionsMap.get(ex.id) || [])),
    questions: sanitizedQuestions,
    attempts: attempts.map((a: any) => ({
      id: a.id,
      examId: a.exam_id,
      studentId: a.student_id,
      questionOrder: a.question_order || [],
      optionOrders: a.option_orders || {},
      autosavedAnswers: a.autosaved_answers || {},
      answers: answersByAttempt.get(a.id) || [],
      startedAt: a.started_at,
      expiresAt: a.expires_at,
      lastSavedAt: a.last_saved_at,
      submittedAt: a.submitted_at || undefined,
      status: a.status,
    })),
    results: (resultsRes.data || []).map((r: any) => mapResult(r)),
    resources,
    notices,
    notifications: (notifRes.data || []).map((n: any) => ({
      id: n.id,
      studentId: n.student_id,
      title: n.title,
      body: n.body,
      linkView: n.link_view || 'portal',
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    })),
    tickets: ticketRows.map((t: any) => ({
      id: t.id,
      studentId: t.student_id,
      studentName: studentRow.full_name,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      messages: messagesByTicket.get(t.id) || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  });
}

async function handleStudentExamAction(
  req: Request,
  env: SofsBackendEnv,
  subAction: 'start' | 'autosave' | 'submit'
): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required.', 401);

  const supabase = createServiceSupabase(env);
  if (!supabase) {
    return errorResponse('Supabase backend is not configured for server exam enforcement.', 503);
  }

  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return errorResponse('Invalid JSON payload.', 400);
  }

  const student = await ensureStudentRecord(supabase, user);

  if (subAction === 'start') {
    const examId = String(body.examId || '');
    if (!examId) return errorResponse('examId is required.', 400);

    const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle();
    if (!exam || !exam.is_published) return errorResponse('Exam is unavailable.', 404);

    // Check existing attempt first (supports resume after disconnect)
    const { data: existingAttempt } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', student.id)
      .maybeSingle();

    const { data: eqRows } = await supabase
      .from('exam_questions')
      .select('question_id, sort_order')
      .eq('exam_id', examId)
      .order('sort_order');

    const questionIds = (eqRows || []).map((r: any) => r.question_id);
    const { data: qRows } = questionIds.length
      ? await supabase.from('questions').select('*').in('id', questionIds)
      : { data: [] };

    if (existingAttempt) {
      return jsonResponse({
        ok: true,
        attempt: {
          id: existingAttempt.id,
          examId: existingAttempt.exam_id,
          studentId: existingAttempt.student_id,
          questionOrder: existingAttempt.question_order,
          optionOrders: existingAttempt.option_orders,
          autosavedAnswers: existingAttempt.autosaved_answers || {},
          answers: [],
          startedAt: existingAttempt.started_at,
          expiresAt: existingAttempt.expires_at,
          lastSavedAt: existingAttempt.last_saved_at,
          submittedAt: existingAttempt.submitted_at,
          status: existingAttempt.status,
        },
        // Never leak answer keys during active/locked exam
        questions: (qRows || []).map((q: any) =>
          mapQuestion(q, Boolean(exam.results_published && exam.allow_answer_review))
        ),
      });
    }

    const nowMs = Date.now();
    const startsMs = new Date(exam.starts_at).getTime();
    const endsMs = new Date(exam.ends_at).getTime();
    if (nowMs < startsMs) {
      return errorResponse('This exam has not opened yet.', 403);
    }
    if (nowMs > endsMs) {
      return errorResponse('The exam submission window has already closed.', 403);
    }

    const orderedQIds = exam.randomize_questions ? shuffleArray(questionIds) : questionIds;
    const optionOrders: Record<string, string[]> = {};
    (qRows || []).forEach((q: any) => {
      const keys = Array.isArray(q.options) ? q.options.map((o: any) => String(o.key)) : [];
      optionOrders[q.id] = exam.randomize_options ? shuffleArray(keys) : keys;
    });

    const durationMs = Number(exam.duration_minutes || 30) * 60 * 1000;
    const expiresAt = new Date(Math.min(nowMs + durationMs, endsMs)).toISOString();

    const { data: createdAttempt, error: insErr } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        student_id: student.id,
        question_order: orderedQIds,
        option_orders: optionOrders,
        autosaved_answers: {},
        expires_at: expiresAt,
        status: 'in_progress',
      })
      .select('*')
      .single();

    if (insErr) return errorResponse(insErr.message, 500);

    return jsonResponse({
      ok: true,
      attempt: {
        id: createdAttempt.id,
        examId: createdAttempt.exam_id,
        studentId: createdAttempt.student_id,
        questionOrder: createdAttempt.question_order,
        optionOrders: createdAttempt.option_orders,
        autosavedAnswers: {},
        answers: [],
        startedAt: createdAttempt.started_at,
        expiresAt: createdAttempt.expires_at,
        lastSavedAt: createdAttempt.last_saved_at,
        status: createdAttempt.status,
      },
      questions: (qRows || []).map((q: any) => mapQuestion(q, false)),
    });
  }

  if (subAction === 'autosave') {
    const attemptId = String(body.attemptId || '');
    const autosavedAnswers = body.autosavedAnswers || {};
    if (!attemptId) return errorResponse('attemptId is required.', 400);

    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('id, student_id, status')
      .eq('id', attemptId)
      .maybeSingle();

    if (!attempt || attempt.student_id !== student.id) {
      return errorResponse('Attempt not found.', 404);
    }
    if (attempt.status !== 'in_progress') {
      return errorResponse('Exam attempt is already submitted.', 409);
    }

    await supabase
      .from('exam_attempts')
      .update({
        autosaved_answers: autosavedAnswers,
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    return jsonResponse({ ok: true, lastSavedAt: new Date().toISOString() });
  }

  // submit
  const attemptId = String(body.attemptId || '');
  const submittedAnswers = (body.answers || {}) as Record<
    string,
    { selectedOption?: string; writtenText?: string; attachmentUrl?: string }
  >;
  const autoSubmitted = Boolean(body.autoSubmitted);

  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .maybeSingle();

  if (!attempt || attempt.student_id !== student.id) {
    return errorResponse('Exam attempt not found.', 404);
  }
  if (attempt.status !== 'in_progress') {
    return errorResponse('This exam attempt has already been submitted.', 409);
  }

  const { data: exam } = await supabase.from('exams').select('*').eq('id', attempt.exam_id).single();
  const { data: eqRows } = await supabase
    .from('exam_questions')
    .select('question_id, marks_override')
    .eq('exam_id', attempt.exam_id);

  const qIds = (eqRows || []).map((r: any) => r.question_id);
  const overrideMap = new Map((eqRows || []).map((r: any) => [r.question_id, r.marks_override]));
  const { data: qRows } = qIds.length
    ? await supabase.from('questions').select('*').in('id', qIds)
    : { data: [] };

  let totalMarks = 0;
  let mcqMarks = 0;
  let negativeDeducted = 0;
  const answerRecords: any[] = [];

  for (const q of qRows || []) {
    const qMarks = Number(overrideMap.get(q.id) || q.marks || 1);
    totalMarks += qMarks;
    const ans = submittedAnswers[q.id] || {};
    const selectedOption = String(ans.selectedOption || '').trim();
    const writtenText = String(ans.writtenText || '').trim();
    const attachmentUrl = String(ans.attachmentUrl || '').trim();

    if (q.question_type === 'mcq') {
      let isCorrect: boolean | null = null;
      let autoMarks = 0;
      if (selectedOption) {
        if (selectedOption === String(q.correct_option || '').trim()) {
          isCorrect = true;
          autoMarks = qMarks;
          mcqMarks += qMarks;
        } else {
          isCorrect = false;
          if (exam.negative_marking_enabled) {
            const penalty = Number(exam.negative_mark_value || 0);
            autoMarks = -penalty;
            negativeDeducted += penalty;
          }
        }
      }
      answerRecords.push({
        attempt_id: attempt.id,
        question_id: q.id,
        selected_option: selectedOption,
        written_text: '',
        attachment_url: '',
        is_correct: isCorrect,
        auto_marks: autoMarks,
      });
    } else {
      answerRecords.push({
        attempt_id: attempt.id,
        question_id: q.id,
        selected_option: '',
        written_text: writtenText,
        attachment_url: attachmentUrl,
        is_correct: null,
        auto_marks: 0,
      });
    }
  }

  if (answerRecords.length > 0) {
    await supabase
      .from('exam_answers')
      .upsert(answerRecords, { onConflict: 'attempt_id,question_id' });
  }

  const finalStatus = autoSubmitted ? 'auto_submitted' : 'submitted';
  const submittedAt = new Date().toISOString();
  await supabase
    .from('exam_attempts')
    .update({
      autosaved_answers: submittedAnswers,
      submitted_at: submittedAt,
      last_saved_at: submittedAt,
      status: finalStatus,
    })
    .eq('id', attempt.id);

  const obtainedMarks = Math.max(0, Number((mcqMarks - negativeDeducted).toFixed(2)));
  const denom = Number(exam.total_marks || totalMarks || 1);
  const percentage = Math.max(0, Math.min(100, Number(((obtainedMarks / denom) * 100).toFixed(2))));
  const { letterGrade, gpa } = computeLetterGradeAndGpa(percentage);

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('batch_id')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  const { data: resultRow } = await supabase
    .from('exam_results')
    .upsert(
      {
        exam_id: exam.id,
        attempt_id: attempt.id,
        student_id: student.id,
        batch_id: enrollment?.batch_id || null,
        total_marks: denom,
        obtained_marks: obtainedMarks,
        mcq_marks: Number(mcqMarks.toFixed(2)),
        written_marks: 0,
        negative_deducted: Number(negativeDeducted.toFixed(2)),
        percentage,
        letter_grade: letterGrade,
        gpa,
        is_published: Boolean(exam.results_published),
        published_at: exam.results_published ? submittedAt : null,
      },
      { onConflict: 'attempt_id' }
    )
    .select('*')
    .single();

  return jsonResponse({
    ok: true,
    status: finalStatus,
    submittedAt,
    resultPublished: Boolean(exam.results_published),
    result: exam.results_published && resultRow ? mapResult(resultRow) : null,
  });
}

async function handleAdminWorkspace(req: Request, env: SofsBackendEnv): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required.', 401);

  const supabase = createServiceSupabase(env);
  const admin = await resolveAdminRole(user, supabase);
  if (!admin) return errorResponse('Forbidden: active SOFS admin role required.', 403);

  if (!supabase) {
    return jsonResponse({
      ok: true,
      supabaseConfigured: false,
      adminRole: admin.role,
      adminEmail: admin.user.email,
    });
  }

  const [
    settingsRes,
    adminsRes,
    teachersRes,
    coursesRes,
    subjectsRes,
    batchesRes,
    schedulesRes,
    studentsRes,
    enrollmentsRes,
    admissionsRes,
    qCatsRes,
    questionsRes,
    examsRes,
    examQuestionsRes,
    attemptsRes,
    answersRes,
    resultsRes,
    resourcesRes,
    noticesRes,
    ticketsRes,
    messagesRes,
    galleryRes,
    testimonialsRes,
    mediaRes,
    auditRes,
  ] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('admin_users').select('*').order('created_at'),
    supabase.from('teachers').select('*').order('display_order'),
    supabase.from('courses').select('*').order('display_order'),
    supabase.from('subjects').select('*').order('name'),
    supabase.from('batches').select('*').order('created_at', { ascending: false }),
    supabase.from('batch_schedules').select('*'),
    supabase.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('enrollments').select('*').order('enrolled_at', { ascending: false }),
    supabase.from('admissions').select('*').order('created_at', { ascending: false }),
    supabase.from('question_categories').select('*').order('name'),
    supabase.from('questions').select('*').order('created_at', { ascending: false }),
    supabase.from('exams').select('*').order('starts_at', { ascending: false }),
    supabase.from('exam_questions').select('*').order('sort_order'),
    supabase.from('exam_attempts').select('*').order('started_at', { ascending: false }),
    supabase.from('exam_answers').select('*'),
    supabase.from('exam_results').select('*').order('obtained_marks', { ascending: false }),
    supabase.from('resources').select('*').order('created_at', { ascending: false }),
    supabase.from('notices').select('*').order('published_at', { ascending: false }),
    supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }),
    supabase.from('support_messages').select('*').order('created_at'),
    supabase.from('gallery_items').select('*').order('display_order'),
    supabase.from('testimonials').select('*').order('display_order'),
    supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  const studentRows = studentsRes.data || [];
  const batchRows = batchesRes.data || [];
  const studentMap = new Map(studentRows.map((s: any) => [s.id, s]));
  const batchMap = new Map(batchRows.map((b: any) => [b.id, b]));

  const eqByExam = new Map<string, string[]>();
  (examQuestionsRes.data || []).forEach((eq: any) => {
    const arr = eqByExam.get(eq.exam_id) || [];
    arr.push(eq.question_id);
    eqByExam.set(eq.exam_id, arr);
  });

  const answersByAttempt = new Map<string, any[]>();
  (answersRes.data || []).forEach((ans: any) => {
    const arr = answersByAttempt.get(ans.attempt_id) || [];
    arr.push({
      questionId: ans.question_id,
      selectedOption: ans.selected_option || '',
      writtenText: ans.written_text || '',
      attachmentUrl: ans.attachment_url || '',
      isCorrect: ans.is_correct,
      autoMarks: Number(ans.auto_marks || 0),
      manualMarks: ans.manual_marks !== null && ans.manual_marks !== undefined ? Number(ans.manual_marks) : null,
      graderFeedback: ans.grader_feedback || '',
      gradedBy: ans.graded_by || '',
    });
    answersByAttempt.set(ans.attempt_id, arr);
  });

  const messagesByTicket = new Map<string, any[]>();
  (messagesRes.data || []).forEach((m: any) => {
    const arr = messagesByTicket.get(m.ticket_id) || [];
    arr.push({
      id: m.id,
      ticketId: m.ticket_id,
      senderRole: m.sender_role,
      senderName: m.sender_name,
      message: m.message,
      createdAt: m.created_at,
    });
    messagesByTicket.set(m.ticket_id, arr);
  });

  return jsonResponse({
    ok: true,
    supabaseConfigured: true,
    adminRole: admin.role,
    adminEmail: admin.user.email,
    siteSettings: settingsRes.data ? mapSiteSettings(settingsRes.data) : null,
    adminUsers: (adminsRes.data || []).map((a: any) => ({
      id: a.id,
      firebaseUid: a.firebase_uid || undefined,
      email: a.email,
      fullName: a.full_name,
      role: a.role,
      isActive: Boolean(a.is_active),
      createdBy: a.created_by || undefined,
      createdAt: a.created_at,
    })),
    teachers: (teachersRes.data || []).map(mapTeacher),
    courses: (coursesRes.data || []).map(mapCourse),
    subjects: (subjectsRes.data || []).map(mapSubject),
    batches: batchRows.map(mapBatch),
    schedules: (schedulesRes.data || []).map(mapSchedule),
    students: studentRows.map(mapStudent),
    enrollments: (enrollmentsRes.data || []).map((e: any) => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      batchId: e.batch_id || undefined,
      status: e.status,
      enrolledAt: e.enrolled_at,
    })),
    admissions: (admissionsRes.data || []).map((a: any) => ({
      id: a.id,
      referenceCode: a.reference_code,
      fullName: a.full_name,
      phone: a.phone,
      whatsapp: a.whatsapp || '',
      academicLevel: a.academic_level,
      academicGroup: a.academic_group,
      desiredCourse: a.desired_course,
      preferredBatch: a.preferred_batch || '',
      message: a.message || '',
      status: a.status,
      staffNotes: a.staff_notes || '',
      handledBy: a.handled_by || '',
      createdAt: a.created_at,
    })),
    questionCategories: (qCatsRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      subjectName: c.subject_name || '',
      academicLevel: c.academic_level || 'HSC',
      description: c.description || '',
    })),
    questions: (questionsRes.data || []).map((q: any) => mapQuestion(q, true)),
    exams: (examsRes.data || []).map((e: any) => mapExam(e, eqByExam.get(e.id) || [])),
    attempts: (attemptsRes.data || []).map((a: any) => ({
      id: a.id,
      examId: a.exam_id,
      studentId: a.student_id,
      questionOrder: a.question_order || [],
      optionOrders: a.option_orders || {},
      autosavedAnswers: a.autosaved_answers || {},
      answers: answersByAttempt.get(a.id) || [],
      startedAt: a.started_at,
      expiresAt: a.expires_at,
      lastSavedAt: a.last_saved_at,
      submittedAt: a.submitted_at || undefined,
      status: a.status,
    })),
    results: (resultsRes.data || []).map((r: any) => mapResult(r, studentMap, batchMap)),
    resources: (resourcesRes.data || []).map(mapResource),
    notices: (noticesRes.data || []).map(mapNotice),
    tickets: (ticketsRes.data || []).map((t: any) => ({
      id: t.id,
      studentId: t.student_id,
      studentName: studentMap.get(t.student_id)?.full_name || 'Student',
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      messages: messagesByTicket.get(t.id) || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
    gallery: (galleryRes.data || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      caption: g.caption || '',
      imageUrl: g.image_url,
      isPublished: Boolean(g.is_published),
      displayOrder: Number(g.display_order || 0),
    })),
    testimonials: (testimonialsRes.data || []).map((t: any) => ({
      id: t.id,
      studentName: t.student_name,
      achievement: t.achievement,
      cohort: t.cohort || '',
      quote: t.quote,
      isPublished: Boolean(t.is_published),
      displayOrder: Number(t.display_order || 0),
    })),
    mediaAssets: (mediaRes.data || []).map((m: any) => ({
      id: m.id,
      fileName: m.file_name,
      bucket: m.bucket,
      storagePath: m.storage_path || '',
      publicUrl: m.public_url,
      mimeType: m.mime_type || '',
      sizeBytes: Number(m.size_bytes || 0),
      uploadedBy: m.uploaded_by || '',
      createdAt: m.created_at,
    })),
    auditLogs: (auditRes.data || []).map((l: any) => ({
      id: l.id,
      actorEmail: l.actor_email,
      actorRole: l.actor_role,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id || '',
      details: l.details || {},
      createdAt: l.created_at,
    })),
  });
}

async function handleAdminMutate(req: Request, env: SofsBackendEnv): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required.', 401);

  const supabase = createServiceSupabase(env);
  const admin = await resolveAdminRole(user, supabase);
  if (!admin) return errorResponse('Forbidden: admin access required.', 403);

  let payload: { entity?: string; action?: string; id?: string; data?: Record<string, any> };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return errorResponse('Invalid JSON payload.', 400);
  }

  const entity = String(payload.entity || '').trim();
  const action = String(payload.action || 'upsert').trim();
  if (!entity || !ENTITY_ALLOWED_ROLES[entity]) {
    return errorResponse(`Unsupported entity: ${entity}`, 400);
  }
  if (!canRoleManageEntity(admin.role, entity)) {
    return errorResponse(`Forbidden: role ${admin.role} cannot modify ${entity}.`, 403);
  }

  if (!supabase) {
    return jsonResponse({ ok: true, localFallback: true, entity, action });
  }

  const d = payload.data || {};
  const id = payload.id || d.id;

  if (action === 'delete') {
    if (!id) return errorResponse('Record id is required for deletion.', 400);

    // Prevent super_admin from deleting their own account
    if (entity === 'admin_users') {
      const { data: targetAdmin } = await supabase
        .from('admin_users')
        .select('email')
        .eq('id', id)
        .maybeSingle();
      if (targetAdmin?.email?.toLowerCase() === admin.user.email) {
        return errorResponse('You cannot delete your own active super_admin record.', 400);
      }
    }

    // Also delete associated Supabase Storage file when deleting media/resources
    if (entity === 'resources' || entity === 'media_assets' || entity === 'gallery_items') {
      const { data: rec } = await supabase.from(entity).select('*').eq('id', id).maybeSingle();
      if (rec?.storage_path) {
        const bucket = rec.bucket || (entity === 'resources' ? 'sofs-resources' : entity === 'gallery_items' ? 'sofs-gallery' : 'sofs-media');
        await supabase.storage.from(bucket).remove([rec.storage_path]);
      }
    }

    const { error } = await supabase.from(entity).delete().eq('id', id);
    if (error) return errorResponse(error.message, 500);

    await logAudit(supabase, admin, 'delete', entity, id, {});
    return jsonResponse({ ok: true, id, deleted: true });
  }

  // Upsert / Special workflows
  let rowToSave: Record<string, any> | null = null;
  switch (entity) {
    case 'site_settings':
      rowToSave = {
        id: 'main',
        institute_name: d.instituteName,
        short_name: d.shortName,
        tagline: d.tagline,
        hero_headline: d.heroHeadline,
        hero_subheadline: d.heroSubheadline,
        hero_image_url: d.heroImageUrl,
        about_title: d.aboutTitle,
        about_body: d.aboutBody,
        about_image_url: d.aboutImageUrl,
        primary_color: d.primaryColor,
        secondary_color: d.secondaryColor,
        accent_color: d.accentColor,
        background_color: d.backgroundColor,
        announcement_enabled: Boolean(d.announcementEnabled),
        announcement_text: d.announcementText || '',
        contact_phone: d.contactPhone || '',
        whatsapp_number: d.whatsappNumber || '',
        contact_email: d.contactEmail || '',
        campus_address: d.campusAddress || '',
        office_hours: d.officeHours || '',
        seo_title: d.seoTitle || '',
        seo_description: d.seoDescription || '',
        social_links: d.socialLinks || {},
      };
      break;
    case 'teachers':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        name: d.name,
        title: d.title,
        department: d.department,
        qualifications: d.qualifications || '',
        experience_years: Number(d.experienceYears || 0),
        bio: d.bio || '',
        photo_url: d.photoUrl || '',
        email: d.email || '',
        is_published: d.isPublished !== false,
        display_order: Number(d.displayOrder || 0),
      };
      break;
    case 'courses':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        slug: d.slug,
        title: d.title,
        academic_level: d.academicLevel,
        academic_group: d.academicGroup || 'Science',
        summary: d.summary || '',
        description: d.description || '',
        duration_label: d.durationLabel || '6 Months',
        fee_bdt: Number(d.feeBdt || 0),
        fee_label: d.feeLabel || '',
        syllabus_highlights: Array.isArray(d.syllabusHighlights) ? d.syllabusHighlights : [],
        cover_image_url: d.coverImageUrl || '',
        is_featured: Boolean(d.isFeatured),
        is_published: d.isPublished !== false,
        display_order: Number(d.displayOrder || 0),
      };
      break;
    case 'subjects':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        course_id: d.courseId || null,
        name: d.name,
        code: d.code || '',
        academic_level: d.academicLevel || 'HSC',
        teacher_id: d.teacherId || null,
        description: d.description || '',
        is_published: d.isPublished !== false,
      };
      break;
    case 'batches':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        course_id: d.courseId || null,
        name: d.name,
        code: d.code,
        academic_level: d.academicLevel || 'HSC',
        academic_group: d.academicGroup || 'Science',
        lead_teacher_id: d.leadTeacherId || null,
        schedule_summary: d.scheduleSummary || '',
        room_or_mode: d.roomOrMode || 'Campus + Hybrid',
        seat_capacity: Number(d.seatCapacity || 40),
        enrolled_count: Number(d.enrolledCount || 0),
        start_date: d.startDate || null,
        status: d.status || 'open',
        is_published: d.isPublished !== false,
      };
      break;
    case 'batch_schedules':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        batch_id: d.batchId,
        subject_id: d.subjectId || null,
        teacher_id: d.teacherId || null,
        day_of_week: d.dayOfWeek,
        start_time: d.startTime,
        end_time: d.endTime,
        room_label: d.roomLabel || '',
        topic_note: d.topicNote || '',
      };
      break;
    case 'admissions':
      rowToSave = {
        id: d.id,
        status: d.status,
        staff_notes: d.staffNotes || '',
        handled_by: admin.user.email,
      };
      break;
    case 'students':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        firebase_uid: d.firebaseUid || `manual-${crypto.randomUUID()}`,
        student_code: d.studentCode,
        full_name: d.fullName,
        email: d.email,
        phone: d.phone || '',
        whatsapp: d.whatsapp || '',
        academic_level: d.academicLevel || 'HSC',
        academic_group: d.academicGroup || 'Science',
        institution_name: d.institutionName || '',
        guardian_name: d.guardianName || '',
        guardian_phone: d.guardianPhone || '',
        status: d.status || 'active',
      };
      break;
    case 'enrollments':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        student_id: d.studentId,
        course_id: d.courseId,
        batch_id: d.batchId || null,
        status: d.status || 'active',
      };
      break;
    case 'question_categories':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        name: d.name,
        subject_name: d.subjectName || '',
        academic_level: d.academicLevel || 'HSC',
        description: d.description || '',
      };
      break;
    case 'questions':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        category_id: d.categoryId || null,
        subject_id: d.subjectId || null,
        question_type: d.questionType || 'mcq',
        language: d.language || 'en',
        difficulty: d.difficulty || 'medium',
        question_text: d.questionText,
        equation_latex: d.equationLatex || '',
        diagram_svg: d.diagramSvg || '',
        image_url: d.imageUrl || '',
        options: Array.isArray(d.options) ? d.options : [],
        correct_option: d.correctOption || '',
        explanation: d.explanation || '',
        marks: Number(d.marks || 1),
        tags: Array.isArray(d.tags) ? d.tags : [],
        created_by: admin.user.email,
      };
      break;
    case 'exams': {
      const { data: savedExam, error: examErr } = await supabase
        .from('exams')
        .upsert({
          ...(d.id ? { id: d.id } : {}),
          title: d.title,
          course_id: d.courseId || null,
          subject_id: d.subjectId || null,
          description: d.description || '',
          instructions: d.instructions || '',
          exam_type: d.examType || 'mixed',
          target_batch_ids: Array.isArray(d.targetBatchIds) ? d.targetBatchIds : [],
          target_student_ids: Array.isArray(d.targetStudentIds) ? d.targetStudentIds : [],
          starts_at: d.startsAt,
          ends_at: d.endsAt,
          duration_minutes: Number(d.durationMinutes || 30),
          total_marks: Number(d.totalMarks || 0),
          pass_marks: Number(d.passMarks || 0),
          randomize_questions: Boolean(d.randomizeQuestions),
          randomize_options: Boolean(d.randomizeOptions),
          negative_marking_enabled: Boolean(d.negativeMarkingEnabled),
          negative_mark_value: Number(d.negativeMarkValue || 0),
          grading_scale: d.gradingScale || 'gpa_5',
          is_published: Boolean(d.isPublished),
          results_published: Boolean(d.resultsPublished),
          allow_answer_review: Boolean(d.allowAnswerReview),
          created_by: admin.user.email,
        })
        .select('*')
        .single();

      if (examErr) return errorResponse(examErr.message, 500);

      if (Array.isArray(d.questionIds)) {
        await supabase.from('exam_questions').delete().eq('exam_id', savedExam.id);
        if (d.questionIds.length > 0) {
          await supabase.from('exam_questions').insert(
            d.questionIds.map((qId: string, idx: number) => ({
              exam_id: savedExam.id,
              question_id: qId,
              sort_order: idx,
            }))
          );
        }
      }

      // Sync published flags on exam_results when exam.resultsPublished toggles
      await supabase
        .from('exam_results')
        .update({
          is_published: Boolean(d.resultsPublished),
          published_at: d.resultsPublished ? new Date().toISOString() : null,
        })
        .eq('exam_id', savedExam.id);

      await logAudit(supabase, admin, d.id ? 'update' : 'create', 'exams', savedExam.id, {
        title: savedExam.title,
      });
      return jsonResponse({
        ok: true,
        record: mapExam(savedExam, Array.isArray(d.questionIds) ? d.questionIds : []),
      });
    }
    case 'exam_answers': {
      // Manual grading update + recalculation of exam_results
      const attemptId = String(d.attemptId || '');
      const questionId = String(d.questionId || '');
      const manualMarks = Number(d.manualMarks ?? 0);
      const graderFeedback = String(d.graderFeedback || '');

      const { error: ansErr } = await supabase
        .from('exam_answers')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            manual_marks: manualMarks,
            grader_feedback: graderFeedback,
            graded_by: admin.user.email,
            graded_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        );
      if (ansErr) return errorResponse(ansErr.message, 500);

      const { data: allAnswers } = await supabase
        .from('exam_answers')
        .select('*')
        .eq('attempt_id', attemptId);

      let mcqMarks = 0;
      let negativeDeducted = 0;
      let writtenMarks = 0;
      for (const a of allAnswers || []) {
        const autoM = Number(a.auto_marks || 0);
        if (autoM >= 0) mcqMarks += autoM;
        else negativeDeducted += Math.abs(autoM);
        if (a.manual_marks !== null && a.manual_marks !== undefined) {
          writtenMarks += Number(a.manual_marks);
        }
      }

      const { data: resRow } = await supabase
        .from('exam_results')
        .select('*')
        .eq('attempt_id', attemptId)
        .maybeSingle();

      if (resRow) {
        const obtainedMarks = Math.max(0, Number((mcqMarks - negativeDeducted + writtenMarks).toFixed(2)));
        const totalM = Number(resRow.total_marks || 1);
        const percentage = Math.max(0, Math.min(100, Number(((obtainedMarks / totalM) * 100).toFixed(2))));
        const { letterGrade, gpa } = computeLetterGradeAndGpa(percentage);
        await supabase
          .from('exam_results')
          .update({
            mcq_marks: mcqMarks,
            written_marks: writtenMarks,
            negative_deducted: negativeDeducted,
            obtained_marks: obtainedMarks,
            percentage,
            letter_grade: letterGrade,
            gpa,
          })
          .eq('id', resRow.id);
      }

      await logAudit(supabase, admin, 'grade_written', 'exam_answers', attemptId, {
        questionId,
        manualMarks,
      });
      return jsonResponse({ ok: true });
    }
    case 'exam_results':
      rowToSave = {
        id: d.id,
        is_published: Boolean(d.isPublished),
        hall_of_fame: Boolean(d.hallOfFame),
        remarks: d.remarks || '',
        published_at: d.isPublished ? d.publishedAt || new Date().toISOString() : null,
      };
      break;
    case 'resources':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        title: d.title,
        description: d.description || '',
        resource_type: d.resourceType || 'pdf',
        category: d.category || 'Lecture Sheet',
        course_id: d.courseId || null,
        subject_id: d.subjectId || null,
        batch_id: d.batchId || null,
        access_level: d.accessLevel || 'enrolled',
        file_url: d.fileUrl,
        storage_path: d.storagePath || '',
        file_size_bytes: Number(d.fileSizeBytes || 0),
        is_published: d.isPublished !== false,
        uploaded_by: admin.user.email,
      };
      break;
    case 'notices':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        title: d.title,
        body: d.body,
        category: d.category || 'General',
        target_batch_id: d.targetBatchId || null,
        attachment_url: d.attachmentUrl || '',
        is_pinned: Boolean(d.isPinned),
        is_published: d.isPublished !== false,
        published_at: d.publishedAt || new Date().toISOString(),
        created_by: admin.user.email,
      };
      break;
    case 'notifications':
      rowToSave = {
        student_id: d.studentId,
        title: d.title,
        body: d.body,
        link_view: d.linkView || 'portal',
        is_read: false,
      };
      break;
    case 'support_tickets':
      rowToSave = {
        id: d.id,
        status: d.status,
      };
      break;
    case 'support_messages':
      rowToSave = {
        ticket_id: d.ticketId,
        sender_role: 'staff',
        sender_name: admin.fullName,
        message: d.message,
      };
      break;
    case 'gallery_items':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        title: d.title,
        category: d.category || 'Campus',
        caption: d.caption || '',
        image_url: d.imageUrl,
        is_published: d.isPublished !== false,
        display_order: Number(d.displayOrder || 0),
      };
      break;
    case 'testimonials':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        student_name: d.studentName,
        achievement: d.achievement,
        cohort: d.cohort || '',
        quote: d.quote,
        is_published: d.isPublished !== false,
        display_order: Number(d.displayOrder || 0),
      };
      break;
    case 'admin_users':
      rowToSave = {
        ...(d.id ? { id: d.id } : {}),
        email: String(d.email || '').trim().toLowerCase(),
        full_name: d.fullName,
        role: d.role,
        is_active: d.isActive !== false,
        created_by: admin.user.email,
      };
      break;
  }

  if (!rowToSave) return errorResponse('No update payload built.', 400);

  const { data: saved, error } = await supabase
    .from(entity)
    .upsert(rowToSave, entity === 'admin_users' && !d.id ? { onConflict: 'email' } : undefined)
    .select('*')
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(supabase, admin, d.id ? 'update' : 'create', entity, String(saved?.id || ''), {
    summary: d.title || d.name || d.fullName || d.email || entity,
  });

  return jsonResponse({ ok: true, record: saved });
}

async function handleStorageUpload(req: Request, env: SofsBackendEnv): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required.', 401);

  const supabase = createServiceSupabase(env);
  const admin = await resolveAdminRole(user, supabase);
  if (!admin) return errorResponse('Admin authorization required to upload assets.', 403);
  if (!supabase) {
    return errorResponse(
      'Supabase Storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
      503
    );
  }

  let body: {
    bucket?: string;
    fileName?: string;
    mimeType?: string;
    base64Data?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return errorResponse('Invalid JSON payload.', 400);
  }

  const bucket = body.bucket || 'sofs-media';
  const allowedBuckets = new Set(['sofs-media', 'sofs-gallery', 'sofs-questions', 'sofs-resources']);
  if (!allowedBuckets.has(bucket)) {
    return errorResponse('Unsupported storage bucket.', 400);
  }

  const fileName = String(body.fileName || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
  const mimeType = String(body.mimeType || 'application/octet-stream');
  const rawBase64 = String(body.base64Data || '').replace(/^data:[^;]+;base64,/, '');
  if (!rawBase64) return errorResponse('File data is empty.', 400);

  const binaryStr = atob(rawBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const storagePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}-${fileName}`;
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: mimeType,
    upsert: false,
  });

  if (uploadErr) return errorResponse(`Storage upload failed: ${uploadErr.message}`, 500);

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = pub.publicUrl;

  const { data: assetRow } = await supabase
    .from('media_assets')
    .insert({
      file_name: fileName,
      bucket,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: mimeType,
      size_bytes: bytes.byteLength,
      uploaded_by: admin.user.email,
    })
    .select('*')
    .single();

  await logAudit(supabase, admin, 'upload', 'media_assets', String(assetRow?.id || ''), {
    bucket,
    fileName,
    sizeBytes: bytes.byteLength,
  });

  return jsonResponse({
    ok: true,
    publicUrl,
    storagePath,
    asset: assetRow
      ? {
          id: assetRow.id,
          fileName: assetRow.file_name,
          bucket: assetRow.bucket,
          storagePath: assetRow.storage_path,
          publicUrl: assetRow.public_url,
          mimeType: assetRow.mime_type,
          sizeBytes: Number(assetRow.size_bytes || 0),
          uploadedBy: assetRow.uploaded_by,
          createdAt: assetRow.created_at,
        }
      : null,
  });
}

async function handleGeminiOcrExtract(req: Request, env: SofsBackendEnv): Promise<Response> {
  const user = await verifyFirebaseIdToken(req, env);
  if (!user) return errorResponse('Authentication required.', 401);

  const supabase = createServiceSupabase(env);
  const admin = await resolveAdminRole(user, supabase);
  if (!admin || (admin.role !== 'super_admin' && admin.role !== 'exam_manager')) {
    return errorResponse('Forbidden: exam_manager or super_admin role required for question OCR.', 403);
  }

  const geminiKey = getEnvValue(env, 'GEMINI_API_KEY');
  if (!geminiKey) {
    return errorResponse(
      'GEMINI_API_KEY is not configured in server environment variables. Please set GEMINI_API_KEY in Cloudflare Pages or .env.',
      503
    );
  }

  let body: { base64Data?: string; mimeType?: string; subjectHint?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return errorResponse('Invalid JSON payload.', 400);
  }

  const rawBase64 = String(body.base64Data || '').replace(/^data:[^;]+;base64,/, '');
  const mimeType = String(body.mimeType || 'image/jpeg');
  const subjectHint = String(body.subjectHint || 'HSC Science / University Admission');
  if (!rawBase64) return errorResponse('No image or PDF payload uploaded for OCR.', 400);

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: rawBase64, mimeType } },
            {
              text: `You are extracting academic exam questions for SOFS Academic Coaching (${subjectHint}). Extract all visible MCQ and written questions faithfully in their original Bangla, English, or bilingual script. Wrap mathematical formulas cleanly inside KaTeX LaTeX syntax in the equationLatex field (without dollar signs) or inline with $...$ in text. If an answer key mark is not visible in the image, leave correctOption blank or infer only when clearly marked.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionType: { type: Type.STRING },
                  language: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  equationLatex: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        text: { type: Type.STRING },
                        equation: { type: Type.STRING },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  correctOption: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                },
                required: ['questionType', 'language', 'questionText', 'marks'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText) as { questions?: any[] };
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (supabase) {
      await logAudit(supabase, admin, 'ocr_extract', 'questions', 'gemini-4-hydrogen', {
        extractedCount: questions.length,
        subjectHint,
      });
    }

    return jsonResponse({
      ok: true,
      model: 'gemini-4-hydrogen',
      questions: questions.map((q) => ({
        questionType: q.questionType === 'written' ? 'written' : 'mcq',
        language: q.language === 'bn' || q.language === 'bilingual' ? q.language : 'en',
        difficulty: q.difficulty === 'easy' || q.difficulty === 'hard' ? q.difficulty : 'medium',
        questionText: String(q.questionText || '').trim(),
        equationLatex: String(q.equationLatex || '').trim(),
        options: Array.isArray(q.options) ? q.options : [],
        correctOption: String(q.correctOption || '').trim(),
        explanation: String(q.explanation || '').trim(),
        marks: Number(q.marks || (q.questionType === 'written' ? 5 : 1)),
      })),
    });
  } catch (err: any) {
    return errorResponse(
      `Gemini OCR extraction error: ${err?.message || 'Unable to process uploaded sheet.'}`,
      502
    );
  }
}

export async function handleSofsApiRequest(req: Request, env: SofsBackendEnv): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/sofs\/?/, '').replace(/\/+$/, '');

  if (route === 'health' && req.method === 'GET') {
    return jsonResponse({
      ok: true,
      supabaseConfigured: Boolean(
        getEnvValue(env, 'SUPABASE_URL', 'VITE_SUPABASE_URL') &&
          getEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      geminiConfigured: Boolean(getEnvValue(env, 'GEMINI_API_KEY')),
      firebaseProjectId:
        getEnvValue(env, 'FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID') || 'tastehub-16c49',
    });
  }

  if (route === 'public' && req.method === 'GET') {
    return handlePublicBootstrap(env);
  }

  if (route === 'admissions' && req.method === 'POST') {
    return handlePublicAdmissionSubmit(req, env);
  }

  if (route === 'student/dashboard' && req.method === 'GET') {
    return handleStudentDashboard(req, env);
  }

  if (route === 'student/profile' && req.method === 'POST') {
    const user = await verifyFirebaseIdToken(req, env);
    if (!user) return errorResponse('Authentication required.', 401);
    const supabase = createServiceSupabase(env);
    if (!supabase) return jsonResponse({ ok: true, localFallback: true });
    const student = await ensureStudentRecord(supabase, user);
    const body = (await req.json()) as Record<string, any>;
    const { data, error } = await supabase
      .from('students')
      .update({
        full_name: String(body.fullName || student.full_name).trim(),
        phone: String(body.phone || ''),
        whatsapp: String(body.whatsapp || ''),
        academic_level: String(body.academicLevel || 'HSC'),
        academic_group: String(body.academicGroup || 'Science'),
        institution_name: String(body.institutionName || ''),
        guardian_name: String(body.guardianName || ''),
        guardian_phone: String(body.guardianPhone || ''),
      })
      .eq('id', student.id)
      .select('*')
      .single();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ ok: true, studentProfile: mapStudent(data) });
  }

  if (route === 'student/exams/start' && req.method === 'POST') {
    return handleStudentExamAction(req, env, 'start');
  }
  if (route === 'student/exams/autosave' && req.method === 'POST') {
    return handleStudentExamAction(req, env, 'autosave');
  }
  if (route === 'student/exams/submit' && req.method === 'POST') {
    return handleStudentExamAction(req, env, 'submit');
  }

  if (route === 'student/notifications/read' && req.method === 'POST') {
    const user = await verifyFirebaseIdToken(req, env);
    if (!user) return errorResponse('Authentication required.', 401);
    const supabase = createServiceSupabase(env);
    if (!supabase) return jsonResponse({ ok: true, localFallback: true });
    const student = await ensureStudentRecord(supabase, user);
    await supabase.from('notifications').update({ is_read: true }).eq('student_id', student.id);
    return jsonResponse({ ok: true });
  }

  if (route === 'student/tickets' && req.method === 'POST') {
    const user = await verifyFirebaseIdToken(req, env);
    if (!user) return errorResponse('Authentication required.', 401);
    const supabase = createServiceSupabase(env);
    if (!supabase) return jsonResponse({ ok: true, localFallback: true });
    const student = await ensureStudentRecord(supabase, user);
    const body = (await req.json()) as Record<string, any>;

    if (body.ticketId && body.message) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id, student_id')
        .eq('id', body.ticketId)
        .maybeSingle();
      if (!ticket || ticket.student_id !== student.id) {
        return errorResponse('Ticket not found.', 404);
      }
      const { data: msg, error: mErr } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_role: 'student',
          sender_name: student.full_name,
          message: String(body.message).trim(),
        })
        .select('*')
        .single();
      if (mErr) return errorResponse(mErr.message, 500);
      await supabase
        .from('support_tickets')
        .update({ status: 'open' })
        .eq('id', ticket.id);
      return jsonResponse({ ok: true, message: msg });
    }

    const { data: newTicket, error: tErr } = await supabase
      .from('support_tickets')
      .insert({
        student_id: student.id,
        subject: String(body.subject || 'Academic Query').trim(),
        category: String(body.category || 'Academic'),
        priority: String(body.priority || 'normal'),
        status: 'open',
      })
      .select('*')
      .single();
    if (tErr) return errorResponse(tErr.message, 500);

    if (body.initialMessage) {
      await supabase.from('support_messages').insert({
        ticket_id: newTicket.id,
        sender_role: 'student',
        sender_name: student.full_name,
        message: String(body.initialMessage).trim(),
      });
    }
    return jsonResponse({ ok: true, ticket: newTicket });
  }

  if (route === 'admin/workspace' && req.method === 'GET') {
    return handleAdminWorkspace(req, env);
  }
  if (route === 'admin/mutate' && req.method === 'POST') {
    return handleAdminMutate(req, env);
  }
  if (route === 'storage/upload' && req.method === 'POST') {
    return handleStorageUpload(req, env);
  }
  if (route === 'ocr/extract' && req.method === 'POST') {
    return handleGeminiOcrExtract(req, env);
  }

  return errorResponse(`Unknown SOFS API route: /api/sofs/${route}`, 404);
}
