import React, { useState } from 'react';
import {
  CheckSquare,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Question } from '../../types';
import { MathDiagramRenderer } from '../MathDiagramRenderer';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ExamsQuestionsSection: React.FC = () => {
  const {
    questions,
    questionCategories,
    subjects,
    courses,
    batches,
    exams,
    attempts,
    students,
    adminUpsert,
    adminDelete,
    uploadMediaAsset,
    extractQuestionsWithGemini,
    showToast,
  } = useApp();

  const [subTab, setSubTab] = useState<'questions' | 'exams' | 'monitor'>('questions');
  const [deleteTarget, setDeleteTarget] = useState<{
    entity: string;
    id: string;
    label: string;
  } | null>(null);

  // Category quick form
  const [catName, setCatName] = useState('');

  // Question Form
  const [qForm, setQForm] = useState({
    id: '',
    categoryId: questionCategories[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    questionType: 'mcq' as 'mcq' | 'written',
    language: 'bilingual' as 'en' | 'bn' | 'bilingual',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionText: '',
    equationLatex: '',
    diagramSvg: '',
    imageUrl: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctOption: 'A',
    explanation: '',
    marks: 1,
  });

  // Gemini OCR state
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrSubjectHint, setOcrSubjectHint] = useState('HSC Physics & Higher Mathematics');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrExtracted, setOcrExtracted] = useState<
    Array<Partial<Question> & { include: boolean }>
  >([]);

  // Exam Form
  const [examForm, setExamForm] = useState({
    id: '',
    title: '',
    courseId: courses[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    description: '',
    instructions: 'Answer carefully. Timer autosaves progress.',
    examType: 'mixed' as 'mcq' | 'written' | 'mixed',
    targetBatchIds: [] as string[],
    questionIds: [] as string[],
    startsAt: new Date(Date.now() - 3600_000).toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16),
    durationMinutes: 30,
    passMarks: 10,
    randomizeQuestions: true,
    randomizeOptions: true,
    negativeMarkingEnabled: true,
    negativeMarkValue: 0.25,
    isPublished: true,
    resultsPublished: false,
    allowAnswerReview: false,
  });

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const options =
      qForm.questionType === 'mcq'
        ? [
            { key: 'A', text: qForm.optA },
            { key: 'B', text: qForm.optB },
            { key: 'C', text: qForm.optC },
            { key: 'D', text: qForm.optD },
          ].filter((o) => o.text.trim())
        : [];

    await adminUpsert('questions', {
      ...(qForm.id ? { id: qForm.id } : {}),
      categoryId: qForm.categoryId || undefined,
      subjectId: qForm.subjectId || undefined,
      questionType: qForm.questionType,
      language: qForm.language,
      difficulty: qForm.difficulty,
      questionText: qForm.questionText,
      equationLatex: qForm.equationLatex,
      diagramSvg: qForm.diagramSvg,
      imageUrl: qForm.imageUrl,
      options,
      correctOption: qForm.questionType === 'mcq' ? qForm.correctOption : '',
      explanation: qForm.explanation,
      marks: Number(qForm.marks || 1),
      tags: [],
    });

    setQForm({
      ...qForm,
      id: '',
      questionText: '',
      equationLatex: '',
      diagramSvg: '',
      imageUrl: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      explanation: '',
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      const asset = await uploadMediaAsset(file, 'sofs-questions');
      setQForm((prev) => ({ ...prev, imageUrl: asset.publicUrl }));
    } catch (err: any) {
      showToast(err?.message || 'Image upload failed.', 'error');
    }
  };

  const handleOcrFileSelect = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrExtracted([]);
    try {
      const items = await extractQuestionsWithGemini(file, ocrSubjectHint);
      if (items.length === 0) {
        setOcrError('No clear questions were detected in the uploaded image.');
      } else {
        setOcrExtracted(items.map((item) => ({ ...item, include: true })));
      }
    } catch (err: any) {
      setOcrError(err?.message || 'Gemini OCR request failed.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCommitOcrQuestions = async () => {
    const selected = ocrExtracted.filter((q) => q.include);
    for (const q of selected) {
      await adminUpsert('questions', {
        categoryId: qForm.categoryId || undefined,
        subjectId: qForm.subjectId || undefined,
        questionType: q.questionType || 'mcq',
        language: q.language || 'bilingual',
        difficulty: q.difficulty || 'medium',
        questionText: q.questionText || '',
        equationLatex: q.equationLatex || '',
        diagramSvg: '',
        imageUrl: '',
        options: q.options || [],
        correctOption: q.correctOption || '',
        explanation: q.explanation || '',
        marks: Number(q.marks || 1),
        tags: ['gemini-ocr'],
      });
    }
    setOcrOpen(false);
    setOcrExtracted([]);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMarks = examForm.questionIds.reduce((sum, qId) => {
      const q = questions.find((item) => item.id === qId);
      return sum + Number(q?.marks || 0);
    }, 0);

    await adminUpsert('exams', {
      ...(examForm.id ? { id: examForm.id } : {}),
      title: examForm.title,
      courseId: examForm.courseId || undefined,
      subjectId: examForm.subjectId || undefined,
      description: examForm.description,
      instructions: examForm.instructions,
      examType: examForm.examType,
      targetBatchIds: examForm.targetBatchIds,
      targetStudentIds: [],
      questionIds: examForm.questionIds,
      startsAt: new Date(examForm.startsAt).toISOString(),
      endsAt: new Date(examForm.endsAt).toISOString(),
      durationMinutes: Number(examForm.durationMinutes),
      totalMarks: totalMarks || 10,
      passMarks: Number(examForm.passMarks),
      randomizeQuestions: examForm.randomizeQuestions,
      randomizeOptions: examForm.randomizeOptions,
      negativeMarkingEnabled: examForm.negativeMarkingEnabled,
      negativeMarkValue: Number(examForm.negativeMarkValue),
      gradingScale: 'gpa_5',
      isPublished: examForm.isPublished,
      resultsPublished: examForm.resultsPublished,
      allowAnswerReview: examForm.allowAnswerReview,
    });

    setExamForm({ ...examForm, id: '', title: '', description: '', questionIds: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            Question Bank, Gemini OCR &amp; Exam Engine
          </h2>
          <p className="text-xs text-[#4E5B53]">
            Supports Bangla/English scripts, KaTeX equations, SVG vector diagrams, and secure answer
            keys.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOcrOpen((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-[#B47B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Question OCR</span>
          </button>
          {[
            { id: 'questions', label: `Question Bank (${questions.length})` },
            { id: 'exams', label: `Exams (${exams.length})` },
            { id: 'monitor', label: `Attempt Monitor (${attempts.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                subTab === t.id
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                  : 'bg-white text-[#4E5B53] border-[#DCE2DC]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Gemini OCR Extraction Drawer */}
      {ocrOpen && (
        <div className="bg-white border-2 border-[#B47B2B] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#111915] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B47B2B]" />
                <span>Gemini OCR Question Sheet Importer (Review Before Saving)</span>
              </h3>
              <p className="text-xs text-[#4E5B53]">
                Upload a printed Bangla/English question sheet photo or PDF to extract structured
                MCQ/written items with KaTeX math.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOcrOpen(false)}
              className="text-xs font-semibold text-[#4E5B53] hover:text-[#111915]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <input
              type="text"
              value={ocrSubjectHint}
              onChange={(e) => setOcrSubjectHint(e.target.value)}
              placeholder="Subject / Chapter hint"
              className="px-3.5 py-2.5 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <label className="px-4 py-2.5 rounded-xl bg-[#EEF2EE] border border-[#C8D4CA] text-xs font-semibold text-[#0F3D2E] cursor-pointer inline-flex items-center justify-center gap-2">
              {ocrLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{ocrLoading ? 'Extracting with Gemini...' : 'Select Question Sheet Image/PDF'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={ocrLoading}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleOcrFileSelect(file);
                }}
              />
            </label>
          </div>

          {ocrError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {ocrError}
            </div>
          )}

          {ocrExtracted.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-[#0F3D2E]">
                Extracted {ocrExtracted.length} questions — verify and edit before saving:
              </p>
              {ocrExtracted.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        checked={item.include}
                        onChange={(e) =>
                          setOcrExtracted((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, include: e.target.checked } : x))
                          )
                        }
                      />
                      <span>
                        Question {idx + 1} ({item.questionType} · {item.language})
                      </span>
                    </label>
                    <span className="font-mono">Correct Key: {item.correctOption || 'N/A'}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={item.questionText || ''}
                    onChange={(e) =>
                      setOcrExtracted((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, questionText: e.target.value } : x))
                      )
                    }
                    className="w-full p-2 rounded-lg border border-[#DCE2DC] bg-white"
                  />
                  {item.equationLatex && (
                    <p className="font-mono text-[11px] text-[#0F3D2E]">
                      KaTeX: {item.equationLatex}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => void handleCommitOcrQuestions()}
                className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
              >
                Save Checked Questions to Bank
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {subTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleSaveQuestion}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-serif text-lg font-bold text-[#111915]">
                {qForm.id ? 'Edit Question' : 'Author Question'}
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={qForm.questionType}
                  onChange={(e) => setQForm({ ...qForm, questionType: e.target.value as any })}
                  className="px-2.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="mcq">MCQ</option>
                  <option value="written">Written</option>
                </select>
                <select
                  value={qForm.language}
                  onChange={(e) => setQForm({ ...qForm, language: e.target.value as any })}
                  className="px-2.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="bilingual">Bilingual</option>
                  <option value="en">English</option>
                  <option value="bn">Bangla</option>
                </select>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={qForm.marks}
                  onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
                  placeholder="Marks"
                  className="px-2.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={qForm.categoryId}
                  onChange={(e) => setQForm({ ...qForm, categoryId: e.target.value })}
                  className="px-2.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="">Select Category</option>
                  {questionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={qForm.subjectId}
                  onChange={(e) => setQForm({ ...qForm, subjectId: e.target.value })}
                  className="px-2.5 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={3}
                required
                placeholder="Question prompt (supports Bangla Unicode and inline $LaTeX$)"
                value={qForm.questionText}
                onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs font-bn"
              />

              <input
                type="text"
                placeholder="Display KaTeX equation (optional, e.g. \int_0^{\pi} \sin x \, dx)"
                value={qForm.equationLatex}
                onChange={(e) => setQForm({ ...qForm, equationLatex: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs font-mono"
              />

              <textarea
                rows={2}
                placeholder="Optional inline <svg>...</svg> diagram markup"
                value={qForm.diagramSvg}
                onChange={(e) => setQForm({ ...qForm, diagramSvg: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE2DC] text-[11px] font-mono"
              />

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Optional Diagram Image URL"
                  value={qForm.imageUrl}
                  onChange={(e) => setQForm({ ...qForm, imageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
                <label className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs cursor-pointer hover:bg-[#F8F9F7]">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleImageUpload(f);
                    }}
                  />
                </label>
              </div>

              {qForm.questionType === 'mcq' && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={qForm.optA}
                      onChange={(e) => setQForm({ ...qForm, optA: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={qForm.optB}
                      onChange={(e) => setQForm({ ...qForm, optB: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={qForm.optC}
                      onChange={(e) => setQForm({ ...qForm, optC: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={qForm.optD}
                      onChange={(e) => setQForm({ ...qForm, optD: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">Correct Answer Key:</span>
                    <select
                      value={qForm.correctOption}
                      onChange={(e) => setQForm({ ...qForm, correctOption: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DCE2DC]"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
              )}

              <textarea
                rows={2}
                placeholder="Solution / Rubric Explanation (hidden from students until review enabled)"
                value={qForm.explanation}
                onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE2DC] text-xs"
              />

              {(qForm.questionText || qForm.equationLatex || qForm.diagramSvg) && (
                <div className="p-3 rounded-xl bg-[#F8F9F7] border border-[#DCE2DC] text-xs space-y-1">
                  <p className="font-semibold text-[#4E5B53] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Live KaTeX &amp; Diagram Preview
                  </p>
                  <MathDiagramRenderer
                    text={qForm.questionText}
                    equationLatex={qForm.equationLatex}
                    diagramSvg={qForm.diagramSvg}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{qForm.id ? 'Update Question' : 'Add to Question Bank'}</span>
              </button>
            </form>

            {/* Category Quick Add */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!catName.trim()) return;
                await adminUpsert('question_categories', {
                  name: catName.trim(),
                  subjectName: 'General',
                  academicLevel: 'HSC',
                });
                setCatName('');
              }}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex gap-2"
            >
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="New question category..."
                className="flex-1 px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#EEF2EE] text-[#0F3D2E] text-xs font-semibold"
              >
                Add Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-[#DCE2DC] rounded-2xl p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-semibold text-[#B47B2B] uppercase">
                    {q.questionType} &middot; {q.language} &middot; {q.marks} Marks{' '}
                    {q.correctOption ? `· Key: ${q.correctOption}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setQForm({
                          id: q.id,
                          categoryId: q.categoryId || '',
                          subjectId: q.subjectId || '',
                          questionType: q.questionType,
                          language: q.language,
                          difficulty: q.difficulty,
                          questionText: q.questionText,
                          equationLatex: q.equationLatex || '',
                          diagramSvg: q.diagramSvg || '',
                          imageUrl: q.imageUrl || '',
                          optA: q.options.find((o) => o.key === 'A')?.text || '',
                          optB: q.options.find((o) => o.key === 'B')?.text || '',
                          optC: q.options.find((o) => o.key === 'C')?.text || '',
                          optD: q.options.find((o) => o.key === 'D')?.text || '',
                          correctOption: q.correctOption || 'A',
                          explanation: q.explanation || '',
                          marks: q.marks,
                        })
                      }
                      className="p-1.5 rounded-lg border border-[#DCE2DC]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          entity: 'questions',
                          id: q.id,
                          label: q.questionText.slice(0, 60),
                        })
                      }
                      className="p-1.5 rounded-lg border border-red-200 text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs">
                  <MathDiagramRenderer
                    text={q.questionText}
                    equationLatex={q.equationLatex}
                    diagramSvg={q.diagramSvg}
                    imageUrl={q.imageUrl}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXAMS BUILDER TAB */}
      {subTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveExam}
            className="lg:col-span-5 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
          >
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              {examForm.id ? 'Edit Exam' : 'Schedule New Exam'}
            </h3>
            <input
              type="text"
              required
              placeholder="Exam Title"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={examForm.examType}
                onChange={(e) => setExamForm({ ...examForm, examType: e.target.value as any })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              >
                <option value="mixed">Mixed (MCQ + Written)</option>
                <option value="mcq">MCQ Only</option>
                <option value="written">Written Only</option>
              </select>
              <input
                type="number"
                min={5}
                value={examForm.durationMinutes}
                onChange={(e) =>
                  setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })
                }
                placeholder="Duration (mins)"
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <div>
                <label className="block text-[10px] text-[#4E5B53] mb-0.5">Window Opens</label>
                <input
                  type="datetime-local"
                  value={examForm.startsAt}
                  onChange={(e) => setExamForm({ ...examForm, startsAt: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#DCE2DC] text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4E5B53] mb-0.5">Window Closes</label>
                <input
                  type="datetime-local"
                  value={examForm.endsAt}
                  onChange={(e) => setExamForm({ ...examForm, endsAt: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#DCE2DC] text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Target Batches (leave empty for all):</p>
              <div className="flex flex-wrap gap-2">
                {batches.map((b) => {
                  const checked = examForm.targetBatchIds.includes(b.id);
                  return (
                    <label key={b.id} className="inline-flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setExamForm((prev) => ({
                            ...prev,
                            targetBatchIds: e.target.checked
                              ? [...prev.targetBatchIds, b.id]
                              : prev.targetBatchIds.filter((x) => x !== b.id),
                          }))
                        }
                      />
                      <span>{b.code}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#DCE2DC] rounded-xl p-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#0F3D2E]" /> Select Exam Questions (
                {examForm.questionIds.length} chosen)
              </p>
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-2 text-xs py-1">
                  <input
                    type="checkbox"
                    checked={examForm.questionIds.includes(q.id)}
                    onChange={(e) =>
                      setExamForm((prev) => ({
                        ...prev,
                        questionIds: e.target.checked
                          ? [...prev.questionIds, q.id]
                          : prev.questionIds.filter((x) => x !== q.id),
                      }))
                    }
                  />
                  <span className="line-clamp-1">
                    [{q.marks}m] {q.questionText}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={examForm.randomizeQuestions}
                  onChange={(e) =>
                    setExamForm({ ...examForm, randomizeQuestions: e.target.checked })
                  }
                />
                <span>Randomize Questions</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={examForm.randomizeOptions}
                  onChange={(e) =>
                    setExamForm({ ...examForm, randomizeOptions: e.target.checked })
                  }
                />
                <span>Randomize Options</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={examForm.negativeMarkingEnabled}
                  onChange={(e) =>
                    setExamForm({ ...examForm, negativeMarkingEnabled: e.target.checked })
                  }
                />
                <span>Negative Marking (-{examForm.negativeMarkValue})</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={examForm.isPublished}
                  onChange={(e) => setExamForm({ ...examForm, isPublished: e.target.checked })}
                />
                <span>Publish Exam</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
            >
              {examForm.id ? 'Update Exam Schedule' : 'Publish / Save Exam'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white border border-[#DCE2DC] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs font-mono text-[#B47B2B]">
                    {ex.examType.toUpperCase()} &middot; {ex.durationMinutes} mins &middot;{' '}
                    {ex.totalMarks} marks &middot;{' '}
                    {ex.isPublished ? 'Published' : 'Draft'}
                  </p>
                  <h4 className="font-serif text-lg font-bold text-[#111915]">{ex.title}</h4>
                  <p className="text-xs text-[#4E5B53] tabular-nums">
                    {ex.questionIds.length} questions &middot; Results:{' '}
                    {ex.resultsPublished ? 'Released' : 'Hidden'} &middot; Review:{' '}
                    {ex.allowAnswerReview ? 'Unlocked' : 'Locked'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExamForm({
                        id: ex.id,
                        title: ex.title,
                        courseId: ex.courseId || '',
                        subjectId: ex.subjectId || '',
                        description: ex.description,
                        instructions: ex.instructions,
                        examType: ex.examType,
                        targetBatchIds: ex.targetBatchIds,
                        questionIds: ex.questionIds,
                        startsAt: new Date(ex.startsAt).toISOString().slice(0, 16),
                        endsAt: new Date(ex.endsAt).toISOString().slice(0, 16),
                        durationMinutes: ex.durationMinutes,
                        passMarks: ex.passMarks,
                        randomizeQuestions: ex.randomizeQuestions,
                        randomizeOptions: ex.randomizeOptions,
                        negativeMarkingEnabled: ex.negativeMarkingEnabled,
                        negativeMarkValue: ex.negativeMarkValue,
                        isPublished: ex.isPublished,
                        resultsPublished: ex.resultsPublished,
                        allowAnswerReview: ex.allowAnswerReview,
                      })
                    }
                    className="p-2 rounded-lg border border-[#DCE2DC]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ entity: 'exams', id: ex.id, label: ex.title })
                    }
                    className="p-2 rounded-lg border border-red-200 text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTEMPT MONITOR */}
      {subTab === 'monitor' && (
        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#111915]">
            Live Exam Attempts &amp; Autosave Monitor
          </h3>
          {attempts.length === 0 ? (
            <p className="text-xs text-[#4E5B53]">No active or completed exam attempts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE2DC] text-[#4E5B53]">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Exam</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Started</th>
                    <th className="py-2 pr-4">Last Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const st = students.find((s) => s.id === a.studentId);
                    const ex = exams.find((e) => e.id === a.examId);
                    return (
                      <tr key={a.id} className="border-b border-[#EEF2EE]">
                        <td className="py-2.5 pr-4 font-semibold">{st?.fullName || a.studentId}</td>
                        <td className="py-2.5 pr-4">{ex?.title || a.examId}</td>
                        <td className="py-2.5 pr-4 uppercase font-semibold text-[#0F3D2E]">
                          {a.status.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">
                          {new Date(a.startedAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">
                          {new Date(a.lastSavedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Exam Item"
        itemLabel={deleteTarget?.label || ''}
        description="Permanently deletes this question or exam record."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete(deleteTarget.entity, deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
