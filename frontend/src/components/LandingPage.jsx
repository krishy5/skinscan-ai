import React, { useState, useEffect } from 'react';
import {
  Scan, Sparkles, ShieldAlert, ArrowRight, CheckCircle2,
  Activity, Lock, Eye, EyeOff, Mail, User, X,
  Heart, Users, Microscope, Camera,
  FileText, Clock, Shield, Stethoscope
} from 'lucide-react';
import { signInWithGoogle } from '../lib/supabase';

function TrustBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-xs">
      <Icon className="w-4 h-4 text-teal-300 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function AudienceCard({ icon: Icon, color, iconBg, title, desc, tags }) {
  return (
    <div className={`rounded-3xl p-6 border ${color} space-y-4 bg-white/90 backdrop-blur-xs shadow-2xs hover:shadow-md transition-all interactive-card`}>
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-ink mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {tags.map((t) => (
          <span key={t} className="text-[10px] font-semibold px-2.5 py-0.5 bg-slate-50 rounded-full border border-slate-200/80 text-slate-600">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepCard({ n, icon: Icon, title, desc, color }) {
  return (
    <div className="flex flex-col items-center text-center relative p-4 rounded-2xl bg-white sm:bg-transparent">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-sm relative`}>
        <Icon className="w-6 h-6" />
        <div className="w-6 h-6 rounded-full bg-ink border-2 border-white text-white flex items-center justify-center text-[10px] font-bold absolute -top-2 -right-2 shadow-xs">
          {n}
        </div>
      </div>
      <h3 className="font-semibold text-sm text-ink mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}

function ConditionCard({ badge, badgeClass, risk, riskColor, title, body, signs, note }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3 interactive-card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>{badge}</span>
        <span className={`text-[11px] font-bold ${riskColor}`}>{risk}</span>
      </div>
      <h3 className="font-serif text-xl font-bold text-ink">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{body}</p>
      <div className="bg-slate-50/80 rounded-2xl p-3.5 space-y-2 border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnostic Signs</p>
        {signs.map((s) => (
          <div key={s} className="flex items-start gap-2 text-xs text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{s}</span>
          </div>
        ))}
      </div>
      {note && <p className="text-[11px] text-slate-400 italic pt-1">{note}</p>}
    </div>
  );
}

function AuthForm({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      if (!name.trim()) { setError('Please provide your full name.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email format.'); return; }
      if (password.length < 8) { setError('Password must contain at least 8 characters.'); return; }
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      onSuccess(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-7 space-y-5 animate-slide-up">
      <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
        {[
          ['login', 'Sign in'],
          ['register', 'Create account'],
        ].map(([m, lbl]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === m ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {mode === 'register' && (
          <div>
            <label htmlFor="lp-name" className="block text-xs font-semibold text-slate-700 mb-1">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="lp-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
              />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="lp-email" className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              id="lp-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@skinscan.ai"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
            />
          </div>
        </div>
        <div>
          <label htmlFor="lp-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              id="lp-password"
              type={showPwd ? 'text' : 'password'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 animate-scale-in" role="alert">
            <X className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white font-semibold py-3 rounded-xl text-xs sm:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
        >
          {loading ? (
            <span>Processing credentials…</span>
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign into Workstation' : 'Create Free Evaluator Account'}</span>
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </>
          )}
        </button>
      </form>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-400 font-medium">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="w-full flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>

      {mode === 'login' && (
        <button
          type="button"
          onClick={() => { setEmail(DEMO.email); setPassword(DEMO.password); }}
          className="w-full text-left text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-3 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-900 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-ink block">Demo Account:</span>
              <span className="font-mono text-slate-500">user@skinscan.ai / password123</span>
            </div>
            <span className="text-teal-700 font-bold text-[10px] bg-teal-100/70 px-2 py-0.5 rounded-md">
              1-Click Fill
            </span>
          </div>
        </button>
      )}

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Free academic access · data stored locally on your workstation
      </p>
    </div>
  );
}

export default function LandingPage({ onEnterApp, onAuthSuccess }) {
  const [showAuthCard, setShowAuthCard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowAuthCard(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSuccess = (user) => {
    onAuthSuccess(user);
    onEnterApp();
  };

  const scrollToAuth = () =>
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#f6f8fa] font-sans">
      {/* ── Top Navbar ────────────────────────────────── */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.25rem] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ink via-slate-900 to-teal-950 text-teal-300 flex items-center justify-center shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-serif text-[1.18rem] font-semibold text-ink tracking-tight">
                SkinScan <span className="text-teal-700 font-bold">AI</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">3D-TDP lesion decision support</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={scrollToAuth}
              className="hidden sm:flex text-xs font-semibold text-slate-700 hover:text-ink px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="text-xs font-semibold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-slate-900 to-[#032124] text-white pt-20 pb-28 sm:pt-28 sm:pb-36 border-b border-white/10">
        <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-32 bottom-0 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-semibold text-teal-200 mb-8 backdrop-blur-md shadow-xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>InceptionV3 · 3D-TDP Feature Extraction · 92.3% Accuracy</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.14] animate-slide-up">
              High-Precision Skin Lesion Screening,{' '}
              <span className="text-teal-400">Powered by AI</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-10 animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: '80ms' }}>
              Upload a dermatological photograph of a suspicious lesion. SkinScan AI computes multi-class classification across Melanoma, BCC, and SCC with calibrated certainty and explainable Grad-CAM heatmaps.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14 animate-slide-up" style={{ animationDelay: '160ms' }}>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-ink font-bold px-8 py-4 rounded-xl text-sm sm:text-base transition-all shadow-xl shadow-teal-950/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Scan className="w-5 h-5" />
                <span>Start Screening — Free</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                type="button"
                onClick={scrollToAuth}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-300 hover:text-white font-semibold px-6 py-4 rounded-xl text-sm sm:text-base transition-colors border border-white/15 hover:border-white/30 hover:bg-white/5"
              >
                Sign into Account
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 animate-fade-in" style={{ animationDelay: '240ms' }}>
              <TrustBadge icon={Shield} text="Research decision support" />
              <TrustBadge icon={Camera} text="Standard smartphone photos" />
              <TrustBadge icon={Clock} text="Inference in <2 seconds" />
              <TrustBadge icon={Lock} text="Runs locally on device" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-center animate-fade-in">
            {[
              { value: '92.3%', label: 'Held-out test accuracy' },
              { value: '3',     label: 'Malignant & non-melanoma classes' },
              { value: '3,053', label: 'Research validation images' },
              { value: '<2.1s', label: 'Average inference latency' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">{value}</div>
                <div className="text-xs text-teal-300 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prominent Clinical Notice ─────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong className="font-bold">Clinical Advisory:</strong> SkinScan AI is an investigational algorithm for research decision-support and triage education. It does <strong>not</strong> produce a confirmed histopathological diagnosis. Always consult a certified dermatologist for biopsy and evaluation.
          </p>
        </div>
      </div>

      {/* ── Audience Section ──────────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">Designed for Varied Clinical Contexts</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
            Who Benefits from SkinScan AI?
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            From patient awareness to academic deep learning research, the pipeline accommodates multiple use-cases.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AudienceCard
            icon={Heart}
            color="bg-rose-50/70 border-rose-200/80"
            iconBg="bg-rose-100 text-rose-600"
            title="Patients &amp; Individuals"
            desc="Examine changing moles or asymmetrical lesions to gauge when an in-person dermatology visit is urgently needed."
            tags={['Self-monitoring', 'ABCDE rules', 'Early triage']}
          />
          <AudienceCard
            icon={Users}
            color="bg-amber-50/70 border-amber-200/80"
            iconBg="bg-amber-100 text-amber-600"
            title="Caregivers &amp; Families"
            desc="Track suspicious skin spots on elderly relatives or dependent family members over recurring monthly checkups."
            tags={['Serial tracking', 'Notes', 'Visual history']}
          />
          <AudienceCard
            icon={Stethoscope}
            color="bg-teal-50/70 border-teal-200/80"
            iconBg="bg-teal-100 text-teal-700"
            title="General Practitioners"
            desc="Use as a pre-referral triage assistant. Generate clinical PDF documentation with Grad-CAM heatmaps for specialists."
            tags={['PDF summaries', 'Grad-CAM', 'Probability scores']}
          />
          <AudienceCard
            icon={Microscope}
            color="bg-indigo-50/70 border-indigo-200/80"
            iconBg="bg-indigo-100 text-indigo-700"
            title="Vision Researchers"
            desc="Analyze InceptionV3 + 3D-TDP depth profiles, confusion matrices, and per-class F1 performance metrics."
            tags={['3D-TDP', 'Confusion matrix', 'TFLite inference']}
          />
        </div>
      </section>

      {/* ── Process: 3 Steps ──────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">Streamlined Screening</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
              From Image to Diagnosis in Three Steps
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">
              No specialized hardware or dermatoscope required — high-quality smartphone photography is fully compatible.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <StepCard
              n="1"
              icon={Camera}
              color="bg-teal-50 text-teal-700"
              title="Capture Lesion Photo"
              desc="Photograph the spot in balanced natural light, keeping the lesion sharp and centered in the frame."
            />
            <StepCard
              n="2"
              icon={Activity}
              color="bg-indigo-50 text-indigo-700"
              title="3D-TDP &amp; Neural Inference"
              desc="The convolutional network extracts depth gradients and multi-scale texture features in under 2 seconds."
            />
            <StepCard
              n="3"
              icon={FileText}
              color="bg-emerald-50 text-emerald-700"
              title="Clinical PDF Report"
              desc="Review predicted risk category, confidence rating, Grad-CAM focus overlay, and download a summary report."
            />
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-all text-xs sm:text-sm shadow-sm"
            >
              <Scan className="w-4 h-4 text-teal-300" />
              <span>Start a Free Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Conditions Screened ───────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">Trained Diagnostic Scope</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
            What Does SkinScan AI Screen For?
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Trained on dermatological registries across three critical skin cancer phenotypes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ConditionCard
            badge="Melanoma"
            badgeClass="bg-rose-100 text-rose-800 border-rose-300"
            risk="High Risk · Immediate Specialist Review"
            riskColor="text-rose-600"
            title="Malignant Melanoma"
            body="Arising from melanocytes, melanoma carries high metastatic urgency. Early identification dramatically improves survival rates."
            signs={['Asymmetric lesion geometry', 'Irregular or notched borders', 'Variegated pigmentation', 'Diameter exceeding 6 mm', 'Evolving elevation']}
            note="1,113 training cohort images · urgent dermatologist consult advised"
          />
          <ConditionCard
            badge="Basal Cell Carcinoma"
            badgeClass="bg-amber-100 text-amber-800 border-amber-300"
            risk="High Curability with Early Intervention"
            riskColor="text-amber-600"
            title="Basal Cell Carcinoma (BCC)"
            body="Most frequent skin cancer globally. Grows indolently with minimal metastasis, but can inflict extensive local tissue morbidity if overlooked."
            signs={['Translucent pearly papule', 'Rolled border contours', 'Arborizing telangiectasia', 'Superficial ulceration']}
            note="514 training cohort images · typically curable with excision"
          />
          <ConditionCard
            badge="Squamous Cell Carcinoma"
            badgeClass="bg-orange-100 text-orange-800 border-orange-300"
            risk="Moderate Risk · Nodal Monitoring"
            riskColor="text-orange-600"
            title="Squamous Cell Carcinoma (SCC)"
            body="Develops from stratified keratinocytes, predominantly on chronic sun-damaged head, neck, and hand surfaces."
            signs={['Firm erythematous nodule', 'Hyperkeratotic crusted plaque', 'Non-healing cutaneous sore', 'Tender indurated base']}
            note="327 training cohort images · biopsy required for confirmation"
          />
        </div>
      </section>

      {/* ── Auth Section ──────────────────────────────── */}
      <section id="auth-section" className="py-20 bg-gradient-to-b from-slate-100/70 to-[#f6f8fa] border-t border-slate-200/80">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-ink text-teal-300 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Scan className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-ink mb-2">Sign In or Create Account</h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Create an account to save your scan records, clinical notes, and track lesion changes over time.
            </p>
          </div>

          {showAuthCard && <AuthForm onSuccess={handleSuccess} />}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onEnterApp}
              className="text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
            >
              Skip sign-in — continue as guest →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="bg-ink text-white py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-white">SkinScan AI</div>
                <div className="text-xs text-slate-400">Research Decision Support · v1.2</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 max-w-md text-xs text-slate-400 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Investigational Software:</strong> Outputs reflect statistical classifications and must not be interpreted as confirmed clinical diagnoses.
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>InceptionV3 · 3D-TDP · Grad-CAM · TFLite · Flask API · React 19</span>
            <span>92.3% Accuracy on Held-Out Test Cohort · 3 Target Classes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
