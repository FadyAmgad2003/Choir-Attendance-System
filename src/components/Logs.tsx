import React, { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { FileDown, Printer, Trash2, Calendar, User, ShieldAlert, BadgeCheck, Filter, Search } from 'lucide-react';

export const Logs: React.FC = () => {
  const { events, members, choirs, clearAllEvents, deleteEvent, admins, t, language } = useApp();

  // Search and filter logs states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [filterChoir, setFilterChoir] = useState('all');

  // Custom modal state for safe iframe deletion confirmation
  const [logToDelete, setLogToDelete] = useState<{ id: string; memberName: string; date: string } | null>(null);

  // Derive unique active Admins/Officers registered in the system (excluding the super admin)
  const operatorsList = useMemo(() => {
    const list = new Map<string, string>();
    
    // List all existing operators/admins
    admins
      .filter(a => a.role !== 'super_admin')
      .forEach(a => {
        list.set(a.id, a.name);
      });
    
    return Array.from(list.entries());
  }, [admins]);

  // Combined Filters Logic
  const filteredEvents = useMemo(() => {
    // Only display events for members currently present in the system
    const existingMemberCodes = new Set(members.map(m => m.memberCode));
    const activeEvents = events.filter(e => existingMemberCodes.has(e.memberCode));

    return activeEvents.filter(e => {
      const member = members.find(m => m.memberCode === e.memberCode);
      const memberName = member ? member.fullName.toLowerCase() : '';
      const queryLower = searchQuery.toLowerCase();

      const matchSearch = e.memberCode.toLowerCase().includes(queryLower) ||
                          e.adminName.toLowerCase().includes(queryLower) ||
                          memberName.includes(queryLower);

      const matchDate = !filterDate || e.date === filterDate;
      const matchAdmin = filterAdmin === 'all' || e.adminId === filterAdmin;
      const matchChoir = filterChoir === 'all' || e.choirId === filterChoir;

      return matchSearch && matchDate && matchAdmin && matchChoir;
    });
  }, [events, members, searchQuery, filterDate, filterAdmin, filterChoir]);

  // Export to CSV Functionality supporting perfect UTF-8 characters for Arabic!
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;

    // Header layout
    const headers = [
      language === 'ar' ? 'معرف الحركة' : 'Event ID',
      language === 'ar' ? 'رمز المعرّف (QR)' : 'QR Code',
      language === 'ar' ? 'الاسم الكامل' : 'Full Name',
      language === 'ar' ? 'تاريخ الحضور' : 'Date',
      language === 'ar' ? 'التوقيت الفعلي' : 'Exact Timestamp',
      language === 'ar' ? 'المشرف المسؤول' : 'Recording Admin',
      language === 'ar' ? 'معلومات الجهاز' : 'Device Info'
    ];

    const rows = filteredEvents.map(e => {
      const member = members.find(m => m.memberCode === e.memberCode);
      return [
        e.id,
        e.memberCode,
        member ? member.fullName : 'Unknown Member',
        e.date,
        e.timestamp,
        e.adminName,
        e.deviceInfo || 'Standard Core Engine'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blobs with \uFEFF Byte Order Mark (BOM) to force Excel to read Arabic UTF-8!
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `church_attendance_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printing the logs directly to a beautiful printable report PDF
  const handlePrintLogs = () => {
    if (filteredEvents.length === 0) return;

    const printWin = window.open('', '_blank');
    if (printWin) {
      const isRtl = language === 'ar';
      const rowsHtml = filteredEvents.map((e, index) => {
        const m = members.find(member => member.memberCode === e.memberCode);
        const name = m ? m.fullName : 'Archived Profile';
        const formattedTime = new Date(e.timestamp).toLocaleTimeString(
          language === 'ar' ? 'ar-EG' : 'en-US', 
          { hour: '2-digit', minute: '2-digit' }
        );

        return `
          <tr style="border-bottom: 0.5px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center; font-size: 11px;">${index + 1}</td>
            <td style="padding: 8px; font-weight: bold; font-size: 11px;">${name}</td>
            <td style="padding: 8px; text-align: center; font-family: monospace; font-size: 10px; color: #4f46e5;">${e.memberCode}</td>
            <td style="padding: 8px; text-align: center; font-size: 11px;">${e.date}</td>
            <td style="padding: 8px; text-align: center; font-family: monospace; font-size: 11px;">${formattedTime}</td>
            <td style="padding: 8px; text-align: center; font-size: 11px;">${e.adminName}</td>
            <td style="padding: 8px; text-align: center; font-size: 10px; color: #15803d; font-weight: bold;">${isRtl ? 'حضور معتمد' : 'VERIFIED'}</td>
          </tr>
        `;
      }).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="${language}" dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${isRtl ? 'تقرير حضور الجمعية الكنسية' : 'Church Attendance Records Report'}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm 10mm;
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                color: #1e293b;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #4f46e5;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .header-logo {
                height: 50px;
                width: 50px;
                object-fit: cover;
                border-radius: 8px;
              }
              .header-text h1 {
                margin: 0;
                font-size: 18px;
                color: #1e1b4b;
              }
              .header-text p {
                margin: 4px 0 0 0;
                font-size: 11px;
                color: #4f46e5;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: bold;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 15px;
              }
              .meta-item {
                font-size: 11px;
              }
              .meta-item span {
                font-weight: bold;
                color: #4f46e5;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th {
                background-color: #f1f5f9;
                color: #1e293b;
                font-weight: bold;
                font-size: 11px;
                padding: 8px;
                border-bottom: 2px solid #cbd5e1;
              }
              td {
                font-size: 11px;
              }
              .footer {
                margin-top: 30px;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
                text-align: center;
                font-size: 9px;
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-text">
                <h1>${isRtl ? 'بيان حركة تسجيل الحضور والغياب الكنسي' : 'Church Attendance Records Report'}</h1>
                <p>${isRtl ? 'سجل التدقيق الإلكتروني الموحد لبطاقات الهوية' : 'Unified ID Scan Verification Registry'}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">${isRtl ? 'إجمالي عدد تسجيلات الحضور:' : 'Total Attendance Swipes:'} <span>${filteredEvents.length}</span></div>
              <div class="meta-item">${isRtl ? 'تاريخ التصدير التلقائي:' : 'Exported Date:'} <span>${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">${isRtl ? 'م' : 'No.'}</th>
                  <th style="text-align: ${isRtl ? 'right' : 'left'};">${isRtl ? 'اسم العضو الكنسي' : 'Parishioner Name'}</th>
                  <th style="width: 15%;">${isRtl ? 'كود الهوية' : 'ID Code'}</th>
                  <th style="width: 15%;">${isRtl ? 'التاريخ' : 'Date'}</th>
                  <th style="width: 15%;">${isRtl ? 'توقيت المسح' : 'Time Scanned'}</th>
                  <th style="width: 20%;">${isRtl ? 'المشرف المسؤول' : 'Recorded By'}</th>
                  <th style="width: 15%;">${isRtl ? 'التحقق' : 'Verification'}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer">
              ${isRtl ? 'نظام تشغيل وتصاريح بطاقات الهوية الكنسية الرقمية' : 'Diocesan Attendance & Identity System'} - ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div className="space-y-6" id="logs-view-screen">
      {/* Upper Title Row with action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            {t.attendanceLogs}
          </h1>
          <p className="text-sm text-slate-550 mt-1">
            {language === 'ar' ? 'سجلات حركات الحضور التاريخية، التدقيق الفوري والتصدير.' : 'Trace chronological attendance events, search active entries, and compile reports.'}
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={filteredEvents.length === 0}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-500" />
            {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
          </button>

          <button
            onClick={handlePrintLogs}
            disabled={filteredEvents.length === 0}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-100 transition-all font-display"
          >
            <Printer className="h-3.5 w-3.5" />
            {language === 'ar' ? 'تصدير PDF / طباعة' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Advanced query log search filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Query Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث بالرمز أو الاسم...' : 'Search by name, code...'}
              className="w-full rounded-lg border border-gray-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-750 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Admin choice dropdown */}
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-750 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{language === 'ar' ? 'جميع المشرفين' : 'All Operators'}</option>
              {operatorsList.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="logs-printable-target">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">{language === 'ar' ? 'العضو' : 'Member Detail'}</th>
                <th className="py-3 px-4">{t.memberCode}</th>

                <th className="py-3 px-4">{language === 'ar' ? 'اليوم' : 'Calendar Date'}</th>
                <th className="py-3 px-4">{language === 'ar' ? 'زمن التخصيص' : 'System Time'}</th>
                <th className="py-3 px-4">{language === 'ar' ? 'المسؤول' : 'Registered By'}</th>
                <th className="py-3 px-4">{language === 'ar' ? 'حالة التزامن' : 'Verification'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-normal">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-gray-400 italic">
                    {t.noEventsRecorded}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => {
                  const m = members.find(member => member.memberCode === e.memberCode);
                  const matchedChoir = choirs.find(c => c.id === e.choirId);
                  
                  // Convert timestamp nicely
                  const formattedTime = new Date(e.timestamp).toLocaleTimeString(
                    language === 'ar' ? 'ar-EG' : 'en-US', 
                    { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                  );

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {m ? (
                            <>
                              <img 
                                src={m.profileImageUrl} 
                                alt="" 
                                className="h-8 w-8 rounded-full object-cover border border-gray-100 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="font-semibold text-gray-900">{m.fullName}</div>
                            </>
                          ) : (
                            <div className="font-semibold text-gray-400 font-mono text-[11px]">ARCHIVED_OR_UNBOUND</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-indigo-600">{e.memberCode}</td>

                      <td className="py-3 px-4 text-gray-800 font-medium whitespace-nowrap">{e.date}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono whitespace-nowrap">{formattedTime}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 sm:text-[11px] text-gray-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          {e.adminName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <BadgeCheck className="h-3 w-3 text-emerald-600" />
                          {language === 'ar' ? 'معتمد' : 'VERIFIED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setLogToDelete({
                              id: e.id,
                              memberName: m ? m.fullName : 'Archived Profile',
                              date: e.date
                            });
                          }}
                          className="cursor-pointer p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors inline-block border border-transparent hover:border-rose-100"
                          title={language === 'ar' ? 'حذف سجل حضور العضو' : 'Delete attendance record'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe confirmation modal for iframe-friendly deletes */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-150 shadow-xl space-y-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="h-12 w-12 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 leading-none">
                {language === 'ar' ? 'تأكيد حذف سجل الحضور' : 'Confirm Deleting Attendance'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ar' ? (
                  <>هل أنت متأكد من رغبتك في حذف سجل حضور العضو <strong>"{logToDelete.memberName}"</strong> بتاريخ <strong>{logToDelete.date}</strong>؟ سيتم إزالة هذه الحركة من السجلات تماماً.</>
                ) : (
                  <>Are you sure you want to delete the attendance record for <strong>"{logToDelete.memberName}"</strong> on <strong>{logToDelete.date}</strong>? This action will remove this event from systemic logs.</>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="cursor-pointer px-4 py-2 border border-gray-250 bg-white text-gray-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEvent(logToDelete.id);
                  setLogToDelete(null);
                }}
                className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
              >
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden layout specifically customized for standard page printing reports */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #logs-printable-target, #logs-printable-target * {
            visibility: visible;
          }
          #logs-printable-target {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 10px;
          }
          th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};
