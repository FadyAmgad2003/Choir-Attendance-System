import React, { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { Printer, Palette, Sliders, CheckCircle2, Heart, Download, Image } from 'lucide-react';
import { Member } from '../types';
import { QRCodeImage } from '../qr';
import { toPng, toJpeg } from 'html-to-image';

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Pure vector crisp 1D Code-128 / Code-39 emulating high density barcode generator
const BarcodeImage: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const bars = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const result: { isBlack: boolean; width: number }[] = [];
    
    // Standard barcode start character
    result.push({ isBlack: true, width: 2 });
    result.push({ isBlack: false, width: 1 });
    result.push({ isBlack: true, width: 1 });
    result.push({ isBlack: false, width: 2 });
    
    let state = Math.abs(hash);
    for (let i = 0; i < 28; i++) {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      const width = (state % 3) + 1; // 1, 2, or 3px
      const isBlack = i % 2 === 0;
      result.push({ isBlack, width });
    }
    
    // Standard barcode stop character
    result.push({ isBlack: true, width: 2 });
    result.push({ isBlack: false, width: 1 });
    result.push({ isBlack: true, width: 3 });
    return result;
  }, [text]);

  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  return (
    <svg 
      className={className} 
      viewBox={`0 0 ${totalWidth} 24`} 
      width="100%" 
      height="100%" 
      preserveAspectRatio="none"
    >
      <rect width={totalWidth} height="24" fill="#ffffff" />
      {bars.map((bar, idx) => {
        if (!bar.isBlack) return null;
        const leftOffset = bars.slice(0, idx).reduce((acc, b) => acc + b.width, 0);
        return (
          <rect
            key={idx}
            x={leftOffset}
            y="0"
            width={bar.width}
            height="24"
            fill="#000000"
          />
        );
      })}
    </svg>
  );
};

// Premium high-fidelity geometric polygon low-poly abstract background
const PolyBackground: React.FC<{ themeColor: string; secondaryColor: string; id: string }> = ({ themeColor, secondaryColor, id }) => {
  return (
    <svg className="card-poly-bg absolute inset-0 w-full h-[95px] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0c16" />
          <stop offset="55%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={themeColor} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#grad-${id})`} />
      <polygon points="0,0 45,0 25,100 0,100" fill="#ffffff" opacity="0.08" />
      <polygon points="35,0 80,0 55,100 20,100" fill={themeColor} opacity="0.12" />
      <polygon points="75,0 100,0 100,60 50,100" fill="#ffffff" opacity="0.07" />
      <polygon points="10,0 90,0 100,100 0,100" fill="none" stroke="#ffffff" strokeWidth="0.15" opacity="0.1" />
      <polygon points="0,75 35,100 0,100" fill={secondaryColor} opacity="0.2" />
      <polygon points="65,0 100,50 100,0" fill="#ffffff" opacity="0.05" />
    </svg>
  );
};

// High intelligence DOB calculator from educational stages (Primary, Preparatory, etc.)
const getRealisticDOB = (stage: string, code: string) => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash += code.charCodeAt(i);
  }
  const day = (hash % 28) + 1;
  const month = (hash % 12) + 1;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  
  const currentYear = new Date().getFullYear();
  let birthYear = currentYear - 14;
  
  const s = (stage || '').toLowerCase();
  if (s.includes('kind') || s.includes('حض') || s.includes('تمه')) {
    birthYear = currentYear - 5;
  } else if (s.includes('first') || s.includes('اولى') || s.includes('ابتد') || s.includes('1') || s.includes('2') || s.includes('3') || s.includes('4') || s.includes('5') || s.includes('6')) {
    birthYear = currentYear - 9;
  } else if (s.includes('seco') || s.includes('ثان') || s.includes('اعداد') || s.includes('7') || s.includes('8') || s.includes('9')) {
    birthYear = currentYear - 13;
  } else if (s.includes('thir') || s.includes('ثال') || s.includes('ثانوى') || s.includes('high')) {
    birthYear = currentYear - 16;
  } else if (s.includes('univ') || s.includes('جامع') || s.includes('خريج') || s.includes('serv') || s.includes('خدم')) {
    birthYear = currentYear - 22;
  }
  return `${dayStr}/${monthStr}/${birthYear}`;
};

// High cohesion dynamic card expiry calculation
const getRealisticExpiryDate = (joinDate: string) => {
  if (!joinDate) return '31/12/2028';
  try {
    const parts = joinDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      return `31/12/${year + 3}`;
    }
  } catch (e) {}
  return '31/12/2028';
};

// Diocesan Bishop/Priest sign generator helper
const getSignatureName = (accent: string, lang: string) => {
  if (lang === 'ar') return 'الأنبا يوحنا';
  return 'Bishop Yohanna';
};

interface IDCardsProps {
  initialSelectedCodes: string[];
}

