import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExamAttempt, ExamResult, Question } from '../types';
import { MathDiagramRenderer } from './MathDiagramRenderer';

export const ExamTakingWorkspace: React.FC = () => {
  const {
    activeExamId,
    exams,
    setView,
    startOrResumeExam,
    autosaveExamAnswers,
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
    resultPublished: boolean;
    result: ExamResult | null;
  } | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedFlagRef = useRef(false);

  useEffect(() => {
    if (!activeExamId) {
      setLoading(false);
      setLoadError('No exam selected.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    startOrResumeExam(activeExamId)
      .then((res) => {
        if (cancelled) return;
        setAttempt(res.attempt);
        // Order questions according to attempt.questionOrder
        const qMap = new Map(res.questions.map((q) => [q.id, q]));
        const ordered = res.attempt.questionOrder
          .map((id) => qMap.get(id))
          .filter((q): q is Question => Boolean(q));
        setExamQuestions(ordered.length > 0 ? ordered : res.questions);
        setAnswers(res.attempt.autosavedAnswers || {});
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
          setSubmittedOutcome({
            autoSubmitted: res.attempt.status === 'auto_submitted',
            resultPublished: Boolean(exam?.resultsPublished),
            result: null,
          });
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

  // Live countdown timer + auto-submit on expiry
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;

    const timer = setInterval(() => {
      const rem = Math.max(
        0,
        Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(rem);
      if (rem <= 0 && !submittedFlagRef.current) {
        submittedFlagRef.current = true;
        void handleFinalizeSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt?.id, attempt?.expiresAt, attempt?.status, submittedOutcome]);

  // Periodic background autosave every 12s
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;
    const interval = setInterval(() => {
      void performAutosave(answersRef.current);
    }, 12000);
    return () => clearInterval(interval);
  }, [attempt?.id, attempt?.status, submittedOutcome]);

  const performAutosave = async (
    nextAnswers: Record<string, { selectedOption?: string; writtenText?: string; attachmentUrl?: string }>
  ) => {
    if (!attempt || attempt.status !== 'in_progress' || submittedOutcome) return;
    setSaving(true);
    try {
      await autosaveExamAnswers(attempt.id, nextAnswers);
      setLastSavedLabel(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch {
      // Silent retry on next cycle if transient network issue occurs
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (
    questionId: string,
    patch: { selectedOption?: string; writtenText?: string }
  ) => {
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

  const handleFinalizeSubmit = async (autoSubmitted = false) => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setConfirmSubmitOpen(false);
    try {
      const res = await submitExamAttempt(attempt.id, answersRef.current, autoSubmitted);
      submittedFlagRef.current = true;
      setSubmittedOutcome({
        autoSubmitted,
        resultPublished: res.resultPublished,
        result: res.result,
      });
      showToast(
        autoSubmitted
          ? 'Time expired — your answers were automatically submitted.'
          : 'Exam submitted successfully.',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Submission failed. Please retry.', 'error');
      submittedFlagRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9F7] flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[#0F3D2E]" />
        <p className="text-sm text-[#4E5B53]">Preparing secure exam workspace...</p>
      </div>
    );
  }

  if (loadError || !exam || !attempt) {
    return (
      <div className="min-h-screen bg-[#F8F9F7] flex items-center justify-center p-6">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-700 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#111915]">Exam Unavailable</h2>
          <p className="text-sm text-[#4E5B53]">{loadError || 'Unable to load exam details.'}</p>
          <button
            type="button"
            onClick={() => setView('portal')}
            className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  if (submittedOutcome) {
    return (
      <div className="min-h-screen bg-[#F8F9F7] flex items-center justify-center p-6">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-lg w-full p-8 space-y-5 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-[#0F3D2E] mx-auto" />
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-bold text-[#111915]">
              {submittedOutcome.autoSubmitted
                ? 'Time Expired — Script Auto-Submitted'
                : 'Exam Script Submitted'}
            </h1>
            <p className="text-sm text-[#4E5B53]">{exam.title}</p>
          </div>

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
              Your responses have been recorded safely. Objective MCQs are graded automatically, and
              full results (along with any written script feedback) will appear in your Student Portal
              once faculty publishes this exam's results.
            </div>
          )}

          <button
            type="button"
            onClick={() => setView('portal')}
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
    <div className="min-h-screen bg-[#F8F9F7] text-[#111915] flex flex-col">
      {/* Focused Exam Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DCE2DC] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                void performAutosave(answers);
                setView('portal');
              }}
              className="p-2 rounded-lg border border-[#DCE2DC] text-[#4E5B53] hover:text-[#111915]"
              title="Pause & return to portal (timer continues)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-lg font-bold text-[#111915] truncate">
                {exam.title}
              </h1>
              <p className="text-[11px] text-[#4E5B53] flex flex-wrap items-center gap-2">
                <span>
                  Question {currentIdx + 1} of {examQuestions.length}
                </span>
                <span>&middot;</span>
                <span>
                  {exam.negativeMarkingEnabled
                    ? `Negative marking: -${exam.negativeMarkValue} per wrong MCQ`
                    : 'No negative marking'}
                </span>
                <span>&middot;</span>
                <span className="inline-flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  {saving ? 'Saving...' : lastSavedLabel ? `Saved ${lastSavedLabel}` : 'Autosave ready'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`px-3.5 py-2 rounded-xl border font-mono text-sm font-bold tabular-nums flex items-center gap-2 ${
                isUrgent
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-[#EEF2EE] border-[#C8D4CA] text-[#0F3D2E]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formattedTime}</span>
            </div>

            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#16503D] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Question Canvas */}
        <div className="lg:col-span-8 space-y-5">
          {currentQuestion ? (
            <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE2DC] pb-4 text-xs text-[#4E5B53]">
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
                <div className="space-y-3 pt-2">
                  {orderedOptions.map((opt, idx) => {
                    const selected = answers[currentQuestion.id]?.selectedOption === opt.key;
                    const displayLetter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          handleAnswerChange(currentQuestion.id, { selectedOption: opt.key })
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
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
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-[#111915]">
                    Your Written Solution / Derivation
                  </label>
                  <textarea
                    rows={8}
                    value={answers[currentQuestion.id]?.writtenText || ''}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, { writtenText: e.target.value })
                    }
                    onBlur={() => void performAutosave(answers)}
                    placeholder="Write clear steps, formulas, or explanation here..."
                    className="w-full p-4 rounded-xl border border-[#DCE2DC] bg-[#F8F9F7] text-sm leading-relaxed focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#DCE2DC]">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => void performAutosave(answers)}
                  className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] text-xs font-medium text-[#4E5B53] hover:text-[#111915]"
                >
                  Save Progress Now
                </button>

                <button
                  type="button"
                  disabled={currentIdx >= examQuestions.length - 1}
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1))
                  }
                  className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
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

        {/* Right: Navigator & Instructions */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-[#111915]">Question Navigator</h2>
              <span className="text-xs font-mono tabular-nums text-[#4E5B53]">
                {answeredCount}/{examQuestions.length} answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = Boolean(ans?.selectedOption?.trim() || ans?.writtenText?.trim());
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
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

            {exam.instructions && (
              <div className="pt-3 border-t border-[#DCE2DC] space-y-1">
                <p className="text-xs font-semibold text-[#111915]">Exam Instructions</p>
                <p className="text-xs text-[#4E5B53] leading-relaxed">{exam.instructions}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Confirm Submission Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
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
                onClick={() => void handleFinalizeSubmit(false)}
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
