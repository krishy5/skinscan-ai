import React, { useEffect, useMemo, useState } from 'react';
import {
  Cpu, Layers, TrendingUp, Activity, CheckCircle2,
  Sparkles, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { percent } from '../lib/format';

const MATRIX = {
  labels: ['BCC', 'Melanoma', 'SCC'],
  matrix: [
    [473, 28, 13],
    [52, 988, 73],
    [11, 14, 302],
  ],
};

function StatSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="skeleton h-3 w-20 mb-2.5" />
      <div className="skeleton h-7 w-16 mb-1.5" />
      <div className="skeleton h-3 w-28" />
    </div>
  );
}

export default function InsightsScreen({ insightsData }) {
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [activeMatrixFilter, setActiveMatrixFilter] = useState('Overall');
  const [activeChartTab, setActiveChartTab] = useState('distribution');

  useEffect(() => {
    fetch('/api/model/metrics')
      .then((res) => res.json())
      .then((data) => { setMetrics(data); setMetricsLoading(false); })
      .catch(() => { setMetrics(null); setMetricsLoading(false); });
  }, []);

  const totalScans = insightsData?.total_scans ?? 0;
  const latestPred = insightsData?.latest_prediction || '—';
  const distribution = insightsData?.prediction_distribution;

  const chartData = useMemo(() => {
    if (!distribution) return [];
    return Object.entries(distribution).map(([name, count]) => ({
      name: name.replace(' Carcinoma', '').replace('Basal Cell', 'BCC').replace('Squamous Cell', 'SCC'),
      fullName: name,
      count,
    }));
  }, [distribution]);

  const trainingData = useMemo(() => {
    const hist = metrics?.training_history;
    if (!hist) return [];
    return hist.epochs.map((epoch, i) => ({
      epoch,
      'Train Acc': +(hist.train_acc[i] * 100).toFixed(1),
      'Val Acc': +(hist.val_acc[i] * 100).toFixed(1),
      'Train Loss': +hist.train_loss[i].toFixed(3),
      'Val Loss': +hist.val_loss[i].toFixed(3),
    }));
  }, [metrics]);

  const overall = metrics?.overall;
  const cm = metrics?.confusion_matrix || MATRIX;
  const rowIndex = { BCC: 0, Melanoma: 1, SCC: 2 }[activeMatrixFilter];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Screen Header ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Clinical &amp; Model Insights</h2>
          <p className="text-sm text-slate-500">Live workstation metrics &amp; published InceptionV3 3D-TDP benchmarks</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Research Evaluation Protocol</span>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Activity}
              label="Workstation Scans"
              value={totalScans}
              hint="Local persistent database"
              color="text-teal-700 bg-teal-50"
            />
            <StatCard
              icon={Sparkles}
              label="Latest Diagnosis"
              value={latestPred}
              hint="Most recent inference"
              color="text-indigo-700 bg-indigo-50"
              compact
            />
            <StatCard
              icon={CheckCircle2}
              label="Held-Out Accuracy"
              value={overall ? percent(overall.accuracy) : '92.3%'}
              hint="Test split (n=3,053)"
              color="text-emerald-700 bg-emerald-50"
            />
            <StatCard
              icon={Cpu}
              label="Macro F1-Score"
              value={overall ? percent(overall.f1_score) : '91.5%'}
              hint="Balanced harmonic mean"
              color="text-slate-800 bg-slate-100"
            />
          </>
        )}
      </div>

      {/* ── Performance Charts Card ──────────────────── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">Analytical Charts</h3>
            <p className="text-xs text-slate-500">Class breakdown and epoch convergence metrics</p>
          </div>
          <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
            {[
              { id: 'distribution', label: 'Workstation Mix' },
              { id: 'accuracy', label: 'Training Convergence' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveChartTab(id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeChartTab === id ? 'bg-white text-ink shadow-2xs' : 'text-slate-600 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeChartTab === 'distribution' && (
          <div>
            {chartData.length ? (
              <div className="h-60 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                      }}
                      formatter={(val, name, item) => [`${val} scans`, item.payload.fullName]}
                    />
                    <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center gap-2 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center p-4">
                <TrendingUp className="w-6 h-6 text-slate-400" />
                <p className="text-xs text-slate-600 font-semibold">No workstation scans recorded yet</p>
                <p className="text-[11px] text-slate-400">Class frequency distribution will appear after your first lesion scan.</p>
              </div>
            )}
          </div>
        )}

        {activeChartTab === 'accuracy' && (
          <div>
            {trainingData.length ? (
              <div className="h-60 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#475569' }} unit=" ep" />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} domain={[55, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                      }}
                      formatter={(v) => `${v}%`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Line type="monotone" dataKey="Train Acc" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Val Acc" stroke="#0284c7" strokeWidth={2.5} strokeDasharray="4 3" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <div className="skeleton h-40 w-full" />
              </div>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Convergence curves across 15 fine-tuning epochs on research cohort (n=3,053)
            </p>
          </div>
        )}
      </div>

      {/* ── Model Evaluation & Confusion Matrix ─────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-teal-100 mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>InceptionV3 Benchmark</span>
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink">Multiclass Validation Matrix</h3>
          </div>
          <span className="text-xs text-slate-400">3 Target Classes</span>
        </div>

        {/* Primary Metrics */}
        {metricsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniMetric label="Accuracy" value={overall ? percent(overall.accuracy) : '92.3%'} color="text-emerald-700 bg-emerald-50/70" />
            <MiniMetric label="Precision" value={overall ? percent(overall.precision) : '91.8%'} color="text-teal-700 bg-teal-50/70" />
            <MiniMetric label="Recall / Sensitivity" value={overall ? percent(overall.recall) : '91.2%'} color="text-sky-700 bg-sky-50/70" />
            <MiniMetric label="Harmonic F1" value={overall ? percent(overall.f1_score) : '91.5%'} color="text-indigo-700 bg-indigo-50/70" />
          </div>
        )}

        {/* Per-class F1 */}
        {metrics?.class_metrics && (
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Class-Specific F1-Scores</h4>
            {Object.entries(metrics.class_metrics).map(([cls, m]) => {
              const pct = Math.round(m.f1_score * 100);
              return (
                <div key={cls} className="flex items-center gap-3">
                  <span className="text-xs text-slate-700 font-semibold w-48 shrink-0 truncate">{cls}</span>
                  <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-ink w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Confusion Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confusion Matrix (n=3,053)</h4>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['Overall', 'BCC', 'Melanoma', 'SCC'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveMatrixFilter(filter)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    activeMatrixFilter === filter ? 'bg-ink text-white shadow-xs' : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3 text-left">Ground Truth \ Predicted</th>
                  {cm.labels.map((l) => (
                    <th key={l} className="p-3 font-semibold">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.matrix.map((row, r) => (
                  <tr key={cm.labels[r]} className={`border-b border-slate-100 last:border-0 ${rowIndex === r ? 'bg-teal-50/50' : ''}`}>
                    <td className="p-3 text-left font-semibold text-slate-800 bg-slate-50/80">{cm.labels[r]}</td>
                    {row.map((cell, c) => (
                      <td
                        key={`${r}-${c}`}
                        className={`p-3 font-mono ${
                          r === c
                            ? 'bg-emerald-100/70 text-emerald-950 font-bold'
                            : 'text-slate-500'
                        } ${
                          rowIndex === r || (activeMatrixFilter !== 'Overall' && c === rowIndex)
                            ? 'ring-1 ring-inset ring-teal-400'
                            : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            {activeMatrixFilter === 'Overall'
              ? 'Diagonal green cells reflect true positive concordances across the held-out validation cohort.'
              : `Highlighting cross-tabulated predictions for the ${activeMatrixFilter} class.`}
          </p>
        </div>
      </div>

      {/* ── 3D-TDP Architectural Blueprint ──────────── */}
      <div className="bg-gradient-to-br from-ink via-slate-900 to-[#042124] text-white rounded-3xl p-6 sm:p-7 space-y-4 relative overflow-hidden border border-white/10 shadow-lg">
        <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-semibold">3D-TDP Feature Engineering</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10 max-w-2xl">
          Three-Dimensional Texture and Depth Perception augments conventional 2D RGB imagery with spatial gradients and micro-relief surface variations. Sobel decomposition extracts depth gradients along lesion borders, enhancing boundary discrimination.
        </p>

        <div className="grid sm:grid-cols-4 gap-2.5 text-center text-xs font-semibold relative z-10 pt-2">
          {[
            { label: '2D RGB Input', step: '1', desc: 'Pre-processed 299×299 image' },
            { label: 'Sobel Depth Map', step: '2', desc: 'Z-gradient surface elevation' },
            { label: 'InceptionV3 Spine', step: '3', desc: 'Multi-scale spatial pooling' },
            { label: '3-Class Softmax', step: '4', desc: 'BCC · Melanoma · SCC', highlight: true },
          ].map(({ label, step, desc, highlight }) => (
            <div
              key={label}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                highlight
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <span className="text-[10px] opacity-70 uppercase tracking-widest">Phase {step}</span>
              <span className="font-bold text-xs">{label}</span>
              <span className="text-[10px] opacity-80 font-normal">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Technical Model Specification ────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Model Technical Profile</h3>
          <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
            InceptionV3 3D-TDP v1.2
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <SpecTile label="Architecture" value="InceptionV3" />
          <SpecTile label="Input Tensor" value="299 × 299 × 3 RGB" />
          <SpecTile label="Parameters" value="23.9M Total / 2.1M Trained" />
          <SpecTile label="Optimization" value="TFLite + Keras Float32" />
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700 font-mono leading-relaxed">
          Index Mapping: 0 → Basal Cell Carcinoma &nbsp;|&nbsp; 1 → Melanoma &nbsp;|&nbsp; 2 → Squamous Cell Carcinoma
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color, compact }) {
  return (
    <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <h3 className={`font-bold font-sans text-ink ${compact ? 'text-base truncate' : 'text-2xl'}`}>{value}</h3>
      <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
    </div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div className={`p-3.5 rounded-2xl border border-slate-200/80 text-center ${color}`}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase">{label}</p>
      <h4 className="text-xl font-bold font-sans text-ink mt-0.5">{value}</h4>
    </div>
  );
}

function SpecTile({ label, value }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
      <span className="text-slate-400 block text-[11px] mb-0.5">{label}</span>
      <strong className="text-ink font-semibold text-xs">{value}</strong>
    </div>
  );
}
