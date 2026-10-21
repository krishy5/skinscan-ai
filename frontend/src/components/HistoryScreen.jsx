import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Trash2, Download, X, Check, Columns, ShieldAlert,
  Edit3, ArrowUpDown, Clock, BarChart3
} from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';
import { formatDateTime, formatRelativeDate } from '../lib/format';
import { getLesionTheme } from '../lib/lesionStyles';

const FILTERS = ['All', 'Basal Cell Carcinoma', 'Melanoma', 'Squamous Cell Carcinoma'];
const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Newest first', icon: Clock },
  { id: 'date_asc', label: 'Oldest first', icon: Clock },
  { id: 'conf_desc', label: 'Highest confidence', icon: BarChart3 },
  { id: 'conf_asc', label: 'Lowest confidence', icon: BarChart3 },
];

function sortScans(scans, sortId) {
  const sorted = [...scans];
  switch (sortId) {
    case 'date_asc':  return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'conf_desc': return sorted.sort((a, b) => b.confidence - a.confidence);
    case 'conf_asc':  return sorted.sort((a, b) => a.confidence - b.confidence);
    default:          return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export default function HistoryScreen({ scans, onDeleteScan, onUpdateNotes }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [sortId, setSortId] = useState('date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeModalScan, setActiveModalScan] = useState(null);
  const [editingNote, setEditingNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('original');

  // Keyboard navigation & escape listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (scanToDelete) { setScanToDelete(null); return; }
        if (showCompareModal) { setShowCompareModal(false); return; }
        if (activeModalScan) { setActiveModalScan(null); return; }
        if (showSortMenu) { setShowSortMenu(false); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModalScan, showCompareModal, scanToDelete, showSortMenu]);

  // Summary counts
  const counts = useMemo(() => {
    const bcc = scans.filter((s) => s.prediction === 'Basal Cell Carcinoma').length;
    const mel = scans.filter((s) => s.prediction === 'Melanoma').length;
    const scc = scans.filter((s) => s.prediction === 'Squamous Cell Carcinoma').length;
    return { bcc, mel, scc, total: scans.length };
  }, [scans]);

  const filteredScans = sortScans(
    scans.filter((scan) => {
      const matchesFilter = selectedFilter === 'All' || scan.prediction === selectedFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        scan.prediction.toLowerCase().includes(q) ||
        scan.created_at.toLowerCase().includes(q) ||
        (scan.notes && scan.notes.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    }),
    sortId
  );

  const handleOpenDetail = (scan) => {
    setActiveModalScan(scan);
    setEditingNote(scan.notes || '');
    setActiveModalTab('original');
  };

  const handleSaveNote = async () => {
    if (!activeModalScan) return;
    setIsSavingNote(true);
    await onUpdateNotes(activeModalScan.id, editingNote);
    setActiveModalScan({ ...activeModalScan, notes: editingNote });
    setIsSavingNote(false);
  };

  const toggleCompareSelection = (scan) => {
    if (compareSelected.some((s) => s.id === scan.id)) {
      setCompareSelected(compareSelected.filter((s) => s.id !== scan.id));
    } else if (compareSelected.length < 2) {
      setCompareSelected([...compareSelected, scan]);
    }
  };

  const confirmDelete = async () => {
    if (scanToDelete) {
      await onDeleteScan(scanToDelete.id);
      setScanToDelete(null);
      if (activeModalScan?.id === scanToDelete.id) setActiveModalScan(null);
    }
  };

  const activeSortLabel = SORT_OPTIONS.find((s) => s.id === sortId)?.label || 'Sort';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Screen Header ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Scan History</h2>
          <p className="text-sm text-slate-500">{scans.length} stored records · annotate, compare, export clinical reports</p>
        </div>

        {/* Header Actions: Sort & Compare */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeSortLabel}</span>
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 min-w-[180px] overflow-hidden animate-scale-in p-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={sortId === opt.id}
                    onClick={() => { setSortId(opt.id); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                      sortId === opt.id ? 'text-teal-800 bg-teal-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{opt.label}</span>
                    {sortId === opt.id && <Check className="w-3.5 h-3.5 ml-auto text-teal-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compare toggle */}
          <button
            type="button"
            onClick={() => { setCompareMode(!compareMode); setCompareSelected([]); }}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs ${
              compareMode
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{compareMode ? 'Exit Compare' : 'Side-by-Side'}</span>
          </button>

          {compareMode && compareSelected.length === 2 && (
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="text-xs font-semibold bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-2 rounded-xl hover:from-teal-500 hover:to-teal-400 transition-all shadow-sm flex items-center gap-1.5 animate-pulse-subtle"
            >
              <span>Compare Selected (2)</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Counters ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total recorded', count: counts.total, color: 'text-ink' },
          { label: 'Melanoma', count: counts.mel, color: 'text-rose-700' },
          { label: 'Basal Cell (BCC)', count: counts.bcc, color: 'text-teal-700' },
          { label: 'Squamous Cell (SCC)', count: counts.scc, color: 'text-amber-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{label}</span>
            <span className={`text-xl font-bold font-sans ${color}`}>{count}</span>
          </div>
        ))}
      </div>

      {/* ── Search Input ─────────────────────────────── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by diagnosis, date, or clinical notes…"
          aria-label="Search scans"
          className="w-full bg-white border border-slate-200/90 rounded-2xl pl-11 pr-10 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filter Pills ─────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => {
          const isActive = selectedFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                isActive
                  ? 'bg-ink text-white border-ink shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'All' ? `All (${scans.length})` : getLesionTheme(f).short}
            </button>
          );
        })}
      </div>

      {compareMode && (
        <div className="bg-teal-50 border border-teal-200/90 rounded-2xl p-3.5 text-xs text-teal-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Select 2 scans to evaluate morphological difference side-by-side ({compareSelected.length} of 2 selected)</span>
          </div>
          {compareSelected.length === 2 && (
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="font-bold text-teal-800 underline hover:text-teal-950 shrink-0"
            >
              Open comparison modal
            </button>
          )}
        </div>
      )}

      {/* ── Scans Grid ───────────────────────────────── */}
      {filteredScans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredScans.map((scan) => {
            const selected = compareSelected.some((s) => s.id === scan.id);
            const theme = getLesionTheme(scan.prediction);
            return (
              <button
                type="button"
                key={scan.id}
                onClick={() => (compareMode ? toggleCompareSelection(scan) : handleOpenDetail(scan))}
                className={`bg-white rounded-2xl p-4 border text-left transition-all relative interactive-card ${
                  selected
                    ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md'
                    : 'border-slate-200/80 hover:border-teal-300 shadow-2xs'
                }`}
              >
                {compareMode && (
                  <span className={`absolute top-3.5 right-3.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    selected ? 'bg-teal-700 border-teal-700 text-white shadow-xs' : 'bg-white border-slate-300'
                  }`}>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </span>
                )}

                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/90">
                    <img
                      src={scan.original_image_url}
                      alt={`Scan: ${scan.prediction}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/100?text=Scan'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block px-2.5 py-0.2 rounded-full text-[10px] font-semibold border ${theme.badge}`}>
                        {scan.prediction}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-ink">{scan.confidence}% confidence</p>
                    <p className="text-[11px] text-slate-400 mt-0.5" title={formatDateTime(scan.created_at)}>
                      {formatRelativeDate(scan.created_at)}
                    </p>
                    {scan.notes && (
                      <p className="text-[11px] text-slate-500 italic truncate mt-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        "{scan.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center space-y-2 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink">No matching records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or switch to another diagnostic category filter.
          </p>
        </div>
      )}

      {/* ── Scan Detail Modal ─────────────────────────── */}
      {activeModalScan && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setActiveModalScan(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="detail-modal-title" className="font-serif text-xl font-semibold text-ink">Scan Evaluation</h3>
                <p className="text-xs text-slate-400">{formatDateTime(activeModalScan.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalScan(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewport with Tab toggle */}
            <div className="space-y-2">
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                {['original', 'heatmap'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveModalTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeModalTab === tab ? 'bg-white text-ink shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {tab === 'original' ? 'Original Photo' : 'Grad-CAM Attention'}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-60 flex items-center justify-center border border-slate-800">
                <img
                  src={activeModalTab === 'original' ? activeModalScan.original_image_url : (activeModalScan.heatmap_image_url || activeModalScan.original_image_url)}
                  alt={activeModalTab === 'original' ? 'Original lesion scan' : 'Grad-CAM heat view'}
                  className="w-full object-contain max-h-60"
                />
              </div>
            </div>

            {/* Verdict Box */}
            <div className={`p-4 rounded-2xl border text-center ${getLesionTheme(activeModalScan.prediction).badge}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">Classification Outcome</p>
              <h3 className="font-serif text-2xl font-bold mt-0.5">{activeModalScan.prediction}</h3>
              <p className="text-xs font-semibold mt-1">{activeModalScan.confidence}% confidence</p>
            </div>

            {/* Probabilities */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-class Probabilities</h4>
              {Object.entries(activeModalScan.probabilities || {}).map(([cls, prob]) => {
                const pct = Math.round(prob * 100);
                const isTop = cls === activeModalScan.prediction;
                const t = getLesionTheme(cls);
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isTop ? 'font-bold text-ink' : 'text-slate-600'}>{cls}{isTop ? ' ✓' : ''}</span>
                      <span className="font-mono text-slate-500">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isTop ? t.bar : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Personal / Clinical Notes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                <span>Clinical notes &amp; body location</span>
              </h4>
              <textarea
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder="e.g. Upper left shoulder, diameter ~5mm, patient reports itching…"
                rows={3}
                aria-label="Notes for this scan"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all resize-none"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="text-xs font-semibold bg-ink text-white px-3.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {isSavingNote ? 'Saving…' : 'Save notes'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScanToDelete(activeModalScan)}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 hover:text-rose-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete record</span>
              </button>
              <button
                type="button"
                onClick={() => generatePDFReport(activeModalScan)}
                className="text-xs font-semibold bg-ink text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>Download PDF report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare Side-by-Side Modal ────────────────── */}
      {showCompareModal && compareSelected.length === 2 && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowCompareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Side-by-side scan comparison"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-xl font-semibold text-ink">Side-by-Side Evaluation</h3>
                <p className="text-xs text-slate-500">Comparative visual audit across two captured points</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                aria-label="Close comparison"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {compareSelected.map((s, idx) => {
                const t = getLesionTheme(s.prediction);
                return (
                  <div key={s.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span className="font-bold text-ink">Scan #{idx + 1}</span>
                      <span>{formatRelativeDate(s.created_at)}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-slate-950 h-44 border border-slate-800">
                      <img src={s.original_image_url} alt={`Scan ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${t.badge}`}>
                        {s.prediction}
                      </span>
                      <p className="text-xs font-bold text-ink">{s.confidence}% certainty</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDateTime(s.created_at)}</p>
                    </div>
                    {/* Probabilities mini bars */}
                    <div className="space-y-1.5 pt-1">
                      {Object.entries(s.probabilities || {}).map(([cls, prob]) => (
                        <div key={cls} className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-600 w-8 shrink-0">{Math.round(prob * 100)}%</span>
                          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getLesionTheme(cls).bar}`} style={{ width: `${Math.round(prob * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delta calculation badge */}
            {compareSelected[0] && compareSelected[1] && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-700 text-center">
                Confidence variance: <strong className="text-ink">{Math.abs(compareSelected[0].confidence - compareSelected[1].confidence).toFixed(1)}%</strong>
                {' '}between Scan 1 ({compareSelected[0].confidence}%) and Scan 2 ({compareSelected[1].confidence}%)
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>
                Visual comparison for research monitoring only. Morphological evolution or lesion progression requires serial dermatoscopic evaluation by a licensed specialist.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ───────────────── */}
      {scanToDelete && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4 modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setScanToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 id="delete-modal-title" className="font-serif text-xl font-semibold text-ink">Delete Record?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action will permanently delete this analysis and associated image data from this workstation.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScanToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
