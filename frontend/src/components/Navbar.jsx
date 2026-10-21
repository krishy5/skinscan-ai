import React, { useState, useEffect } from 'react';
import { Home, Scan, History, BarChart3, LogIn, User, Sparkles } from 'lucide-react';
import { initials } from '../lib/format';

const NAV = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'scan',     label: 'Scan',     icon: Scan, primary: true },
  { id: 'history',  label: 'History',  icon: History },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

export default function Navbar({ activeTab, setActiveTab, demoMode, user, openAuthModal, onGoToLanding }) {
  const letter = initials(user?.name);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setModelStatus(data.model_loaded ? 'online' : 'demo'))
      .catch(() => setModelStatus('offline'));
  }, []);

  const statusConfig = {
    online:  { dot: 'bg-emerald-500', ping: 'bg-emerald-400', label: 'InceptionV3 Online', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/70' },
    demo:    { dot: 'bg-amber-500',   ping: 'bg-amber-400',   label: 'Demo Engine',       badge: 'bg-amber-50 text-amber-800 border-amber-200/70' },
    offline: { dot: 'bg-rose-500',    ping: 'bg-rose-400',    label: 'API Disconnected',  badge: 'bg-rose-50 text-rose-800 border-rose-200/70' },
  }[modelStatus] || null;

  const isProfileActive = activeTab === 'profile';

  return (
    <>
      {/* ── Top Header ────────────────────────────────── */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.25rem] flex items-center justify-between gap-4">

          {/* Logo & Clinical Brand */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 shrink-0 text-left group transition-transform active:scale-[0.99]"
            aria-label="SkinScan AI — return to home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ink via-slate-900 to-teal-950 text-teal-300 flex items-center justify-center shadow-md shadow-slate-900/10 ring-1 ring-white/10 group-hover:shadow-lg group-hover:ring-teal-500/40 transition-all">
              <Scan className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-serif text-[1.18rem] font-semibold text-ink tracking-tight">
                  SkinScan <span className="text-teal-700 font-bold">AI</span>
                </span>
                {demoMode && (
                  <span className="hidden sm:inline bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200/70 shadow-xs">
                    Demo Mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-slate-500 font-medium">3D-TDP lesion analysis</p>
                {statusConfig && (
                  <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${statusConfig.badge}`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.ping}`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusConfig.dot}`} />
                    </span>
                    <span>{statusConfig.label}</span>
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav
            className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 shadow-xs"
            aria-label="Primary navigation"
          >
            {NAV.map(({ id, label, icon: Icon, primary }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    active && primary
                      ? 'bg-ink text-white shadow-sm ring-1 ring-white/10'
                      : active
                        ? 'bg-white text-teal-800 shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:text-ink hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? (primary ? 'text-teal-300' : 'text-teal-700') : 'text-slate-500'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header: Landing Switcher & User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/70 shadow-2xs hover:border-slate-300"
                title="View product landing page & screening guide"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Product overview</span>
              </button>
            )}

            {user ? (
              /* Signed-in researcher avatar */
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                aria-label={`Profile — ${user.name}`}
                title={`Researcher: ${user.name}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs tracking-wider transition-all relative ${
                  isProfileActive
                    ? 'bg-teal-600 text-white ring-2 ring-teal-500 ring-offset-2 shadow-md'
                    : 'bg-ink text-teal-200 hover:bg-slate-800 shadow-sm ring-1 ring-slate-300/80 hover:ring-teal-400'
                }`}
              >
                {letter}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </button>
            ) : (
              /* Guest CTA */
              <button
                type="button"
                onClick={openAuthModal}
                aria-label="Sign in"
                className="flex items-center gap-2 text-xs font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Floating Bar ──────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 z-50 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(11,28,44,0.08)]"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          {NAV.map(({ id, label, icon: Icon, primary }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  primary ? '' : active ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {primary ? (
                  <span
                    className={`w-12 h-12 -mt-7 rounded-2xl flex items-center justify-center shadow-lg border-3 border-white transition-all transform ${
                      active
                        ? 'bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-teal-700/30 scale-105'
                        : 'bg-gradient-to-tr from-ink to-slate-800 text-teal-300 shadow-slate-900/25 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                ) : (
                  <>
                    <Icon className={`w-5 h-5 mb-0.5 transition-transform ${active ? 'scale-110 text-teal-700' : 'text-slate-500'}`} />
                    <span className={`text-[10px] tracking-tight ${active ? 'font-bold text-teal-800' : 'font-medium'}`}>{label}</span>
                  </>
                )}
              </button>
            );
          })}

          {/* 5th slot: Profile / Auth */}
          {user ? (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              aria-current={isProfileActive ? 'page' : undefined}
              aria-label="Profile"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isProfileActive ? 'text-teal-800' : 'text-slate-500'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                isProfileActive ? 'bg-teal-700 text-white scale-110 shadow-xs' : 'bg-ink text-teal-200'
              }`}>
                {letter}
              </div>
              <span className={`text-[10px] mt-0.5 ${isProfileActive ? 'font-bold text-teal-800' : 'font-medium'}`}>Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              aria-label="Sign in"
              className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">Sign in</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
