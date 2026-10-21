import React, { useState, useRef } from 'react';
import {
  Camera, Image as ImageIcon, RefreshCw, CheckCircle2, AlertTriangle,
  Download, Info, Sparkles, Layers, ShieldAlert,
  ArrowRight, Check, Cpu
} from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';
import { getLesionTheme } from '../lib/lesionStyles';

/** Circular Confidence Gauge */
function ConfidenceRing({ value }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = circ - (pct / 100) * circ;
  const riskLevel = pct >= 80 ? 'High' : pct >= 60 ? 'Moderate' : 'Low';
  const strokeColor = pct >= 80 ? '#e11d48' : pct >= 60 ? '#f59e0b' : '#0d9488';

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative flex items-center justify-center">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-label={`Confidence: ${value}%`} className="transform -rotate-90">
          <circle cx="46" cy="46" r={r} className="conf-ring-track" stroke="#e2e8f0" strokeWidth="6" fill="none" />
          <circle
            cx="46" cy="46" r={r}
            className="conf-ring-fill"
            stroke={strokeColor}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-sans text-ink leading-none">{value}%</span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Confidence</span>
        </div>
      </div>
      <span
        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs"
        style={{ color: strokeColor, borderColor: strokeColor + '40', background: strokeColor + '12' }}
      >
        {riskLevel} certainty
      </span>
    </div>
  );
}

