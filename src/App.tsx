import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import {
  AboutView,
  AdmissionDedicatedView,
  BatchesView,
  ContactView,
  CoursesView,
  GalleryView,
  NoticesView,
  TeachersView,
} from './components/PublicWebsiteViews';
import { StudentPortalView } from './components/StudentPortalView';
import { ExamTakingWorkspace } from './components/ExamTakingWorkspace';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { AdmissionModal } from './components/AdmissionModal';

const SofsRouter: React.FC = () => {
  const { view } = useApp();

  const isExamMode = view === 'exam';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F7] text-[#111915]">
      {!isExamMode && <Header />}
      <main className="flex-1">
        {view === 'home' && <HomeView />}
        {view === 'about' && <AboutView />}
        {view === 'courses' && <CoursesView />}
        {view === 'teachers' && <TeachersView />}
        {view === 'batches' && <BatchesView />}
        {view === 'gallery' && <GalleryView />}
        {view === 'notices' && <NoticesView />}
        {view === 'contact' && <ContactView />}
        {view === 'admission' && <AdmissionDedicatedView />}
        {view === 'portal' && <StudentPortalView />}
        {view === 'exam' && <ExamTakingWorkspace />}
        {view === 'admin' && <AdminDashboard />}
      </main>
      {!isExamMode && <Footer />}
      <AuthModal />
      <AdmissionModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <SofsRouter />
    </AppProvider>
  );
}

export default App;
