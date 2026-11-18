-- ============================================================================
-- SOFS Academic Coaching (SOFS) — Complete PostgreSQL + RLS + Storage Migration
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper trigger function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper function to read verified Firebase UID from custom JWT claims if configured
CREATE OR REPLACE FUNCTION public.current_firebase_uid()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', ''),
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id', ''),
    ''
  );
$$;

-- 1. Site Settings & CMS Configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  institute_name TEXT NOT NULL DEFAULT 'SOFS Academic Coaching',
  short_name TEXT NOT NULL DEFAULT 'SOFS',
  tagline TEXT NOT NULL DEFAULT 'Structured clarity for SSC, HSC, and University Admission.',
  hero_headline TEXT NOT NULL DEFAULT 'Disciplined preparation for board mastery and admission merit.',
  hero_subheadline TEXT NOT NULL DEFAULT 'Small-batch mentoring, bilingual MCQ and written testing, and transparent weekly progress tracking.',
  hero_image_url TEXT NOT NULL DEFAULT '',
  about_title TEXT NOT NULL DEFAULT 'Built around conceptual depth and regular testing.',
  about_body TEXT NOT NULL DEFAULT '',
  about_image_url TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#0F3D2E',
  secondary_color TEXT NOT NULL DEFAULT '#2B5E4A',
  accent_color TEXT NOT NULL DEFAULT '#B47B2B',
  background_color TEXT NOT NULL DEFAULT '#F8F9F7',
  announcement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  announcement_text TEXT NOT NULL DEFAULT 'HSC 2026 & Admission Foundation batches now enrolling — Apply online with zero registration fee.',
  contact_phone TEXT NOT NULL DEFAULT '+880 1711-000000',
  whatsapp_number TEXT NOT NULL DEFAULT '+880 1711-000000',
  contact_email TEXT NOT NULL DEFAULT 'admissions@sofscoaching.edu.bd',
  campus_address TEXT NOT NULL DEFAULT 'House 24, Road 6, Dhanmondi, Dhaka 1205',
  office_hours TEXT NOT NULL DEFAULT 'Saturday – Thursday · 8:00 AM – 8:00 PM',
  seo_title TEXT NOT NULL DEFAULT 'SOFS Academic Coaching — Dhaka',
  seo_description TEXT NOT NULL DEFAULT 'Board and university admission coaching with online exams, analytics, and study resources.',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Role-Based Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN (
      'super_admin',
      'content_manager',
      'admission_manager',
      'exam_manager',
      'results_manager',
      'resource_manager'
    )
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper check for verified active admin via JWT claim
-- Defined after public.admin_users exists so SQL function validation succeeds cleanly
CREATE OR REPLACE FUNCTION public.is_sofs_admin(required_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.firebase_uid = public.current_firebase_uid()
      AND au.is_active = TRUE
      AND (required_roles IS NULL OR au.role = ANY(required_roles))
  );
$$;

-- 3. Teachers / Faculty
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  qualifications TEXT NOT NULL DEFAULT '',
  experience_years INTEGER NOT NULL DEFAULT 1 CHECK (experience_years >= 0),
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  academic_level TEXT NOT NULL, -- e.g. SSC, HSC, Admission, Foundation
  academic_group TEXT NOT NULL DEFAULT 'Science',
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  duration_label TEXT NOT NULL DEFAULT '6 Months',
  fee_bdt INTEGER NOT NULL DEFAULT 0 CHECK (fee_bdt >= 0),
  fee_label TEXT NOT NULL DEFAULT '',
  syllabus_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  academic_level TEXT NOT NULL DEFAULT 'HSC',
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Batches & Schedules
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  academic_level TEXT NOT NULL DEFAULT 'HSC',
  academic_group TEXT NOT NULL DEFAULT 'Science',
  lead_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule_summary TEXT NOT NULL DEFAULT '',
  room_or_mode TEXT NOT NULL DEFAULT 'Campus + Hybrid',
  seat_capacity INTEGER NOT NULL DEFAULT 40 CHECK (seat_capacity > 0),
  enrolled_count INTEGER NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'full', 'archived')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batch_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room_label TEXT NOT NULL DEFAULT 'Room 201',
  topic_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Students & Enrollments
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT NOT NULL UNIQUE,
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  academic_level TEXT DEFAULT 'HSC',
  academic_group TEXT DEFAULT 'Science',
  institution_name TEXT DEFAULT '',
  guardian_name TEXT DEFAULT '',
  guardian_phone TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- 8. Public Admissions (No login required to submit)
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 24),
  whatsapp TEXT DEFAULT '',
  academic_level TEXT NOT NULL CHECK (char_length(academic_level) BETWEEN 2 AND 60),
  academic_group TEXT NOT NULL DEFAULT 'Science',
  desired_course TEXT NOT NULL CHECK (char_length(desired_course) BETWEEN 2 AND 160),
  preferred_batch TEXT DEFAULT '',
  message TEXT DEFAULT '' CHECK (char_length(message) <= 1500),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'counseling', 'admitted', 'archived')),
  staff_notes TEXT DEFAULT '',
  handled_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Question Bank & Categories
