import React from 'react';
import {
  Scan, History, BookOpen, HelpCircle, ArrowRight, ShieldAlert,
  Sparkles, ChevronRight, Activity, BarChart3,
} from 'lucide-react';
import { formatRelativeDate, greetingForHour } from '../lib/format';
import { getLesionTheme } from '../lib/lesionStyles';

const RISK_LABELS = {
  'Melanoma': { label: 'High risk', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'Squamous Cell Carcinoma': { label: 'Moderate risk', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'Basal Cell Carcinoma': { label: 'Low–moderate risk', color: 'text-teal-700 bg-teal-50 border-teal-200' },
};

export default function HomeScreen({ setActiveTab, recentScans, openGuide, user }) {
  const greeting = greetingForHour();
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ── Clinical Hero Banner ─────────────────────────────── */}
      <section className="bg-gradient-to-br from-ink via-slate-900 to-[#06292c] rounded-3xl p-6 sm:p-9 text-white shadow-xl shadow-slate-900/15 relative overflow-hidden border border-white/10">
        {/* Ambient glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-60 h-60 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />

        {/* Reticle / Radar Scanner Graphic */}
        <div className="absolute right-8 top-8 hidden lg:block w-36 h-36 rounded-3xl border border-teal-500/20 overflow-hidden bg-slate-950/40 backdrop-blur-xs p-3">
          <div className="relative w-full h-full rounded-2xl border border-dashed border-teal-400/30 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-laser-sweep" />
            <Activity className="w-10 h-10 text-teal-400/40 animate-pulse-subtle" />
            {/* Corner crosshairs */}
            <span className="absolute top-1 left-1 w-2 h-2 border-t border-l border-teal-300" />
            <span className="absolute top-1 right-1 w-2 h-2 border-t border-r border-teal-300" />
            <span className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-teal-300" />
            <span className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-teal-300" />
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-teal-200 mb-4 border border-white/10 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>InceptionV3 · 3D-TDP · 92.3% validation accuracy</span>
          </div>

          <p className="text-xs uppercase tracking-widest font-semibold text-slate-300 mb-1">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3 leading-snug">
            Precision Lesion Analysis &amp; 3D-TDP Screening
          </h1>
          <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
            Upload a focused dermatological photo to classify melanoma, basal cell carcinoma, or squamous cell carcinoma with calibrated confidence and explainable Grad-CAM heatmaps.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-ink font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-teal-950/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Scan className="w-4 h-4" />
              <span>Start new scan</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-3.5 rounded-xl text-sm transition-all border border-white/10 hover:border-white/20"
            >
              <BarChart3 className="w-4 h-4 text-teal-300" />
              <span>View Model Insights</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Workstation Actions ────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Workstation tools</h3>
          <span className="text-xs text-slate-400">Clinical decision support</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { tab: 'scan', icon: Scan, title: 'New scan', desc: 'Run AI analysis', color: 'bg-teal-50 text-teal-800 border-teal-200/60' },
            { tab: 'history', icon: History, title: 'History & comparison', desc: `${recentScans?.length || 0} stored analyses`, color: 'bg-slate-100 text-slate-800 border-slate-200' },
            { action: () => openGuide('learn'), icon: BookOpen, title: 'Lesion library', desc: 'ABCDE diagnostic rules', color: 'bg-emerald-50 text-emerald-800 border-emerald-200/60' },
            { action: () => openGuide('help'), icon: HelpCircle, title: 'Capture protocol', desc: 'Photo clarity standards', color: 'bg-amber-50 text-amber-800 border-amber-200/60' },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => (item.action ? item.action() : setActiveTab(item.tab))}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-400/80 transition-all text-left group interactive-card"
            >
              <div className={`w-11 h-11 rounded-xl ${item.color} border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-ink mb-0.5 group-hover:text-teal-800 transition-colors">{item.title}</h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Scans Section ─────────────────────────────── */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">Recent scan activity</h3>
            <p className="text-xs text-slate-500">Evaluations performed on this workstation</p>
          </div>
          {recentScans?.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-teal-50/70"
            >
              <span>View all ({recentScans.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentScans?.length > 0 ? (
          <div className="space-y-2.5">
            {recentScans.slice(0, 4).map((scan, idx) => {
              const theme = getLesionTheme(scan.prediction);
              const risk = RISK_LABELS[scan.prediction];
              return (
                <button
                  type="button"
                  key={scan.id}
                  onClick={() => setActiveTab('history')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/40 hover:border-teal-200 transition-all text-left group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-13 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200/90 shadow-2xs">
                      <img
                        src={scan.original_image_url}
                        alt={scan.prediction}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => { e.target.src = 'https://placehold.co/100?text=Scan'; }}
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-ink truncate">{scan.prediction}</h4>
                        {risk && (
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${risk.color}`}>
                            {risk.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{formatRelativeDate(scan.created_at)}</p>
                      {scan.notes && (
                        <p className="text-[11px] text-slate-400 italic truncate max-w-md">"{scan.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${theme.badge} shadow-2xs`}>
                      {scan.confidence}% confidence
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Scan className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-ink mb-1">No workstation scans recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Upload a dermatological photograph or choose one of the pre-loaded research test samples to run your first screening.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-ink text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
            >
              <Scan className="w-3.5 h-3.5 text-teal-300" />
              <span>Launch scanner</span>
            </button>
          </div>
        )}
      </section>

      {/* ── Research & Clinical Disclaimer ───────────────────── */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs flex items-start gap-3.5 text-slate-600">
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed space-y-0.5">
          <p className="font-semibold text-ink">Academic research decision-support only</p>
          <p className="text-slate-500">
            This artificial intelligence system provides statistical probability estimates based on InceptionV3 and 3D-TDP feature extraction. It does not replace histopathological biopsy or examination by a licensed board-certified dermatologist.
          </p>
        </div>
      </div>
    </div>
  );
}
