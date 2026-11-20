import React, { useState } from 'react';
import { Award, CheckCircle2, Eye, Lock, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExamAttempt } from '../../types';
import {
  ExamAttemptDisplayKey,
  getExamAttemptStatusMeta,
} from '../../utils/examStatus';

export const ResultsGradingSection: React.FC = () => {
  const { exams, attempts, results, questions, students, adminUpsert } = useApp();
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
  const [attemptFilter, setAttemptFilter] = useState<'all' | ExamAttemptDisplayKey>('all');
  const [inspectedAttempt, setInspectedAttempt] = useState<ExamAttempt | null>(null);
  const [gradingDraft, setGradingDraft] = useState<
    Record<string, { marks: number; feedback: string }>
  >({});

  const exam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examResults = results.filter((r) => !exam || r.examId === exam.id);
  const examAttempts = attempts.filter((a) => !exam || a.examId === exam.id);
  const filteredAttempts = examAttempts.filter((a) =>
    attemptFilter === 'all' ? true : getExamAttemptStatusMeta(a).key === attemptFilter
  );
  const writtenQuestions = exam
    ? questions.filter((q) => exam.questionIds.includes(q.id) && q.questionType === 'written')
    : [];

  const avgPct = examResults.length
    ? Math.round((examResults.reduce((s, r) => s + r.percentage, 0) / examResults.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            Written Grading, Results Publication &amp; Hall of Fame
          </h2>
          <p className="text-xs text-[#4E5B53]">
            MCQs grade automatically on submit. Grade written answers here and control when students
            see results and answer keys.
          </p>
        </div>

        <select
          value={exam?.id || ''}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#DCE2DC] bg-white text-xs font-semibold"
        >
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {/* Exam Publication Controls */}
      {exam && (
        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#B47B2B]">
              {examResults.length} Evaluated Results &middot; Batch Average: {avgPct}%
            </p>
            <h3 className="font-serif text-xl font-bold text-[#111915]">{exam.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void adminUpsert('exams', {
                  ...exam,
                  resultsPublished: !exam.resultsPublished,
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border ${
                exam.resultsPublished
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                  : 'bg-[#F8F9F7] text-[#111915] border-[#DCE2DC]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exam.resultsPublished ? 'Results Published' : 'Publish Exam Results'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                void adminUpsert('exams', {
                  ...exam,
                  allowAnswerReview: !exam.allowAnswerReview,
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border ${
                exam.allowAnswerReview
                  ? 'bg-[#B47B2B] text-white border-[#B47B2B]'
                  : 'bg-[#F8F9F7] text-[#111915] border-[#DCE2DC]'
              }`}
            >
              {exam.allowAnswerReview ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>
                {exam.allowAnswerReview ? 'Answer Key Unlocked' : 'Answer Key Locked'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Exam Attempt Status & Fullscreen Violation Monitor */}
      <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#111915] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#0F3D2E]" />
              <span>Exam Attempt Status &amp; Fullscreen Proctoring Log</span>
            </h3>
            <p className="text-xs text-[#4E5B53]">
              Track normal submissions, fullscreen violation auto-submissions, time expirations, and active attempts.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${examAttempts.length})` },
              { id: 'completed_normal', label: 'Completed normally' },
              { id: 'fullscreen_violation', label: 'Fullscreen Violation' },
              { id: 'time_expired', label: 'Time expired' },
              { id: 'in_progress', label: 'In progress' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAttemptFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                  attemptFilter === f.id
                    ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                    : 'bg-[#F8F9F7] text-[#4E5B53] border-[#DCE2DC]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <p className="text-xs text-[#4E5B53]">No exam attempts match the selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE2DC] text-[#4E5B53]">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Violation Timestamp</th>
                  <th className="py-2 pr-4">Submitted At</th>
                  <th className="py-2 pr-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((att) => {
                  const st = students.find((s) => s.id === att.studentId);
                  const meta = getExamAttemptStatusMeta(att);
                  return (
                    <tr key={att.id} className="border-b border-[#EEF2EE]">
                      <td className="py-2.5 pr-4">
                        <p className="font-semibold text-[#111915]">
                          {st?.fullName || att.studentId}
                        </p>
                        {st?.studentCode && (
                          <p className="text-[11px] font-mono text-[#4E5B53]">{st.studentCode}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-[#4E5B53]">
                        {att.violationTimestamp
                          ? new Date(att.violationTimestamp).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-[#4E5B53]">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 pr-2">
                        <button
                          type="button"
                          onClick={() => setInspectedAttempt(att)}
                          className="px-2.5 py-1 rounded-lg border border-[#DCE2DC] text-[11px] font-semibold text-[#0F3D2E] hover:bg-[#EEF2EE]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Written Grading Workspace */}
      {writtenQuestions.length > 0 && examAttempts.length > 0 && (
        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#111915]">
            Manual Written Script Grading
          </h3>
          {examAttempts.map((att) => {
            const st = students.find((s) => s.id === att.studentId);
            return (
              <div
                key={att.id}
                className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] space-y-3"
              >
                <p className="text-xs font-semibold text-[#0F3D2E]">
                  Candidate: {st?.fullName || att.studentId} ({st?.studentCode || 'Student'})
                </p>
                {writtenQuestions.map((wq) => {
                  const ansRecord = att.answers.find((a) => a.questionId === wq.id);
                  const writtenText =
                    ansRecord?.writtenText || att.autosavedAnswers?.[wq.id]?.writtenText || '';
                  const draftKey = `${att.id}:${wq.id}`;
                  const draft = gradingDraft[draftKey] || {
                    marks: ansRecord?.manualMarks ?? 0,
                    feedback: ansRecord?.graderFeedback || '',
                  };

                  return (
                    <div
                      key={wq.id}
                      className="p-3 rounded-lg bg-white border border-[#DCE2DC] space-y-2 text-xs"
                    >
                      <p className="font-semibold text-[#111915]">
                        Q: {wq.questionText} (Max {wq.marks} marks)
                      </p>
                      <p className="p-2.5 rounded bg-[#F8F9F7] text-[#111915] whitespace-pre-line">
                        {writtenText || '(No written text submitted)'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          max={wq.marks}
                          step={0.5}
                          value={draft.marks}
                          onChange={(e) =>
                            setGradingDraft((p) => ({
                              ...p,
                              [draftKey]: { ...draft, marks: Number(e.target.value) },
                            }))
                          }
                          className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-[#DCE2DC]"
                          placeholder="Marks"
                        />
                        <input
                          type="text"
                          value={draft.feedback}
                          onChange={(e) =>
                            setGradingDraft((p) => ({
                              ...p,
                              [draftKey]: { ...draft, feedback: e.target.value },
                            }))
                          }
                          className="sm:col-span-8 px-2.5 py-1.5 rounded-lg border border-[#DCE2DC]"
                          placeholder="Grader rubric note..."
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void adminUpsert('exam_answers', {
                              attemptId: att.id,
                              questionId: wq.id,
                              manualMarks: draft.marks,
                              graderFeedback: draft.feedback,
                            })
                          }
                          className="sm:col-span-2 py-1.5 rounded-lg bg-[#0F3D2E] text-white font-semibold"
                        >
                          Save Grade
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Results Table & Hall of Fame Toggle */}
      <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#111915]">
          Result Ledger &amp; Hall of Fame Selection
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE2DC] text-[#4E5B53]">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">MCQ</th>
                <th className="py-2 pr-4">Written</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Grade / GPA</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4">Hall of Fame</th>
              </tr>
            </thead>
            <tbody>
              {examResults.map((res) => (
                <tr key={res.id} className="border-b border-[#EEF2EE]">
                  <td className="py-2.5 pr-4 font-semibold text-[#111915]">
                    {res.studentName || res.studentId}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{res.mcqMarks}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{res.writtenMarks}</td>
                  <td className="py-2.5 pr-4 font-bold tabular-nums text-[#0F3D2E]">
                    {res.obtainedMarks}/{res.totalMarks} ({res.percentage}%)
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    {res.letterGrade} ({res.gpa.toFixed(2)})
                  </td>
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() =>
                        void adminUpsert('exam_results', {
                          ...res,
                          isPublished: !res.isPublished,
                        })
                      }
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                        res.isPublished
                          ? 'bg-[#EEF2EE] text-[#0F3D2E]'
                          : 'bg-gray-100 text-[#4E5B53]'
                      }`}
                    >
                      {res.isPublished ? 'Published' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() =>
                        void adminUpsert('exam_results', {
                          ...res,
                          hallOfFame: !res.hallOfFame,
                        })
                      }
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                        res.hallOfFame
                          ? 'bg-[#B47B2B] text-white'
                          : 'bg-gray-100 text-[#4E5B53]'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      <span>{res.hallOfFame ? 'Featured' : 'Feature'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violation / Submission Details Modal */}
      {inspectedAttempt && (() => {
        const st = students.find((s) => s.id === inspectedAttempt.studentId);
        const ex = exams.find((e) => e.id === inspectedAttempt.examId);
        const meta = getExamAttemptStatusMeta(inspectedAttempt);
        const answeredTotal = Object.values(inspectedAttempt.autosavedAnswers || {}).filter(
          (v) => Boolean(v?.selectedOption?.trim() || v?.writtenText?.trim())
        ).length;

        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE2DC] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-[#DCE2DC] pb-3">
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#111915]">
                    Exam Submission &amp; Violation Details
                  </h4>
                  <p className="text-xs text-[#4E5B53]">{ex?.title || inspectedAttempt.examId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedAttempt(null)}
                  className="p-1.5 rounded-lg border border-[#DCE2DC] text-[#4E5B53] hover:text-[#111915]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Candidate</span>
                  <span className="font-semibold text-[#111915]">
                    {st?.fullName || inspectedAttempt.studentId}{' '}
                    {st?.studentCode ? `(${st.studentCode})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg border font-semibold ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Submission Reason</span>
                  <span className="font-semibold text-[#111915] text-right">
                    {meta.reasonLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Violation Timestamp</span>
                  <span className="font-mono tabular-nums text-[#111915]">
                    {inspectedAttempt.violationTimestamp
                      ? new Date(inspectedAttempt.violationTimestamp).toLocaleString()
                      : 'None recorded'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Started At</span>
                  <span className="font-mono tabular-nums text-[#111915]">
                    {new Date(inspectedAttempt.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Last Autosaved</span>
                  <span className="font-mono tabular-nums text-[#111915]">
                    {new Date(inspectedAttempt.lastSavedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Submitted At</span>
                  <span className="font-mono tabular-nums text-[#111915]">
                    {inspectedAttempt.submittedAt
                      ? new Date(inspectedAttempt.submittedAt).toLocaleString()
                      : 'Not submitted yet'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4E5B53]">Questions Answered</span>
                  <span className="font-mono tabular-nums font-semibold text-[#111915]">
                    {answeredTotal} / {inspectedAttempt.questionOrder.length || answeredTotal}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedAttempt(null)}
                  className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
