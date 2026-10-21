export const CLASSES = [
  'Basal Cell Carcinoma',
  'Melanoma',
  'Squamous Cell Carcinoma',
];

export function getLesionTheme(prediction) {
  switch (prediction) {
    case 'Basal Cell Carcinoma':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        bar: 'bg-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        short: 'BCC',
      };
    case 'Squamous Cell Carcinoma':
      return {
        badge: 'bg-orange-50 text-orange-800 border-orange-200',
        bar: 'bg-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        short: 'SCC',
      };
    case 'Melanoma':
      return {
        badge: 'bg-rose-50 text-rose-800 border-rose-200',
        bar: 'bg-rose-500',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        short: 'Melanoma',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        bar: 'bg-teal-600',
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        border: 'border-slate-200',
        short: prediction || 'Unknown',
      };
  }
}
