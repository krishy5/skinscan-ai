import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import ScanScreen from './components/ScanScreen';
import HistoryScreen from './components/HistoryScreen';
import InsightsScreen from './components/InsightsScreen';
import ProfileScreen from './components/ProfileScreen';
import AuthModal from './components/AuthModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { supabase, onAuthStateChange, signOut as supabaseSignOut } from './lib/supabase';

const USER_KEY  = 'skinscan_user';
const DEMO_KEY  = 'skinscan_demo';
const SEEN_KEY  = 'skinscan_seen_landing';

export default function App() {
  // ── Routing: landing vs app ───────────────────────────────
  const [showLanding, setShowLanding] = useState(
    () => localStorage.getItem(SEEN_KEY) !== '1'
  );

  // ── App state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [profileSection, setProfileSection] = useState('main');
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem(DEMO_KEY) === '1');
  const [scans, setScans] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  });

  // ── Supabase session sync ─────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url || null,
          provider: 'google',
        };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      }
    });
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url || null,
          provider: 'google',
        };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        if (showLanding) {
          localStorage.setItem(SEEN_KEY, '1');
          setShowLanding(false);
          setActiveTab('home');
        }
      } else {
        setUser(null);
        localStorage.removeItem(USER_KEY);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Toast notification ────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3400);
  };

  // ── Data fetching ─────────────────────────────────────────
  const fetchScans = useCallback(async (userId) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const url = userId ? `${apiBase}/api/scans?user_id=${userId}` : `${apiBase}/api/scans`;
      const res = await fetch(url);
      if (res.ok) setScans(await res.json());
    } catch (err) { console.error('Failed to fetch scans:', err); }
  }, []);

  const fetchInsights = useCallback(async (userId) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const url = userId ? `${apiBase}/api/insights?user_id=${userId}` : `${apiBase}/api/insights`;
      const res = await fetch(url);
      if (res.ok) setInsightsData(await res.json());
    } catch (err) { console.error('Failed to fetch insights:', err); }
  }, []);

  useEffect(() => {
    if (!showLanding) {
      const userId = user?.id;
      fetchScans(userId);
      fetchInsights(userId);
    }
  }, [showLanding, fetchScans, fetchInsights, user]);

  useEffect(() => {
    localStorage.setItem(DEMO_KEY, demoMode ? '1' : '0');
  }, [demoMode]);

  // ── Handlers ──────────────────────────────────────────────
  const enterApp = (userId) => {
    localStorage.setItem(SEEN_KEY, '1');
    setShowLanding(false);
    setActiveTab('home');
    fetchScans(userId);
    fetchInsights(userId);
  };

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setIsAuthModalOpen(false);
    setActiveTab('home');
    showToast(`Welcome back, ${nextUser.name}!`);
    fetchScans(nextUser.id);
    fetchInsights(nextUser.id);
  };

  const handleLandingAuthSuccess = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setActiveTab('home');
    enterApp(nextUser.id);
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SEEN_KEY);
    setScans([]);
    setInsightsData(null);
    setShowLanding(true);
    showToast('Signed out of session');
  };

  const handleScanCompleted = (newScan) => {
    setScans((prev) => [newScan, ...prev.filter((s) => s.id !== newScan.id)]);
    fetchInsights(user?.id);
    showToast('Analysis completed & recorded ✓');
  };

  const handleDeleteScan = async (scanId) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiBase}/api/scans/${scanId}`, { method: 'DELETE' });
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      fetchInsights(user?.id);
      showToast('Scan record deleted');
    } catch { showToast('Could not delete scan', 'error'); }
  };

  const handleClearHistory = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const userId = user?.id;
      const url = userId ? `${apiBase}/api/scans?user_id=${userId}` : `${apiBase}/api/scans`;
      await fetch(url, { method: 'DELETE' });
      setScans([]);
      fetchInsights(userId);
      showToast('All scan records purged');
    } catch { showToast('Could not purge history', 'error'); }
  };

  const handleExportData = () => {
    const blob = new Blob(
      [JSON.stringify({ user, exportedAt: new Date().toISOString(), scans }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skinscan-research-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workstation JSON dataset exported');
  };

  const handleUpdateNotes = async (scanId, notes) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiBase}/api/scans/${scanId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      setScans((prev) => prev.map((s) => (s.id === scanId ? { ...s, notes } : s)));
      showToast('Notes saved');
    } catch { showToast('Failed to save notes', 'error'); }
  };

  const openGuide = (type) => {
    setProfileSection(type === 'help' ? 'capture_guide' : 'education');
    setActiveTab('profile');
  };

  // ── Toast banner ──────────────────────────────────────────
  const Toast = toast ? (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 right-5 z-[100] px-4.5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-toast border backdrop-blur-md ${
        toast.type === 'error'
          ? 'bg-rose-900/90 text-white border-rose-700/80'
          : 'bg-ink/90 text-white border-white/10 shadow-slate-900/20'
      }`}
    >
      {toast.type === 'error'
        ? <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
        : <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />}
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => setToast(null)}
        aria-label="Dismiss toast"
        className="ml-2 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : null;

  // ── Landing page view ─────────────────────────────────────
  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnterApp={enterApp}
          onAuthSuccess={handleLandingAuthSuccess}
        />
        {Toast}
      </>
    );
  }

  // ── App shell view ────────────────────────────────────────
  return (
    <div className="min-h-screen text-ink flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={demoMode}
        user={user}
        openAuthModal={() => setIsAuthModalOpen(true)}
        onGoToLanding={() => { localStorage.removeItem(SEEN_KEY); setShowLanding(true); }}
      />

      {demoMode && (
        <div className="bg-amber-50 border-b border-amber-200/90 text-amber-950 py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Demo mode active: Predictions use pre-computed research weights instead of live model inference.</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 pb-28 md:pb-12">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'home' && (
            <HomeScreen
              setActiveTab={setActiveTab}
              recentScans={scans}
              user={user}
              openGuide={openGuide}
            />
          )}

          {activeTab === 'scan' && (
            <ScanScreen
              demoMode={demoMode}
              onScanCompleted={handleScanCompleted}
              setActiveTab={setActiveTab}
              onError={(msg) => showToast(msg, 'error')}
              user={user}
            />
          )}

          {activeTab === 'history' && (
            <HistoryScreen
              scans={scans}
              onDeleteScan={handleDeleteScan}
              onUpdateNotes={handleUpdateNotes}
            />
          )}

          {activeTab === 'insights' && <InsightsScreen insightsData={insightsData} />}

          {activeTab === 'profile' && (
            <ProfileScreen
              demoMode={demoMode}
              setDemoMode={setDemoMode}
              setActiveTab={setActiveTab}
              openAuthModal={() => setIsAuthModalOpen(true)}
              user={user}
              onSignOut={handleSignOut}
              initialSection={profileSection}
              onSectionChange={setProfileSection}
              onExport={handleExportData}
              onClearHistory={handleClearHistory}
              onGoToLanding={() => { localStorage.removeItem(SEEN_KEY); setShowLanding(true); }}
            />
          )}
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { localStorage.removeItem(SEEN_KEY); setShowLanding(true); }}
              className="font-serif font-bold text-slate-700 hover:text-teal-700 transition-colors"
              title="Return to product landing page"
            >
              SkinScan AI
            </button>
            <span>·</span>
            <span>Research Decision Support System · Not an Approved Medical Diagnostic Device</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { localStorage.removeItem(SEEN_KEY); setShowLanding(true); }}
              className="text-xs text-teal-700 font-semibold hover:underline"
            >
              Product Overview
            </button>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border border-slate-200/80">
              InceptionV3 · 3D-TDP v1.2
            </span>
          </div>
        </div>
      </footer>

      {Toast}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