CREATE TABLE IF NOT EXISTS public.question_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL DEFAULT '',
  academic_level TEXT NOT NULL DEFAULT 'HSC',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.question_categories(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'written')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'bn', 'bilingual')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  equation_latex TEXT DEFAULT '',
  diagram_svg TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "key": "A", "text": "...", "equation": "..." }]
  correct_option TEXT DEFAULT '', -- Restricted! Never exposed to students before release
  explanation TEXT DEFAULT '',
  marks NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (marks > 0),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Exams & Targeting
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  exam_type TEXT NOT NULL DEFAULT 'mixed' CHECK (exam_type IN ('mcq', 'written', 'mixed')),
  target_batch_ids UUID[] NOT NULL DEFAULT '{}',
  target_student_ids UUID[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  total_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  pass_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  randomize_questions BOOLEAN NOT NULL DEFAULT TRUE,
  randomize_options BOOLEAN NOT NULL DEFAULT TRUE,
  negative_marking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  negative_mark_value NUMERIC(5,2) NOT NULL DEFAULT 0.25 CHECK (negative_mark_value >= 0),
  grading_scale TEXT NOT NULL DEFAULT 'gpa_5' CHECK (grading_scale IN ('gpa_5', 'percentage')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  allow_answer_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  marks_override NUMERIC(6,2),
  UNIQUE (exam_id, question_id)
);

-- 11. Exam Attempts, Answers & Results
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_order UUID[] NOT NULL DEFAULT '{}',
  option_orders JSONB NOT NULL DEFAULT '{}'::jsonb,
  autosaved_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'graded')),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT DEFAULT '',
  written_text TEXT DEFAULT '',
  attachment_url TEXT DEFAULT '',
  is_correct BOOLEAN,
  auto_marks NUMERIC(6,2) NOT NULL DEFAULT 0,
  manual_marks NUMERIC(6,2),
  grader_feedback TEXT DEFAULT '',
  graded_by TEXT DEFAULT '',
  graded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  total_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  obtained_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  mcq_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  written_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
  negative_deducted NUMERIC(7,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  letter_grade TEXT NOT NULL DEFAULT 'F',
  gpa NUMERIC(3,2) NOT NULL DEFAULT 0,
  rank_in_batch INTEGER,
  rank_overall INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  hall_of_fame BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

-- 12. Resources Library
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'note', 'image', 'video', 'link')),
  category TEXT NOT NULL DEFAULT 'Lecture Sheet',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  access_level TEXT NOT NULL DEFAULT 'enrolled' CHECK (access_level IN ('public', 'enrolled', 'batch_specific')),
  file_url TEXT NOT NULL,
  storage_path TEXT DEFAULT '',
  file_size_bytes BIGINT DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Notices & Notifications
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  target_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  attachment_url TEXT DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_view TEXT DEFAULT 'portal',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Support Tickets & Realtime Messages
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Academic',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'staff')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Gallery, Testimonials, Media Library & Audit Logs
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Campus',
  caption TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  storage_path TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  achievement TEXT NOT NULL,
  cohort TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'sofs-media',
  storage_path TEXT DEFAULT '',
  public_url TEXT NOT NULL,
  mime_type TEXT DEFAULT '',
  size_bytes BIGINT DEFAULT 0,
  uploaded_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_course ON public.subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_course ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON public.exam_results(exam_id, obtained_marks DESC);
CREATE INDEX IF NOT EXISTS idx_resources_scope ON public.resources(course_id, batch_id, access_level);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Updated_at Triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'site_settings', 'admin_users', 'teachers', 'courses', 'subjects',
    'batches', 'batch_schedules', 'students', 'enrollments', 'admissions',
    'questions', 'exams', 'exam_answers', 'exam_results', 'resources',
    'notices', 'support_tickets'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Enabled & Locked Down on ALL Tables