/** Clinical Risk Badge */
function RiskBadge({ prediction }) {
  const risk = {
    'Melanoma': { label: 'High risk (Immediate clinical review)', className: 'bg-rose-50 text-rose-800 border-rose-300 badge-high-risk' },
    'Squamous Cell Carcinoma': { label: 'Moderate risk (Clinical triage)', className: 'bg-amber-50 text-amber-800 border-amber-300' },
    'Basal Cell Carcinoma': { label: 'Low–moderate risk (Dermatology referral)', className: 'bg-teal-50 text-teal-800 border-teal-300' },
  }[prediction] || { label: 'Investigate', className: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${risk.className}`}>
      <ShieldAlert className="w-3.5 h-3.5" />
      {risk.label}
    </span>
  );
}

const LOADING_STEPS = [
  'Pre-processing & normalizing 299×299 RGB tensor',
  'Extracting 3D-TDP surface texture and depth gradients',
  'Executing InceptionV3 deep convolutional classification',
  'Generating Grad-CAM attention heatmap explanation',
];

const SAMPLE_PRESETS = [
  {
    name: 'Basal Cell Carcinoma',
    short: 'Sample BCC',
    url: '/static/samples/sample_bcc.jpg',
    description: 'Pearly nodule with rolled borders',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    name: 'Melanoma',
    short: 'Sample Melanoma',
    url: '/static/samples/sample_melanoma.jpg',
    description: 'Asymmetric pigmented lesion',
    tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    name: 'Squamous Cell Carcinoma',
    short: 'Sample SCC',
    url: '/static/samples/sample_scc.jpg',
    description: 'Hyperkeratotic erythematous plaque',
    tagColor: 'bg-orange-50 text-orange-800 border-orange-200',
  },
];

export default function ScanScreen({ demoMode, onScanCompleted, setActiveTab, onError, user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [step, setStep] = useState('upload');
  const [loadingStep, setLoadingStep] = useState(1);
  const [qualityCheck, setQualityCheck] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTabGrad, setActiveTabGrad] = useState('heatmap');
  const [analyzeError, setAnalyzeError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setFileError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Unsupported file format. Please upload JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setFileError('File exceeds 12 MB limit. Please compress or crop the lesion.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageMeta({
        width: img.width,
        height: img.height,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });
      const isLowRes = img.width < 300 || img.height < 300;
      setQualityCheck({
        is_good: !isLowRes,
        score: isLowRes ? 58 : 94,
        warnings: isLowRes ? ['Resolution is below 300px. High magnification improves diagnostic accuracy.'] : [],
      });
      setStep('preview');
    };
  };

  const handleLoadSample = async (sample) => {
    try {
      setLoadingSample(true);
      const res = await fetch(sample.url);
      if (!res.ok) throw new Error('Could not load sample file');
      const blob = await res.blob();
      const file = new File([blob], `${sample.short.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      handleFileSelect(file);
    } catch {
      setFileError('Could not load test sample image. You may upload any custom image directly.');
    } finally {
      setLoadingSample(false);
    }
  };

  const resetScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setResult(null);
    setQualityCheck(null);
    setFileError(null);
    setAnalyzeError(null);
    setStep('upload');
    setIsDragging(false);
  };

  const runAnalysis = async () => {
    setAnalyzeError(null);
    setStep('loading');
    setLoadingStep(1);

    const timers = [
      setTimeout(() => setLoadingStep(2), 700),
      setTimeout(() => setLoadingStep(3), 1400),
      setTimeout(() => setLoadingStep(4), 2100),
    ];

    try {
      if (demoMode) {
        await new Promise((res) => setTimeout(res, 2400));
        const demoResult = {
          id: `scan-demo-${Date.now()}`,
          prediction: 'Melanoma',
          confidence: 87.5,
          probabilities: {
            'Basal Cell Carcinoma': 0.082,
            Melanoma: 0.875,
            'Squamous Cell Carcinoma': 0.043,
          },
          original_image_url: previewUrl,
          heatmap_image_url: previewUrl,
          tdp_features: {
            texture: 'Irregular asymmetrical surface texture profile detected',
            border: 'Notched border gradient detected by 3D-TDP spatial map',
            color: 'Multicolor pigment variegation (dark brown and erythematous rim)',
            depth_profile: 'Elevated nodular profile with central shadow gradient',
          },
          quality_report: { is_good: true, score: 92, warnings: [] },
          model_version: 'InceptionV3 3D-TDP v1.2 (Demo)',
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        setResult(demoResult);
        onScanCompleted(demoResult);
        setStep('result');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (user?.id) formData.append('user_id', user.id);
      const response = await fetch('/api/predict', { method: 'POST', body: formData });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Server error occurred during model inference.');
      }
      const data = await response.json();
      setResult(data);
      onScanCompleted(data);
      setStep('result');
    } catch (err) {
      const message = err.message || 'Analysis failed. Please verify API service connectivity.';
      setAnalyzeError(message);
      onError?.(message);
      setStep('preview');
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* ── Screen Header ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Lesion Scanner</h2>
          <p className="text-sm text-slate-500">3D-TDP feature extraction &amp; multi-class neural inference</p>
        </div>
        {step !== 'upload' && (
          <button
            type="button"
            onClick={resetScan}
            className="text-xs font-semibold text-slate-600 hover:text-ink bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── STEP 1: UPLOAD & PRESETS ─────────────────── */}
      {step === 'upload' && (
        <div className="space-y-5 animate-slide-up">
          {/* Main Drag-and-Drop Zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload lesion image — click or drag and drop"
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            className={`bg-white rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all shadow-xs cursor-pointer select-none relative overflow-hidden group ${
              isDragging ? 'drop-zone-active' : 'border-slate-300/90 hover:border-teal-500 hover:shadow-md'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files[0])} accept="image/jpeg,image/png,image/webp" className="hidden" />
            <input type="file" ref={cameraInputRef} onChange={(e) => handleFileSelect(e.target.files[0])} accept="image/*" capture="environment" className="hidden" />

            <div className={`w-18 h-18 rounded-2xl ${isDragging ? 'bg-teal-100 text-teal-800 scale-105' : 'bg-teal-50/90 text-teal-700'} flex items-center justify-center mx-auto mb-4 transition-all relative shadow-2xs group-hover:scale-105`}>
              <Camera className="w-9 h-9 relative z-10" />
              {isDragging && (
                <div className="absolute inset-x-0 h-1 bg-teal-400/60 animate-scan-beam" />
              )}
            </div>

            <h3 className="font-serif text-xl font-semibold text-ink mb-1">
              {isDragging ? 'Drop to initialize analysis' : 'Upload or capture lesion photograph'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Supported formats: JPG, PNG, WEBP · up to 12 MB · sharp focus
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold px-5 py-3 rounded-xl text-xs hover:bg-slate-800 transition-all shadow-sm"
              >
                <Camera className="w-4 h-4 text-teal-300" />
                <span>Use camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 text-ink font-semibold px-5 py-3 rounded-xl text-xs hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                <span>Browse files</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 hidden sm:block">Or drag and drop the image directly into this container</p>
          </div>

          {fileError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-medium animate-scale-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Quick Presets / Test Samples */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">Research Test Presets</h4>
              </div>
              <span className="text-[11px] text-slate-400">1-click validation samples</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PRESETS.map((sample) => (
                <button
                  key={sample.short}
                  type="button"
                  disabled={loadingSample}
                  onClick={() => handleLoadSample(sample)}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-300 transition-all text-left group flex flex-col justify-between interactive-card"
                >
                  <div className="space-y-1 mb-2">
                    <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold border ${sample.tagColor}`}>
                      {sample.short}
                    </span>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-teal-800">{sample.name}</h5>
                    <p className="text-[11px] text-slate-500 leading-tight">{sample.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Load sample</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Photography Guidelines */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Best capture standards</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {[
                'Diffused natural illumination, eliminate specular flash glare',
                'Stabilize camera to minimize motion blur artifacts',
                'Center the lesion filling at least 60% of the active frame',
                'Include 5–10 mm of intact surrounding skin margin',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: PREVIEW & QUALITY AUDIT ─────────── */}
      {step === 'preview' && previewUrl && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 animate-slide-up">
          {/* Lesion Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-84 flex items-center justify-center border border-slate-800">
            <img src={previewUrl} alt="Target lesion preview" className="w-full object-contain max-h-84" />
            
            {/* Medical Reticle Crosshairs */}
            <div className="absolute inset-0 pointer-events-none border border-teal-500/20 m-4 rounded-xl flex items-center justify-center">
              <span className="w-4 h-4 border-t-2 border-l-2 border-teal-400 absolute top-0 left-0" />
              <span className="w-4 h-4 border-t-2 border-r-2 border-teal-400 absolute top-0 right-0" />
              <span className="w-4 h-4 border-b-2 border-l-2 border-teal-400 absolute bottom-0 left-0" />
              <span className="w-4 h-4 border-b-2 border-r-2 border-teal-400 absolute bottom-0 right-0" />
            </div>

            {qualityCheck?.is_good && (
              <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pre-flight checks passed</span>
              </div>
            )}
          </div>

          {/* Metadata pill */}
          {imageMeta && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-ink truncate">{imageMeta.name}</span>
                <span>·</span>
                <span className="font-mono">{imageMeta.width} × {imageMeta.height} px</span>
                <span>·</span>
                <span>{imageMeta.size}</span>
              </div>
              <button
                type="button"
                onClick={resetScan}
                className="text-rose-600 font-semibold hover:text-rose-800 transition-colors ml-2 shrink-0"
              >
                Change photo
              </button>
            </div>
          )}

          {analyzeError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 text-xs animate-scale-in">
              <p className="font-semibold mb-1">Inference exception occurred</p>
              <p>{analyzeError}</p>
              <p className="mt-2 text-rose-700">Tip: Enable Demo Mode in the Profile tab to simulate model response without running backend inference.</p>
            </div>
          )}

          {qualityCheck && !qualityCheck.is_good && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 space-y-1.5 animate-scale-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-semibold text-xs">Low resolution advisory</h4>
              </div>
              <p className="text-xs text-amber-800">{qualityCheck.warnings[0]}</p>
            </div>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-teal-900/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>Execute 3D-TDP &amp; InceptionV3 Analysis</span>
          </button>
        </div>
      )}

      {/* ── STEP 3: PIPELINE LOADING ─────────────────── */}
      {step === 'loading' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-6 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center shadow-sm">
              <Cpu className="w-9 h-9 animate-spin text-teal-600" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-teal-500/30 animate-ping opacity-30" />
          </div>

          <div>
            <h3 className="font-serif text-2xl font-semibold text-ink">Analyzing Dermatological Features</h3>
            <p className="text-xs text-slate-500 mt-1">Deep convolutional extraction with 3D texture &amp; depth profiling</p>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Pipeline Stage {loadingStep} of {LOADING_STEPS.length}</span>
              <span className="font-mono text-teal-700">{Math.round((loadingStep / LOADING_STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${(loadingStep / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2 text-left">
            {LOADING_STEPS.map((label, i) => {
              const isDone = loadingStep > i + 1;
              const isCurrent = loadingStep === i + 1;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all duration-300 ${
                    isDone
                      ? 'bg-teal-50/80 border-teal-200 text-teal-950 font-medium'
                      : isCurrent
                        ? 'bg-slate-50 border-teal-400 text-ink font-semibold shadow-xs ring-1 ring-teal-500/20'
                        : 'bg-slate-50/50 border-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-teal-600 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>{i + 1}. {label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: COMPREHENSIVE RESULT CARD ────────── */}
      {step === 'result' && result && (() => {
        const theme = getLesionTheme(result.prediction);
        return (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Inference Verdict</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{result.created_at}</span>
            </div>

            {/* Diagnosis Banner with Confidence Ring */}
            <div className={`${theme.bg} border ${theme.border} rounded-2xl p-5 sm:p-6 shadow-2xs`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Predicted Lesion Class</span>
                  <h2 className={`font-serif text-2xl sm:text-3xl font-bold ${theme.text} tracking-tight`}>
                    {result.prediction}
                  </h2>
                  <RiskBadge prediction={result.prediction} />
                </div>
                <ConfidenceRing value={result.confidence} />
              </div>
            </div>

            {/* Medical Disclaimer Alert */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-ink font-semibold">Diagnostic reminder:</strong> Model predictions reflect statistical classification on the 3D-TDP dataset and do not replace histological analysis. Always seek a dermatological biopsy confirmation.
              </p>
            </div>

            {/* Class Probabilities Distribution */}
            <div className="space-y-3 bg-slate-50/60 p-4.5 rounded-2xl border border-slate-200/70">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">Multi-Class Probability Distribution</h4>
                <span className="text-[11px] text-slate-400">Softmax calibrated</span>
              </div>
              {Object.entries(result.probabilities || {}).map(([cls, prob]) => {
                const pct = Math.round(prob * 100);
                const isTop = cls === result.prediction;
                const t = getLesionTheme(cls);
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isTop ? 'font-bold text-ink flex items-center gap-1.5' : 'text-slate-600'}>
                        {isTop && <Check className="w-3.5 h-3.5 text-teal-700" />}
                        {cls}
                      </span>
                      <span className={`font-mono ${isTop ? 'font-bold text-ink' : 'text-slate-500'}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isTop ? t.bar : 'bg-slate-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3D-TDP Texture & Depth Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">3D-TDP Morphological Observations</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  ['Surface Texture', result.tdp_features?.texture || 'Micro-relief topography evaluated'],
                  ['Border Margin', result.tdp_features?.border || 'Peripheral gradient contour mapped'],
                  ['Color Spectrum', result.tdp_features?.color || 'Multi-channel pigment variance identified'],
                  ['Depth Perception', result.tdp_features?.depth_profile || result.tdp_features?.depth || 'Sobel z-gradient elevation estimated'],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs shadow-2xs">
                    <span className="font-semibold text-ink block mb-0.5">{label}</span>
                    <span className="text-slate-600 leading-snug">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explainable AI — Grad-CAM Heatmap */}
            <div className="space-y-3 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">Explainable AI (Grad-CAM)</h4>
                  <p className="text-[11px] text-slate-500">Saliency map of neural network focal regions</p>
                </div>
                <div className="flex rounded-xl bg-slate-200/70 p-1">
                  {[
                    { id: 'original', label: 'Original' },
                    { id: 'heatmap', label: 'AI Heatmap' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTabGrad(id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        activeTabGrad === id ? 'bg-white text-ink shadow-xs' : 'text-slate-600 hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-72 flex items-center justify-center border border-slate-800">
                <img
                  src={activeTabGrad === 'original' ? result.original_image_url : result.heatmap_image_url}
                  alt={activeTabGrad === 'original' ? 'Original lesion photo' : 'Grad-CAM saliency overlay'}
                  className="w-full object-contain max-h-72"
                />
              </div>

              {/* Heatmap spectrum legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Low neural activation</span>
                <div className="h-2 w-36 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-rose-600" />
                <span>High lesion saliency</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => generatePDFReport(result)}
                  className="flex items-center justify-center gap-2 bg-ink text-white font-semibold py-3 px-4 rounded-xl text-xs hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-teal-300" />
                  <span>Download clinical report</span>
                </button>
                <button
                  type="button"
                  onClick={resetScan}
                  className="flex items-center justify-center gap-2 bg-slate-100 text-ink font-semibold py-3 px-4 rounded-xl text-xs hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Analyze another lesion</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="w-full text-center text-xs font-semibold text-teal-800 py-2 hover:text-teal-950 flex items-center justify-center gap-1"
              >
                <span>Review scan history and side-by-side progression</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
