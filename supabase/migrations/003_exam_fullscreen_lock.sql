-- SOFS Academic Coaching - Fullscreen Exam Lock & Anti-Cheating Migration
-- Run in Supabase SQL Editor if upgrading an existing SOFS database.

ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS submission_reason TEXT NOT NULL DEFAULT 'normal'
  CHECK (submission_reason IN ('normal', 'fullscreen_violation', 'time_expired'));

ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS violation_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS violation_timestamp TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_exam_attempts_submission_reason
  ON public.exam_attempts (submission_reason);
