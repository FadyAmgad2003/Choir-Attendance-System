import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserAccount, Organization, Church, ChoirDepartment, Member, AttendanceEvent } from '../types';
import { INITIAL_ORGANIZATIONS, INITIAL_CHURCHES, INITIAL_CHOIRS, INITIAL_MEMBERS, INITIAL_EVENTS, TRANSLATIONS, AppLanguage } from '../data';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

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
    setDoc(doc(db, 'settings', 'config'), { orgName: name, logoUrl }, { merge: true }).catch(console.error);
  };
  const setLogoUrl = (url: string) => {
    setLogoUrlState(url);
    localStorage.setItem('cams_logo_url', url);
    setDoc(doc(db, 'settings', 'config'), { orgName, logoUrl: url }, { merge: true }).catch(console.error);
  };

  // 5. Raw Lists backed by localStorage & populated by Firebase
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

  // Seeding function to trigger if collections are empty
  const seedDatabaseIfEmpty = async () => {
    try {
      const membersSnap = await getDocs(collection(db, 'members'));
      if (membersSnap.empty) {
        console.log('Database is empty. Seeding with initial data...');
        const batch = writeBatch(db);

        // 1. Seed admins
        const initialAdmins = [
          { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin' as const, password: 'super', status: 'active' as const },
          { id: 'usr-admin1', name: 'Mina Shawky', email: 'fadyamgd126@gmail.com', role: 'admin' as const, password: 'admin', organizationId: 'org-stmary', status: 'active' as const },
          { id: 'usr-admin2', name: 'Eng. Amgad Adly', email: 'amgad@churchdiocese.org', role: 'admin' as const, password: 'admin', organizationId: 'org-stmary', status: 'active' as const },
          { id: 'usr-officer1', name: 'Peter Mansour', email: 'peter.m@diocesestaff.org', role: 'officer' as const, password: 'officer', organizationId: 'org-stmary', choirId: 'sub-stmary-choir1', status: 'active' as const }
        ];
        initialAdmins.forEach(admin => {
          batch.set(doc(db, 'admins', admin.id), admin);
        });

        // 2. Seed organizations
        INITIAL_ORGANIZATIONS.forEach(org => {
          batch.set(doc(db, 'organizations', org.id), org);
        });

        // 3. Seed churches
        INITIAL_CHURCHES.forEach(church => {
          batch.set(doc(db, 'churches', church.id), church);
        });

        // 4. Seed choirs
        INITIAL_CHOIRS.forEach(choir => {
          batch.set(doc(db, 'choirs', choir.id), choir);
        });

        // 5. Seed members
        INITIAL_MEMBERS.forEach(member => {
          batch.set(doc(db, 'members', member.id), member);
        });

        // 6. Seed events
        INITIAL_EVENTS.forEach(event => {
          batch.set(doc(db, 'events', event.id), event);
        });

        // 7. Seed settings
        batch.set(doc(db, 'settings', 'config'), {
          orgName: 'St. Mary of Angels Diocese',
          logoUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80'
        });

        await batch.commit();
        console.log('Database seeded successfully.');
      }
    } catch (err) {
      console.error('Error seeding database:', err);
    }
  };

  // 6. Establish Real-time Sync listeners with Firebase Firestore
  useEffect(() => {
    seedDatabaseIfEmpty().then(() => {
      // Subscribe to admins
      const unsubAdmins = onSnapshot(collection(db, 'admins'), (snap) => {
        const list: UserAccount[] = [];
        snap.forEach((doc) => list.push(doc.data() as UserAccount));
        setAdmins(list);
        localStorage.setItem('cams_admins', JSON.stringify(list));
      });

      // Subscribe to organizations
      const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snap) => {
        const list: Organization[] = [];
        snap.forEach((doc) => list.push(doc.data() as Organization));
        setOrganizations(list);
        localStorage.setItem('cams_orgs', JSON.stringify(list));
      });

      // Subscribe to churches
      const unsubChurches = onSnapshot(collection(db, 'churches'), (snap) => {
        const list: Church[] = [];
        snap.forEach((doc) => list.push(doc.data() as Church));
        setChurches(list);
        localStorage.setItem('cams_churches', JSON.stringify(list));
      });

      // Subscribe to choirs
      const unsubChoirs = onSnapshot(collection(db, 'choirs'), (snap) => {
        const list: ChoirDepartment[] = [];
        snap.forEach((doc) => list.push(doc.data() as ChoirDepartment));
        setChoirs(list);
        localStorage.setItem('cams_choirs', JSON.stringify(list));
      });

      // Subscribe to members
      const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
        const list: Member[] = [];
        snap.forEach((doc) => list.push(doc.data() as Member));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setMembers(list);
        localStorage.setItem('cams_members', JSON.stringify(list));
      });

      // Subscribe to events
      const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
        const list: AttendanceEvent[] = [];
        snap.forEach((doc) => list.push(doc.data() as AttendanceEvent));
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEvents(list);
        localStorage.setItem('cams_events', JSON.stringify(list));
      });

      // Subscribe to settings config
      const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.orgName) {
            setOrgNameState(data.orgName);
            localStorage.setItem('cams_org_name', data.orgName);
          }
          if (data.logoUrl) {
            setLogoUrlState(data.logoUrl);
            localStorage.setItem('cams_logo_url', data.logoUrl);
          }
        }
      });

      return () => {
        unsubAdmins();
        unsubOrgs();
        unsubChurches();
        unsubChoirs();
        unsubMembers();
        unsubEvents();
        unsubSettings();
      };
    }).catch(console.error);
  }, []);

  // Reactive pruning: If members are deleted/cleared, automatically clean up their corresponding attendance logs
  useEffect(() => {
    const existingCodes = new Set(members.map(m => m.memberCode));
    const staleEvents = events.filter(e => !existingCodes.has(e.memberCode));
    if (staleEvents.length > 0) {
      // Prune stale events in Firestore too
      const batch = writeBatch(db);
      staleEvents.forEach(e => {
        batch.delete(doc(db, 'events', e.id));
      });
      batch.commit().catch(console.error);
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

    setDoc(doc(db, 'members', id), newMember).catch(console.error);
    return newMember;
  };

  const updateMember = (updated: Member) => {
    setDoc(doc(db, 'members', updated.id), updated).catch(console.error);
  };

  const deleteMembers = async (ids: string[]) => {
    const codesToDelete = members.filter(m => ids.includes(m.id)).map(m => m.memberCode);
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'members', id));
    });
    const eventsToDelete = events.filter(e => codesToDelete.includes(e.memberCode));
    eventsToDelete.forEach(e => {
      batch.delete(doc(db, 'events', e.id));
    });
    await batch.commit().catch(console.error);
    setOfflineQueue(prev => prev.filter(code => !codesToDelete.includes(code)));
  };

  const bulkImportMembers = async (incomingMembers: Member[]) => {
    const batch = writeBatch(db);
    incomingMembers.forEach(m => {
      batch.set(doc(db, 'members', m.id), m);
    });
    await batch.commit().catch(console.error);
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

    setDoc(doc(db, 'events', newEvent.id), newEvent).catch(console.error);
    return { success: true, message: `${matchedMember.fullName} attendance registered successfully!` };
  };

  // Force flush of the offline cached events
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const batch = writeBatch(db);
    let count = 0;

    offlineQueue.forEach((code, index) => {
      const matchedMember = members.find(m => m.memberCode === code);
      if (matchedMember && matchedMember.status === 'Active') {
        const isDuplicate = events.some(e => e.memberCode === code && e.date === todayStr);
        if (!isDuplicate) {
          const newId = `evt-offline-${Date.now()}-${index}`;
          batch.set(doc(db, 'events', newId), {
            id: newId,
            memberCode: code,
            adminId: currentUser?.id || 'system',
            adminName: currentUser?.name || 'System Admin',
            timestamp: new Date().toISOString(),
            date: todayStr,
            choirId: matchedMember.choirId,
            deviceInfo: 'Synced Sandbox Queue Cache',
            synced: true
          });
          count++;
        }
      }
    });

    if (count > 0) {
      await batch.commit().catch(console.error);
    }
    setOfflineQueue([]);
  };

  const clearAllEvents = async () => {
    const batch = writeBatch(db);
    events.forEach(e => {
      batch.delete(doc(db, 'events', e.id));
    });
    await batch.commit().catch(console.error);
  };

  const deleteEvent = (id: string) => {
    deleteDoc(doc(db, 'events', id)).catch(console.error);
  };

  // 8. Super Admin provisions
  const provisionAdmin = (email: string, name: string, role: UserRole, orgId = 'org-stmary', password = 'admin') => {
    const id = `usr-admin-${Date.now()}`;
    const newAdmin: UserAccount = {
      id,
      name,
      email,
      role,
      password,
      organizationId: role !== 'super_admin' ? orgId : undefined,
      status: 'active'
    };
    setDoc(doc(db, 'admins', id), newAdmin).catch(console.error);
  };

  const revokeAdmin = (id: string) => {
    deleteDoc(doc(db, 'admins', id)).catch(console.error);
  };

  const updateAdmin = (updated: UserAccount) => {
    setDoc(doc(db, 'admins', updated.id), updated).catch(console.error);
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
