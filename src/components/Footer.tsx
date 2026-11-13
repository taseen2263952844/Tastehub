import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Check } from 'lucide-react';

export const Footer: React.FC = () => {
  const {
    navigateTarget,
    setActiveView,
    storeSettings,
    currentUser,
    setIsAuthModalOpen,
    subscribeNewsletter,
  } = useApp();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const footerBg = storeSettings.footerBgColor || storeSettings.primaryColor || '#1B3B2B';
  const footerText = storeSettings.footerTextColor || '#FAF8F4';
  const columns = storeSettings.footerColumns || [];
  const social = storeSettings.socialLinks || {};

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setSubmitting(true);
    try {
      await subscribeNewsletter(email, 'footer');
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setErrMsg(err?.message || 'Could not subscribe.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      className="border-t border-black/10 mt-20"
      style={{ backgroundColor: footerBg, color: footerText }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-serif text-3xl font-semibold tracking-[0.14em]">
              {storeSettings.storeName}
            </div>
            <p className="text-sm opacity-80 max-w-md leading-relaxed">
              {storeSettings.footerDescription || storeSettings.tagline}
            </p>
            <div className="pt-1 text-xs opacity-75 space-y-1">
              <p>Customer Care: {storeSettings.supportPhone}</p>
              <p>Email: {storeSettings.supportEmail}</p>
            </div>

            {/* Social Media Links */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  Instagram
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  Facebook
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  YouTube
                </a>
              )}
              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  TikTok
                </a>
              )}
            </div>
          </div>

          {/* Dynamic Footer Columns */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {columns.slice(0, 2).map((col) => (
              <div key={col.id} className="space-y-3">
                <h3 className="font-sans text-xs uppercase tracking-[0.16em] opacity-60 font-semibold">
                  {col.title}
                </h3>
                <ul className="space-y-2 text-sm opacity-85">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => navigateTarget(link.targetType, link.targetValue)}
                        className="hover:opacity-100 hover:underline underline-offset-4 text-left transition-opacity"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter & Quick Account */}
          <div className="md:col-span-3 space-y-4">
            {storeSettings.footerShowNewsletter !== false && (
              <div className="space-y-3">
                <h3 className="font-sans text-xs uppercase tracking-[0.16em] opacity-60 font-semibold">
                  Stay Informed
                </h3>
                <p className="text-xs opacity-80 leading-relaxed">
                  Receive quiet notes on seasonal arrivals and restocks.
                </p>
                {subscribed ? (
                  <div className="p-3 rounded-xl bg-white/10 text-xs inline-flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>You are subscribed.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs placeholder:text-white/50 focus:outline-none focus:border-white"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-2 rounded-lg bg-[#FAF8F4] text-[#171C19] text-xs font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1 shrink-0"
                        aria-label="Subscribe to newsletter"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {errMsg && <p className="text-[11px] text-red-200">{errMsg}</p>}
                  </form>
                )}
              </div>
            )}

            <div className="pt-2 space-y-1.5 text-xs opacity-80">
              <button
                type="button"
                onClick={() => {
                  if (currentUser) setActiveView('account');
                  else setIsAuthModalOpen(true);
                }}
                className="block hover:underline underline-offset-2"
              >
                {currentUser ? 'My Account & Order History' : 'Customer Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="block hover:underline underline-offset-2"
              >
                Store Administration
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-65">
          <p>
            © {new Date().getFullYear()} {storeSettings.footerCopyright || 'VEYRA.'}
          </p>
          <p>Cash on Delivery · Manual bKash & Nagad Verification · Bangladesh</p>
        </div>
      </div>
    </footer>
  );
};
