import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from './AppContext';
import { Camera, RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, Play, Pause, Search, UserCheck, Flame, Trash2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export const Scanner: React.FC = () => {
  const { 
    members, 
    recordScan, 
    isOnline, 
    setIsOnline, 
    offlineQueue, 
    syncOfflineQueue, 
    events,
    deleteEvent,
    t, 
    language,
    updateSupabaseConfig
  } = useApp();

  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; duplicate?: boolean } | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastScannedName, setLastScannedName] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Simulated & Actual scan triggers
  const handleSimulateScan = (code: string) => {
    // 1. Intercept Supabase configuration sync QR instead of a parishioner check-in ID badge
    if (code.trim().startsWith('cams_config:')) {
      try {
        const jsonStr = code.trim().substring('cams_config:'.length);
        const config = JSON.parse(jsonStr);
        if (config.url && config.key) {
          updateSupabaseConfig(config.url, config.key);
          setScanResult({
            success: true,
            message: language === 'ar' 
              ? '⚡ تم الربط المباشر ومزامنة إعدادات قاعدة البيانات بنجاح في اللحظة نفسها!' 
              : '⚡ Cloud Link Activated! Supabase credentials synced and linked successfully.'
          });
          setLastScannedName(language === 'ar' ? 'مزامنة السحابية وتكامل الأجهزة' : 'Cloud Sync Link');
          setLastScannedCode('SUCCESS');
          
          // Clear alert after 4 seconds
          setTimeout(() => {
            setScanResult(null);
          }, 4000);
          return;
        }
      } catch (err) {
        console.error('Failed to parse synchronized QR configuration:', err);
      }
    }

    const cleanCode = code.trim().toUpperCase();
    const matched = members.find(m => m.memberCode === cleanCode);
    if (matched) {
      setLastScannedName(matched.fullName);
      setLastScannedCode(cleanCode);
    } else {
      setLastScannedName('Unknown Code');
      setLastScannedCode(cleanCode);
    }

    const deviceDetail = isOnline ? 'Physical Web Scanner (Online)' : 'Physical Web Scanner (Offline)';
    const result = recordScan(cleanCode, deviceDetail);
    setScanResult(result);

    // Clear alert after 4 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 4000);
  };

  // Webcam stream management using native Decoders
  const startCamera = async () => {
    setCameraActive(true);
    setScanResult(null);

    setTimeout(() => {
      try {
        const qrScanner = new Html5Qrcode("qr-reader-element");
        html5QrCodeRef.current = qrScanner;

        qrScanner.start(
          { facingMode: "environment" },
          {
            fps: 25, // Higher FPS for responsive, near-instantaneous QR decoding
          },
          (decodedText) => {
            // Found & Decoded QR Code!
            handleSimulateScan(decodedText);
          },
          (errorMessage) => {
            // Keep logs empty
          }
        ).catch(err => {
          console.warn("Failed to activate webcam QR scan engine:", err);
          setCameraActive(false);
        });
      } catch (e) {
        console.error("QR Scanner initialization error:", e);
        setCameraActive(false);
      }
    }, 200);
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      if (html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          console.warn("Stopping camera failed:", e);
        }
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Filter members in the simulated scanner search bar with high efficiency limit
  const searchedMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Return top 12 active members initially to prevent heavy DOM rendering overhead (300+ members)
      return members.slice(0, 12);
    }
    return members.filter(m => {
      const stage = m.educationStage ? m.educationStage.toLowerCase() : '';
      return m.fullName.toLowerCase().includes(query) || 
             m.memberCode.toLowerCase().includes(query) ||
             stage.includes(query);
    }).slice(0, 15);
  }, [members, searchQuery]);

  // Track exact match counts to show friendly visual statistics
  const totalMatchesCount = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members.length;
    return members.filter(m => {
      const stage = m.educationStage ? m.educationStage.toLowerCase() : '';
      return m.fullName.toLowerCase().includes(query) || 
             m.memberCode.toLowerCase().includes(query) ||
             stage.includes(query);
    }).length;
  }, [members, searchQuery]);

  // Filter events to find those logged today
  const todayStr = new Date().toISOString().split('T')[0];
  const scanLogs = useMemo(() => {
    return events
      .filter(e => e.date === todayStr)
      .slice(0, 8); // Show last 8 scans for screen fitting
  }, [events, todayStr]);

  return (
    <div className="space-y-6" id="scanner-view-container">
      {/* View Header with Link State indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-600" />
            {t.scannerHeader}
          </h1>
          <p className="text-sm text-slate-550 mt-1">
            {language === 'ar' ? 'مسح فوري لبطاقات الهوية لتسجيل حضور اليوم التلقائي.' : 'Instant physical QR-ID scanning for real-time member check-ins.'}
          </p>
        </div>

        {/* Network Toggle Emulator Box */}
        <div id="connection-toggle-card" className="flex items-center gap-3 bg-slate-50 border border-gray-200/60 rounded-xl px-4 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs text-semibold text-emerald-600">
                <Wifi className="h-4 w-4" />
                {t.activeConnection}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-semibold text-amber-600">
                <WifiOff className="h-4 w-4" />
                {t.offlineConnection}
              </span>
            )}
          </div>

          <button
            id="network-emulator-btn"
            onClick={() => setIsOnline(!isOnline)}
            className={`cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${isOnline ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
          >
            {isOnline ? (language === 'ar' ? 'محاكاة انقطاع الإنترنت' : 'Go Offline') : (language === 'ar' ? 'محاكاة عودة الإنترنت' : 'Go Online')}
          </button>
        </div>
      </div>

      {/* Main scanner control boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Video Camera & Sync Queue Status */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>{language === 'ar' ? 'عدسة الكاميرا النشطة' : 'Physical Webcam Live-Feed'}</span>
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
            </h2>

            {/* Webcam display square */}
            <div className="relative h-64 sm:h-80 md:h-[380px] w-full rounded-xl bg-slate-900 border-2 border-indigo-100 overflow-hidden flex flex-col items-center justify-center">
              {cameraActive ? (
                <>
                  <div 
                    id="qr-reader-element" 
                    className="absolute inset-0 w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain [&_video]:rounded-xl [&_canvas]:hidden" 
                  />
                  {/* Modern full-feed futuristic scanning layer */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 p-6">
                    <div className="flex justify-between w-full">
                      <div className="h-6 w-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      <div className="h-6 w-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    </div>
                    {/* Pulsing full-width scanning line */}
                    <div className="w-full h-0.5 bg-indigo-500/80 shadow-[0_0_10px_#6366f1] animate-pulse" />
                    <div className="flex justify-between w-full">
                      <div className="h-6 w-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      <div className="h-6 w-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 z-10 px-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-gray-400">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-300">
                      {language === 'ar' ? 'كاميرا التدقيق الميداني للمتصفح' : 'Secure Iframe Camera Access Controller'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
                      {language === 'ar' ? 'يتطلب هذا ترخيص الكاميرا. اضغط بالأسفل لبدء الالتقاط.' : 'Real camera stream requires permission. Click start capture below.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle camera hardware button */}
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`cursor-pointer mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold shadow-sm transition-all ${cameraActive ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700'}`}
            >
              {cameraActive ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'إيقاف تشغيل الكاميرا' : 'Stop Camera Capture'}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  {t.tapToScan}
                </>
              )}
            </button>
          </div>

          {/* Pending Sync Queue Resilience Box */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <WifiOff className="h-4 w-4 text-amber-500" />
                {t.pendingQueue}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                {offlineQueue.length}
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              {language === 'ar' 
                ? 'عند مسح البطاقات دون إنترنت، يتم حفظ المعرفات دقة مشفرة في ذاكرة متصفحك المحلية لتجنب التكرار ومكافحة فقدان البيانات.'
                : 'Scanned events collected of any active member are safely queued locally until server availability reconnects.'}
            </p>

            {offlineQueue.length > 0 ? (
              <div className="space-y-2">
                <div id="offline-queue-list" className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-gray-100 rounded-lg">
                  {offlineQueue.map((code, index) => {
                    const matchedMember = members.find(m => m.memberCode === code);
                    return (
                      <div key={index} className="flex justify-between items-center text-[11px] bg-white px-2 py-1 rounded border border-gray-100">
                        <span className="font-medium text-gray-700">{matchedMember ? matchedMember.fullName : 'Guest'}</span>
                        <span className="font-mono text-gray-400">{code}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={syncOfflineQueue}
                  disabled={!isOnline}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t.syncCommitNow}
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400 italic">
                {language === 'ar' ? 'الذاكرة المؤقتة فارغة حالياً.' : 'Cache buffer is quiet. All records synced cleanly.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Simulated Scan triggers & Live Session Logs */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 border-b border-gray-100 pb-3 mb-4">
                <Flame className="h-4 w-4 text-indigo-500 animate-bounce" />
                <h2 className="text-sm font-semibold text-gray-900">
                  {t.simulatedScan}
                </h2>
              </div>
              
              <p className="text-xs text-gray-500 mb-4 italic">
                {t.selectMemberToSimulatedScan}
              </p>

              {/* Simulated search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث لتصفية أسماء الأعضاء للمحاكاة...' : 'Filter list of members by name or stage...'}
                  className="w-full rounded-lg border border-gray-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Performance Indicator Statistics Badge */}
              <div className="flex items-center justify-between mt-1 mb-2.5 px-1 text-[10px] text-gray-400 font-medium font-mono">
                <span>
                  {language === 'ar' ? `يعرض ${searchedMembers.length} من أصل ${totalMatchesCount}` : `Showing ${searchedMembers.length} of ${totalMatchesCount} matches`}
                </span>
                <span className="text-indigo-600 font-semibold">
                  {language === 'ar' ? 'محرك فائق السرعة ⚡' : 'Ultra-Fast Engine ⚡'}
                </span>
              </div>

              {/* List and tap grid */}
              <div id="simulated-member-grid" className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {searchedMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSimulateScan(m.memberCode)}
                    className={`cursor-pointer w-full text-left flex items-center justify-between p-2.5 rounded-lg border shadow-sm transition-all text-xs ${m.status === 'Inactive' ? 'bg-gray-50/70 border-gray-100 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img 
                        src={m.profileImageUrl} 
                        alt={m.fullName}
                        className="h-8 w-8 rounded-full object-cover border border-gray-150"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-gray-800">{m.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {language === 'ar' ? (m.educationStage === 'First Stage' ? 'المرحلة الأولى' : m.educationStage === 'Second Stage' ? 'المرحلة الثانية' : m.educationStage === 'Third Stage' ? 'المرحلة الثالثة' : m.educationStage) : m.educationStage}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono ${m.status === 'Active' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                        {m.memberCode}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold uppercase hover:underline">
                        {language === 'ar' ? 'مسح ⚡' : 'TAP ⚡'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Feed: Operational Results Alert notifications */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              {scanResult ? (
                <div 
                  id="diagnostic-alerts"
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${scanResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
                >
                  {scanResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 animate-[spin_0.8s_ease-out_1]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                  )}
                  
                  <div className="text-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      {scanResult.success ? t.recordingSuccess : 'Alert: Registration Blocked'}
                    </p>
                    <p className="mt-1 text-[11px] opacity-90">{scanResult.message}</p>
                    
                    {scanResult.success && (
                      <div className="mt-2 pt-2 border-t border-emerald-200/40 text-[10px] font-mono text-emerald-600 flex justify-between">
                        <span>{t.fullName}: {lastScannedName}</span>
                        <span>QR: {lastScannedCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center text-xs text-gray-400">
                  {language === 'ar' ? 'بانتظار مسح بطاقة أو رمز هوية للتدقيق الكنسي...' : 'Waiting for ID sweep to check credentials...'}
                </div>
              )}
            </div>

          </div>

          {/* Active Attendance Session Logs with Live Removal */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 font-display">
                <UserCheck className="h-4 w-4 text-emerald-600 animate-pulse" />
                {language === 'ar' ? 'سجل الحضور الجاري (الجلسة الحالية)' : 'Live Session Attendance Logs'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 font-mono">
                {events.filter(e => e.date === todayStr).length} {language === 'ar' ? 'مسجلين اليوم' : 'scans today'}
              </span>
            </div>

            {scanLogs.length > 0 ? (
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {scanLogs.map(evt => {
                  const sMember = members.find(m => m.memberCode === evt.memberCode);
                  const scanTime = new Date(evt.timestamp).toLocaleTimeString(
                    language === 'ar' ? 'ar-EG' : 'en-US', 
                    { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                  );
                  return (
                    <div 
                      key={evt.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors shadow-2xs group animate-[fadeIn_0.2s_ease-out]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img 
                          src={sMember?.profileImageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'} 
                          alt="" 
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate leading-tight">
                            {sMember?.fullName || evt.memberCode}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {scanTime} • {evt.deviceInfo || 'Scanner'} • {language === 'ar' ? `بواسطة: ${evt.adminName || 'مسؤول'}` : `By: ${evt.adminName || 'Admin'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80">
                          {evt.memberCode}
                        </span>
                        
                        {/* Instant Trash Button */}
                        <button
                          onClick={() => deleteEvent(evt.id)}
                          className="cursor-pointer p-1.5 bg-rose-50 hover:bg-rose-105 border border-rose-100 hover:border-rose-300 text-rose-600 hover:text-rose-750 rounded-lg transition-all"
                          title={language === 'ar' ? 'حذف السجل (إلغاء التحضير)' : 'Delete this check-in record'}
                          id={`scanner-trash-event-${evt.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                {language === 'ar' ? 'لم يتم رصد أي عمليات تحضير في هذه الجلسة بعد.' : 'No active scans recorded in this session yet.'}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
