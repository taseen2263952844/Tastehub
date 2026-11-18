import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  Shield,
} from 'lucide-react';
import { AdminModule, useApp } from '../context/AppContext';
import { AdminOverviewSection } from './admin/AdminOverviewSection';
import { AcademicManagementSection } from './admin/AcademicManagementSection';
import { AdmissionsManagementSection } from './admin/AdmissionsManagementSection';
import { ExamsQuestionsSection } from './admin/ExamsQuestionsSection';
import { ResultsGradingSection } from './admin/ResultsGradingSection';
import {
  NoticesSection,
  ResourcesSection,
  SupportTicketsAdminSection,
} from './admin/ResourcesNoticesSupportSection';
import {
  AdminsAndAuditSection,
  CmsSettingsSection,
} from './admin/CmsSettingsAdminsSection';

const MODULE_ITEMS: { id: AdminModule; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'admissions', label: 'Admissions', icon: Inbox },
  { id: 'academics', label: 'Academics & Batches', icon: BookOpen },
  { id: 'exams', label: 'Exams & OCR Bank', icon: ClipboardList },
  { id: 'results', label: 'Results & Grading', icon: Award },
  { id: 'resources', label: 'Resources', icon: FileText },
  { id: 'notices', label: 'Notices & Alerts', icon: Bell },
  { id: 'support', label: 'Support Tickets', icon: MessageSquare },
  { id: 'settings', label: 'Website & Media', icon: Settings },
  { id: 'admins', label: 'Admins & Audit', icon: Shield },
];

export const AdminDashboard: React.FC = () => {
  const {
    authUser,
    isAdmin,
    adminRole,
    hasAdminModuleAccess,
    setView,
    setAuthModalOpen,
    refreshBackendData,
    syncingBackend,
  } = useApp();

  const [activeModule, setActiveModule] = useState<AdminModule>('overview');

  if (!authUser || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF2EE] text-[#0F3D2E] flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111915]">
          SOFS Admin Access Restricted
        </h1>
        <p className="text-sm text-[#4E5B53]">
          Sign in with an authorized SOFS staff email verified in Firebase Authentication and
          assigned an active administrative role.
        </p>
        <div className="flex justify-center gap-3">
          {!authUser && (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold"
            >
              Sign In
            </button>
          )}
          <button
            type="button"
            onClick={() => setView('home')}
            className="px-5 py-2.5 rounded-xl border border-[#DCE2DC] bg-white text-xs font-semibold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const permittedModules = MODULE_ITEMS.filter((m) => hasAdminModuleAccess(m.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-[#DCE2DC] rounded-2xl p-4 space-y-4">
          <div className="border-b border-[#DCE2DC] pb-3 px-2">
            <p className="text-[11px] font-mono uppercase text-[#B47B2B] font-semibold">
              {adminRole?.replace('_', ' ')}
            </p>
            <p className="font-serif text-lg font-bold text-[#111915]">SOFS Admin Console</p>
            <p className="text-[11px] text-[#4E5B53] truncate">{authUser.email}</p>
          </div>

          <nav className="space-y-1">
            {permittedModules.map((mod) => {
              const Icon = mod.icon;
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                    active
                      ? 'bg-[#0F3D2E] text-white'
                      : 'text-[#4E5B53] hover:bg-[#F8F9F7] hover:text-[#111915]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            disabled={syncingBackend}
            onClick={() => void refreshBackendData()}
            className="w-full px-3 py-2 rounded-xl border border-[#DCE2DC] text-xs font-semibold text-[#111915] hover:bg-[#F8F9F7] inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingBackend ? 'animate-spin' : ''}`} />
            <span>Sync Workspace</span>
          </button>
        </aside>

        {/* Active Admin Module */}
        <div className="flex-1 min-w-0 w-full">
          {activeModule === 'overview' && (
            <AdminOverviewSection onNavigateModule={(m) => setActiveModule(m)} />
          )}
          {activeModule === 'academics' && <AcademicManagementSection />}
          {activeModule === 'admissions' && <AdmissionsManagementSection />}
          {activeModule === 'exams' && <ExamsQuestionsSection />}
          {activeModule === 'results' && <ResultsGradingSection />}
          {activeModule === 'resources' && <ResourcesSection />}
          {activeModule === 'notices' && <NoticesSection />}
          {activeModule === 'support' && <SupportTicketsAdminSection />}
          {activeModule === 'settings' && <CmsSettingsSection />}
          {activeModule === 'admins' && <AdminsAndAuditSection />}
        </div>
      </div>
    </div>
  );
};
