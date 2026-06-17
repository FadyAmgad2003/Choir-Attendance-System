import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Settings as SettingsIcon, Globe, Building, Image, HelpCircle, Database, CheckCircle, AlertTriangle, Key, Copy, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    orgName, 
    setOrgName, 
    logoUrl, 
    setLogoUrl, 
    language, 
    setLanguage, 
    t,
    supabaseUrl,
    supabaseAnonKey,
    isSupabaseConnected,
    updateSupabaseConfig
  } = useApp();

  const [localOrgName, setLocalOrgName] = useState(orgName);
  const [localLogoUrl, setLocalLogoUrl] = useState(logoUrl);
  const [successMsg, setSuccessMsg] = useState('');

  // Supabase Local Inputs
  const [dbUrl, setDbUrl] = useState(supabaseUrl);
  const [dbKey, setDbKey] = useState(supabaseAnonKey);
  const [dbSuccessMsg, setDbSuccessMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Keep local inputs in sync with settings updates
  React.useEffect(() => {
    setLocalOrgName(orgName);
  }, [orgName]);

  React.useEffect(() => {
    setLocalLogoUrl(logoUrl);
  }, [logoUrl]);

  React.useEffect(() => {
    setDbUrl(supabaseUrl);
    setDbKey(supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

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
  };

  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(dbUrl, dbKey);
    setDbSuccessMsg(language === 'ar' ? 'تم تحديث مفاتيح الاتصال وجاري الربط!' : 'Connection parameters updated! Synchronizing...');
    const timer = setTimeout(() => {
      setDbSuccessMsg('');
    }, 4000);
  };

  const sqlSetupScript = `-- === COPY AND PASTE INTO SUPABASE SQL EDITOR ===

-- 1. Create Table: Organizations
create table if not exists public.organizations (
  id text primary key,
  name text not null,
  "logoUrl" text,
  "churchCount" int default 0
);

-- 2. Create Table: Churches
create table if not exists public.churches (
  id text primary key,
  "organizationId" text,
  name text not null,
  location text
);

-- 3. Create Table: Choirs
create table if not exists public.choirs (
  id text primary key,
  "churchId" text,
  name text not null,
  description text
);

-- 4. Create Table: Admins
create table if not exists public.admins (
  id text primary key,
  name text not null,
  email text not null,
  role text not null,
  password text not null,
  "organizationId" text,
  "choirId" text,
  status text not null
);

-- 5. Create Table: Members
create table if not exists public.members (
  id text primary key,
  "memberCode" text not null,
  "fullName" text not null,
  gender text,
  "profileImageUrl" text,
  "mobileNumber" text,
  "parentMobileNumber" text,
  school text,
  "educationStage" text,
  "memberType" text,
  status text not null,
  "joinDate" text,
  "choirId" text,
  notes text
);

-- 6. Create Table: Events
create table if not exists public.events (
  id text primary key,
  "memberCode" text not null,
  "adminId" text,
  "adminName" text,
  timestamp text not null,
  date text not null,
  "choirId" text,
  "deviceInfo" text,
  synced boolean default true
);

-- 7. Create Table: Settings Configs
create table if not exists public.settings (
  id text primary key default 'config',
  "orgName" text,
  "logoUrl" text
);

-- 8. Turn On Realtime Synchronization Alerts
alter publication supabase_realtime add table public.organizations;
alter publication supabase_realtime add table public.churches;
alter publication supabase_realtime add table public.choirs;
alter publication supabase_realtime add table public.admins;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.settings;
`;

  const copySQLToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-6" id="settings-view-form">
      {/* Upper Navigation Row */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-indigo-600" />
          {t.settings}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'ar' 
            ? 'تخصيص لغة النظام، اسم الأيبارشية، وشعار الكورال وتكامل قاعدة البيانات السحابية.' 
            : 'Configure default client language, diocesan titles, logo visuals, and your real-time cloud database.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Form Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-150 rounded-xl p-6 shadow-sm space-y-5 text-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="h-4 w-4 text-indigo-600" />
              {language === 'ar' ? 'الإعدادات العامة واللغة' : 'General & Language Settings'}
            </h2>

            {/* Success Alert */}
            {successMsg && (
              <div id="settings-success-feedback" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center font-bold">
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
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`cursor-pointer px-4 py-2.5 rounded-lg border text-center font-bold transition-all ${language === 'en' ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-800' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  English (LTR Layout)
                </button>

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
              className="cursor-pointer px-5 py-2.5 w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
            >
              {t.updateSettingsBtn}
            </button>
          </form>

          {/* SUPABASE CONNECTION SETTINGS PANEL */}
          <form onSubmit={handleConnectSupabase} className="bg-white border border-gray-150 rounded-xl p-6 shadow-sm space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-600" />
                {language === 'ar' ? 'ربط قاعدة بيانات سوبابيز (Supabase)' : 'Supabase Cloud Database Integration'}
              </h2>
              
              {/* Dynamic Connection Status badge */}
              {isSupabaseConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 shrink-0 self-start sm:self-auto">
                  <CheckCircle className="h-3 w-3 text-emerald-600 scale-110" />
                  {language === 'ar' ? 'متصل ومزامن لحظياً ⚡' : '⚡ Connected & Synced Real-Time'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 self-start sm:self-auto">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  {language === 'ar' ? 'نمط محلي (بدون سحابة) 📂' : '📂 Local Storage Backup Mode'}
                </span>
              )}
            </div>

            {/* DB Alert */}
            {dbSuccessMsg && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-center font-bold">
                {dbSuccessMsg}
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-slate-500">
              {language === 'ar'
                ? 'استبدل خادم فايربيس بقاعدة بيانات سوبابيز (Supabase Postgres) للحصول على مزامنة ثنائية مذهلة ولحظية بين اللابتوب والموبايل دون أي حاجة للتحديث اليدوي.'
                : 'Replace Firebase with a lightning-fast Supabase database. Enables seamless bidirectional real-time synchronization between laptops, tablets, and scanner mobiles instantly.'}
            </p>

            <div className="space-y-4 pt-2">
              {/* URL */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                  SUPABASE PROJECT URL:
                </label>
                <div className="relative">
                  <Database className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="https://your-project.supabase.co"
                  />
                </div>
              </div>

              {/* Anon API Code key */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                  SUPABASE ANON KEY:
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-50 transition-all flex items-center gap-1.5"
              >
                <Database className="h-3.5 w-3.5" />
                {language === 'ar' ? 'ربط وتفعيل المزامنة' : 'Connect & Sync Real-Time'}
              </button>

              {(dbUrl || dbKey) && (
                <button
                  type="button"
                  onClick={() => {
                    updateSupabaseConfig('', '');
                    setDbUrl('');
                    setDbKey('');
                    setDbSuccessMsg(language === 'ar' ? 'تم مسح الربط والعودة للنمط المحلي.' : 'Disconnected. Switched back to Local Fallback Mode.');
                    setTimeout(() => setDbSuccessMsg(''), 3000);
                  }}
                  className="cursor-pointer px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  {language === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
                </button>
              )}
            </div>
          </form>

        </div>

        {/* Informative Side Tips widget & Supabase instructions */}
        <div className="lg:col-span-1 space-y-4 text-xs">
          
          {/* Quick Copy Database Creator Instructions */}
          <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-450" />
                {language === 'ar' ? 'خطوات تهيئة قاعدة البيانات' : 'Supabase SQL Setup'}
              </h3>
              <button
                type="button"
                onClick={copySQLToClipboard}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                title="Copy SQL Installation Script"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] leading-relaxed text-slate-400">
              {language === 'ar'
                ? 'أنشئ حساباً مجانياً على موقع Supabase، وافتح نافذة (SQL Editor)، ثم الصق الأوامر وقم بتشغيلها لتهيئة الجداول تلقائياً بضغطة زر واحدة!'
                : '1. Create a free project at supabase.com. 2. Open SQL Editor and paste the copied database schema, then click Run. 3. Copy your project API Keys and paste them here.'}
            </p>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[9px] text-slate-400 overflow-x-auto max-h-[140px] shadow-inner whitespace-pre">
              {sqlSetupScript}
            </div>
          </div>

          {/* Original Informative Side Banner */}
          <div className="bg-indigo-950 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 pointer-events-none" />
            <h3 className="text-xs font-bold opacity-90">{language === 'ar' ? 'تعليمات الإعداد والربط الميداني' : 'Parish Deployment Check'}</h3>
            <p className="text-[10px] opacity-75 mt-2.5 leading-relaxed">
              {language === 'ar'
                ? 'تم استبدال فايربيس بنظام سوبابيز لدعم الاستمرارية وحل مشكلة المزامنة المعطلة. يدعم هذا النظام عمل التطبيق بالكامل بدون إنترنت لحماية البيانات في الكنائس والخدمات الكنسية الميدانية.'
                : 'Firebase is replaced with a streamlined Supabase real-time client. Even when offline in parish basements, all logged QR scans auto-buffer safely in local cache queue and release immediately upon reconnection.'}
            </p>
            <div className="mt-4 pt-2 border-t border-white/5 text-[9px] font-mono opacity-50 flex justify-between">
              <span>Client ID: CAMS-SUPABASE</span>
              <span>PWA: Ready</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
