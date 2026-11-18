import React from 'react';
import { GraduationCap, Mail, MapPin, Phone, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { siteSettings, setView, openAdmissionModal, view } = useApp();

  if (view === 'exam') {
    return null;
  }

  return (
    <footer className="bg-[#111915] text-[#DCE2DC] border-t border-[#223029] print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: siteSettings.primaryColor || '#0F3D2E' }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-white leading-tight">
                {siteSettings.instituteName}
              </p>
              <p className="text-xs text-[#9AB0A3]">{siteSettings.shortName}</p>
            </div>
          </div>
          <p className="text-sm text-[#A9B8AF] leading-relaxed">{siteSettings.tagline}</p>
          <button
            type="button"
            onClick={() => openAdmissionModal()}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: siteSettings.accentColor || '#B47B2B' }}
          >
            Apply for SOFS Admission
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
            Academic Programs
          </h3>
          <ul className="space-y-2.5 text-sm text-[#A9B8AF]">
            <li>
              <button type="button" onClick={() => setView('courses')} className="hover:text-white">
                SSC &amp; HSC Science Courses
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('batches')} className="hover:text-white">
                Active Batches &amp; Class Routine
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('teachers')} className="hover:text-white">
                Faculty Directory
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('notices')} className="hover:text-white">
                Exam &amp; Notice Board
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
            Institute
          </h3>
          <ul className="space-y-2.5 text-sm text-[#A9B8AF]">
            <li>
              <button type="button" onClick={() => setView('about')} className="hover:text-white">
                About SOFS
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('gallery')} className="hover:text-white">
                Campus Gallery
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('admission')} className="hover:text-white">
                SOFS Admission Desk
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setView('portal')} className="hover:text-white">
                Student Portal &amp; Results
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm text-[#A9B8AF]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
            Campus &amp; Contact
          </h3>
          <p className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#B47B2B] shrink-0 mt-0.5" />
            <span>{siteSettings.campusAddress}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-[#B47B2B] shrink-0" />
            <span className="tabular-nums">{siteSettings.contactPhone}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#B47B2B] shrink-0" />
            <span>{siteSettings.contactEmail}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#B47B2B] shrink-0" />
            <span>{siteSettings.officeHours}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-[#223029] py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#85998D]">
        <p>
          &copy; {new Date().getFullYear()} {siteSettings.instituteName}. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          {siteSettings.socialLinks?.facebook && (
            <a
              href={siteSettings.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Facebook
            </a>
          )}
          {siteSettings.socialLinks?.youtube && (
            <a
              href={siteSettings.socialLinks.youtube}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              YouTube
            </a>
          )}
          {siteSettings.socialLinks?.instagram && (
            <a
              href={siteSettings.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
