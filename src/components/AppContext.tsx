import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserAccount, Organization, Church, ChoirDepartment, Member, AttendanceEvent } from '../types';
import { INITIAL_ORGANIZATIONS, INITIAL_CHURCHES, INITIAL_CHOIRS, INITIAL_MEMBERS, INITIAL_EVENTS, TRANSLATIONS, AppLanguage } from '../data';

interface AppContextType {
  // Localization
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: typeof TRANSLATIONS['en'];

  // Network Offline Emulation
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  offlineQueue: string[]; // pending scanned QR codes
  syncOfflineQueue: () => void;

  // Active User / Access Session
  currentUser: UserAccount | null;
  switchRole: (role: UserRole) => void;
  login: (email: string, pass: string) => { success: boolean; message: string };
  logout: () => void;

  // Core Data Lists
  organizations: Organization[];
  churches: Church[];
  choirs: ChoirDepartment[];
  members: Member[];
  events: AttendanceEvent[];

  // Data Actions
  addMember: (member: Omit<Member, 'id' | 'memberCode' | 'joinDate'>) => Member;
  updateMember: (member: Member) => void;
  deleteMembers: (ids: string[]) => void;
  bulkImportMembers: (incomingMembers: Member[]) => void;
  recordScan: (memberCode: string, deviceInfo?: string) => { success: boolean; message: string; duplicate?: boolean };
  clearAllEvents: () => void;
  deleteEvent: (id: string) => void;

