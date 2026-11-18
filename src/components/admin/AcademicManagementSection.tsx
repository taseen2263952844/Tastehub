import React, { useState } from 'react';
import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const AcademicManagementSection: React.FC = () => {
  const {
    courses,
    subjects,
    teachers,
    batches,
    schedules,
    students,
    enrollments,
    adminUpsert,
    adminDelete,
  } = useApp();

  const [subTab, setSubTab] = useState<'courses' | 'teachers' | 'batches' | 'students'>('courses');
  const [deleteTarget, setDeleteTarget] = useState<{
    entity: string;
    id: string;
    label: string;
  } | null>(null);

  // Course Form
  const [courseForm, setCourseForm] = useState({
    id: '',
    title: '',
    slug: '',
    academicLevel: 'HSC',
    academicGroup: 'Science',
    durationLabel: '6 Months',
    feeBdt: 4000,
    feeLabel: '৳4,000 / month',
    summary: '',
    description: '',
    highlightsText: '',
    coverImageUrl: courses[0]?.coverImageUrl || '',
    isPublished: true,
    isFeatured: true,
  });

  // Subject quick add
  const [subjectForm, setSubjectForm] = useState({
    courseId: courses[0]?.id || '',
    name: '',
    code: '',
    academicLevel: 'HSC',
    teacherId: teachers[0]?.id || '',
  });

  // Teacher Form
  const [teacherForm, setTeacherForm] = useState({
    id: '',
    name: '',
    title: '',
    department: '',
    qualifications: '',
    experienceYears: 5,
    bio: '',
    photoUrl: teachers[0]?.photoUrl || '',
    email: '',
    isPublished: true,
  });

  // Batch Form
  const [batchForm, setBatchForm] = useState({
    id: '',
    courseId: courses[0]?.id || '',
    name: '',
    code: '',
    academicLevel: 'HSC',
    academicGroup: 'Science',
    leadTeacherId: teachers[0]?.id || '',
    scheduleSummary: '',
    roomOrMode: 'Campus Room 302 · Hybrid',
    seatCapacity: 35,
    status: 'open' as 'open' | 'ongoing' | 'full' | 'archived',
    isPublished: true,
  });

  // Schedule Slot Form
  const [slotForm, setSlotForm] = useState({
    batchId: batches[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    dayOfWeek: 'Saturday',
    startTime: '16:00',
    endTime: '17:30',
    roomLabel: 'Room 302',
    topicNote: '',
  });

  // Enrollment Quick Assign
  const [enrollForm, setEnrollForm] = useState({
    studentId: students[0]?.id || '',
    courseId: courses[0]?.id || '',
    batchId: batches[0]?.id || '',
  });

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug =
      courseForm.slug.trim() ||
      courseForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    await adminUpsert('courses', {
      ...(courseForm.id ? { id: courseForm.id } : {}),
      title: courseForm.title,
      slug,
      academicLevel: courseForm.academicLevel,
      academicGroup: courseForm.academicGroup,
      durationLabel: courseForm.durationLabel,
      feeBdt: Number(courseForm.feeBdt),
      feeLabel: courseForm.feeLabel,
      summary: courseForm.summary,
      description: courseForm.description || courseForm.summary,
      syllabusHighlights: courseForm.highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      coverImageUrl: courseForm.coverImageUrl,
      isPublished: courseForm.isPublished,
      isFeatured: courseForm.isFeatured,
      displayOrder: courses.length + 1,
    });
    setCourseForm({
      ...courseForm,
      id: '',
      title: '',
      slug: '',
      summary: '',
      description: '',
      highlightsText: '',
    });
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminUpsert('teachers', {
      ...(teacherForm.id ? { id: teacherForm.id } : {}),
      name: teacherForm.name,
      title: teacherForm.title,
      department: teacherForm.department,
      qualifications: teacherForm.qualifications,
      experienceYears: Number(teacherForm.experienceYears),
      bio: teacherForm.bio,
      photoUrl: teacherForm.photoUrl,
      email: teacherForm.email,
      isPublished: teacherForm.isPublished,
      displayOrder: teachers.length + 1,
    });
    setTeacherForm({
      ...teacherForm,
      id: '',
      name: '',
      title: '',
      department: '',
      qualifications: '',
      bio: '',
      email: '',
    });
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminUpsert('batches', {
      ...(batchForm.id ? { id: batchForm.id } : {}),
      courseId: batchForm.courseId,
      name: batchForm.name,
      code: batchForm.code || `SOFS-${Math.floor(100 + Math.random() * 900)}`,
      academicLevel: batchForm.academicLevel,
      academicGroup: batchForm.academicGroup,
      leadTeacherId: batchForm.leadTeacherId,
      scheduleSummary: batchForm.scheduleSummary,
      roomOrMode: batchForm.roomOrMode,
      seatCapacity: Number(batchForm.seatCapacity),
      enrolledCount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      status: batchForm.status,
      isPublished: batchForm.isPublished,
    });
    setBatchForm({ ...batchForm, id: '', name: '', code: '', scheduleSummary: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold text-[#111915]">
          Academic Catalog &amp; Enrollments
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'courses', label: `Courses & Subjects (${courses.length})` },
            { id: 'teachers', label: `Teachers (${teachers.length})` },
            { id: 'batches', label: `Batches & Schedules (${batches.length})` },
            { id: 'students', label: `Students & Enrollments (${students.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                subTab === item.id
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                  : 'bg-white text-[#4E5B53] border-[#DCE2DC]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* COURSES & SUBJECTS */}
      {subTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveCourse}
            className="lg:col-span-5 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
          >
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              {courseForm.id ? 'Edit Course' : 'Add New Course'}
            </h3>
            <input
              type="text"
              required
              placeholder="Course Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Level (e.g. HSC)"
                value={courseForm.academicLevel}
                onChange={(e) => setCourseForm({ ...courseForm, academicLevel: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                placeholder="Group (e.g. Science)"
                value={courseForm.academicGroup}
                onChange={(e) => setCourseForm({ ...courseForm, academicGroup: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 8 Months)"
                value={courseForm.durationLabel}
                onChange={(e) => setCourseForm({ ...courseForm, durationLabel: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                placeholder="Fee Label (e.g. ৳4,200/month)"
                value={courseForm.feeLabel}
                onChange={(e) => setCourseForm({ ...courseForm, feeLabel: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
            </div>
            <input
              type="url"
              placeholder="Cover Image URL"
              value={courseForm.coverImageUrl}
              onChange={(e) => setCourseForm({ ...courseForm, coverImageUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <textarea
              rows={2}
              required
              placeholder="Short summary..."
              value={courseForm.summary}
              onChange={(e) => setCourseForm({ ...courseForm, summary: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <textarea
              rows={3}
              placeholder="Syllabus highlights (one per line)..."
              value={courseForm.highlightsText}
              onChange={(e) => setCourseForm({ ...courseForm, highlightsText: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={courseForm.isPublished}
                  onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                />
                <span>Published</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={courseForm.isFeatured}
                  onChange={(e) => setCourseForm({ ...courseForm, isFeatured: e.target.checked })}
                />
                <span>Featured</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{courseForm.id ? 'Update Course' : 'Save Course'}</span>
              </button>
              {courseForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setCourseForm({ ...courseForm, id: '', title: '', summary: '', highlightsText: '' })
                  }
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-3">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-[#B47B2B]">
                      {c.academicLevel} &middot; {c.academicGroup} &middot; {c.feeLabel} &middot;{' '}
                      {c.isPublished ? 'Published' : 'Draft'}
                    </p>
                    <h4 className="font-serif text-lg font-bold text-[#111915]">{c.title}</h4>
                    <p className="text-xs text-[#4E5B53] mt-0.5">{c.summary}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setCourseForm({
                          id: c.id,
                          title: c.title,
                          slug: c.slug,
                          academicLevel: c.academicLevel,
                          academicGroup: c.academicGroup,
                          durationLabel: c.durationLabel,
                          feeBdt: c.feeBdt,
                          feeLabel: c.feeLabel,
                          summary: c.summary,
                          description: c.description,
                          highlightsText: c.syllabusHighlights.join('\n'),
                          coverImageUrl: c.coverImageUrl,
                          isPublished: c.isPublished,
                          isFeatured: c.isFeatured,
                        })
                      }
                      className="p-2 rounded-lg border border-[#DCE2DC] text-[#111915]"
                      aria-label="Edit course"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ entity: 'courses', id: c.id, label: c.title })
                      }
                      className="p-2 rounded-lg border border-red-200 text-red-700"
                      aria-label="Delete course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Subject Adder */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminUpsert('subjects', {
                  ...subjectForm,
                  description: '',
                  isPublished: true,
                });
                setSubjectForm({ ...subjectForm, name: '', code: '' });
              }}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-4 space-y-3"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4E5B53]">
                Subjects ({subjects.length}) — Quick Add
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={subjectForm.courseId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, courseId: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Subject Name"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (PHY-101)"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-[#0F3D2E] text-white text-xs font-semibold"
                >
                  Add Subject
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {subjects.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#EEF2EE] text-[#111915]"
                  >
                    <span>
                      {sub.name} ({sub.code})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ entity: 'subjects', id: sub.id, label: sub.name })
                      }
                      className="text-red-700 hover:text-red-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHERS */}
      {subTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveTeacher}
            className="lg:col-span-5 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
          >
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              {teacherForm.id ? 'Edit Teacher' : 'Add Faculty Member'}
            </h3>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Title (Senior Lecturer)"
                value={teacherForm.title}
                onChange={(e) => setTeacherForm({ ...teacherForm, title: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="text"
                required
                placeholder="Department (Physics)"
                value={teacherForm.department}
                onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="Qualifications (e.g. M.Sc. BUET)"
              value={teacherForm.qualifications}
              onChange={(e) => setTeacherForm({ ...teacherForm, qualifications: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Years Exp"
                value={teacherForm.experienceYears}
                onChange={(e) =>
                  setTeacherForm({ ...teacherForm, experienceYears: Number(e.target.value) })
                }
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
            </div>
            <input
              type="url"
              placeholder="Photo URL"
              value={teacherForm.photoUrl}
              onChange={(e) => setTeacherForm({ ...teacherForm, photoUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <textarea
              rows={3}
              placeholder="Academic bio..."
              value={teacherForm.bio}
              onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#DCE2DC] text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
            >
              {teacherForm.id ? 'Update Faculty' : 'Add Faculty'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#DCE2DC] rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={t.photoUrl}
                    alt={t.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#DCE2DC]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#B47B2B]">{t.department}</p>
                    <h4 className="font-serif text-lg font-bold text-[#111915] truncate">
                      {t.name}
                    </h4>
                    <p className="text-xs text-[#4E5B53] truncate">{t.qualifications}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setTeacherForm({
                        id: t.id,
                        name: t.name,
                        title: t.title,
                        department: t.department,
                        qualifications: t.qualifications,
                        experienceYears: t.experienceYears,
                        bio: t.bio,
                        photoUrl: t.photoUrl,
                        email: t.email || '',
                        isPublished: t.isPublished,
                      })
                    }
                    className="p-2 rounded-lg border border-[#DCE2DC]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ entity: 'teachers', id: t.id, label: t.name })
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

      {/* BATCHES & SCHEDULES */}
      {subTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={handleSaveBatch}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-serif text-lg font-bold text-[#111915]">
                {batchForm.id ? 'Edit Batch' : 'Create Batch'}
              </h3>
              <select
                value={batchForm.courseId}
                onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Batch Name"
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Code (HSC-PHY-A)"
                  value={batchForm.code}
                  onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Capacity"
                  value={batchForm.seatCapacity}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, seatCapacity: Number(e.target.value) })
                  }
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Schedule Summary (Sat · Mon · Wed · 4:00 PM)"
                value={batchForm.scheduleSummary}
                onChange={(e) => setBatchForm({ ...batchForm, scheduleSummary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Room / Mode"
                  value={batchForm.roomOrMode}
                  onChange={(e) => setBatchForm({ ...batchForm, roomOrMode: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                />
                <select
                  value={batchForm.status}
                  onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value as any })}
                  className="px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
                >
                  <option value="open">Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="full">Full</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
              >
                {batchForm.id ? 'Update Batch' : 'Save Batch'}
              </button>
            </form>

            {/* Add Weekly Schedule Slot */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminUpsert('batch_schedules', slotForm);
                setSlotForm({ ...slotForm, topicNote: '' });
              }}
              className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
            >
              <h4 className="font-serif text-base font-bold text-[#111915]">
                Add Weekly Routine Slot
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={slotForm.batchId}
                  onChange={(e) => setSlotForm({ ...slotForm, batchId: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                >
                  {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="text"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  placeholder="Start (16:00)"
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                />
                <input
                  type="text"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  placeholder="End (17:30)"
                  className="px-2.5 py-2 rounded-lg border border-[#DCE2DC] text-xs"
                />
              </div>
              <input
                type="text"
                value={slotForm.topicNote}
                onChange={(e) => setSlotForm({ ...slotForm, topicNote: e.target.value })}
                placeholder="Topic Note (e.g. Electrostatics Lecture)"
                className="w-full px-3 py-2 rounded-lg border border-[#DCE2DC] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#B47B2B] text-white text-xs font-semibold"
              >
                Add Routine Slot
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {batches.map((b) => {
              const bSlots = schedules.filter((s) => s.batchId === b.id);
              return (
                <div
                  key={b.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-[#B47B2B]">
                        {b.code} &middot; {b.status.toUpperCase()} &middot; {b.enrolledCount}/
                        {b.seatCapacity} seats
                      </p>
                      <h4 className="font-serif text-lg font-bold text-[#111915]">{b.name}</h4>
                      <p className="text-xs text-[#4E5B53]">{b.scheduleSummary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ entity: 'batches', id: b.id, label: b.name })
                      }
                      className="p-2 rounded-lg border border-red-200 text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {bSlots.length > 0 && (
                    <div className="border-t border-[#DCE2DC] pt-2 space-y-1 text-xs">
                      {bSlots.map((sl) => (
                        <div key={sl.id} className="flex items-center justify-between text-[#4E5B53]">
                          <span>
                            <strong className="text-[#111915]">{sl.dayOfWeek}</strong> {sl.startTime}–
                            {sl.endTime} &middot; {sl.topicNote || sl.roomLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                entity: 'batch_schedules',
                                id: sl.id,
                                label: `${sl.dayOfWeek} ${sl.startTime}`,
                              })
                            }
                            className="text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENTS & ENROLLMENTS */}
      {subTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await adminUpsert('enrollments', {
                studentId: enrollForm.studentId,
                courseId: enrollForm.courseId,
                batchId: enrollForm.batchId || undefined,
                status: 'active',
                enrolledAt: new Date().toISOString(),
              });
            }}
            className="lg:col-span-4 bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-3 h-fit"
          >
            <h3 className="font-serif text-lg font-bold text-[#111915] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F3D2E]" />
              <span>Assign Student Enrollment</span>
            </h3>
            <select
              value={enrollForm.studentId}
              onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
            <select
              value={enrollForm.courseId}
              onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={enrollForm.batchId}
              onChange={(e) => setEnrollForm({ ...enrollForm, batchId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs"
            >
              <option value="">No specific batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
            >
              Enroll Student in Batch
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {students.map((stu) => {
              const stuEnrolls = enrollments.filter((e) => e.studentId === stu.id);
              return (
                <div
                  key={stu.id}
                  className="bg-white border border-[#DCE2DC] rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-[#B47B2B] font-semibold">
                        {stu.studentCode} &middot; {stu.academicLevel} ({stu.academicGroup})
                      </p>
                      <h4 className="font-serif text-lg font-bold text-[#111915]">
                        {stu.fullName}
                      </h4>
                      <p className="text-xs text-[#4E5B53]">
                        {stu.email} &middot; {stu.phone || 'No phone'} &middot; {stu.institutionName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          entity: 'students',
                          id: stu.id,
                          label: stu.fullName,
                        })
                      }
                      className="p-2 rounded-lg border border-red-200 text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {stuEnrolls.map((enr) => {
                      const crs = courses.find((c) => c.id === enr.courseId);
                      const bt = batches.find((b) => b.id === enr.batchId);
                      return (
                        <span
                          key={enr.id}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EEF2EE] text-[#0F3D2E] inline-flex items-center gap-1.5"
                        >
                          <span>
                            {crs?.title || 'Course'} {bt ? `(${bt.code})` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                entity: 'enrollments',
                                id: enr.id,
                                label: `Enrollment: ${stu.fullName}`,
                              })
                            }
                            className="text-red-700 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Confirm Permanent Deletion"
        itemLabel={deleteTarget?.label || ''}
        description="This action permanently deletes the record from the SOFS database."
        onConfirm={async () => {
          if (deleteTarget) await adminDelete(deleteTarget.entity, deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
