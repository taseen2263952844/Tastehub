import React from 'react';
import { Award, CheckCircle2, Lock, Printer, X, XCircle } from 'lucide-react';
import { Exam, ExamAttempt, ExamResult, Question, SiteSettings, StudentProfile } from '../types';
import { MathDiagramRenderer } from './MathDiagramRenderer';

interface ResultCardViewProps {
  result: ExamResult;
  exam?: Exam;
  attempt?: ExamAttempt;
  questions: Question[];
  student?: StudentProfile | null;
  siteSettings: SiteSettings;
  onClose?: () => void;
}

export const ResultCardView: React.FC<ResultCardViewProps> = ({
  result,
  exam,
  attempt,
  questions,
  student,
  siteSettings,
  onClose,
}) => {
  const canReviewAnswers = Boolean(exam?.resultsPublished && exam?.allowAnswerReview);
  const examQuestions = exam
    ? questions.filter((q) => exam.questionIds.includes(q.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
      <div className="bg-white border border-[#DCE2DC] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 print-card">
        {/* Top Screen-Only Controls */}
        <div className="px-6 py-4 bg-[#EEF2EE] border-b border-[#DCE2DC] flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F3D2E]">
            Official SOFS Academic Result Card
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg border border-[#DCE2DC] bg-white text-[#4E5B53] hover:text-[#111915]"
                aria-label="Close result card"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Transcript Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#DCE2DC] pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B47B2B]">
                {siteSettings.instituteName}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111915] mt-1">
                {exam?.title || 'Academic Assessment Transcript'}
              </h2>
              <p className="text-xs text-[#4E5B53] mt-1">{siteSettings.campusAddress}</p>
            </div>
            <div className="text-left sm:text-right text-xs text-[#4E5B53] space-y-1 tabular-nums">
              <p>
                Student ID:{' '}
                <span className="font-mono font-semibold text-[#111915]">
                  {result.studentCode || student?.studentCode || 'SOFS'}
                </span>
              </p>
              <p>
                Published:{' '}
                {result.publishedAt
                  ? new Date(result.publishedAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Student Identity & Primary Score Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC]">
              <p className="text-[11px] uppercase tracking-wider text-[#4E5B53]">Candidate</p>
              <p className="font-serif text-lg font-bold text-[#111915] mt-1">
                {result.studentName || student?.fullName}
              </p>
              <p className="text-xs text-[#4E5B53]">{result.batchName || student?.academicLevel}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#EEF2EE] border border-[#C8D4CA]">
              <p className="text-[11px] uppercase tracking-wider text-[#0F3D2E]">Total Score</p>
              <p className="font-serif text-2xl font-bold text-[#0F3D2E] tabular-nums mt-1">
                {result.obtainedMarks} / {result.totalMarks}
              </p>
              <p className="text-xs text-[#0F3D2E] tabular-nums font-medium">
                {result.percentage}% overall
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC]">
              <p className="text-[11px] uppercase tracking-wider text-[#4E5B53]">Grade &amp; GPA</p>
              <p className="font-serif text-2xl font-bold text-[#111915] tabular-nums mt-1">
                {result.letterGrade} &middot; {result.gpa.toFixed(2)}
              </p>
              <p className="text-xs text-[#4E5B53]">Scale: 5.00 GPA</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC]">
              <p className="text-[11px] uppercase tracking-wider text-[#4E5B53]">Merit Standing</p>
              <p className="font-serif text-2xl font-bold text-[#B47B2B] tabular-nums mt-1 flex items-center gap-1.5">
                <Award className="w-5 h-5" />
                <span>{result.rankInBatch ? `#${result.rankInBatch}` : 'Evaluated'}</span>
              </p>
              <p className="text-xs text-[#4E5B53]">
                {result.rankOverall ? `Overall Rank #${result.rankOverall}` : 'Verified Script'}
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-[#DCE2DC] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF2EE]/70 border-b border-[#DCE2DC] text-[#4E5B53]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Objective MCQ</th>
                  <th className="py-2.5 px-4 font-semibold">Written Section</th>
                  <th className="py-2.5 px-4 font-semibold">Negative Deducted</th>
                  <th className="py-2.5 px-4 font-semibold">Final Obtained</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-sm font-semibold text-[#111915] tabular-nums">
                  <td className="py-3 px-4">{result.mcqMarks}</td>
                  <td className="py-3 px-4">{result.writtenMarks}</td>
                  <td className="py-3 px-4 text-red-700">-{result.negativeDeducted}</td>
                  <td className="py-3 px-4 text-[#0F3D2E]">{result.obtainedMarks}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {result.remarks && (
            <div className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] text-xs text-[#111915]">
              <span className="font-semibold">Examiner Remarks:</span> {result.remarks}
            </div>
          )}

          {/* Detailed Answer Review (Only When Admin Enables allowAnswerReview) */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-xl font-bold text-[#111915] border-b border-[#DCE2DC] pb-2">
              Answer Script Review
            </h3>

            {!canReviewAnswers ? (
              <div className="p-5 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] flex items-center gap-3 text-xs text-[#4E5B53]">
                <Lock className="w-4 h-4 text-[#B47B2B] shrink-0" />
                <span>
                  Detailed solution review and correct answer keys remain locked until the faculty
                  team enables review access for this assessment.
                </span>
              </div>
            ) : examQuestions.length === 0 ? (
              <p className="text-xs text-[#4E5B53]">Question review breakdown unavailable.</p>
            ) : (
              <div className="space-y-4">
                {examQuestions.map((q, idx) => {
                  const studentAns =
                    attempt?.answers?.find((a) => a.questionId === q.id) ||
                    (attempt?.autosavedAnswers?.[q.id]
                      ? {
                          selectedOption: attempt.autosavedAnswers[q.id].selectedOption,
                          writtenText: attempt.autosavedAnswers[q.id].writtenText,
                          autoMarks: 0,
                          manualMarks: null,
                          isCorrect: null,
                          graderFeedback: '',
                        }
                      : null);
                  const isCorrect =
                    q.questionType === 'mcq' &&
                    studentAns?.selectedOption &&
                    studentAns.selectedOption === q.correctOption;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-[#DCE2DC] bg-[#F8F9F7] space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#111915]">
                          Q{idx + 1} ({q.questionType.toUpperCase()})
                        </span>
                        <span className="font-mono tabular-nums">
                          {q.questionType === 'mcq' ? (
                            isCorrect ? (
                              <span className="text-[#0F3D2E] inline-flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marks})
                              </span>
                            ) : (
                              <span className="text-red-700 inline-flex items-center gap-1 font-semibold">
                                <XCircle className="w-3.5 h-3.5" /> Selected:{' '}
                                {studentAns?.selectedOption || 'Unanswered'} &middot; Key:{' '}
                                {q.correctOption}
                              </span>
                            )
                          ) : (
                            <span className="font-semibold text-[#0F3D2E]">
                              Written Marks: {studentAns?.manualMarks ?? 'Pending'} / {q.marks}
                            </span>
                          )}
                        </span>
                      </div>

                      <MathDiagramRenderer text={q.questionText} equationLatex={q.equationLatex} />

                      {q.questionType === 'written' && studentAns?.writtenText && (
                        <div className="p-3 rounded-lg bg-white border border-[#DCE2DC] text-[#111915]">
                          <p className="font-semibold text-[11px] text-[#4E5B53] mb-1">
                            Your Answer:
                          </p>
                          <p className="whitespace-pre-line">{studentAns.writtenText}</p>
                        </div>
                      )}

                      {studentAns?.graderFeedback && (
                        <p className="text-[#0F3D2E] font-medium">
                          Grader Feedback: {studentAns.graderFeedback}
                        </p>
                      )}

                      {q.explanation && (
                        <div className="p-3 rounded-lg bg-[#EEF2EE] text-[#111915]">
                          <span className="font-semibold">Solution Note: </span>
                          <MathDiagramRenderer text={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
