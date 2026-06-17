import React, { useState } from 'react';
import { AppProvider, useApp } from './components/AppContext';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { Members } from './components/Members';
import { Logs } from './components/Logs';
import { IDCards } from './components/IDCards';
import { Settings } from './components/Settings';
import { SuperAdmin } from './components/SuperAdmin';
import { Login } from './components/Login';
import { 
  Users, 
  Camera, 
  Database, 
  Printer, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  ShieldCheck, 
  UserSquare2, 
  Languages, 
  Signal, 
  SignalZero,
  Heart,
  Menu,
  X,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

interface TabItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  allowedRoles: ('super_admin' | 'admin' | 'officer')[];
}

const MainAppContent: React.FC = () => {
  const { 
    currentUser, 
    switchRole, 
    orgName, 
    logoUrl, 
    language, 
    setLanguage, 
    isOnline, 
    setIsOnline, 
    offlineQueue, 
    t,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [targetCardCodes, setTargetCardCodes] = useState<string[]>([]);
  const darkMode = false;

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('cams_dark_mode', 'false');
  }, []);

  // Callback to jump to card printing module with specific selection
  const handleTriggerCardPrint = (selectedCodes: string[]) => {
    setTargetCardCodes(selectedCodes);
    setActiveTab('idcards');
  };

  // Safe tab adjustment if role forces restriction (e.g., Attendance Officer -> Scanner Only)
  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'officer') {
      setActiveTab('scanner');
    } else if (activeTab === 'super_admin' && currentUser.role !== 'super_admin') {
      setActiveTab('dashboard');
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Login />;
  }

  const tabs: TabItem[] = [
    { 
      id: 'dashboard', 
      name: t.dashboard, 
      icon: <LayoutDashboard className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin'] 
    },
    { 
      id: 'members', 
      name: t.members, 
      icon: <Users className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin'] 
    },
    { 
      id: 'scanner', 
      name: t.qrScanner, 
      icon: <Camera className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin', 'officer'] 
    },
    { 
      id: 'logs', 
      name: t.attendanceLogs, 
      icon: <Database className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin'] 
    },
    { 
      id: 'idcards', 
      name: t.idCards, 
      icon: <Printer className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin'] 
    },
    { 
      id: 'settings', 
      name: t.settings, 
      icon: <SettingsIcon className="h-4 w-4" />, 
      allowedRoles: ['super_admin', 'admin'] 
    },
    { 
      id: 'super_admin', 
      name: t.superAdmin, 
      icon: <ShieldCheck className="h-4 w-4 text-amber-500" />, 
      allowedRoles: ['super_admin'] 
    }
  ];

  const allowedTabs = tabs.filter(t => t.allowedRoles.includes(currentUser.role));

  const rtlClass = language === 'ar' ? 'font-sans' : 'font-sans';

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 flex flex-col ${rtlClass} text-slate-900 dark:text-slate-100 transition-colors duration-200`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. Global Header with Impersonator Panel and Language Dialect Swaps */}
      <header className="sticky top-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm px-6 flex items-center justify-between transition-colors duration-200">
        
        {/* Left Section: Logo & Diocese details */}
        <div className="flex items-center gap-2.5">
          <img 
            src={logoUrl} 
            alt="Diocesan Crest" 
            className="h-10 w-10 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-inner bg-slate-50 dark:bg-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1 leading-none">
              <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500 shrink-0" />
              {t.appName}
            </span>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight truncate max-w-[150px] sm:max-w-xs">{orgName}</h1>
          </div>
        </div>

        {/* Dynamic header options */}
        <div className="flex items-center gap-3">
          
          {/* Active Connection state indicator */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-colors">
            {isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 translate-y-0.5">
                <Signal className="h-3.5 w-3.5" />
                {t.activeConnection}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 translate-y-0.5">
                <SignalZero className="h-3.5 w-3.5" />
                {offlineQueue.length} {language === 'ar' ? 'حركات معلقة' : 'cached'}
              </span>
            )}
          </div>



          {/* Language translation switcher button */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="cursor-pointer px-3 py-1.5 flex items-center gap-1 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            title="Switch Language / تبديل اللغة"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline font-bold uppercase">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Mobile responsive toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg md:hidden border border-gray-200"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. Main Sidebar and Dashboard Panels Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Sidebar Left Component (Desktop view) - Responsive Design */}
        <aside className="hidden md:block w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 text-slate-800 dark:text-white">
          <div className="p-4 space-y-1.5 pt-6">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
              {language === 'ar' ? 'قطاعات النظام الرئيسي' : 'MAIN CONSOLE SYSTEM'}
            </p>
            
            {allowedTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all shadow-sm ${isActive ? 'bg-indigo-600 text-white font-bold shadow-indigo-950/20 border border-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-transparent'}`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{tab.icon}</span>
                  <span className="truncate">{tab.name}</span>
                  {tab.id === 'scanner' && offlineQueue.length > 0 && (
                    <span className="ml-auto inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Lower session badge */}
          <div className="p-4 border-t border-slate-150 bg-slate-50/30 space-y-2.5">
            <div className="flex items-center gap-2.5 p-2 rounded-xl border border-indigo-100/90 bg-indigo-50/40 shadow-xs">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm leading-none shrink-0 font-display">
                {currentUser?.name ? currentUser.name.substring(0, 2) : 'AD'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-indigo-950 truncate leading-tight">{currentUser?.name}</p>
                <span className="text-[9px] font-semibold text-indigo-600 block mt-0.5 truncate uppercase tracking-wider">
                  {currentUser?.role === 'super_admin' ? t.superScope : (currentUser?.role === 'admin' ? t.adminScope : t.officerScope)}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-100 hover:border-rose-250 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-[10px] font-bold text-rose-700 hover:text-rose-800 tracking-wider uppercase transition-all shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>

            <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800 select-none uppercase tracking-wide">
              Copy rights all for ENG. Fady Amgad
            </p>
          </div>
        </aside>

        {/* Mobile slide-out drawer navigator */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden animate-[fadeIn_0.15s_ease-out]">
            <div className="w-64 max-w-[80vw] bg-white h-full p-4 space-y-2 pt-6 shadow-xl relative animate-[slideIn_0.2s_ease-out]">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.appName}</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {allowedTabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`cursor-pointer w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-left text-xs font-semibold ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-slate-50'}`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-gray-150 mt-4 space-y-3">
                <div className="flex items-center gap-2.5 p-2 rounded-xl border border-indigo-100/90 bg-indigo-50/40 shadow-xs">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 font-display">
                    {currentUser?.name ? currentUser.name.substring(0, 2) : 'AD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-indigo-950 truncate leading-tight select-none">{currentUser?.name}</p>
                    <p className="text-[9px] text-indigo-600 font-semibold uppercase mt-0.5 tracking-wider">
                      {currentUser?.role === 'super_admin' ? t.superScope : (currentUser?.role === 'admin' ? t.adminScope : t.officerScope)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-100 hover:border-rose-250 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-[10px] font-bold text-rose-700 hover:text-rose-800 tracking-wider uppercase transition-all shadow-xs"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>

                <p className="text-[9px] text-center text-slate-400 font-mono pt-1.5 border-t border-gray-100 select-none uppercase tracking-wide">
                  Copy rights all for ENG. Fady Amgad
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Panel Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-white md:bg-inherit" id="main-content-viewport">
          
          {/* Active View Router */}
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'members' && <Members onGoToCards={handleTriggerCardPrint} />}
            {activeTab === 'scanner' && <Scanner />}
            {activeTab === 'logs' && <Logs />}
            {activeTab === 'idcards' && <IDCards initialSelectedCodes={targetCardCodes} />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'super_admin' && <SuperAdmin />}
          </div>

        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