-- ============================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Safe Published Content Only)
DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read published teachers" ON public.teachers;
CREATE POLICY "Public read published teachers" ON public.teachers FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read published courses" ON public.courses;
CREATE POLICY "Public read published courses" ON public.courses FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read published subjects" ON public.subjects;
CREATE POLICY "Public read published subjects" ON public.subjects FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read published batches" ON public.batches;
CREATE POLICY "Public read published batches" ON public.batches FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read schedules" ON public.batch_schedules;
CREATE POLICY "Public read schedules" ON public.batch_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read published notices" ON public.notices;
CREATE POLICY "Public read published notices" ON public.notices FOR SELECT USING (is_published = true AND target_batch_id IS NULL);

DROP POLICY IF EXISTS "Public read published gallery" ON public.gallery_items;
CREATE POLICY "Public read published gallery" ON public.gallery_items FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read published testimonials" ON public.testimonials;
CREATE POLICY "Public read published testimonials" ON public.testimonials FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read hall of fame" ON public.exam_results;
CREATE POLICY "Public read hall of fame" ON public.exam_results FOR SELECT USING (is_published = true AND hall_of_fame = true);

DROP POLICY IF EXISTS "Public read public resources" ON public.resources;
CREATE POLICY "Public read public resources" ON public.resources FOR SELECT USING (is_published = true AND access_level = 'public');

-- Admissions Security:
-- Public admission submissions are accepted exclusively via the server-side Worker API
-- (/api/sofs/admissions) using SUPABASE_SERVICE_ROLE_KEY (service_role / sb_secret_).
-- Anonymous users cannot directly read, insert, update, or delete admissions.
DROP POLICY IF EXISTS "Public insert admission" ON public.admissions;
DROP POLICY IF EXISTS "Admins manage admissions via verified JWT" ON public.admissions;
CREATE POLICY "Admins manage admissions via verified JWT" ON public.admissions
  FOR ALL
  USING (public.is_sofs_admin(ARRAY['super_admin', 'admission_manager']))
  WITH CHECK (public.is_sofs_admin(ARRAY['super_admin', 'admission_manager']));

-- Student Private Policies (When Firebase JWT claims are verified by Supabase)
DROP POLICY IF EXISTS "Student read own profile" ON public.students;
CREATE POLICY "Student read own profile" ON public.students
  FOR SELECT USING (firebase_uid = public.current_firebase_uid());

DROP POLICY IF EXISTS "Student update own safe profile" ON public.students;
CREATE POLICY "Student update own safe profile" ON public.students
  FOR UPDATE USING (firebase_uid = public.current_firebase_uid())
  WITH CHECK (firebase_uid = public.current_firebase_uid());

DROP POLICY IF EXISTS "Student read own enrollments" ON public.enrollments;
CREATE POLICY "Student read own enrollments" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = enrollments.student_id AND s.firebase_uid = public.current_firebase_uid())
  );

DROP POLICY IF EXISTS "Student read own notifications" ON public.notifications;
CREATE POLICY "Student read own notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = notifications.student_id AND s.firebase_uid = public.current_firebase_uid())
  );

DROP POLICY IF EXISTS "Student read own results when published" ON public.exam_results;
CREATE POLICY "Student read own results when published" ON public.exam_results
  FOR SELECT USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = exam_results.student_id AND s.firebase_uid = public.current_firebase_uid()
    )
  );

-- Explicit Deny on Sensitive Answer Keys & Admin Logs for anon/authenticated direct client queries
-- (Served through server-side Cloudflare Pages Functions using SUPABASE_SERVICE_ROLE_KEY after role/window checks)
DROP POLICY IF EXISTS "Admins manage all via verified JWT" ON public.admin_users;
CREATE POLICY "Admins manage all via verified JWT" ON public.admin_users
  FOR ALL USING (public.is_sofs_admin(ARRAY['super_admin']));

-- ============================================================================
-- SUPABASE STORAGE BUCKETS & POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('sofs-media', 'sofs-media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('sofs-gallery', 'sofs-gallery', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('sofs-questions', 'sofs-questions', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf']),
  ('sofs-resources', 'sofs-resources', false, 26214400, ARRAY['application/pdf','image/jpeg','image/png','image/webp','video/mp4'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read public SOFS buckets" ON storage.objects;
CREATE POLICY "Public read public SOFS buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('sofs-media', 'sofs-gallery', 'sofs-questions'));

-- Realtime publication setup for notices, notifications, and support messages
DO $$
DECLARE
  rt_tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH rt_tbl IN ARRAY ARRAY['notices', 'notifications', 'support_messages', 'support_tickets']
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = rt_tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rt_tbl);
      END IF;
    END LOOP;
  END IF;
END $$;
