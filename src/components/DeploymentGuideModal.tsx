import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Github, 
  Cloud, 
  Flame, 
  ShieldCheck, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DeploymentGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  const { firebaseStatus, showToast } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                Deployment & Firebase Guide
              </h2>
              <p className="text-xs text-stone-500">
                TasteHub Restaurant • Vite + React + Cloud Firestore + Cloudflare Pages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          {/* Current Status Badge */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                Current Status: {firebaseStatus.isConfigured ? `Connected to ${firebaseStatus.projectId}` : 'Local Preview / Simulation Mode'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                Live Cloud Active
              </span>
            </div>
            <p className="text-xs text-stone-600">
              {firebaseStatus.message}
            </p>
            {firebaseStatus.isConfigured && (
              <div className="pt-2 border-t border-amber-200/80">
                <a
                  href={`https://console.firebase.google.com/project/tastehub-16c49/firestore/databases/ai-studio-tastehubrestaura-3695d266-0af0-4fbc-92e0-8a7cb0eea600/data`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Database in Firebase Console (Direct Link to Orders)</span>
                </a>
              </div>
            )}
          </div>

          {/* Android Phone Development Note */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
            <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Building on an Android Phone:</strong>
              The entire UI and build system are optimized for touch and mobile screens. You can manage Git and deployments directly from your Android phone using Termux, Git apps (e.g. MGit, Pocket Git), or GitHub Web.
            </div>
          </div>

          {/* Step 1: Firebase Connection */}
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">1</span>
              Connecting Firebase Cloud Firestore & Auth
            </h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              To connect your real Firebase project, you can either click the AI Studio Firebase setup tool, or create your project in the Firebase Console (Firestore + Google Auth) and supply these frontend environment variables in your deployment:
            </p>

            <div className="relative bg-stone-900 text-stone-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="tastehub-restaurant.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tastehub-restaurant"
VITE_FIREBASE_STORAGE_BUCKET="tastehub-restaurant.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"`}</pre>
              <button
                onClick={() => copyCode(`VITE_FIREBASE_API_KEY=""\nVITE_FIREBASE_AUTH_DOMAIN=""\nVITE_FIREBASE_PROJECT_ID=""\nVITE_FIREBASE_STORAGE_BUCKET=""\nVITE_FIREBASE_MESSAGING_SENDER_ID=""\nVITE_FIREBASE_APP_ID=""`, 'env')}
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300"
                title="Copy snippet"
              >
                {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              * Note: The hardened <code className="font-mono text-amber-800">firestore.rules</code> file is already placed in your workspace root, configured with role separation and PII protection for <code className="font-mono text-amber-800">bdtaseengaming@gmail.com</code>.
            </p>
          </div>

          {/* Step 2: Push to GitHub */}
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">2</span>
              Syncing to GitHub (From Android or Terminal)
            </h3>
            <p className="text-stone-600 text-xs">
              Initialize your repository and push to GitHub:
            </p>
            <div className="relative bg-stone-900 text-stone-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`git init
git add .
git commit -m "Initial release: TasteHub Restaurant"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/tastehub-restaurant.git
git push -u origin main`}</pre>
              <button
                onClick={() => copyCode(`git init\ngit add .\ngit commit -m "Initial release: TasteHub Restaurant"\ngit branch -M main\ngit remote add origin https://github.com/<YOUR_USERNAME>/tastehub-restaurant.git\ngit push -u origin main`, 'git')}
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                {copiedKey === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 3: Deploy to Cloudflare Pages */}
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">3</span>
              Deploying to Cloudflare Pages (Pure Static)
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-stone-700 leading-relaxed">
              <li>Log in to your <strong>Cloudflare Dashboard</strong> and go to <strong>Workers & Pages</strong> &gt; <strong>Create application</strong> &gt; <strong>Pages</strong>.</li>
              <li>Connect your GitHub account and select the <strong>tastehub-restaurant</strong> repository.</li>
              <li>Under <strong>Build settings</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 font-mono text-[11px] text-stone-800">
                  <li>Framework preset: <strong>Vite</strong></li>
                  <li>Build command: <strong>npm run build</strong></li>
                  <li>Build output directory: <strong>dist</strong></li>
                  <li>Root directory: <strong>/</strong> (leave blank or default)</li>
                </ul>
              </li>
              <li>Add your Firebase environment variables in Cloudflare Settings &gt; Environment Variables.</li>
              <li>Click <strong>Save and Deploy</strong>. Cloudflare will build the static <code className="font-mono">dist/</code> bundle and provide your fast global URL (e.g. <code className="font-mono text-amber-700">tastehub.pages.dev</code>). No Wrangler CLI is required!</li>
            </ol>
          </div>

          {/* Step 4: Security Validation */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Commercial Security & Server-Side Validation:</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              While client calculations are validated against the menu catalog in frontend state, a production environment should connect a Cloud Function or Cloudflare Worker that re-verifies item prices from the database before dispatching to the kitchen thermal printer, and enforces rate limits on Cash on Delivery orders to eliminate fake submissions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
