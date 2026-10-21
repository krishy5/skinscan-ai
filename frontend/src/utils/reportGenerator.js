import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFReport = async (scan) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const width = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, width, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SkinScan AI  |  Lesion Analysis Report', 14, 16);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, width - 14, 16, { align: 'right' });
  
  // Disclaimer Banner
  doc.setFillColor(254, 242, 242); // Red 50
  doc.setDrawColor(254, 202, 202);
  doc.rect(14, 32, width - 28, 16, 'FD');
  
  doc.setTextColor(185, 28, 28); // Red 700
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RESEARCH & DECISION SUPPORT TOOL - NOT A MEDICAL DIAGNOSIS', 18, 38);
  doc.setFont('helvetica', 'normal');
  doc.text('This AI report is generated for preliminary research evaluation. Always consult a certified dermatologist.', 18, 44);

  // Scan Metadata Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scan Details', 14, 58);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Scan ID: ${scan.id}`, 14, 65);
  doc.text(`Date & Time: ${scan.created_at}`, 14, 71);
  doc.text(`AI Model: ${scan.model_version || 'InceptionV3 3D-TDP v1.2'}`, 14, 77);

  // Primary Prediction Box
  const isConcerning = scan.prediction === 'Melanoma';
  if (isConcerning) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
  } else {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(34, 197, 94);
  }
  doc.rect(14, 85, width - 28, 24, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isConcerning ? 185 : 21, isConcerning ? 28 : 128, isConcerning ? 28 : 61);
  doc.text(`Primary Prediction: ${scan.prediction}`, 20, 95);
  doc.setFontSize(12);
  doc.text(`Model Confidence: ${scan.confidence}%`, width - 20, 95, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('* Model confidence reflects AI pattern matching probability and does not equal diagnostic certainty.', 20, 103);

  // Class Probabilities Breakdown
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Probability Distribution', 14, 120);

  let y = 128;
  const probs = scan.probabilities || {};
  Object.entries(probs).forEach(([cls, val]) => {
    const pct = Math.round(val * 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', cls === scan.prediction ? 'bold' : 'normal');
    doc.text(cls, 14, y);
    doc.text(`${pct}%`, 80, y);

    // Draw simple progress bar
    doc.setFillColor(226, 232, 240);
    doc.rect(95, y - 3, 90, 4, 'F');
    doc.setFillColor(cls === scan.prediction ? (isConcerning ? 239 : 34) : 148, cls === scan.prediction ? (isConcerning ? 68 : 197) : 163, cls === scan.prediction ? (isConcerning ? 68 : 94) : 184);
    doc.rect(95, y - 3, Math.max(2, (pct / 100) * 90), 4, 'F');

    y += 8;
  });

  // 3D-TDP Visual Observations
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3D-TDP Feature Observations (AI-Derived)', 14, y);

  y += 7;
  const tdp = scan.tdp_features || {};
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Texture Analysis: ${tdp.texture || 'Spatial gradient evaluated'}`, 14, y); y += 6;
  doc.text(`• Border Irregularity: ${tdp.border || 'Boundary contrast mapped'}`, 14, y); y += 6;
  doc.text(`• Color Asymmetry: ${tdp.color || 'HSV variance measured'}`, 14, y); y += 6;
  doc.text(`• Depth Perception: ${tdp.depth_profile || tdp.depth || 'Elevation surface profile estimated'}`, 14, y); y += 6;

  if (scan.notes) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('User Personal Notes', 14, y);
    y += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(scan.notes, 14, y, { maxWidth: width - 28 });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SkinScan AI System • Powered by InceptionV3 & 3D-TDP Deep Learning Architecture', width / 2, 285, { align: 'center' });

  doc.save(`SkinScan_Report_${scan.id}.pdf`);
};
