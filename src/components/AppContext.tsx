import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserAccount, Organization, Church, ChoirDepartment, Member, AttendanceEvent } from '../types';
import { INITIAL_ORGANIZATIONS, INITIAL_CHURCHES, INITIAL_CHOIRS, INITIAL_MEMBERS, INITIAL_EVENTS, TRANSLATIONS, AppLanguage } from '../data';
import { getSupabaseClient, getSupabaseCredentials, resetSupabaseClient, isSupabaseConfigured } from '../supabaseClient';

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

  // Supabase Custom Config Hooks
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConnected: boolean;
  supabaseError: string | null;
  updateSupabaseConfig: (url: string, key: string) => void;
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

  // 3. Dynamic Supabase Connection State and Config hooks
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return getSupabaseCredentials().url;
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => {
    return getSupabaseCredentials().key;
  });
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [syncTrigger, setSyncTrigger] = useState<number>(0);

  const updateSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('cams_supabase_url', url.trim());
    localStorage.setItem('cams_supabase_anon_key', key.trim());
    setSupabaseUrl(url.trim());
    setSupabaseAnonKey(key.trim());
    resetSupabaseClient();
    setIsSupabaseConnected(false);
    setSupabaseError(null);
    // Trigger real-time synchronization re-run
    setSyncTrigger(prev => prev + 1);
  };

  // 4. User Accounts State (Super Admin and normal screens interact with)
  const [admins, setAdmins] = useState<UserAccount[]>(() => {
    const cached = localStorage.getItem('cams_admins');
    if (cached) return JSON.parse(cached);
    return [
      { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin', password: 'super', status: 'active' },
      { id: 'usr-admin1', name: 'Mina Shawky1', email: 'fadyamgd126@gmail.com', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
      { id: 'usr-admin2', name: 'Eng. Amgad Adly', email: 'amgad@churchdiocese.org', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
      { id: 'usr-officer1', name: 'Peter Mansour', email: 'peter.m@diocesestaff.org', role: 'officer', password: 'officer', organizationId: 'org-stmary', choirId: 'sub-stmary-choir1', status: 'active' }
    ];
  });

  // Current session representation (null means logged out)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const cached = localStorage.getItem('cams_session');
    if (cached) return JSON.parse(cached);
    return null;
  });

  const switchRole = (role: UserRole) => {
    let account: UserAccount;
    if (role === 'super_admin') {
      account = admins.find(a => a.role === 'super_admin') || { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin', password: 'super', status: 'active' };
    } else if (role === 'admin') {
      account = admins.find(a => a.role === 'admin') || admins[1] || admins[0];
    } else {
      account = admins.find(a => a.role === 'officer') || admins[3] || admins[0];
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

  // 5. Church Settings Config
  const [orgName, setOrgNameState] = useState<string>(() => {
    return localStorage.getItem('cams_org_name') || 'St. Mary of Angels Diocese';
  });
  const [logoUrl, setLogoUrlState] = useState<string>(() => {
    return localStorage.getItem('cams_logo_url') || 'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80';
  });

  const setOrgName = (name: string) => {
    setOrgNameState(name);
    localStorage.setItem('cams_org_name', name);
    const client = getSupabaseClient() as any;
    if (client) {
      client.from('settings').upsert({ id: 'config', orgName: name, logoUrl }).catch(console.error);
    }
  };
  const setLogoUrl = (url: string) => {
    setLogoUrlState(url);
    localStorage.setItem('cams_logo_url', url);
    const client = getSupabaseClient() as any;
    if (client) {
      client.from('settings').upsert({ id: 'config', orgName, logoUrl: url }).catch(console.error);
    }
  };

  // 6. Raw Lists backed by localStorage & populated by Supabase
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

  // Supabase Data Seeding (Fired if table records are completely empty)
  const seedSupabaseIfEmpty = async (client: any) => {
    try {
      console.log('Seeding Supabase with initial demo data...');
      
      const { data: adminCheck } = await client.from('admins').select('id').limit(1);
      if (!adminCheck || adminCheck.length === 0) {
        // 1. Seed admins
        const initialAdmins = [
          { id: 'usr-super', name: 'His Eminence Bishop Anba Antonios', email: 'superadmin@church.org', role: 'super_admin', password: 'super', status: 'active' },
          { id: 'usr-admin1', name: 'Mina Shawky', email: 'fadyamgd126@gmail.com', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
          { id: 'usr-admin2', name: 'Eng. Amgad Adly', email: 'amgad@churchdiocese.org', role: 'admin', password: 'admin', organizationId: 'org-stmary', status: 'active' },
          { id: 'usr-officer1', name: 'Peter Mansour', email: 'peter.m@diocesestaff.org', role: 'officer', password: 'officer', organizationId: 'org-stmary', choirId: 'sub-stmary-choir1', status: 'active' }
        ];
        await client.from('admins').upsert(initialAdmins).catch(console.error);

        // 2. Seed organizations
        await client.from('organizations').upsert(INITIAL_ORGANIZATIONS).catch(console.error);

        // 3. Seed churches
        await client.from('churches').upsert(INITIAL_CHURCHES).catch(console.error);

        // 4. Seed choirs
        await client.from('choirs').upsert(INITIAL_CHOIRS).catch(console.error);

        // 5. Seed members
        await client.from('members').upsert(INITIAL_MEMBERS).catch(console.error);

        // 6. Seed events
        await client.from('events').upsert(INITIAL_EVENTS).catch(console.error);

        // 7. Seed Settings config
        await client.from('settings').upsert({
          id: 'config',
          orgName: 'St. Mary of Angels Diocese',
          logoUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80'
        }).catch(console.error);

        console.log('Supabase demo data seeded successfully!');
      }
    } catch (err) {
      console.warn('Supabase auto-seed was bypassed (tables might need creation).', err);
    }
  };

  const fetchInitialData = async (client: any) => {
    try {
      setSupabaseError(null);

      // Perform a clean connection test
      const { data: testData, error: testError } = await client.from('settings').select('id').limit(1) as any;
      if (testError) {
        console.error('Supabase test select error:', testError);
        if (testError.code === '42P01') {
          // Tables do not exist!
          setSupabaseError(language === 'ar'
            ? 'خطأ: جداول قاعدة البيانات غير موجودة! يرجى أولاً نسخ رمز الـ SQL من لوحة الإعدادات وتأكيد تشغيله (SQL Editor) داخل Supabase.'
            : 'Error: Database tables not found! Please copy the SQL setup code under settings, paste it in Supabase SQL Editor and hit Run.');
        } else if (testError.message && (testError.message.includes('JWT') || testError.status === 401 || testError.status === 403)) {
          setSupabaseError(language === 'ar'
            ? 'خطأ مصادقة: رمز الـ Anon Key غير صحيح أو غير متطابق مع هذا المشروع.'
            : 'Authentication Error: The Supabase Anon Key is invalid or expired.');
        } else {
          setSupabaseError(testError.message || JSON.stringify(testError));
        }
        setIsSupabaseConnected(false);
        return;
      }

      // 1. Fetch settings config first
      const { data: settingsData, error: settingsError } = await client.from('settings').select('*').eq('id', 'config').maybeSingle() as any;
      if (!settingsError && settingsData) {
        if (settingsData.orgName) {
          setOrgNameState(settingsData.orgName);
          localStorage.setItem('cams_org_name', settingsData.orgName);
        }
        if (settingsData.logoUrl) {
          setLogoUrlState(settingsData.logoUrl);
          localStorage.setItem('cams_logo_url', settingsData.logoUrl);
        }
      }

      // 2. Fetch admins
      const { data: adminsData, error: adminsError } = await client.from('admins').select('*') as any;
      if (!adminsError && adminsData) {
        if (adminsData.length === 0) {
          await seedSupabaseIfEmpty(client);
          // Refetch admins
          const { data: refetchedAdmins } = await client.from('admins').select('*') as any;
          if (refetchedAdmins) setAdmins(refetchedAdmins);
        } else {
          setAdmins(adminsData);
          localStorage.setItem('cams_admins', JSON.stringify(adminsData));
        }
      }

      // 3. Fetch organizations
      const { data: orgsData, error: orgsError } = await client.from('organizations').select('*') as any;
      if (!orgsError && orgsData) {
        setOrganizations(orgsData);
        localStorage.setItem('cams_orgs', JSON.stringify(orgsData));
      }

      // 4. Fetch churches
      const { data: churchesData, error: churchesError } = await client.from('churches').select('*') as any;
      if (!churchesError && churchesData) {
        setChurches(churchesData);
        localStorage.setItem('cams_churches', JSON.stringify(churchesData));
      }

      // 5. Fetch choirs
      const { data: choirsData, error: choirsError } = await client.from('choirs').select('*') as any;
      if (!choirsError && choirsData) {
        setChoirs(choirsData);
        localStorage.setItem('cams_choirs', JSON.stringify(choirsData));
      }

      // 6. Fetch members
      const { data: membersData, error: membersError } = await client.from('members').select('*') as any;
      if (!membersError && membersData) {
        const sorted = [...membersData].sort((a, b) => b.id.localeCompare(a.id));
        setMembers(sorted);
        localStorage.setItem('cams_members', JSON.stringify(sorted));
      }

      // 7. Fetch events
      const { data: eventsData, error: eventsError } = await client.from('events').select('*') as any;
      if (!eventsError && eventsData) {
        const sorted = [...eventsData].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEvents(sorted);
        localStorage.setItem('cams_events', JSON.stringify(sorted));
      }

      // Connection is fully successful
      setSupabaseError(null);
      setIsSupabaseConnected(true);
    } catch (err: any) {
      console.error('Supabase initial fetch failed:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
        setSupabaseError(language === 'ar'
          ? 'خطأ في الشبكة: تعذر الاتصال بـ Supabase. يرجى التحقق من الرابط والاتصال بشبكة الإنترنت.'
          : 'Network Error: Cannot establish database socket connection. Please check that your Supabase project URL is correct and active.');
      } else {
        setSupabaseError(errMsg);
      }
      setIsSupabaseConnected(false);
    }
  };

  // 7. Establish Real-time Sync listeners with Supabase PostgreSQL
  useEffect(() => {
    const client = getSupabaseClient() as any;
    if (!client) {
      console.log('Supabase not configured. Operating in completely localized backup storage mode.');
      setIsSupabaseConnected(false);
      return;
    }

    // Load initial data
    fetchInitialData(client);

    // Dynamic state synchronizer listening instantly to remote database modifications
    const channel = client
      .channel('cams-supabase-pubsub')
      // Admins Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setAdmins(prev => prev.some(a => a.id === newRec.id) ? prev : [...prev, newRec as UserAccount]);
        } else if (eventType === 'UPDATE') {
          setAdmins(prev => prev.map(a => a.id === newRec.id ? (newRec as UserAccount) : a));
          if (currentUser && currentUser.id === newRec.id) {
            setCurrentUser(newRec as UserAccount);
            localStorage.setItem('cams_session', JSON.stringify(newRec));
          }
        } else if (eventType === 'DELETE') {
          setAdmins(prev => prev.filter(a => a.id !== oldRec.id));
        }
      })
      // Organizations Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setOrganizations(prev => prev.some(o => o.id === newRec.id) ? prev : [...prev, newRec as Organization]);
        } else if (eventType === 'UPDATE') {
          setOrganizations(prev => prev.map(o => o.id === newRec.id ? (newRec as Organization) : o));
        } else if (eventType === 'DELETE') {
          setOrganizations(prev => prev.filter(o => o.id !== oldRec.id));
        }
      })
      // Churches Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'churches' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setChurches(prev => prev.some(c => c.id === newRec.id) ? prev : [...prev, newRec as Church]);
        } else if (eventType === 'UPDATE') {
          setChurches(prev => prev.map(c => c.id === newRec.id ? (newRec as Church) : c));
        } else if (eventType === 'DELETE') {
          setChurches(prev => prev.filter(c => c.id !== oldRec.id));
        }
      })
      // Choirs Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choirs' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setChoirs(prev => prev.some(c => c.id === newRec.id) ? prev : [...prev, newRec as ChoirDepartment]);
        } else if (eventType === 'UPDATE') {
          setChoirs(prev => prev.map(c => c.id === newRec.id ? (newRec as ChoirDepartment) : c));
        } else if (eventType === 'DELETE') {
          setChoirs(prev => prev.filter(c => c.id !== oldRec.id));
        }
      })
      // Members Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setMembers(prev => {
            if (prev.some(m => m.id === newRec.id)) return prev;
            return [newRec as Member, ...prev].sort((a, b) => b.id.localeCompare(a.id));
          });
        } else if (eventType === 'UPDATE') {
          setMembers(prev => prev.map(m => m.id === newRec.id ? (newRec as Member) : m));
        } else if (eventType === 'DELETE') {
          setMembers(prev => prev.filter(m => m.id !== oldRec.id));
        }
      })
      // Events Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        if (eventType === 'INSERT') {
          setEvents(prev => {
            if (prev.some(e => e.id === newRec.id)) return prev;
            return [newRec as AttendanceEvent, ...prev].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          });
        } else if (eventType === 'UPDATE') {
          setEvents(prev => prev.map(e => e.id === newRec.id ? (newRec as AttendanceEvent) : e));
        } else if (eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== oldRec.id));
        }
      })
      // Settings Sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload: any) => {
        const { eventType, new: newRec } = payload;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const config = newRec as { id: string; orgName?: string; logoUrl?: string };
          if (config && config.id === 'config') {
            if (config.orgName) {
              setOrgNameState(config.orgName);
              localStorage.setItem('cams_org_name', config.orgName);
            }
            if (config.logoUrl) {
              setLogoUrlState(config.logoUrl);
              localStorage.setItem('cams_logo_url', config.logoUrl);
            }
          }
        }
      })
      .subscribe((status: string) => {
        console.log('Supabase real-time pubsub status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSupabaseConnected(true);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [syncTrigger]);

  // Keep local backups stored up to date
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
    const staleEvents = events.filter(e => !existingCodes.has(e.memberCode));
    if (staleEvents.length > 0) {
      setEvents(prev => prev.filter(e => existingCodes.has(e.memberCode)));
      const client = getSupabaseClient() as any;
      if (client) {
        const staleIds = staleEvents.map(e => e.id);
        client.from('events').delete().in('id', staleIds).catch(console.error);
      }
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

  // 8. Action: Add Member Profile
  const addMember = (data: Omit<Member, 'id' | 'memberCode' | 'joinDate'>) => {
    const id = `mem-${Date.now()}`;
    const randPattern = Math.random().toString(36).substring(2, 8).toUpperCase();
    const memberCode = `CH-${randPattern}`;

    const newMember: Member = {
      ...data,
      id,
      memberCode,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    // Optimistic Update
    setMembers(prev => [newMember, ...prev]);

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('members').insert([newMember]).catch((err: any) => {
        console.error('Error uploading new member to Supabase:', err);
      });
    }

    return newMember;
  };

  const updateMember = (updated: Member) => {
    // Optimistic Update
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('members').upsert([updated]).catch((err: any) => {
        console.error('Error updating member in Supabase:', err);
      });
    }
  };

  const deleteMembers = (ids: string[]) => {
    const codesToDelete = members.filter(m => ids.includes(m.id)).map(m => m.memberCode);
    
    // Optimistic Update
    setMembers(prev => prev.filter(m => !ids.includes(m.id)));
    setEvents(prev => prev.filter(e => !codesToDelete.includes(e.memberCode)));
    setOfflineQueue(prev => prev.filter(code => !codesToDelete.includes(code)));

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('members').delete().in('id', ids).catch((err: any) => {
        console.error('Error deleting members from Supabase:', err);
      });
      client.from('events').delete().in('memberCode', codesToDelete).catch((err: any) => {
        console.error('Error deleting associated member events from Supabase:', err);
      });
    }
  };

  const bulkImportMembers = (incomingMembers: Member[]) => {
    // Optimistic
    setMembers(prev => {
      const existingMap = new Map<string, Member>();
      prev.forEach(m => existingMap.set(m.id, m));
      incomingMembers.forEach(m => {
        existingMap.set(m.id, m);
      });
      return Array.from(existingMap.values()).sort((a,b) => b.id.localeCompare(a.id));
    });

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('members').upsert(incomingMembers).catch((err: any) => {
        console.error('Error bulk uploading members inside Supabase:', err);
      });
    }
  };

  // 9. Action: Scan QR Member Code
  const recordScan = (memberCode: string, deviceInfo = 'Web Integration') => {
    const cleanCode = memberCode.trim().toUpperCase();
    const matchedMember = members.find(m => m.memberCode === cleanCode);

    if (!matchedMember) {
      return { success: false, message: `Invalid Code: ${cleanCode} has no linked parishioner profile.` };
    }

    if (matchedMember.status === 'Inactive') {
      return { success: false, message: `Access Denied: ${matchedMember.fullName} is flagged as Inactive.` };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const alreadyScanned = events.some(e => e.memberCode === cleanCode && e.date === todayStr);
    const alreadyInQueue = offlineQueue.includes(cleanCode);

    if (alreadyScanned || alreadyInQueue) {
      return { 
        success: false, 
        message: `${matchedMember.fullName} has already registered check-in for today.`,
        duplicate: true 
      };
    }

    if (!isOnline) {
      if (!offlineQueue.includes(cleanCode)) {
        setOfflineQueue(prev => [...prev, cleanCode]);
      }
      return { 
        success: true, 
        message: `${matchedMember.fullName} QR checked. Saved in local offline queue! (${cleanCode})` 
      };
    }

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

    // Optimistic Update
    setEvents(prev => [newEvent, ...prev]);

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('events').insert([newEvent]).catch((err: any) => {
        console.error('Error saving checkin scan to Supabase:', err);
      });
    }

    return { success: true, message: `${matchedMember.fullName} attendance registered successfully!` };
  };

  // Flush of offline cached scans
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
      const client = getSupabaseClient() as any;
      if (client) {
        client.from('events').insert(newEvents).catch((err: any) => {
          console.error('Error uploading offline scan queue list to Supabase:', err);
        });
      }
    }
    setOfflineQueue([]);
  };

  const clearAllEvents = () => {
    setEvents([]);
    const client = getSupabaseClient() as any;
    if (client) {
      client.from('events').delete().neq('id', 'placeholder').catch((err: any) => {
        console.error('Error emptying events in Supabase:', err);
      });
    }
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    const client = getSupabaseClient() as any;
    if (client) {
      client.from('events').delete().eq('id', id).catch((err: any) => {
        console.error('Error removing event in Supabase:', err);
      });
    }
  };

  // 10. Super Admin account provisioning
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

    setAdmins(prev => [...prev, newAdmin]);

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('admins').insert([newAdmin]).catch((err: any) => {
        console.error('Error saving provisioned admin admin to Supabase:', err);
      });
    }
  };

  const revokeAdmin = (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    const client = getSupabaseClient() as any;
    if (client) {
      client.from('admins').delete().eq('id', id).catch((err: any) => {
        console.error('Error revoking admin account in Supabase:', err);
      });
    }
  };

  const updateAdmin = (updated: UserAccount) => {
    setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
      localStorage.setItem('cams_session', JSON.stringify(updated));
    }

    const client = getSupabaseClient() as any;
    if (client) {
      client.from('admins').upsert([updated]).catch((err: any) => {
        console.error('Error saving updated admin credentials to Supabase:', err);
      });
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
      revokeAdmin,
      supabaseUrl,
      supabaseAnonKey,
      isSupabaseConnected,
      supabaseError,
      updateSupabaseConfig
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
