import { ExamAttempt, ExamSubmissionReason } from '../types';

export type ExamAttemptDisplayKey =
  | 'completed_normal'
  | 'fullscreen_violation'
  | 'time_expired'
  | 'in_progress';

export interface ExamAttemptStatusMeta {
  key: ExamAttemptDisplayKey;
  label: string;
  badgeClass: string;
  reasonLabel: string;
}

export function resolveExamSubmissionReason(attempt: ExamAttempt): ExamSubmissionReason {
  if (attempt.submissionReason) return attempt.submissionReason;
  if (attempt.violationTimestamp) return 'fullscreen_violation';
  if (attempt.status === 'auto_submitted') return 'time_expired';
  return 'normal';
}

export function getExamAttemptStatusMeta(attempt: ExamAttempt): ExamAttemptStatusMeta {
  if (attempt.status === 'in_progress') {
    return {
      key: 'in_progress',
      label: 'In progress',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      reasonLabel: attempt.violationTimestamp
        ? `Fullscreen violation detected (${attempt.violationReason || 'Exited fullscreen'})`
        : 'Active attempt in progress',
    };
  }

  const reason = resolveExamSubmissionReason(attempt);
  if (reason === 'fullscreen_violation') {
    return {
      key: 'fullscreen_violation',
      label: 'Automatically submitted (Fullscreen Violation)',
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
      reasonLabel: attempt.violationReason || 'Exited fullscreen mode during active exam',
    };
  }

  if (reason === 'time_expired') {
    return {
      key: 'time_expired',
      label: 'Time expired',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      reasonLabel: 'Exam timer elapsed — script automatically submitted',
    };
  }

  return {
    key: 'completed_normal',
    label: 'Completed normally',
    badgeClass: 'bg-[#EEF2EE] text-[#0F3D2E] border-[#C8D4CA]',
    reasonLabel: 'Submitted normally by student',
  };
}