  // Church Settings
  orgName: string;
  setOrgName: (name: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;

  // Admin Account Lists (Super Admin Scope)
  admins: UserAccount[];
  provisionAdmin: (email: string, name: string, role: UserRole, orgId?: string, password?: string) => void;
  updateAdmin: (updated: UserAccount) => void;
  revokeAdmin: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language State
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const cached = localStorage.getItem('cams_lang');
    return (cached as AppLanguage) || 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('cams_lang', lang);
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      html.setAttribute('lang', lang);
    }
  };

  useEffect(() => {
    // Sync HTML on mount
    setLanguage(language);
  }, []);

  const t = TRANSLATIONS[language];

  // 2. Network Emulation
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const cached = localStorage.getItem('cams_online');
    return cached !== 'false';
  });

  const [offlineQueue, setOfflineQueue] = useState<string[]>(() => {
    const cached = localStorage.getItem('cams_offline_queue');
    return cached ? JSON.parse(cached) : [];
  });

  const toggleOnlineStatus = (status: boolean) => {
    setIsOnline(status);
    localStorage.setItem('cams_online', String(status));
  };

  // 3. User Accounts (Mock list that Super Admin and normal screens interact with)
  const [admins, setAdmins] = useState<UserAccount[]>(() => {
    const cached = localStorage.getItem('cams_admins');
    if (cached) return JSON.parse(cached);
    return [
      { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin', password: 'super', status: 'active' },
      { id: 'usr-admin1', name: 'Mina Shawky', email: 'fadyamgd126@gmail.com', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
      { id: 'usr-admin2', name: 'Eng. Amgad Adly', email: 'amgad@churchdiocese.org', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
      { id: 'usr-officer1', name: 'Peter Mansour', email: 'peter.m@diocesestaff.org', role: 'officer', password: 'officer', organizationId: 'org-stmary', choirId: 'sub-stmary-choir1', status: 'active' }
    ];
  });

  // Current session representation (null means logged out)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const cached = localStorage.getItem('cams_session');
    if (cached) return JSON.parse(cached);
    // Let's keep logged-out by default to present the beautiful Login page
    return null;
  });

  const switchRole = (role: UserRole) => {
    let account: UserAccount;
    if (role === 'super_admin') {
      account = admins.find(a => a.role === 'super_admin') || { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin', password: 'super', status: 'active' };
    } else if (role === 'admin') {
      account = admins.find(a => a.role === 'admin') || admins[1];
    } else {
      account = admins.find(a => a.role === 'officer') || admins[3];
    }
    setCurrentUser(account);
    localStorage.setItem('cams_session', JSON.stringify(account));
  };

  const login = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const user = admins.find(a => a.email.toLowerCase() === cleanEmail);
    if (user) {
      const userPass = user.password || 'admin';
      if (userPass === cleanPass) {
        if (user.status === 'inactive') {
          return { success: false, message: language === 'ar' ? 'هذا الحساب غير نشط حالياً.' : 'This account is currently marked inactive.' };
        }
        setCurrentUser(user);
        localStorage.setItem('cams_session', JSON.stringify(user));
        return { success: true, message: language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Successfully signed in!' };
      }
    }

    return { success: false, message: language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cams_session');
  };

  // 4. Church Settings Config
  const [orgName, setOrgNameState] = useState<string>(() => {
    return localStorage.getItem('cams_org_name') || 'St. Mary of Angels Diocese';
  });
  const [logoUrl, setLogoUrlState] = useState<string>(() => {
    return localStorage.getItem('cams_logo_url') || 'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80';
  });

  const setOrgName = (name: string) => {
    setOrgNameState(name);
    localStorage.setItem('cams_org_name', name);
  };
  const setLogoUrl = (url: string) => {
    setLogoUrlState(url);
    localStorage.setItem('cams_logo_url', url);
  };

  // 5. Raw Lists backed by localStorage
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const cached = localStorage.getItem('cams_orgs');
    return cached ? JSON.parse(cached) : INITIAL_ORGANIZATIONS;
  });

  const [churches, setChurches] = useState<Church[]>(() => {
    const cached = localStorage.getItem('cams_churches');
    return cached ? JSON.parse(cached) : INITIAL_CHURCHES;
  });

  const [choirs, setChoirs] = useState<ChoirDepartment[]>(() => {
    const cached = localStorage.getItem('cams_choirs');
    return cached ? JSON.parse(cached) : INITIAL_CHOIRS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const cached = localStorage.getItem('cams_members');
    return cached ? JSON.parse(cached) : INITIAL_MEMBERS;
  });

  const [events, setEvents] = useState<AttendanceEvent[]>(() => {
    const cached = localStorage.getItem('cams_events');
    return cached ? JSON.parse(cached) : INITIAL_EVENTS;
  });

  // Keep localStorage up-to-date with raw changes
  useEffect(() => {
    localStorage.setItem('cams_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('cams_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('cams_churches', JSON.stringify(churches));
  }, [churches]);

  useEffect(() => {
    localStorage.setItem('cams_choirs', JSON.stringify(choirs));
  }, [choirs]);

  useEffect(() => {
    localStorage.setItem('cams_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('cams_events', JSON.stringify(events));
  }, [events]);

  // Reactive pruning: If members are deleted/cleared, automatically clean up their corresponding attendance logs
  useEffect(() => {
    const existingCodes = new Set(members.map(m => m.memberCode));
    const isStale = events.some(e => !existingCodes.has(e.memberCode));
    if (isStale) {
      setEvents(prev => prev.filter(e => existingCodes.has(e.memberCode)));
    }
  }, [members]);

  useEffect(() => {
    localStorage.setItem('cams_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Sync automatic check if back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  // 6. Action: Add Member Profile (Permanent Alphanumeric QR generated here)
  const addMember = (data: Omit<Member, 'id' | 'memberCode' | 'joinDate'>) => {
    const id = `mem-${Date.now()}`;
    const randPattern = Math.random().toString(36).substring(2, 8).toUpperCase();
    const memberCode = `CH-${randPattern}`; // e.g. CH-9K4F2A permanent code

    const newMember: Member = {
      ...data,
      id,
      memberCode,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setMembers(prev => [newMember, ...prev]);
    return newMember;
  };

  const updateMember = (updated: Member) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const deleteMembers = (ids: string[]) => {
    const codesToDelete = members.filter(m => ids.includes(m.id)).map(m => m.memberCode);
    setMembers(prev => prev.filter(m => !ids.includes(m.id)));
    setEvents(prev => prev.filter(e => !codesToDelete.includes(e.memberCode)));
    setOfflineQueue(prev => prev.filter(code => !codesToDelete.includes(code)));
  };

  const bulkImportMembers = (incomingMembers: Member[]) => {
    setMembers(prev => {
      const existingMap = new Map<string, Member>();
      prev.forEach(m => existingMap.set(m.id, m));
      incomingMembers.forEach(m => {
        existingMap.set(m.id, m);
      });
      return Array.from(existingMap.values());
    });
  };

  // 7. Action: Scan QR Member Code
  const recordScan = (memberCode: string, deviceInfo = 'Web Integration') => {
    const cleanCode = memberCode.trim().toUpperCase();
    const matchedMember = members.find(m => m.memberCode === cleanCode);

    if (!matchedMember) {
      return { success: false, message: `Invalid Code: ${cleanCode} has no linked parishioner profile.` };
    }

    if (matchedMember.status === 'Inactive') {
      return { success: false, message: `Access Denied: ${matchedMember.fullName} is flagged as Inactive.` };
    }

    // Capture today's date in local time zone to prevent timezone shift issues
    const todayStr = new Date().toISOString().split('T')[0];

    // Check for double scan on the same exact day
    const alreadyScanned = events.some(e => e.memberCode === cleanCode && e.date === todayStr);
    
    // Check if duplicate is also pending in local offline cache
    const alreadyInQueue = offlineQueue.includes(cleanCode);

    if (alreadyScanned || alreadyInQueue) {
      return { 
        success: false, 
        message: `${matchedMember.fullName} has already registered check-in for today.`,
        duplicate: true 
      };
    }

    // Capture real action
    if (!isOnline) {
      // Offline mode caching
      if (!offlineQueue.includes(cleanCode)) {
        setOfflineQueue(prev => [...prev, cleanCode]);
      }
      return { 
        success: true, 
        message: `${matchedMember.fullName} QR checked. Saved in local offline queue! (${cleanCode})` 
      };
    }

    // Online immediately save event
    const newEvent: AttendanceEvent = {
      id: `evt-${Date.now()}`,
      memberCode: cleanCode,
      adminId: currentUser?.id || 'system',
      adminName: currentUser?.name || 'System Admin',
      timestamp: new Date().toISOString(),
      date: todayStr,
      choirId: matchedMember.choirId,
      deviceInfo,
      synced: true
    };

    setEvents(prev => [newEvent, ...prev]);
    return { success: true, message: `${matchedMember.fullName} attendance registered successfully!` };
  };

  // Force flush of the offline cached events
  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newEvents: AttendanceEvent[] = [];

    offlineQueue.forEach((code, index) => {
      const matchedMember = members.find(m => m.memberCode === code);
      if (matchedMember && matchedMember.status === 'Active') {
        const isDuplicate = events.some(e => e.memberCode === code && e.date === todayStr);
        if (!isDuplicate) {
          newEvents.push({
            id: `evt-offline-${Date.now()}-${index}`,
            memberCode: code,
            adminId: currentUser?.id || 'system',
            adminName: currentUser?.name || 'System Admin',
            timestamp: new Date().toISOString(),
            date: todayStr,
            choirId: matchedMember.choirId,
            deviceInfo: 'Synced Sandbox Queue Cache',
            synced: true
          });
        }
      }
    });

    if (newEvents.length > 0) {
      setEvents(prev => [...newEvents, ...prev]);
    }
    setOfflineQueue([]);
  };

  const clearAllEvents = () => {
    setEvents([]);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // 8. Super Admin provisions
  const provisionAdmin = (email: string, name: string, role: UserRole, orgId = 'org-stmary', password = 'admin') => {
    const newAdmin: UserAccount = {
      id: `usr-admin-${Date.now()}`,
      name,
      email,
      role,
      password,
      organizationId: role !== 'super_admin' ? orgId : undefined,
      status: 'active'
    };
    setAdmins(prev => [...prev, newAdmin]);
  };

  const revokeAdmin = (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  const updateAdmin = (updated: UserAccount) => {
    setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
      localStorage.setItem('cams_session', JSON.stringify(updated));
    }
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      t,
      isOnline,
      setIsOnline: toggleOnlineStatus,
      offlineQueue,
      syncOfflineQueue,
      currentUser,
      switchRole,
      login,
      logout,
      organizations,
      churches,
      choirs,
      members,
      events,
      addMember,
      updateMember,
      deleteMembers,
      bulkImportMembers,
      recordScan,
      clearAllEvents,
      deleteEvent,
      orgName,
      setOrgName,
      logoUrl,
      setLogoUrl,
      admins,
      provisionAdmin,
      updateAdmin,
      revokeAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
};
