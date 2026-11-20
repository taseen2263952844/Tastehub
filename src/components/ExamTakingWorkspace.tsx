import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Maximize2,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExamAttempt, ExamResult, ExamSubmissionReason, Question } from '../types';
import { MathDiagramRenderer } from './MathDiagramRenderer';
import {
  clearStoredExamViolation,
  exitExamFullscreen,
  isFullscreenSupported,
  isInFullscreen,
  onFullscreenChange,
  readStoredExamViolation,
  requestExamFullscreen,
  writeStoredExamViolation,
} from '../utils/examFullscreen';

interface ViolationState {
  violationReason: string;
  violationTimestamp: string;
  startedAtMs: number;
  countdownSeconds: number;
}

const VIOLATION_COUNTDOWN_MS = 5000;

export const ExamTakingWorkspace: React.FC = () => {
  const {
    activeExamId,
    exams,
    setView,
    startOrResumeExam,
    autosaveExamAnswers,
    reportExamViolation,
    submitExamAttempt,
    showToast,
  } = useApp();

  const exam = useMemo(() => exams.find((e) => e.id === activeExamId) || null, [exams, activeExamId]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOption?: string; writtenText?: string; attachmentUrl?: string }>
  >({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submittedOutcome, setSubmittedOutcome] = useState<{
    autoSubmitted: boolean;
    submissionReason: ExamSubmissionReason;
    violationReason?: string;
    violationTimestamp?: string;
    resultPublished: boolean;
    result: ExamResult | null;
  } | null>(null);

  const [fullscreenSupported] = useState<boolean>(() => isFullscreenSupported());
  const [inFullscreen, setInFullscreen] = useState<boolean>(() => isInFullscreen());
  const [fullscreenGateOpen, setFullscreenGateOpen] = useState<boolean>(false);
  const [violationState, setViolationState] = useState<ViolationState | null>(null);

  const workspaceRootRef = useRef<HTMLDivElement | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const attemptRef = useRef<ExamAttempt | null>(attempt);
  attemptRef.current = attempt;
  const submittedFlagRef = useRef(false);
  const submittingRef = useRef(false);
  const enteredFullscreenRef = useRef(isInFullscreen());
  const violationActiveRef = useRef(false);
  const submittedOutcomeRef = useRef(submittedOutcome);
  submittedOutcomeRef.current = submittedOutcome;

  const performAutosave = useCallback(
    async (
      nextAnswers: Record<
        string,
        { selectedOption?: string; writtenText?: string; attachmentUrl?: string }
      >
    ) => {
      const currentAttempt = attemptRef.current;
      if (!currentAttempt || currentAttempt.status !== 'in_progress' || submittedOutcomeRef.current) {
        return;
      }
      setSaving(true);
      try {
        await autosaveExamAnswers(currentAttempt.id, nextAnswers);
        setLastSavedLabel(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } catch {
        // Silent retry on next cycle if transient network issue occurs
      } finally {
        setSaving(false);
      }
    },
    [autosaveExamAnswers]
  );

  const handleFinalizeSubmit = useCallback(
    async (opts?: {
      autoSubmitted?: boolean;
      submissionReason?: ExamSubmissionReason;
      violationReason?: string;
      violationTimestamp?: string;
    }) => {
      const currentAttempt = attemptRef.current;
      if (!currentAttempt || submittingRef.current) return;

      submittingRef.current = true;
      setSubmitting(true);
      setConfirmSubmitOpen(false);

      const submissionReason: ExamSubmissionReason =
        opts?.submissionReason || (opts?.autoSubmitted ? 'time_expired' : 'normal');
      const autoSubmitted = Boolean(opts?.autoSubmitted || submissionReason !== 'normal');

      try {
        const res = await submitExamAttempt(currentAttempt.id, answersRef.current, {
          autoSubmitted,
          submissionReason,
          violationReason: opts?.violationReason,
          violationTimestamp: opts?.violationTimestamp,
        });
        submittedFlagRef.current = true;
        violationActiveRef.current = false;
        setViolationState(null);
        setFullscreenGateOpen(false);
        clearStoredExamViolation(currentAttempt.id);
        setSubmittedOutcome({
          autoSubmitted,
          submissionReason,
          violationReason: opts?.violationReason,
          violationTimestamp: opts?.violationTimestamp,
          resultPublished: res.resultPublished,
          result: res.result,
        });
        void exitExamFullscreen();

        if (submissionReason === 'fullscreen_violation') {
          showToast(
            'Examination automatically submitted due to exiting fullscreen mode.',
            'error'
          );
        } else if (autoSubmitted) {
          showToast('Time expired — your answers were automatically submitted.', 'info');
        } else {
          showToast('Exam submitted successfully.', 'success');
        }
      } catch (err: any) {
        showToast(err?.message || 'Submission failed. Please retry.', 'error');
        submittedFlagRef.current = false;
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [showToast, submitExamAttempt]
  );

  const activateFullscreenViolation = useCallback(
    (reason: string, existingStartedAtMs?: number, existingTimestampIso?: string) => {
      const currentAttempt = attemptRef.current;
      if (
        !currentAttempt ||
        currentAttempt.status !== 'in_progress' ||
        submittedFlagRef.current ||
        submittedOutcomeRef.current ||
        violationActiveRef.current
      ) {
        return;
      }

      violationActiveRef.current = true;
      setConfirmSubmitOpen(false);
      setFullscreenGateOpen(false);

      const startedAtMs = existingStartedAtMs || Date.now();
      const timestampIso = existingTimestampIso || new Date(startedAtMs).toISOString();
      const remainingMs = Math.max(0, VIOLATION_COUNTDOWN_MS - (Date.now() - startedAtMs));
      const initialCountdown = Math.min(5, Math.max(0, Math.ceil(remainingMs / 1000)));

      writeStoredExamViolation({
        attemptId: currentAttempt.id,
        violationReason: reason,
        violationTimestamp: timestampIso,
        startedAtMs,
      });

      setViolationState({
        violationReason: reason,
        violationTimestamp: timestampIso,
        startedAtMs,
        countdownSeconds: initialCountdown,
      });

      // Immediately autosave current answers and persist violation timestamp to server
      void reportExamViolation(currentAttempt.id, reason, {
        autosavedAnswers: answersRef.current,
        keepalive: true,
      }).catch(() => {
        void performAutosave(answersRef.current);
      });
    },
    [performAutosave, reportExamViolation]
  );

  // Load / resume exam attempt
  useEffect(() => {
    if (!activeExamId) {
      setLoading(false);
      setLoadError('No exam selected.');
      return;
    }

    let cancelled = false;
    submittedFlagRef.current = false;
    violationActiveRef.current = false;
    setViolationState(null);
    setSubmittedOutcome(null);
    setLoading(true);
    setLoadError(null);

    startOrResumeExam(activeExamId)
      .then((res) => {
        if (cancelled) return;
        setAttempt(res.attempt);
        attemptRef.current = res.attempt;
        const qMap = new Map(res.questions.map((q) => [q.id, q]));
        const ordered = res.attempt.questionOrder
          .map((id) => qMap.get(id))
          .filter((q): q is Question => Boolean(q));
        setExamQuestions(ordered.length > 0 ? ordered : res.questions);
        setAnswers(res.attempt.autosavedAnswers || {});
        answersRef.current = res.attempt.autosavedAnswers || {};
        const remaining = Math.max(
          0,
          Math.floor((new Date(res.attempt.expiresAt).getTime() - Date.now()) / 1000)
        );
        setSecondsLeft(remaining);
        setLastSavedLabel(
          new Date(res.attempt.lastSavedAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        );

        if (res.attempt.status !== 'in_progress') {
          submittedFlagRef.current = true;
          clearStoredExamViolation(res.attempt.id);
          void exitExamFullscreen();
          const reason: ExamSubmissionReason =
            res.attempt.submissionReason ||
            (res.attempt.violationTimestamp
              ? 'fullscreen_violation'
              : res.attempt.status === 'auto_submitted'
              ? 'time_expired'
              : 'normal');
          setSubmittedOutcome({
            autoSubmitted: res.attempt.status === 'auto_submitted' || reason !== 'normal',
            submissionReason: reason,
            violationReason: res.attempt.violationReason,
            violationTimestamp: res.attempt.violationTimestamp,
            resultPublished: Boolean(exam?.resultsPublished),
            result: null,
          });
          return;
        }

        // Anti-refresh bypass check: resume active violation countdown if previously exited
        const storedViolation = readStoredExamViolation(res.attempt.id);
        const serverViolationMs = res.attempt.violationTimestamp
          ? new Date(res.attempt.violationTimestamp).getTime()
          : NaN;

        if (Number.isFinite(serverViolationMs)) {
          activateFullscreenViolation(
            res.attempt.violationReason || 'Exited fullscreen mode',
            serverViolationMs,
            res.attempt.violationTimestamp
          );
        } else if (storedViolation) {
          activateFullscreenViolation(
            storedViolation.violationReason,
            storedViolation.startedAtMs,
            storedViolation.violationTimestamp
          );
        } else if (fullscreenSupported && !isInFullscreen()) {
          // Wait briefly for Start Exam fullscreen transition to settle before gating
          setTimeout(() => {
            if (cancelled || submittedFlagRef.current || violationActiveRef.current) return;
            if (isInFullscreen()) {
              enteredFullscreenRef.current = true;
              setInFullscreen(true);
              setFullscreenGateOpen(false);
            } else {
              setFullscreenGateOpen(true);
            }
          }, 450);
        } else if (isInFullscreen()) {
          enteredFullscreenRef.current = true;
          setInFullscreen(true);
          setFullscreenGateOpen(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setLoadError(err?.message || 'Unable to start or resume exam.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeExamId]);

  // Monitor fullscreen transitions, tab/app visibility loss, and browser back-button navigation
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;

    // Push a history guard so Android back button / browser back triggers popstate instead of leaving
    try {
      window.history.pushState({ sofsExamLock: attempt.id }, '');
    } catch {
      // Ignore history API errors in constrained contexts
    }

    const unsubFullscreen = onFullscreenChange(() => {
      const nowFull = isInFullscreen();
      setInFullscreen(nowFull);
      if (nowFull) {
        enteredFullscreenRef.current = true;
        setFullscreenGateOpen(false);
      } else if (
        enteredFullscreenRef.current &&
        !submittedFlagRef.current &&
        !violationActiveRef.current
      ) {
        activateFullscreenViolation('Exited fullscreen mode');
      }
    });

    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        !submittedFlagRef.current &&
        !violationActiveRef.current &&
        (!fullscreenSupported || enteredFullscreenRef.current || !fullscreenGateOpen)
      ) {
        activateFullscreenViolation('Switched away from active examination screen');
      }
    };

    const handlePopState = () => {
      if (submittedFlagRef.current || submittedOutcomeRef.current) return;
      try {
        window.history.pushState({ sofsExamLock: attempt.id }, '');
      } catch {
        // Ignore
      }
      if (!violationActiveRef.current) {
        activateFullscreenViolation('Attempted back navigation during active examination');
      }
    };

    const handlePageHide = () => {
      if (submittedFlagRef.current || submittedOutcomeRef.current) return;
      if (violationActiveRef.current || enteredFullscreenRef.current) {
        const reason = violationActiveRef.current
          ? 'Exited fullscreen mode before page close'
          : 'Left examination window';
        const nowIso = new Date().toISOString();
        if (!readStoredExamViolation(attempt.id)) {
          writeStoredExamViolation({
            attemptId: attempt.id,
            violationReason: reason,
            violationTimestamp: nowIso,
            startedAtMs: Date.now(),
          });
        }
        void reportExamViolation(attempt.id, reason, {
          autosavedAnswers: answersRef.current,
          keepalive: true,
        }).catch(() => undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      unsubFullscreen();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [
    attempt?.id,
    attempt?.status,
    submittedOutcome,
    fullscreenSupported,
    fullscreenGateOpen,
    activateFullscreenViolation,
    reportExamViolation,
  ]);

  // 5-second wall-clock countdown + automatic submission when fullscreen violation is active
  useEffect(() => {
    if (!violationState || submittedOutcome || !attempt || attempt.status !== 'in_progress') {
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - violationState.startedAtMs;
      const remainingMs = Math.max(0, VIOLATION_COUNTDOWN_MS - elapsed);
      const nextSeconds = Math.min(5, Math.max(0, Math.ceil(remainingMs / 1000)));

      setViolationState((prev) =>
        prev && prev.countdownSeconds !== nextSeconds
          ? { ...prev, countdownSeconds: nextSeconds }
          : prev
      );

      if (remainingMs <= 0 && !submittedFlagRef.current && !submittingRef.current) {
        submittedFlagRef.current = true;
        void handleFinalizeSubmit({
          autoSubmitted: true,
          submissionReason: 'fullscreen_violation',
          violationReason: violationState.violationReason,
          violationTimestamp: violationState.violationTimestamp,
        });
      }
    };

    tick();
    const interval = setInterval(tick, 150);
    return () => clearInterval(interval);
  }, [violationState?.startedAtMs, attempt?.id, attempt?.status, submittedOutcome, handleFinalizeSubmit]);

  // Live exam countdown timer + auto-submit on expiry
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;

    const timer = setInterval(() => {
      const rem = Math.max(
        0,
        Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(rem);
      if (rem <= 0 && !submittedFlagRef.current && !violationActiveRef.current) {
        submittedFlagRef.current = true;
        void handleFinalizeSubmit({
          autoSubmitted: true,
          submissionReason: 'time_expired',
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt?.id, attempt?.expiresAt, attempt?.status, submittedOutcome, handleFinalizeSubmit]);

  // Periodic background autosave every 12s
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;
    const interval = setInterval(() => {
      void performAutosave(answersRef.current);
    }, 12000);
    return () => clearInterval(interval);
  }, [attempt?.id, attempt?.status, submittedOutcome, performAutosave]);

  const handleAnswerChange = (
    questionId: string,
    patch: { selectedOption?: string; writtenText?: string }
  ) => {
    if (violationState || fullscreenGateOpen || submitting || submittedFlagRef.current) return;
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...(prev[questionId] || {}),
          ...patch,
        },
      };
      // Trigger immediate autosave on MCQ option selection
      if (patch.selectedOption !== undefined) {
        void performAutosave(updated);
      }
      return updated;
    });
  };

  const handleEnterFullscreenClick = async () => {
    const ok = await requestExamFullscreen(workspaceRootRef.current || document.documentElement);
    if (ok || isInFullscreen()) {
      enteredFullscreenRef.current = true;
      setInFullscreen(true);
      setFullscreenGateOpen(false);
    } else {
      showToast(
        'Your browser blocked fullscreen entry. Continuing in locked focus mode.',
        'info'
      );
      setFullscreenGateOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F9F7] flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[#0F3D2E]" />
        <p className="text-sm text-[#4E5B53]">Preparing secure fullscreen exam workspace...</p>
      </div>
    );
  }

  if (loadError || !exam || !attempt) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F9F7] flex items-center justify-center p-6">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-700 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#111915]">Exam Unavailable</h2>
          <p className="text-sm text-[#4E5B53]">{loadError || 'Unable to load exam details.'}</p>
          <button
            type="button"
            onClick={() => {
              void exitExamFullscreen();
              setView('portal');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  if (submittedOutcome) {
    const isViolationSubmit = submittedOutcome.submissionReason === 'fullscreen_violation';
    const isTimeExpired = submittedOutcome.submissionReason === 'time_expired';

    return (
      <div className="min-h-[100dvh] bg-[#F8F9F7] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-center shadow-sm">
          {isViolationSubmit ? (
            <ShieldAlert className="w-12 h-12 text-red-700 mx-auto" />
          ) : (
            <CheckCircle2 className="w-12 h-12 text-[#0F3D2E] mx-auto" />
          )}

          <div className="space-y-1.5">
            <h1 className="font-serif text-2xl font-bold text-[#111915]">
              {isViolationSubmit
                ? 'Automatically Submitted — Fullscreen Violation'
                : isTimeExpired
                ? 'Time Expired — Script Auto-Submitted'
                : 'Exam Script Submitted'}
            </h1>
            <p className="text-sm text-[#4E5B53]">{exam.title}</p>
          </div>

          {isViolationSubmit && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1 text-left">
              <p className="font-semibold">
                Reason: {submittedOutcome.violationReason || 'Exited fullscreen mode'}
              </p>
              {submittedOutcome.violationTimestamp && (
                <p className="text-red-800">
                  Recorded at: {new Date(submittedOutcome.violationTimestamp).toLocaleString()}
                </p>
              )}
              <p className="text-red-800 pt-1">
                All answers entered prior to exiting fullscreen were saved and locked for grading.
              </p>
            </div>
          )}

          {submittedOutcome.resultPublished && submittedOutcome.result ? (
            <div className="p-4 rounded-xl bg-[#EEF2EE] border border-[#C8D4CA] space-y-2 text-sm">
              <p className="font-semibold text-[#0F3D2E]">Result Card Published</p>
              <p className="tabular-nums text-2xl font-serif font-bold text-[#111915]">
                {submittedOutcome.result.obtainedMarks} / {submittedOutcome.result.totalMarks} (
                {submittedOutcome.result.percentage}%)
              </p>
              <p className="text-xs text-[#4E5B53]">
                Grade: {submittedOutcome.result.letterGrade} &middot; GPA{' '}
                {submittedOutcome.result.gpa.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] text-xs text-[#4E5B53] leading-relaxed">
              Your responses have been recorded safely and locked. Objective MCQs are graded
              automatically, and full results (along with any written script feedback) will appear
              in your Student Portal once faculty publishes this exam's results.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void exitExamFullscreen();
              setView('portal');
            }}
            className="w-full py-3 rounded-xl bg-[#0F3D2E] text-white text-sm font-semibold"
          >
            Back to Student Portal
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentIdx];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isUrgent = secondsLeft <= 120;
  const examInteractionLocked = Boolean(violationState || fullscreenGateOpen || submitting);

  const answeredCount = examQuestions.filter((q) => {
    const a = answers[q.id];
    return Boolean(a?.selectedOption?.trim() || a?.writtenText?.trim());
  }).length;

  const orderedOptions = (() => {
    if (!currentQuestion) return [];
    const orderKeys = attempt.optionOrders?.[currentQuestion.id];
    if (!Array.isArray(orderKeys) || orderKeys.length === 0) return currentQuestion.options;
    const map = new Map(currentQuestion.options.map((o) => [o.key, o]));
    return orderKeys.map((k) => map.get(k)).filter((o): o is NonNullable<typeof o> => Boolean(o));
  })();

  return (
    <div
      ref={workspaceRootRef}
      className="min-h-[100dvh] overscroll-y-contain bg-[#F8F9F7] text-[#111915] flex flex-col relative"
    >
      {/* Underlying Exam Content (Blurred & Non-Interactive when Warning or Fullscreen Gate is Active) */}
      <div
        aria-hidden={examInteractionLocked}
        className={`flex flex-col flex-1 transition-all duration-150 ${
          violationState || fullscreenGateOpen
            ? 'blur-md pointer-events-none select-none opacity-35'
            : ''
        }`}
      >
        {/* Focused Exam Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#DCE2DC] px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                  inFullscreen
                    ? 'bg-[#EEF2EE] border-[#C8D4CA] text-[#0F3D2E]'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {inFullscreen
                    ? 'Fullscreen Locked'
                    : fullscreenSupported
                    ? 'Focus Lock'
                    : 'Mobile Locked Mode'}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-sm sm:text-lg font-bold text-[#111915] truncate">
                  {exam.title}
                </h1>
                <p className="text-[11px] text-[#4E5B53] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    Q {currentIdx + 1}/{examQuestions.length}
                  </span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span className="hidden sm:inline">
                    {exam.negativeMarkingEnabled
                      ? `Negative marking: -${exam.negativeMarkValue} per wrong MCQ`
                      : 'No negative marking'}
                  </span>
                  <span>&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <Save className="w-3 h-3" />
                    {saving
                      ? 'Saving...'
                      : lastSavedLabel
                      ? `Saved ${lastSavedLabel}`
                      : 'Autosave ready'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border font-mono text-xs sm:text-sm font-bold tabular-nums flex items-center gap-1.5 ${
                  isUrgent
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-[#EEF2EE] border-[#C8D4CA] text-[#0F3D2E]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{formattedTime}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!examInteractionLocked) setConfirmSubmitOpen(true);
                }}
                disabled={examInteractionLocked}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#16503D] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Split Workspace */}
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 flex-1">
          {/* Question Canvas */}
          <div className="lg:col-span-8 space-y-5">
            {currentQuestion ? (
              <div className="bg-white border border-[#DCE2DC] rounded-2xl p-4 sm:p-8 space-y-5 sm:space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE2DC] pb-3.5 text-xs text-[#4E5B53]">
                  <span className="font-semibold uppercase tracking-wider text-[#0F3D2E]">
                    Question {currentIdx + 1} &middot;{' '}
                    {currentQuestion.questionType === 'mcq' ? 'Objective MCQ' : 'Written Response'}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#111915]">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                <div className={currentQuestion.language === 'bn' ? 'font-bn text-base' : 'text-base'}>
                  <MathDiagramRenderer
                    text={currentQuestion.questionText}
                    equationLatex={currentQuestion.equationLatex}
                    diagramSvg={currentQuestion.diagramSvg}
                    imageUrl={currentQuestion.imageUrl}
                  />
                </div>

                {currentQuestion.questionType === 'mcq' ? (
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    {orderedOptions.map((opt, idx) => {
                      const selected = answers[currentQuestion.id]?.selectedOption === opt.key;
                      const displayLetter = String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={examInteractionLocked}
                          onClick={() =>
                            handleAnswerChange(currentQuestion.id, { selectedOption: opt.key })
                          }
                          className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                            selected
                              ? 'bg-[#EEF2EE] border-[#0F3D2E] ring-1 ring-[#0F3D2E]'
                              : 'bg-[#F8F9F7] border-[#DCE2DC] hover:border-[#0F3D2E]/40'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              selected
                                ? 'bg-[#0F3D2E] text-white'
                                : 'bg-white border border-[#DCE2DC] text-[#111915]'
                            }`}
                          >
                            {displayLetter}
                          </span>
                          <div className="flex-1 text-sm">
                            <MathDiagramRenderer text={opt.text} equationLatex={opt.equation} />
                          </div>
                        </button>
                      );
                    })}

                    {answers[currentQuestion.id]?.selectedOption && (
                      <button
                        type="button"
                        disabled={examInteractionLocked}
                        onClick={() =>
                          handleAnswerChange(currentQuestion.id, { selectedOption: '' })
                        }
                        className="text-xs text-[#4E5B53] hover:text-[#111915] underline"
                      >
                        Clear selected choice
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-semibold text-[#111915]">
                      Your Written Solution / Derivation
                    </label>
                    <textarea
                      rows={7}
                      disabled={examInteractionLocked}
                      value={answers[currentQuestion.id]?.writtenText || ''}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, { writtenText: e.target.value })
                      }
                      onBlur={() => void performAutosave(answers)}
                      placeholder="Write clear steps, formulas, or explanation here..."
                      className="w-full p-3.5 sm:p-4 rounded-xl border border-[#DCE2DC] bg-[#F8F9F7] text-sm leading-relaxed focus:outline-none focus:border-[#0F3D2E]"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#DCE2DC]">
                  <button
                    type="button"
                    disabled={currentIdx === 0 || examInteractionLocked}
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    className="px-3.5 sm:px-4 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={examInteractionLocked}
                    onClick={() => void performAutosave(answers)}
                    className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs font-medium text-[#4E5B53] hover:text-[#111915]"
                  >
                    Save Progress
                  </button>

                  <button
                    type="button"
                    disabled={currentIdx >= examQuestions.length - 1 || examInteractionLocked}
                    onClick={() =>
                      setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1))
                    }
                    className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#4E5B53]">This exam has no questions attached yet.</p>
            )}
          </div>

          {/* Right: Navigator & Security Instructions */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-base font-bold text-[#111915]">Question Navigator</h2>
                <span className="text-xs font-mono tabular-nums text-[#4E5B53]">
                  {answeredCount}/{examQuestions.length} answered
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                {examQuestions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isAnswered = Boolean(ans?.selectedOption?.trim() || ans?.writtenText?.trim());
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={examInteractionLocked}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-lg text-xs font-mono font-semibold tabular-nums border transition-colors ${
                        isCurrent
                          ? 'bg-[#111915] text-white border-[#111915]'
                          : isAnswered
                          ? 'bg-[#EEF2EE] text-[#0F3D2E] border-[#0F3D2E]/40'
                          : 'bg-white text-[#4E5B53] border-[#DCE2DC] hover:bg-[#F8F9F7]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] text-[11px] text-[#4E5B53] space-y-1">
                <p className="font-semibold text-[#0F3D2E] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fullscreen Exam Lock Active</span>
                </p>
                <p className="leading-relaxed">
                  Remain in fullscreen mode throughout the examination. Exiting fullscreen, switching
                  tabs, or pressing back triggers a 5-second warning followed by automatic submission.
                </p>
              </div>

              {exam.instructions && (
                <div className="pt-3 border-t border-[#DCE2DC] space-y-1">
                  <p className="text-xs font-semibold text-[#111915]">Exam Instructions</p>
                  <p className="text-xs text-[#4E5B53] leading-relaxed">{exam.instructions}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Re-Enter Fullscreen Gate (Shown only when resuming a page reload without fullscreen) */}
      {fullscreenGateOpen && !violationState && (
        <div className="fixed inset-0 z-[90] bg-[#0B1410]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2EE] text-[#0F3D2E] flex items-center justify-center mx-auto">
              <Maximize2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-[#111915]">
                Fullscreen Mode Required
              </h2>
              <p className="text-xs sm:text-sm text-[#4E5B53] leading-relaxed">
                This examination runs in strict fullscreen mode. Enter fullscreen to view and answer
                your questions. Once entered, exiting fullscreen will trigger automatic submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleEnterFullscreenClick()}
              className="w-full py-3 rounded-xl bg-[#0F3D2E] hover:bg-[#16503D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Enter Fullscreen &amp; Continue Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* 5-Second Fullscreen Exit Warning Overlay */}
      {violationState && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sofs-fullscreen-warning-title"
          className="fixed inset-0 z-[100] bg-[#140A0A]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-red-600 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2
                id="sofs-fullscreen-warning-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-red-700 leading-tight"
              >
                WARNING! You exited fullscreen mode.
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#111915]">
                Your examination will be automatically submitted in 5 seconds.
              </p>
            </div>

            <div className="py-4 px-6 rounded-2xl bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-1">
              <span className="text-5xl sm:text-6xl font-mono font-extrabold text-red-700 tabular-nums leading-none">
                {violationState.countdownSeconds}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-800 mt-1">
                {submitting || violationState.countdownSeconds === 0
                  ? 'Submitting Examination...'
                  : `Auto-submitting in ${violationState.countdownSeconds} ${
                      violationState.countdownSeconds === 1 ? 'second' : 'seconds'
                    }`}
              </span>
            </div>

            <div className="text-xs text-[#4E5B53] bg-[#F8F9F7] border border-[#DCE2DC] rounded-xl p-3 space-y-1">
              <p className="font-semibold text-[#111915]">
                Detected event: {violationState.violationReason}
              </p>
              <p>
                All already-provided answers are saved and locked. Questions and manual submission
                are disabled during automatic submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Submission Modal */}
      {confirmSubmitOpen && !violationState && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#111915]">
              Submit Final Exam Script?
            </h3>
            <p className="text-sm text-[#4E5B53] leading-relaxed">
              You have answered{' '}
              <span className="font-semibold text-[#111915] tabular-nums">
                {answeredCount} of {examQuestions.length}
              </span>{' '}
              questions. Once submitted, your script locks for grading.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DCE2DC] text-xs font-semibold"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void handleFinalizeSubmit({
                    autoSubmitted: false,
                    submissionReason: 'normal',
                  })
                }
                className="px-5 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm &amp; Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