export const IDCards: React.FC<IDCardsProps> = ({ initialSelectedCodes }) => {
  const { members, orgName, logoUrl, t, language } = useApp();

  // Selected members to print
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() => {
    if (initialSelectedCodes.length > 0) return initialSelectedCodes;
    // By default, select all active members
    return members.filter(m => m.status === 'Active').map(m => m.memberCode);
  });

  // Custom colors selection states for templates
  const [themeColor, setThemeColor] = useState('#4f46e5'); // indigo
  const [secondaryColor, setSecondaryColor] = useState('#1e1b4b'); // deep slate
  const [cardAccent, setCardAccent] = useState('gold');

  // Custom text box styling states (for stage badge e.g. "كورال حبة خردل")
  const [useCustomTextBoxColor, setUseCustomTextBoxColor] = useState(false);
  const [textBoxBgColor, setTextBoxBgColor] = useState('#fef08a'); // default warm yellow / mustard
  const [textBoxTextColor, setTextBoxTextColor] = useState('#854d0e'); // default dark gold
  const [textBoxBorderColor, setTextBoxBorderColor] = useState('#fde047'); // default yellow border

  // Available theme presets
  const presets = [
    { name: 'Diocesan Royal Blue', primary: '#2563eb', secondary: '#1e3a8a', accent: 'silver' },
    { name: 'Coptic Crimson Red', primary: '#b91c1c', secondary: '#7f1d1d', accent: 'gold' },
    { name: 'Forest Clergy Green', primary: '#047857', secondary: '#064e3b', accent: 'gold' },
    { name: 'Cathedral Dark Purple', primary: '#7c3aed', secondary: '#4c1d95', accent: 'silver' },
  ];

  // List of actual members modeled by selection
  const selectedMembers = useMemo(() => {
    return members.filter(m => selectedCodes.includes(m.memberCode));
  }, [members, selectedCodes]);

  // States for exporting individual or multiple cards as images
  const [exportingCode, setExportingCode] = useState<string | null>(null);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const downloadCardAsImage = async (memberCode: string, fullName: string, format: 'png' | 'jpeg') => {
    const cardEl = document.getElementById(`member-credential-${memberCode}`);
    if (!cardEl) return;
    
    setExportingCode(memberCode);
    try {
      const exportFn = format === 'png' ? toPng : toJpeg;
      const dataUrl = await exportFn(cardEl, {
        quality: 0.95,
        pixelRatio: 2.0, // balanced high resolution
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          // Exclude any element containing the class 'no-print' (e.g. browser buttons/overlays) from the output image
          if (node instanceof HTMLElement) {
            if (node.classList.contains('no-print')) {
              return false;
            }
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `${fullName.replace(/\s+/g, '_')}_ID_${memberCode}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting card image:', err);
    } finally {
      setExportingCode(null);
    }
  };

  const downloadAllCardsAsImages = async (format: 'png' | 'jpeg') => {
    if (selectedMembers.length === 0) return;
    setBulkExporting(true);
    setExportProgress(0);
    
    try {
      for (let i = 0; i < selectedMembers.length; i++) {
        const m = selectedMembers[i];
        setExportProgress(i + 1);
        
        const cardEl = document.getElementById(`member-credential-${m.memberCode}`);
        if (cardEl) {
          const exportFn = format === 'png' ? toPng : toJpeg;
          const dataUrl = await exportFn(cardEl, {
            quality: 0.95,
            pixelRatio: 2.0,
            backgroundColor: '#ffffff',
            cacheBust: true,
            filter: (node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains('no-print')) {
                  return false;
                }
              }
              return true;
            }
          });
          
          const link = document.createElement('a');
          link.download = `${m.fullName.replace(/\s+/g, '_')}_ID_${m.memberCode}.${format}`;
          link.href = dataUrl;
          link.click();
          
          // Small delay between trigger downloads so the browser doesn't block sequential downloads
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      }
    } catch (err) {
      console.error('Error in batch exporting cards:', err);
    } finally {
      setBulkExporting(false);
      setExportProgress(0);
    }
  };

  const handleToggleCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    if (selectedCodes.length === members.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(members.map(m => m.memberCode));
    }
  };

  const handlePrintCards = () => {
    const printGrid = document.getElementById('id-cards-print-target-grid');
    if (!printGrid) return;

    // Open a native print-ready document window
    const printWin = window.open('', '_blank');
    if (printWin) {
      const isRtl = language === 'ar';
      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="${language}" dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${orgName} - ID Cards</title>
            <style>
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              body {
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                font-family: system-ui, -apple-system, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                display: block !important;
                padding: 0 !important;
                background: white !important;
                width: 100% !important;
              }
              
              /* Elegant Paginated A4 sheets containing exactly up to 4 cards */
              .print-page-sheet {
                display: grid !important;
                grid-template-columns: repeat(2, 54mm) !important;
                grid-template-rows: repeat(2, 85.6mm) !important;
                gap: 12mm 10mm !important;
                justify-content: center !important;
                align-content: center !important;
                height: 297mm !important;
                width: 210mm !important;
                margin: 0 auto !important;
                padding: 15mm 10mm !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                background: white !important;
                position: relative !important;
              }
              .print-page-sheet:last-child {
                page-break-after: avoid !important;
              }

              /* Hide screen-only helpers during printing */
              .no-print {
                display: none !important;
              }
              
              /* CR80 Vertical standard: 54mm width x 85.6mm height */
              .id-card-frame {
                width: 54mm !important;
                height: 85.6mm !important;
                max-width: 54mm !important;
                max-height: 85.6mm !important;
                min-width: 54mm !important;
                min-height: 85.6mm !important;
                border: 0.5px solid #cbd5e1 !important;
                border-radius: 4.5mm !important;
                box-shadow: none !important;
                page-break-inside: avoid !important;
                background: radial-gradient(circle at 100% 10%, ${themeColor}1a 0%, transparent 45%), radial-gradient(circle at 0% 90%, ${secondaryColor}15 0%, transparent 45%), #ffffff !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
                position: relative !important;
                margin: 0 auto !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Curved top header design inspired by Freepik template 23-2149213342 */
              .card-header-banner {
                height: 24mm !important;
                padding: 3mm 1mm 1mm 1mm !important;
                text-align: center !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                position: relative !important;
                background: linear-gradient(135deg, #090a14 0%, ${secondaryColor}d0 60%, ${themeColor} 100%) !important;
                clip-path: ellipse(120% 85% at 50% 15%) !important;
                -webkit-clip-path: ellipse(120% 85% at 50% 15%) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .card-header-accent {
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 0.6mm !important;
              }
              
              .card-header-subtitle {
                font-size: 4px !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.6px !important;
                color: ${cardAccent === 'gold' ? '#fcd34d' : '#e2e8f0'} !important;
                margin: 0 !important;
                line-height: 1 !important;
              }

              .card-header-heading {
                font-size: 7.5px !important;
                font-weight: 500 !important; /* Not bold as requested for clean legible look */
                color: #ffffff !important;
                margin: 0.6mm 0 0 0 !important;
                line-height: 1.1 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 50mm !important;
                text-shadow: 0 0.5px 1px rgba(0,0,0,0.3) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Avatar Photo placement styling: Overlapping circular layout */
              .card-avatar-wrapper {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                margin-top: -11mm !important;
                z-index: 100 !important;
                position: relative !important;
              }

              .photo-container {
                position: relative !important;
                display: inline-block !important;
              }

              .card-avatar-img {
                height: 22.8mm !important;
                width: 22.8mm !important;
                border-radius: 50% !important; /* Elegant circle avatar */
                object-fit: cover !important;
                border: 1px solid ${themeColor} !important;
                background-color: white !important;
                box-shadow: 0 0.5mm 1.5mm rgba(0,0,0,0.1) !important;
              }

              .avatar-rivet {
                position: absolute !important;
                width: 1mm !important;
                height: 1mm !important;
                border-radius: 50% !important;
                background: ${cardAccent === 'gold' ? 'linear-gradient(135deg, #fef08a, #ca8a04)' : 'linear-gradient(135deg, #f1f5f9, #94a3b8)'} !important;
                border: 0.2px solid white !important;
              }
              .rivet-tl { top: 0.2mm; left: 0.2mm; }
              .rivet-tr { top: 0.2mm; right: 0.2mm; }

              .card-avatar-badge {
                position: absolute !important;
                bottom: -0.8mm !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                font-size: 3px !important;
                padding: 0.2px 1.5mm !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                color: white !important;
                border-radius: 999px !important;
                background: ${themeColor} !important;
                white-space: nowrap !important;
                border: 0.3px solid white !important;
              }

              .card-member-name {
                font-size: 8px !important;
                font-weight: 700 !important;
                color: #1e293b !important;
                margin: 1.5mm 0 0 0 !important;
                line-height: 1.1 !important;
                text-align: center !important;
                width: 48mm !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              }

              .card-member-sub {
                font-size: 4.5px !important;
                font-weight: 600 !important;
                color: ${useCustomTextBoxColor ? textBoxTextColor : themeColor} !important;
                background: ${useCustomTextBoxColor ? textBoxBgColor : themeColor + '0a'} !important;
                border: 0.2px solid ${useCustomTextBoxColor ? textBoxBorderColor : themeColor + '20'} !important;
                padding: 0.2px 2mm !important;
                border-radius: 999px !important;
                margin: 0.6mm 0 0 0 !important;
                text-align: center !important;
              }

              /* Center QR Code Container with dynamic corner brackets */
              .card-qr-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1.2mm 0 !important;
                flex: 1 !important;
                width: 100% !important;
                position: relative !important;
              }

              .bracket-decoration {
                position: relative !important;
                padding: 1mm !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }

              .corner-b {
                position: absolute !important;
                width: 1.8mm !important;
                height: 1.8mm !important;
                border-color: ${themeColor} !important;
                border-style: solid !important;
              }
              .cb-tl { top: 0; left: 0; border-width: 0.4px 0 0 0.4px; }
              .cb-tr { top: 0; right: 0; border-width: 0.4px 0.4px 0 0; }
              .cb-bl { bottom: 0; left: 0; border-width: 0 0 0.4px 0.4px; }
              .cb-br { bottom: 0; right: 0; border-width: 0  0.4px 0.4px 0; }

              .card-qr-box {
                padding: 0.4mm !important;
                background: white !important;
                border: 0.4px solid #e2e8f0 !important;
                border-radius: 1mm !important;
              }

              .card-qr-box svg {
                width: 20mm !important;
                height: 20mm !important;
                display: block !important;
              }

              .card-member-code {
                font-size: 6px !important;
                font-family: monospace !important;
                font-weight: bold !important;
                color: #1e1b4b !important;
                background-color: #f1f5f9 !important;
                border: 0.3px solid #cbd5e1 !important;
                padding: 0.4px 2.5mm !important;
                border-radius: 9999px !important;
                margin: 1.2mm 0 0 0 !important;
                display: inline-block !important;
              }

              /* Bottom Branding Bar Card Seal */
              .card-footer-bar {
                background-color: ${secondaryColor} !important;
                color: #e2e8f0 !important;
                font-size: 5mm !important;
                padding: 1.2mm 2.5mm !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-top: 0.3px solid rgba(255, 255, 255, 0.1) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .card-footer-branding {
                font-size: 4px !important;
                font-weight: 950 !important;
                color: ${cardAccent === 'gold' ? '#fcd34d' : '#ffffff'} !important;
                text-transform: uppercase !important;
                display: flex !important;
                align-items: center !important;
                letter-spacing: 0.05em !important;
              }

              /* Nonprint custom notices */
              .no-print-tip {
                background-color: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #166534;
                padding: 4mm;
                border-radius: 2mm;
                margin: 5mm;
                font-size: 13px;
                line-height: 1.5;
              }
              @media print {
                .no-print-tip {
                  display: none !important;
                }
                body {
                  padding: 0;
                  margin: 0;
                }
                .print-container {
                  padding: 0 !important;
                }
                .print-page-sheet {
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print-tip">
              <strong>🖨️ ${isRtl ? 'تعليمات طباعة وتصدير بطاقات الهوية المبتكرة:' : 'PDF / Premium ID Card Printing Guide:'}</strong><br/>
              ${isRtl ? '• اضغط على **Ctrl + P** (أو **Cmd + P** على أجهزة الماك) لفتح نافذة التحكم بالطباعة.' : '• Press **Ctrl + P** (or **Cmd + P** on Mac) to open the printer console.'}<br/>
              ${isRtl ? '• اختر الوجهة كـ **حفظ بتنسيق PDF** (Save as PDF) أو طابعتك المخصصة.' : '• Set your Destination to **Save as PDF** or prioritize your dedicated card machine.'}<br/>
              ${isRtl ? '• **هام:** لا بد من تفعيل خيار **رسومات الخلفية** (Background Graphics) لضمان تفجير جمالية الألوان المائجة.' : '• **CRITICAL:** Ensure that **Background Graphics** is ticked/enabled to maintain the vibrant gradient layouts.'}<br/>
              ${isRtl ? '• عيّن الهوامش (Margins) لتكون **بلا** (None) للحصول على محاذاة دقيقة ومثالية للمقاسات.' : '• Set Margins to **None** for absolute card boundaries matching physical CR80.'}
            </div>
            <div class="print-container">
              ${printGrid.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } else {
      window.focus();
      window.print();
    }
  };

  return (
    <div className="space-y-6" id="id-card-generator-screen">
      {/* Upper Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Printer className="h-6 w-6 text-indigo-600" />
            {language === 'ar' ? 'نظام هويات الكورال الذكية' : 'Innovative Printing Studio'}
          </h1>
          <p className="text-sm text-slate-650 mt-1">
            {language === 'ar' ? 'تخصيص وتصدير بطاقات الهوية بتصاميم هندسية مبتكرة ومعرفات حضور مشفرة.' : 'Formulate spectacular creative modern cards complete with polygon cuts and vector QRs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrintCards}
            disabled={selectedMembers.length === 0 || bulkExporting}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-350 text-white rounded-xl text-xs font-semibold shadow-md shadow-slate-100 transition-all uppercase tracking-wide disabled:cursor-not-allowed"
          >
            <Printer className="h-4 w-4" />
            {t.downloadPdf}
          </button>

          <button
            onClick={() => downloadAllCardsAsImages('png')}
            disabled={selectedMembers.length === 0 || bulkExporting}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-350 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all uppercase tracking-wide disabled:cursor-not-allowed"
          >
            <Image className="h-4 w-4" />
            {language === 'ar' ? 'حفظ كـ PNG' : 'Save as PNG'}
          </button>

          <button
            onClick={() => downloadAllCardsAsImages('jpeg')}
            disabled={selectedMembers.length === 0 || bulkExporting}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-350 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-100 transition-all uppercase tracking-wide disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'حفظ كـ JPG' : 'Save as JPG'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Layout Customizer Options */}
        <div className="lg:col-span-1 space-y-6 animate-[fadeIn_0.2s_ease-out]">
          {/* Preset templates selection */}
          <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-indigo-500" />
              {language === 'ar' ? 'طابع الهوية الفنية' : 'Studio Theme Style'}
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">{language === 'ar' ? 'اختر النبض اللوني والهيكل المفضل:' : 'Select artistic configuration:'}</label>
              <div className="grid grid-cols-1 gap-2">
                {presets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setThemeColor(p.primary);
                      setSecondaryColor(p.secondary);
                      setCardAccent(p.accent);
                    }}
                    className="cursor-pointer flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-left text-xs text-gray-700 transition-all font-semibold bg-white"
                  >
                    <div className="flex gap-0.5 shrink-0">
                      <div className="h-4.5 w-3 rounded-l" style={{ backgroundColor: p.primary }} />
                      <div className="h-4.5 w-3 rounded-r" style={{ backgroundColor: p.secondary }} />
                    </div>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Custom Color */}
              <div className="pt-3.5 border-t border-slate-200 space-y-2.5 text-xs">
                <label className="block font-medium text-gray-700 flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                  {language === 'ar' ? 'عناصر التعديل الفني الدقيق' : 'Subtle Adjustments'}
                </label>
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-gray-600">{language === 'ar' ? 'اللون المتدرج الأول:' : 'Mesh Gradient first:'}</span>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="cursor-pointer h-6 w-10 border border-gray-200 rounded"
                  />
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-gray-600">{language === 'ar' ? 'اللون المتدرج الغامق:' : 'Sleek Dark gradient:'}</span>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="cursor-pointer h-6 w-10 border border-gray-200 rounded"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-gray-600">{language === 'ar' ? 'إطار الزخرفة المعدني:' : 'Luxury rivet highlights:'}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCardAccent('gold')} 
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${cardAccent === 'gold' ? 'bg-amber-500 border-amber-600 text-white shadow-sm' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {language === 'ar' ? 'ذهبي' : 'Gold'}
                    </button>
                    <button 
                      onClick={() => setCardAccent('silver')} 
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${cardAccent === 'silver' ? 'bg-slate-400 border-slate-500 text-white shadow-sm' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {language === 'ar' ? 'فضي' : 'Silver'}
                    </button>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-200 space-y-2.5">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-indigo-500" />
                    {language === 'ar' ? 'مربع المرحلة ("كورال حبة خردل")' : 'Stage TextBox ("Mustard Herb")'}
                  </label>
                  
                  <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-200 text-xs">
                    <span className="text-gray-600 font-medium">{language === 'ar' ? 'تخصيص لون المربع' : 'Customize Stage box'}</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={useCustomTextBoxColor}
                        onChange={(e) => setUseCustomTextBoxColor(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {useCustomTextBoxColor && (
                    <div className="space-y-2 pl-1 animate-[fadeIn_0.15s_ease-out] text-xs">
                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150">
                        <span className="text-gray-500 text-[11px]">{language === 'ar' ? 'لون الخلفية:' : 'Background Color:'}</span>
                        <input
                          type="color"
                          value={textBoxBgColor}
                          onChange={(e) => setTextBoxBgColor(e.target.value)}
                          className="cursor-pointer h-5 w-8 border border-gray-150 rounded bg-transparent"
                        />
                      </div>

                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150">
                        <span className="text-gray-500 text-[11px]">{language === 'ar' ? 'لون الخط:' : 'Text/Font Color:'}</span>
                        <input
                          type="color"
                          value={textBoxTextColor}
                          onChange={(e) => setTextBoxTextColor(e.target.value)}
                          className="cursor-pointer h-5 w-8 border border-gray-150 rounded bg-transparent"
                        />
                      </div>

                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150">
                        <span className="text-gray-500 text-[11px]">{language === 'ar' ? 'لون الإطار:' : 'Border Color:'}</span>
                        <input
                          type="color"
                          value={textBoxBorderColor}
                          onChange={(e) => setTextBoxBorderColor(e.target.value)}
                          className="cursor-pointer h-5 w-8 border border-gray-150 rounded bg-transparent"
                        />
                      </div>

                      {/* Preset color bubbles for quick premium selections */}
                      <div className="pt-1">
                        <span className="text-[10px] text-gray-400 block mb-1.5">{language === 'ar' ? 'ألوان سريعة مقترحة لبطاقات الكورال:' : 'Suggested quick colors:'}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: language === 'ar' ? 'خردل' : 'Mustard', bg: '#fef08a', text: '#854d0e', border: '#fde047' },
                            { name: language === 'ar' ? 'مرجان' : 'Coral', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
                            { name: language === 'ar' ? 'نعناع' : 'Mint', bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
                            { name: language === 'ar' ? 'سماوي' : 'Sky', bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
                            { name: language === 'ar' ? 'خمري' : 'Lilac', bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' }
                          ].map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                setTextBoxBgColor(c.bg);
                                setTextBoxTextColor(c.text);
                                setTextBoxBorderColor(c.border);
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] border font-bold transition-all hover:scale-105 active:scale-95"
                              style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Members Checkbox Queue selection */}
          <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {language === 'ar' ? 'قائمة الفحوصات والطباعة' : 'Print Checklist Queue'}
              </h3>
              <button
                onClick={handleSelectAll}
                className="cursor-pointer text-xs text-indigo-600 font-bold hover:underline"
              >
                {selectedCodes.length === members.length ? (language === 'ar' ? 'إلغاء الجميع' : 'Clear All') : (language === 'ar' ? 'تحديد الجميع' : 'Select All')}
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {members.map(m => {
                const isSelected = selectedCodes.includes(m.memberCode);
                return (
                  <label
                    key={m.id}
                    className={`cursor-pointer w-full flex items-center justify-between p-2 rounded-xl border transition-all ${isSelected ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-150 bg-white'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCode(m.memberCode)}
                        className="rounded border-gray-300 text-indigo-600 h-3.5 w-3.5 shrink-0"
                      />
                      <span className="font-bold text-gray-800 truncate">{m.fullName}</span>
                    </div>
                    <span className="font-mono text-[9px] text-gray-400 shrink-0">{m.memberCode}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Print preview container (Cards are drawn in beautiful grid panels) */}
        <div className="lg:col-span-2 space-y-4">
          {bulkExporting && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-150 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {language === 'ar' ? 'جاري تصدير البطاقات كصور عالية الدقة...' : 'Creating high-resolution ID card image files...'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'ar' ? 'يرجى عدم إغلاق الصفحة أثناء تنزيل الملفات...' : 'Files are being generated in the browser. Please wait...'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-white border border-indigo-150 px-3 py-1 rounded-full shadow-2xs">
                {exportProgress} / {selectedMembers.length}
              </span>
            </div>
          )}

          <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-4 sm:p-6 shadow-inner">
            <p className="text-xs text-slate-550 mb-4 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {language === 'ar' ? 'معاينة التصاق البطاقات والجمالية' : 'Live Architectural Previews'} ({selectedMembers.length} {language === 'ar' ? 'بطاقة مجهزة' : 'cards formatted'})
            </p>

            <div 
              id="id-cards-print-target-grid"
              className="space-y-8 w-full"
            >
              {selectedMembers.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-150 rounded-xl">
                  <span className="text-2xl">📇</span>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {language === 'ar' ? 'لا يوجد أعضاء في قائمة الطباعة حالياً.' : 'No cards have been added to the print sheet. Toggle checklists on the left.'}
                  </p>
                </div>
              ) : (
                chunkArray<Member>(selectedMembers, 4).map((chunk, chunkIndex) => (
                  <div 
                    key={chunkIndex} 
                    className="print-page-sheet grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md relative pt-12"
                  >
                    {/* Floating page sheet ribbon designator in live view */}
                    <div className="absolute top-3 right-4 text-[10px] font-bold text-indigo-500 font-mono select-none pointer-events-none border border-indigo-200 bg-indigo-50/50 px-2.5 py-0.5 rounded-full no-print">
                      {language === 'ar' ? `ورقة طباعة ${chunkIndex + 1}` : `Print Sheet ${chunkIndex + 1}`}
                    </div>

                     {chunk.map((m) => {
                      return (
                        <div 
                          key={m.id}
                          id={`member-credential-${m.memberCode}`}
                          className="id-card-frame w-[265px] h-[410px] mx-auto rounded-[20px] shadow-xl border border-slate-200/80 relative overflow-hidden flex flex-col justify-between transform transition-all duration-300 hover:scale-101 hover:shadow-2xl bg-white group"
                          style={{ 
                            background: `radial-gradient(circle at 100% 10%, ${themeColor}1a 0%, transparent 45%), radial-gradient(circle at 0% 90%, ${secondaryColor}15 0%, transparent 45%), #ffffff` 
                          }}
                        >
                          {/* Decorative elegant grid overlay for modern high-security tech aesthetic */}
                          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                          
                          {/* Interactive glowing light blobs to create depth and modern bento vibe */}
                          <div className="absolute top-1/4 -right-16 w-36 h-36 rounded-full blur-2xl opacity-15 pointer-events-none" style={{ backgroundColor: themeColor }} />
                          <div className="absolute bottom-1/4 -left-16 w-36 h-36 rounded-full blur-2xl opacity-12 pointer-events-none" style={{ backgroundColor: secondaryColor }} />

                          {/* Floating individual save actions overlay */}
                          <div className="no-print absolute top-3 left-3 z-[110] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover:translate-y-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCardAsImage(m.memberCode, m.fullName, 'png');
                              }}
                              disabled={exportingCode !== null || bulkExporting}
                              className="cursor-pointer flex items-center justify-center gap-1 px-2 py-0.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-md text-[8px] font-black tracking-wider shadow-md shadow-indigo-950/25 uppercase disabled:opacity-50 select-none border border-indigo-500/30"
                              title="Save as PNG"
                            >
                              <Download className="h-2 w-2" />
                              PNG
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCardAsImage(m.memberCode, m.fullName, 'jpeg');
                              }}
                              disabled={exportingCode !== null || bulkExporting}
                              className="cursor-pointer flex items-center justify-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[8px] font-black tracking-wider shadow-md shadow-emerald-950/25 uppercase disabled:opacity-50 select-none border border-emerald-500/30"
                              title="Save as JPG"
                            >
                              <Download className="h-2 w-2" />
                              JPG
                            </button>
                            {exportingCode === m.memberCode && (
                              <div className="h-3 w-3 rounded-full border-1.5 border-indigo-500 border-t-transparent animate-spin ml-0.5 shrink-0" />
                            )}
                          </div>

                          {/* Curved top header design */}
                          <div 
                            className="card-header-banner h-28 text-center text-white relative flex flex-col items-center justify-start pt-4 px-3"
                            style={{ 
                              background: `linear-gradient(135deg, #090a14 0%, ${secondaryColor}d0 60%, ${themeColor} 100%)`,
                              clipPath: 'ellipse(120% 85% at 50% 15%)',
                              WebkitClipPath: 'ellipse(120% 85% at 50% 15%)'
                            }}
                          >
                            {/* Elegant ornamental gold or silver line ribbon at the bottom of curves */}
                            <div 
                              className="card-header-accent absolute bottom-0 left-0 right-0 h-[2.5px]" 
                              style={{ backgroundColor: cardAccent === 'gold' ? '#fbbf24' : '#e2e8f0' }}
                            />
                            
                            <p 
                              className="card-header-subtitle text-[8.5px] font-black tracking-widest uppercase mb-0.5 select-none" 
                              style={{ fontFamily: 'var(--font-outfit)', color: cardAccent === 'gold' ? '#fcd34d' : '#e2e8f0' }}
                            >
                              {t.customCardTitle || 'OFFICIAL MEMBER ID'}
                            </p>
                            <h4 
                              className="card-header-heading text-[12.5px] font-medium text-white truncate max-w-[210px] mt-0.5" 
                              style={{ fontFamily: 'var(--font-outfit)', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                            >
                              {orgName}
                            </h4>
                          </div>

                          {/* Avatar Photo placement styling: Elegant overlapping circular layout */}
                          <div className="card-avatar-wrapper flex flex-col items-center -mt-14 z-10 relative">
                            <div className="relative">
                              {/* Round avatar wrapped in thick beautiful gradient ring frame */}
                              <div className="p-0.5 rounded-full bg-white shadow-lg border border-slate-150/50">
                                <img 
                                  src={m.profileImageUrl} 
                                  alt={m.fullName}
                                  className="card-avatar-img h-[92px] w-[92px] rounded-full object-cover border border-slate-200 bg-white"
                                  style={{ borderColor: themeColor }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              
                              {/* Decorative rivets on photo card slots */}
                              <div className={`absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full border border-white/85 shadow-xs bg-gradient-to-br ${cardAccent === 'gold' ? 'from-amber-200 to-amber-500' : 'from-slate-100 to-slate-400'}`} />
                              <div className={`absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full border border-white/85 shadow-xs bg-gradient-to-br ${cardAccent === 'gold' ? 'from-amber-200 to-amber-500' : 'from-slate-100 to-slate-400'}`} />

                              {/* Member type status banner element on avatar */}
                              <div className={`card-avatar-badge absolute -bottom-1.5 text-[7px] tracking-widest px-2 py-0.5 rounded-full font-black uppercase text-white shadow-md border border-white/95 ${m.memberType === 'New' ? 'bg-amber-500' : 'bg-indigo-650'}`} style={{ fontFamily: 'var(--font-display)' }}>
                                {m.memberType === 'New' ? (language === 'ar' ? 'جديد' : 'YOUTH') : (language === 'ar' ? 'عضو' : 'MEMBER')}
                              </div>
                            </div>

                            {/* Name panel text details */}
                            <h3 className="card-member-name text-[13.5px] font-bold text-slate-800 mt-2.5 tracking-tight px-3 text-center leading-tight">
                              {m.fullName}
                            </h3>
                            <p 
                              className="card-member-sub text-[8px] mt-1 font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border"
                              style={{
                                color: useCustomTextBoxColor ? textBoxTextColor : themeColor,
                                borderColor: useCustomTextBoxColor ? textBoxBorderColor : `${themeColor}22`,
                                backgroundColor: useCustomTextBoxColor ? textBoxBgColor : `${themeColor}0a`
                              }}
                            >
                              {language === 'ar' ? (m.educationStage === 'First Stage' ? 'المرحلة الأولى' : m.educationStage === 'Second Stage' ? 'المرحلة الثانية' : m.educationStage === 'Third Stage' ? 'المرحلة الثالثة' : m.educationStage) : m.educationStage}
                            </p>
                          </div>

                          {/* Deep card core body containing the dynamic crisp vector QR Code with corner brackets */}
                          <div className="card-qr-container flex flex-col items-center justify-center py-2 relative bg-slate-50/5 flex-grow">
                            {/* Bracketed QR layout */}
                            <div className="relative p-1 flex items-center justify-center">
                              {/* Corner aesthetic brackets */}
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl-xs" style={{ borderColor: themeColor }} />
                              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r rounded-tr-xs" style={{ borderColor: themeColor }} />
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l rounded-bl-xs" style={{ borderColor: themeColor }} />
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br-xs" style={{ borderColor: themeColor }} />

                              <div className="card-qr-box p-0.5 bg-white rounded-md border border-slate-200/50 shadow-xs max-w-max mx-auto">
                                <QRCodeImage text={m.memberCode} size={84} className="mx-auto bg-white" />
                              </div>
                            </div>
                            
                            {/* Member unique alphanumeric code string */}
                            <p className="card-member-code text-[9.5px] font-mono font-bold tracking-widest text-[#1e1b4b] bg-indigo-50/55 border border-indigo-200/40 px-2.5 py-0.5 rounded-full mt-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.01)]">
                              {m.memberCode}
                            </p>
                          </div>

                          {/* ID Card Footer - Premium dark bar with gold accent */}
                          <div className="card-footer-bar bg-slate-900 text-slate-350 border-t border-slate-100 h-[30px] flex items-center justify-between px-3.5 select-none" style={{ backgroundColor: secondaryColor }}>
                            <span className="text-[8.5px] font-semibold text-slate-300">{t.permanentID || 'PERMANENT ID'}</span>
                            <div className="card-footer-branding flex items-center gap-0.5 font-black uppercase text-[7.5px]" style={{ fontFamily: 'var(--font-outfit)', color: cardAccent === 'gold' ? '#fcd34d' : '#ffffff' }}>
                              <Heart className="h-3 w-3 text-rose-500 fill-rose-500 inline mr-0.5 shrink-0" />
                              <span>COPTIC DIOCESE</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Embedded print css targets defining standard A4 landscape grids for physical printing */}
      <style>{`
        @media print {
          /* Hide parent controls, layout navigation headers and customizer panels */
          header, 
          aside, 
          .lg:col-span-1, 
          button, 
          select, 
          .card-avatar-badge-select, 
          #id-card-generator-screen > div:first-child,
          p.text-xs.text-slate-500.mb-4,
          p.text-xs.text-slate-500,
          .no-print {
            display: none !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
          }
          
          #main-content-viewport {
            padding: 0 !important;
            margin: 0 !important;
          }

          #id-cards-print-target-grid {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            width: 100% !important;
          }

          .print-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(2, 54mm) !important;
            grid-template-rows: repeat(2, 85.6mm) !important;
            gap: 12mm 10mm !important;
            justify-content: center !important;
            align-content: center !important;
            height: 297mm !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 15mm 10mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-page-sheet:last-child {
            page-break-after: avoid !important;
          }
          
          .id-card-frame {
            width: 54mm !important;
            height: 85.6mm !important;
            max-width: 54mm !important;
            max-height: 85.6mm !important;
            min-width: 54mm !important;
            min-height: 85.6mm !important;
            border: 0.5px solid #cbd5e1 !important;
            border-radius: 4.5mm !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            image-rendering: -webkit-optimize-contrast !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            background: radial-gradient(circle at 100% 10%, ${themeColor}1a 0%, transparent 45%), radial-gradient(circle at 0% 90%, ${secondaryColor}15 0%, transparent 45%), #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            position: relative !important;
          }
          
          .id-card-frame .card-header-banner {
            height: 24mm !important;
            padding: 3mm 1mm 1mm 1mm !important;
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            position: relative !important;
            background: linear-gradient(135deg, #090a14 0%, ${secondaryColor}d0 60%, ${themeColor} 100%) !important;
            clip-path: ellipse(120% 85% at 50% 15%) !important;
            -webkit-clip-path: ellipse(120% 85% at 50% 15%) !important;
          }

          .id-card-frame .card-header-accent {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 0.6mm !important;
            background-color: ${cardAccent === 'gold' ? '#fbbf24' : '#e2e8f0'} !important;
          }
          
          .id-card-frame .card-header-subtitle {
            font-size: 4px !important;
            font-weight: 900 !important;
            color: ${cardAccent === 'gold' ? '#fcd34d' : '#e2e8f0'} !important;
            text-transform: uppercase !important;
            letter-spacing: 0.6px !important;
            display: block !important;
            margin: 0 !important;
            line-height: 1 !important;
          }

          .id-card-frame .card-header-heading {
            font-size: 7.5px !important;
            font-weight: 500 !important;
            color: #ffffff !important;
            display: block !important;
            margin: 0.6mm 0 0 0 !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 50mm !important;
            text-shadow: 0 0.5px 1px rgba(0,0,0,0.3) !important;
          }

          .id-card-frame .card-avatar-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            margin-top: -11mm !important;
            z-index: 100 !important;
            position: relative !important;
          }

          .id-card-frame .photo-container {
            position: relative !important;
            display: inline-block !important;
          }

          .id-card-frame .card-avatar-img {
            height: 22.8mm !important;
            width: 22.8mm !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            border: 1px solid ${themeColor} !important;
            background-color: white !important;
            box-shadow: 0 0.5mm 1.5mm rgba(0,0,0,0.1) !important;
          }

          .id-card-frame .avatar-rivet {
            position: absolute !important;
            width: 1mm !important;
            height: 1mm !important;
            border-radius: 50% !important;
            background: ${cardAccent === 'gold' ? 'linear-gradient(135deg, #fef08a, #ca8a04)' : 'linear-gradient(135deg, #f1f5f9, #94a3b8)'} !important;
            border: 0.2px solid white !important;
          }
          .id-card-frame .rivet-tl { top: 0.2mm; left: 0.2mm; }
          .id-card-frame .rivet-tr { top: 0.2mm; right: 0.2mm; }

          .id-card-frame .card-avatar-badge {
            position: absolute !important;
            bottom: -0.8mm !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            font-size: 3px !important;
            padding: 0.2px 1.5mm !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            color: white !important;
            border-radius: 999px !important;
            background: ${themeColor} !important;
            white-space: nowrap !important;
            border: 0.3px solid white !important;
          }

          .id-card-frame .card-member-name {
            font-size: 8px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            margin: 1.5mm 0 0 0 !important;
            line-height: 1.1 !important;
            text-align: center !important;
            width: 48mm !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .id-card-frame .card-member-sub {
            font-size: 4.5px !important;
            font-weight: 600 !important;
            color: ${useCustomTextBoxColor ? textBoxTextColor : themeColor} !important;
            background: ${useCustomTextBoxColor ? textBoxBgColor : themeColor + '0a'} !important;
            border: 0.2px solid ${useCustomTextBoxColor ? textBoxBorderColor : themeColor + '20'} !important;
            padding: 0.2px 2mm !important;
            border-radius: 999px !important;
            margin: 0.6mm 0 0 0 !important;
            text-align: center !important;
          }

          .id-card-frame .card-qr-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1.2mm 0 !important;
            flex: 1 !important;
            width: 100% !important;
            position: relative !important;
          }

          .id-card-frame .bracket-decoration {
            position: relative !important;
            padding: 1mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .id-card-frame .corner-b {
            position: absolute !important;
            width: 1.8mm !important;
            height: 1.8mm !important;
            border-color: ${themeColor} !important;
            border-style: solid !important;
          }
          .id-card-frame .cb-tl { top: 0; left: 0; border-width: 0.4px 0 0 0.4px; }
          .id-card-frame .cb-tr { top: 0; right: 0; border-width: 0.4px 0.4px 0 0; }
          .id-card-frame .cb-bl { bottom: 0; left: 0; border-width: 0 0 0.4px 0.4px; }
          .id-card-frame .cb-br { bottom: 0; right: 0; border-width: 0  0.4px 0.4px 0; }

          .id-card-frame .card-qr-box {
            padding: 0.4mm !important;
            background: white !important;
            border: 0.4px solid #e2e8f0 !important;
            border-radius: 1mm !important;
          }

          .id-card-frame .card-qr-box svg {
            width: 20mm !important;
            height: 20mm !important;
            display: block !important;
          }

          .id-card-frame .card-member-code {
            font-size: 6px !important;
            font-family: monospace !important;
            font-weight: bold !important;
            color: #1e1b4b !important;
            background-color: #f1f5f9 !important;
            border: 0.3px solid #cbd5e1 !important;
            padding: 0.4px 2.5mm !important;
            border-radius: 9999px !important;
            margin: 1.2mm 0 0 0 !important;
            display: inline-block !important;
          }

          .id-card-frame .card-footer-bar {
            background-color: ${secondaryColor} !important;
            color: #e2e8f0 !important;
            font-size: 5mm !important;
            padding: 1.2mm 2.5mm !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-top: 0.3px solid rgba(255, 255, 255, 0.1) !important;
          }

          .id-card-frame .card-footer-branding {
            font-size: 4px !important;
            font-weight: 950 !important;
            color: ${cardAccent === 'gold' ? '#fcd34d' : '#ffffff'} !important;
            text-transform: uppercase !important;
            display: flex !important;
            align-items: center !important;
            letter-spacing: 0.05em !important;
          }
        }
      `}</style>
    </div>
  );
};
