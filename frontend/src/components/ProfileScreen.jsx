import React, { useEffect, useState } from 'react';
import {
  Shield, Bell, Lock, Trash2, BookOpen, Sparkles,
  ChevronRight, Camera, Info, Cpu, LogOut, LogIn, Activity,
  ArrowLeft, AlertTriangle, ExternalLink, FileJson
} from 'lucide-react';
import { initials } from '../lib/format';

export default function ProfileScreen({
  demoMode, setDemoMode, setActiveTab, openAuthModal, user, onSignOut,
  initialSection = 'main', onSectionChange, onExport, onClearHistory, onGoToLanding,
}) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem('skinscan_notifications') !== '0'
  );

  const handleNotifications = (val) => {
    setNotifications(val);
    localStorage.setItem('skinscan_notifications', val ? '1' : '0');
  };
  const [confirmClear, setConfirmClear] = useState(false);

  const go = React.useCallback((section) => {
    setActiveSection(section);
    onSectionChange?.(section);
  }, [onSectionChange]);

  useEffect(() => {
    setActiveSection(initialSection || 'main');
  }, [initialSection]);

  // Keyboard: Escape returns to main section
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && activeSection !== 'main') go('main');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSection, go]);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* ── Screen Header ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {activeSection === 'main' ? 'Researcher Profile & Tools' : 'Profile Settings'}
          </h2>
          <p className="text-sm text-slate-500">Account credentials, dermatological library &amp; data preferences</p>
        </div>
        {activeSection !== 'main' && (
          <button
            type="button"
            onClick={() => go('main')}
            aria-label="Back to main profile"
            className="text-xs font-semibold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-200/80 hover:bg-teal-100/70 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* ── MAIN SECTION ─────────────────────────────── */}
      {activeSection === 'main' && (
        <>
          {/* Identity Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ink via-slate-900 to-teal-950 text-teal-300 font-bold text-xl flex items-center justify-center shadow-md">
                    {initials(user?.name)}
                  </div>
                  {user && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" title="Session active" />
                  )}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-ink leading-tight truncate">
                      {user?.name || 'Guest Clinical Evaluator'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'Local workstation session'}</p>
                  <div className="inline-flex items-center gap-1.5 mt-1 bg-slate-100/90 text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    <Shield className="w-3 h-3 text-teal-700" />
                    <span>{user?.role === 'researcher' ? 'Lead Researcher' : 'Clinical Access'}</span>
                  </div>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/90 flex items-center gap-2 hover:bg-slate-200 transition-colors shrink-0 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="text-xs font-semibold text-white bg-ink px-4.5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shrink-0 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-teal-300" />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Educational Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <GuideCard
              icon={BookOpen}
              color="bg-emerald-50 text-emerald-700 border-emerald-200/80"
              title="Lesion Educational Library"
              desc="Melanoma, BCC, SCC clinical criteria"
              onClick={() => go('education')}
            />
            <GuideCard
              icon={Camera}
              color="bg-amber-50 text-amber-700 border-amber-200/80"
              title="Clinical Photography Protocol"
              desc="8 rules for sharp diagnostic photos"
              onClick={() => go('capture_guide')}
            />
          </div>

          {/* Preferences & System Tools */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 mb-3">
              Workstation Settings
            </h3>
            
            <ToggleRow
              icon={Sparkles}
              iconClass="text-amber-500 bg-amber-50"
              title="Demo Mode"
              desc="Simulate predictions with pre-computed research weights without active GPU inference"
              checked={demoMode}
              onChange={setDemoMode}
              id="toggle-demo"
            />

            <ToggleRow
              icon={Bell}
              iconClass="text-teal-600 bg-teal-50"
              title="Notification Banners"
              desc="Display toast alerts when asynchronous image inference and Grad-CAM complete"
              checked={notifications}
              onChange={handleNotifications}
              id="toggle-notif"
            />

            <button
              type="button"
              onClick={() => go('admin')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-ink">Researcher Model Card</h4>
                  <p className="text-[11px] text-slate-500">InceptionV3 parameters, tensors, and transfer learning specs</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => go('privacy')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-ink">Data &amp; Privacy Management</h4>
                  <p className="text-[11px] text-slate-500">Export JSON records or purge local workstation database</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-teal-50/70 text-left transition-all group border-t border-slate-100 mt-2 pt-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-ink">View Public Landing Page</h4>
                    <p className="text-[11px] text-slate-500">Patient overview, educational guide &amp; screening awareness</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Academic Notice */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 text-xs text-slate-600 leading-relaxed flex items-start gap-3 shadow-2xs">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong className="text-ink font-semibold">Institutional Notice:</strong> SkinScan AI is an investigational software prototype designed to evaluate convolutional vision models and 3D texture features. It is not approved by regulatory bodies as a medical diagnostic device.
            </p>
          </div>
        </>
      )}

      {/* ── LESION LIBRARY SUB-SCREEN ─────────────────── */}
      {activeSection === 'education' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold text-ink">Lesion Taxonomy &amp; Characteristics</h3>
            <span className="text-xs text-slate-400">Dermatological guidelines</span>
          </div>

          <EduCard
            badge="Melanoma"
            badgeClass="bg-rose-50 text-rose-700 border-rose-200"
            risk="High Risk"
            riskClass="text-rose-600"
            title="Malignant Melanoma"
            body="Arises from transformed melanocytes. Most aggressive cutaneous malignancy with high metastatic potential if excised late."
            extra="ABCDE Rule: Asymmetry, Border irregularity, Color variegation (dark brown/black/red), Diameter >6mm, Evolving elevation or size."
          />

          <EduCard
            badge="Basal Cell Carcinoma"
            badgeClass="bg-amber-50 text-amber-700 border-amber-200"
            risk="Low–Moderate Risk"
            riskClass="text-amber-600"
            title="Basal Cell Carcinoma (BCC)"
            body="Most frequent human skin cancer, predominantly developing on photo-exposed regions. Rarely metastasizes, but can cause destructive local tissue invasion."
            extra="Hallmarks: Pearly translucent papule or nodule, rolled border, arborizing telangiectasia, possible central ulceration."
          />

          <EduCard
            badge="Squamous Cell Carcinoma"
            badgeClass="bg-orange-50 text-orange-700 border-orange-200"
            risk="Moderate Risk"
            riskClass="text-orange-600"
            title="Squamous Cell Carcinoma (SCC)"
            body="Derives from keratinocytes in the stratified epidermis. Strongly associated with cumulative solar UV irradiance and actinic keratoses."
            extra="Hallmarks: Indurated erythematous plaque, hyperkeratotic crusting, non-healing ulcer, potential for regional nodal spread."
          />
        </div>
      )}

      {/* ── PHOTOGRAPHY GUIDE SUB-SCREEN ──────────────── */}
      {activeSection === 'capture_guide' && (
        <div className="space-y-4 animate-slide-up">
          <h3 className="font-serif text-xl font-semibold text-ink">Photography Protocol for Skin Lesions</h3>
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2.5">
            {[
              ['Diffused Natural Light', 'Avoid harsh artificial shadows and direct camera flash glare.'],
              ['Stabilize the Device', 'Brace both hands or stabilize on a flat surface to eliminate shake.'],
              ['Tap-to-Focus Directly on Lesion', 'Ensure the central surface texture is sharp, not the background skin.'],
              ['Maintain Surrounding Margin', 'Include 5–10 mm of intact surrounding skin for margin gradient contrast.'],
              ['Deactivate Beauty Filters', 'Software smoothing filters destroy critical diagnostic micro-relief.'],
              ['Avoid Excessive Digital Zoom', 'Move the lens closer (10–15 cm) rather than using digital magnification.'],
              ['Maintain >300px Resolution', 'Low-resolution images obscure discrete border notches.'],
              ['Maintain Serial Angle', 'When tracking changes, capture repeat images from the identical distance and angle.'],
            ].map(([title, desc], i) => (
              <div key={title} className="flex items-start gap-3.5 p-3.5 bg-slate-50/70 rounded-2xl hover:bg-teal-50/50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-ink text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-ink">{title}</h4>
                  <p className="text-xs text-slate-500 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className="w-full bg-ink text-white font-semibold py-3.5 rounded-xl text-xs sm:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Activity className="w-4 h-4 text-teal-300" />
            <span>Launch scanner with captured image</span>
          </button>
        </div>
      )}

      {/* ── MODEL CARD SUB-SCREEN ─────────────────────── */}
      {activeSection === 'admin' && (
        <div className="space-y-5 animate-slide-up">
          <div className="bg-gradient-to-br from-ink to-slate-900 text-white p-6 sm:p-7 rounded-3xl space-y-2 relative overflow-hidden border border-white/10 shadow-lg">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Model Technical Specifications</p>
            <h3 className="font-serif text-2xl font-bold">InceptionV3 3D-TDP v1.2</h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Published model profile for research reproducibility and methodology documentation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniSpec k="Model Format" v="TFLite &amp; H5" />
            <MiniSpec k="Total Params" v="23.9 Million" />
            <MiniSpec k="Input Tensor" v="299 × 299 × 3" />
            <MiniSpec k="Inference Latency" v="<2.1 seconds" green />
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
            <InfoRow label="Primary Weights" value="my_model.tflite (CPU optimized) / my_model.h5" />
            <InfoRow label="Normalization" value="img_tensor / 255.0 (0.0 to 1.0 range)" />
            <InfoRow label="Target Classes" value="0: BCC, 1: Melanoma, 2: SCC" />
            <InfoRow label="Feature Extractor" value="Sobel 3D-TDP Spatial Texture and Depth Perception" />
            <InfoRow label="Backbone" value="InceptionV3 initialized with ImageNet weights" />
            <InfoRow label="Trainable Head" value="2,101,251 parameters in dense projection layer" />
          </div>
        </div>
      )}

      {/* ── PRIVACY & DATA SUB-SCREEN ─────────────────── */}
      {activeSection === 'privacy' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
          <div>
            <h3 className="font-serif text-xl font-semibold text-ink">Workstation Data &amp; Storage</h3>
            <p className="text-xs text-slate-500">Manage localized records stored in the SQLite database.</p>
          </div>

          <button
            type="button"
            onClick={onExport}
            className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs sm:text-sm font-semibold text-ink hover:bg-slate-100 transition-all shadow-2xs group"
          >
            <span className="flex items-center gap-2.5">
              <FileJson className="w-4 h-4 text-teal-700" />
              <span>Export Workstation Records (.JSON)</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="w-full flex items-center justify-between p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 text-xs sm:text-sm font-semibold text-rose-800 hover:bg-rose-100/70 transition-all shadow-2xs group"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Purge All Workstation Scan Records</span>
              </span>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="p-4.5 border border-rose-200 rounded-2xl bg-rose-50 space-y-3 animate-scale-in">
              <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Database Wipe</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Are you sure you want to permanently delete all scans, notes, and heatmaps? This cannot be undone.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { onClearHistory(); setConfirmClear(false); }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Yes, Delete All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GuideCard({ icon: Icon, color, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 text-left flex items-center justify-between group transition-all interactive-card"
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl ${color} border flex items-center justify-center group-hover:scale-105 transition-transform shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-ink group-hover:text-teal-800 transition-colors">{title}</h4>
          <p className="text-[11px] text-slate-500 leading-tight">{desc}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
    </button>
  );
}

function ToggleRow({ icon: Icon, iconClass, title, desc, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3.5">
        <div className={`w-9 h-9 rounded-xl ${iconClass} flex items-center justify-center shrink-0`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <label htmlFor={id} className="font-semibold text-xs sm:text-sm text-ink cursor-pointer block">{title}</label>
          <p className="text-[11px] text-slate-500 leading-tight">{desc}</p>
        </div>
      </div>
      <label className="toggle-switch ml-3" aria-label={title}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          role="switch"
          aria-checked={checked}
        />
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </label>
    </div>
  );
}

function EduCard({ badge, badgeClass, risk, riskClass, title, body, extra }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-2 shadow-2xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>{badge}</span>
        <span className={`text-[11px] font-bold ${riskClass}`}>{risk}</span>
      </div>
      <h4 className="font-serif text-lg font-bold text-ink">{title}</h4>
      <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
      <p className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl leading-relaxed border border-slate-200/60">{extra}</p>
    </div>
  );
}

function MiniSpec({ k, v, green }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{k}</p>
      <h4 className={`text-sm font-bold mt-1 ${green ? 'text-emerald-600' : 'text-ink'}`}>{v}</h4>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 text-xs w-36 shrink-0">{label}</span>
      <span className="text-ink text-xs font-semibold font-mono text-right truncate">{value}</span>
    </div>
  );
}
