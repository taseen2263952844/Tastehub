import React from 'react';
import {
  Award,
  BookOpen,
  ClipboardList,
  Database,
  GraduationCap,
  Inbox,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminOverviewSection: React.FC<{ onNavigateModule: (mod: any) => void }> = ({
  onNavigateModule,
}) => {
  const {
    adminRole,
    supabaseConfigured,
    geminiConfigured,
    courses,
    batches,
    students,
    admissions,
    exams,
    questions,
    results,
    tickets,
    notices,
    hasAdminModuleAccess,
  } = useApp();

  const newAdmissions = admissions.filter((a) => a.status === 'new').length;
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_review').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111915]">
            SOFS Executive Overview
          </h2>
          <p className="text-xs text-[#4E5B53] mt-0.5">
            Signed in with verified role:{' '}
            <span className="font-mono font-semibold text-[#0F3D2E] uppercase">
              {adminRole?.replace('_', ' ')}
            </span>
          </p>
        </div>
      </div>

      {/* Infrastructure Connectivity Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
            supabaseConfigured
              ? 'bg-[#EEF2EE] border-[#C8D4CA] text-[#0F3D2E]'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Database className="w-4 h-4" />
            <span>
              Supabase Backend:{' '}
              {supabaseConfigured ? 'Connected (PostgreSQL + Storage + RLS)' : 'Preview Mode (Env Pending)'}
            </span>
          </div>
          {!supabaseConfigured && (
            <p className="leading-relaxed">
              Run <code className="font-mono">supabase/migrations/001_sofs_schema.sql</code> in
              Supabase SQL Editor and set <code className="font-mono">SUPABASE_URL</code>,{' '}
              <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>,{' '}
              <code className="font-mono">VITE_SUPABASE_URL</code>, and{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in Cloudflare Pages to
              enable live cloud persistence.
            </p>
          )}
        </div>

        <div
          className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
            geminiConfigured
              ? 'bg-[#EEF2EE] border-[#C8D4CA] text-[#0F3D2E]'
              : 'bg-white border-[#DCE2DC] text-[#4E5B53]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-[#111915]">
            <Sparkles className="w-4 h-4 text-[#B47B2B]" />
            <span>
              Gemini Question OCR:{' '}
              {geminiConfigured ? 'Ready (gemini-4-hydrogen)' : 'Server Key Not Set'}
            </span>
          </div>
          <p className="leading-relaxed">
            Set <code className="font-mono">GEMINI_API_KEY</code> in server environment variables
            for optional Bangla/English question paper image-to-bank OCR extraction.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#4E5B53]">
            <span>Active Courses</span>
            <BookOpen className="w-4 h-4 text-[#0F3D2E]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#111915] tabular-nums">
            {courses.length}
          </p>
          <p className="text-[11px] text-[#4E5B53] tabular-nums">{batches.length} batches</p>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#4E5B53]">
            <span>New Admissions</span>
            <Inbox className="w-4 h-4 text-[#B47B2B]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#B47B2B] tabular-nums">
            {newAdmissions}
          </p>
          <p className="text-[11px] text-[#4E5B53] tabular-nums">
            {admissions.length} total applications
          </p>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#4E5B53]">
            <span>Exams &amp; Bank</span>
            <ClipboardList className="w-4 h-4 text-[#0F3D2E]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#111915] tabular-nums">
            {exams.length}
          </p>
          <p className="text-[11px] text-[#4E5B53] tabular-nums">
            {questions.length} bank questions
          </p>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#4E5B53]">
            <span>Students &amp; Support</span>
            <Users className="w-4 h-4 text-[#0F3D2E]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#111915] tabular-nums">
            {students.length}
          </p>
          <p className="text-[11px] text-[#4E5B53] tabular-nums">
            {openTickets} open support tickets
          </p>
        </div>
      </div>

      {/* Role-Aware Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasAdminModuleAccess('admissions') && (
          <button
            type="button"
            onClick={() => onNavigateModule('admissions')}
            className="text-left p-5 rounded-2xl bg-white border border-[#DCE2DC] hover:border-[#0F3D2E] transition-colors space-y-2"
          >
            <Inbox className="w-5 h-5 text-[#B47B2B]" />
            <h3 className="font-serif text-lg font-bold text-[#111915]">Review Admissions</h3>
            <p className="text-xs text-[#4E5B53]">
              Contact {newAdmissions} pending applicants and manage placement notes.
            </p>
          </button>
        )}

        {hasAdminModuleAccess('exams') && (
          <button
            type="button"
            onClick={() => onNavigateModule('exams')}
            className="text-left p-5 rounded-2xl bg-white border border-[#DCE2DC] hover:border-[#0F3D2E] transition-colors space-y-2"
          >
            <GraduationCap className="w-5 h-5 text-[#0F3D2E]" />
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              Question Bank &amp; Gemini OCR
            </h3>
            <p className="text-xs text-[#4E5B53]">
              Build bilingual exams with KaTeX math or scan printed question sheets via AI OCR.
            </p>
          </button>
        )}

        {hasAdminModuleAccess('results') && (
          <button
            type="button"
            onClick={() => onNavigateModule('results')}
            className="text-left p-5 rounded-2xl bg-white border border-[#DCE2DC] hover:border-[#0F3D2E] transition-colors space-y-2"
          >
            <Award className="w-5 h-5 text-[#0F3D2E]" />
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              Grade Scripts &amp; Publish Results
            </h3>
            <p className="text-xs text-[#4E5B53]">
              {results.length} result records tracked · {notices.length} institute notices active.
            </p>
          </button>
        )}

        {hasAdminModuleAccess('admins') && (
          <button
            type="button"
            onClick={() => onNavigateModule('admins')}
            className="text-left p-5 rounded-2xl bg-white border border-[#DCE2DC] hover:border-[#0F3D2E] transition-colors space-y-2"
          >
            <ShieldCheck className="w-5 h-5 text-[#0F3D2E]" />
            <h3 className="font-serif text-lg font-bold text-[#111915]">
              Roles &amp; Audit Logs
            </h3>
            <p className="text-xs text-[#4E5B53]">
              Assign academic, exam, admission, and content staff roles with audit history.
            </p>
          </button>
        )}
      </div>
    </div>
  );
};
