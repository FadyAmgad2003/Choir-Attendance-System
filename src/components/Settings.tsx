import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Settings as SettingsIcon, Globe, Building, Image, HelpCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    orgName, 
    setOrgName, 
    logoUrl, 
    setLogoUrl, 
    language, 
    setLanguage, 
    t 
  } = useApp();

  const [localOrgName, setLocalOrgName] = useState(orgName);
  const [localLogoUrl, setLocalLogoUrl] = useState(logoUrl);
  const [successMsg, setSuccessMsg] = useState('');

  // Keep local inputs in sync with Firestore settings updates
  React.useEffect(() => {
    setLocalOrgName(orgName);
  }, [orgName]);

  React.useEffect(() => {
    setLocalLogoUrl(logoUrl);
  }, [logoUrl]);

  // Seal logo presets for church selection
  const logoPresets = [
    'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80', // Celtic Cross gold icon
    'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=150&q=80', // Faith badge icon
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=150&q=80', // Ancient Cathedral sketch icon
  ];

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgName(localOrgName);
    setLogoUrl(localLogoUrl);
    
    setSuccessMsg(language === 'ar' ? 'تم تحديث إعدادات الأيبارشية بنجاح!' : 'Diocesan settings updated successfully!');
    const timer = setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="space-y-6" id="settings-view-form">
      {/* Upper Navigation Row */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-indigo-600" />
          {t.settings}
        </h1>
        <p className="text-sm text-slate-550 mt-1">
          {language === 'ar' ? 'تخصيص لغة النظام، اسم الأيبارشية الكبرى والشعار المعتمد.' : 'Configure default client language, diocesan titles, and corporate seal graphics.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Form Configurations */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5 text-xs">
            
            {/* Success Alert */}
            {successMsg && (
              <div id="settings-success-feedback" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
                {successMsg}
              </div>
            )}

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
                {t.defaultLanguage}
              </label>
              
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {/* English Option */}
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`cursor-pointer px-4 py-2.5 rounded-lg border text-center font-bold transition-all ${language === 'en' ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-800' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  English (LTR Layout)
                </button>

                {/* Arabic Option */}
                <button
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`cursor-pointer px-4 py-2.5 rounded-lg border text-center font-bold transition-all ${language === 'ar' ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-800' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  العربية (تخطيط RTL)
                </button>
              </div>
            </div>

            {/* Organization Name Input */}
            <div className="space-y-1.5 pt-3 border-t border-slate-50">
              <label className="font-semibold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-indigo-500" />
                {t.orgName}
              </label>
              <input
                type="text"
                value={localOrgName}
                onChange={(e) => setLocalOrgName(e.target.value)}
                className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. St. Mark Cathedral Diocese"
                required
              />
            </div>

            {/* Logo Image URL Options */}
            <div className="space-y-1.5 pt-3 border-t border-slate-50">
              <label className="font-semibold text-gray-700 uppercase tracking-wider block flex items-center gap-1" id="choir-logo-label">
                <Image className="h-3.5 w-3.5 text-indigo-500" />
                {language === 'ar' ? 'شعار الكورال أو الخدمة:' : 'Choir / Ministry Logo:'}
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img 
                  src={localLogoUrl} 
                  alt="Seals" 
                  className="h-14 w-14 rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0 object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 w-full space-y-2">
                  {/* File Upload Zone */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setLocalLogoUrl(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-lg p-3 text-center bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => document.getElementById('hide-choir-logo-upload')?.click()}
                    id="settings-drag-uploader"
                  >
                    <p className="text-[11px] text-slate-500 font-medium">
                      {language === 'ar' ? 'اسحب شعار الكورال أو انقر هنا للرفع' : 'Drag & drop choir logo or click to select'}
                    </p>
                    <input 
                      id="hide-choir-logo-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setLocalLogoUrl(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    value={localLogoUrl}
                    onChange={(e) => setLocalLogoUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Or enter logo URL..."
                  />
                </div>
              </div>

              {/* Presets logo stamps list */}
              <div className="pt-2">
                <span className="block text-[10px] text-gray-400 font-medium mb-1.5">{language === 'ar' ? 'أو اختر من شعارات الأيقونات الكنسية المعتمدة:' : 'Or tap to apply a pastoral stamp template:'}</span>
                <div className="flex gap-2">
                  {logoPresets.map((l, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLocalLogoUrl(l)}
                      className={`cursor-pointer rounded-lg border p-1 bg-slate-50 overflow-hidden shrink-0 ${localLogoUrl === l ? 'border-2 border-indigo-600 scale-102' : 'border-slate-200'}`}
                      id={`logo-preset-${i}`}
                    >
                      <img src={l} alt="" className="h-10 w-10 object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sync Assembly Rules Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <span className="font-bold flex items-center gap-1.5 text-slate-800">
                <HelpCircle className="h-4 w-4 text-indigo-500" />
                {t.activeTimezone}
              </span>
              <p>{t.timezoneLog}</p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="cursor-pointer px-5 py-2 w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
            >
              {t.updateSettingsBtn}
            </button>

          </form>
        </div>

        {/* Informative Side Tips widget */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-indigo-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 pointer-events-none" />
            <h3 className="text-sm font-bold opacity-90">{language === 'ar' ? 'تعليمات الإعداد والربط الميداني' : 'Parish Deployment Check'}</h3>
            <p className="text-[11px] opacity-75 mt-3 leading-relaxed">
              {language === 'ar'
                ? 'يرتبط هذا الجهاز بملف الحضور الموحد لأيبارشية الشباب. جميع الحركات تتم مزامنتها تلقائياً عند استعادة جودة الاتصال بالخادم الرئيسي.'
                : 'All scan logs created by Attendance Officers are linked automatically to the church organization identity and validated against permanent member profiles.'}
            </p>
            <div className="mt-5 text-[10px] font-mono opacity-60">
              <p>Device Token: CAM-LOCAL-2026</p>
              <p className="mt-1">PWA Client Status: Installed</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
