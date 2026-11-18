import React, { useState } from 'react';
import { GraduationCap, Loader2, Lock, Mail, User, X, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatFirebaseAuthError } from '../services/firebase';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    loginWithGoogle,
    loginWithEmail,
    registerAccount,
    resetPassword,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await registerAccount(name, email, password);
      } else {
        await resetPassword(email);
        setInfoMessage('If an account exists for that email, a password reset link has been sent.');
      }
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => !loading && setAuthModalOpen(false)}
    >
      <div
        className="bg-white border border-[#DCE2DC] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#111915]">
                {mode === 'login'
                  ? 'SOFS Student & Staff Sign In'
                  : mode === 'register'
                  ? 'Create Student Account'
                  : 'Reset Password'}
              </h2>
              <p className="text-xs text-[#4E5B53]">
                Access exams, result cards, resources, and support
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-[#4E5B53] hover:text-[#111915]"
            aria-label="Close sign-in dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode !== 'reset' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-[#DCE2DC] bg-[#F8F9F7] hover:bg-[#EEF2EE] text-sm font-medium text-[#111915] flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#DCE2DC]" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#4E5B53]">
                or with email
              </span>
              <div className="flex-grow border-t border-[#DCE2DC]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#111915] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#4E5B53] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student full name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE2DC] text-sm focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#111915] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#4E5B53] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE2DC] text-sm focus:outline-none focus:border-[#0F3D2E]"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#111915]">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                    }}
                    className="text-xs text-[#0F3D2E] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4E5B53] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE2DC] text-sm focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-[#EEF2EE] border border-[#C8D4CA] text-xs text-[#0F3D2E]">
              {infoMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#16503D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' && 'Sign In to SOFS'}
            {mode === 'register' && 'Create Student Account'}
            {mode === 'reset' && (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Reset Email</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#DCE2DC] flex items-center justify-between text-xs text-[#4E5B53]">
          {mode === 'login' ? (
            <>
              <span>New student at SOFS?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="font-semibold text-[#0F3D2E] hover:underline"
              >
                Register Account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="font-semibold text-[#0F3D2E] hover:underline"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
