import React, { useState } from 'react';
import { useApp } from './AppContext';
import { ShieldCheck, UserPlus, Trash2, Building, AlertTriangle, Key, Mail, User, ShieldAlert, BookOpen } from 'lucide-react';
import { UserRole, UserAccount } from '../types';

export const SuperAdmin: React.FC = () => {
  const { 
    admins, 
    provisionAdmin, 
    revokeAdmin, 
    updateAdmin,
    organizations, 
    currentUser, 
    t, 
    language,
    choirs,
    members,
    churches
  } = useApp();

  // Guard: Ensure user possesses Super Admin identity
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto" id="unauthorized-card">
        <div className="mx-auto h-16 w-16 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center shadow-inner">
          <ShieldAlert className="h-8 w-8 text-rose-600 animate-pulse" />
        </div>
        <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">
          {language === 'ar' ? 'غير مسموح بالدخول: صلاحية غير كافية' : 'Access Denied: High-level Clearance Required'}
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          {language === 'ar' 
            ? 'تخضع صلاحيات المشرف العام لقوانين الحماية الثلاثية. يتم فتح لوحة التحكم بعد تسجيل هويتك البطريركية المشفرة بنجاح.'
            : 'Archdiocese Controller access is strictly isolated. Regular parish accounts cannot view or query endpoints configured in this sector.'}
        </p>
      </div>
    );
  }

  // Provisioning Form Fields States
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [statusMsg, setStatusMsg] = useState('');

  // Inline Admin Editing States
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editOrgId, setEditOrgId] = useState('');

  // Custom modal state for safe iframe deletion confirmation
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; name: string } | null>(null);

  // Choir search state
  const [choirSearch, setChoirSearch] = useState('');
  const [expandedChoirId, setExpandedChoirId] = useState<string | null>(null);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    // Check if account already exists
    const duplicate = admins.some(a => a.email.toLowerCase() === newEmail.trim().toLowerCase());
    if (duplicate) {
      setStatusMsg(language === 'ar' ? 'خطأ: هذا الحساب مرخص بالفعل في قواعد البيانات.' : 'Error: This email already holds active diocese credentials.');
      return;
    }

    // Default orgId to first organization or 'org-stmary'
    const defaultOrgId = organizations[0]?.id || 'org-stmary';

    provisionAdmin(newEmail.trim(), newName.trim(), newRole, defaultOrgId, newPassword.trim() || 'admin');
    
    // Clear inputs & success
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    setStatusMsg(language === 'ar' ? 'تم ترخيص ومنح صلاحية المشرف الجديد بنجاح!' : 'Successfully delivered admin credentials to regional workspace!');
    
    setTimeout(() => {
      setStatusMsg('');
    }, 4500);
  };

  const handleRevokeAccount = (id: string, name: string) => {
    setAdminToDelete({ id, name });
  };

  const handleStartEdit = (admin: UserAccount) => {
    setEditingAdminId(admin.id);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditPassword(admin.password || 'admin');
    setEditRole(admin.role);
    setEditOrgId(admin.organizationId || 'org-stmary');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId || !editName.trim() || !editEmail.trim()) return;

    const original = admins.find(a => a.id === editingAdminId);
    if (!original) return;

    updateAdmin({
      ...original,
      name: editName.trim(),
      email: editEmail.trim(),
      password: editPassword.trim(),
      role: editRole,
      organizationId: editRole !== 'super_admin' ? editOrgId : undefined
    });

    setEditingAdminId(null);
  };

  return (
    <div className="space-y-6" id="super-admin-command-view">
      {/* Upper Navigation Row with Security Crest */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-700 animate-pulse" />
            {t.superPanelTitle}
          </h1>
          <p className="text-sm text-slate-550 mt-1">
            {t.superPanelDesc}
          </p>
        </div>

        {/* Security Badge Indicator - Theme Responsive Background */}
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-slate-700/60 rounded-xl px-5 py-2 text-indigo-700 dark:text-indigo-300 shadow shadow-indigo-950/5 dark:shadow-indigo-950/20">
          <Key className="h-4 w-4 text-amber-500 rotate-45 shrink-0" />
          <span className="text-[10px] font-mono tracking-wider font-bold uppercase">SECURE KEY-ROLL: LEVEL_3_ADMIN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Panel: Provisioning Admin Licenses */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1">
              <UserPlus className="h-4 w-4 text-indigo-500" />
              {t.createNewAdmin}
            </h3>

            {statusMsg && (
              <div id="super-form-alert" className={`p-3 rounded-xl border text-center text-xs font-bold mb-4 ${statusMsg.startsWith('Error') ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                {statusMsg}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">{language === 'ar' ? 'الاسم الثلاثي للمشرف:' : 'Authorized Personnel Name:'}</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Peter George"
                    className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-4 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">{t.adminEmail}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. fadyamgd126@gmail.com"
                    className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-4 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">{language === 'ar' ? 'كلمة المرور (دخول آمن):' : 'Secure Login Password:'}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. admin123"
                    className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-4 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assignment Role Choice */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">{language === 'ar' ? 'الصلاحيات المعتمدة للملف الحركي:' : 'Workspace Level clearance:'}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="admin">{t.adminScope}</option>
                  <option value="officer">{t.officerScope}</option>
                  <option value="super_admin">{t.superScope}</option>
                </select>
              </div>

              {/* Note: "Link Parish Archdiocese Territory" section has been removed from here as requested */}

              {/* Warn terms */}
              <div className="p-3 bg-amber-50/50 border border-amber-100/30 rounded-lg text-[10px] text-amber-800 leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {language === 'ar' 
                    ? 'تحذير: إنشاء حساب مشرف عالي المستوى يمنح حق التحكم الكامل بحركات أرشفة وبيانات الحضور الميدانية.' 
                    : 'Delivering credentials triggers automated cryptographic certificates. Act with caution.'}
                </span>
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow transition-all"
              >
                {t.provisionBtn}
              </button>
            </form>
          </div>
        </div>

        {/* Middle and Right: Active Licenses and Organizations controller */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Admins list Table */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              {language === 'ar' ? 'سجل هويات المستخدمين النشطين وتعديل الصلاحيات' : 'Account Credentials Registry'}
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="py-2.5 px-3">{language === 'ar' ? 'البريد الإلكتروني والنطاق' : 'Email / Domain'}</th>
                    <th className="py-2.5 px-3">{language === 'ar' ? 'كلمة المرور' : 'Password'}</th>
                    <th className="py-2.5 px-3">{language === 'ar' ? 'الصلاحيات' : 'Role'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'خيارات التحكم' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {admins.map(a => {
                    const matchedOrg = organizations.find(o => o.id === a.organizationId);
                    const isEditing = editingAdminId === a.id;

                    if (isEditing) {
                      return (
                        <tr key={a.id} className="bg-indigo-50/20" id={`edit-row-${a.id}`}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono focus:border-indigo-500 focus:outline-none bg-white"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                            >
                              <option value="admin">{t.adminScope}</option>
                              <option value="officer">{t.officerScope}</option>
                              <option value="super_admin">{t.superScope}</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center space-x-1 whitespace-nowrap">
                            <button
                              onClick={handleSaveEdit}
                              className="cursor-pointer inline-block text-[10px] font-bold px-2 py-1 bg-emerald-650 hover:bg-emerald-700 text-white rounded shadow transition-colors"
                              style={{ backgroundColor: '#10b981' }}
                            >
                              {language === 'ar' ? 'حفظ' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingAdminId(null)}
                              className="cursor-pointer inline-block text-[10px] font-bold px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded shadow transition-colors"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 leading-none">{a.name}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-gray-500 font-mono text-[11px]">{a.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">{a.password || 'admin'}</code>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${a.role === 'super_admin' ? 'bg-indigo-900 border border-indigo-950 text-white' : (a.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800')}`}>
                            {a.role === 'super_admin' ? 'SUPER' : (a.role === 'admin' ? 'ADMIN' : 'OFFICER')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit(a)}
                            className="cursor-pointer inline-block text-[10px] uppercase font-bold text-indigo-650 hover:text-indigo-800 border border-indigo-200 rounded px-2.5 py-1 bg-white hover:bg-indigo-50 shadow-sm mr-1 transition-all"
                          >
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleRevokeAccount(a.id, a.name)}
                            disabled={currentUser.id === a.id}
                            className={`cursor-pointer p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-600 rounded-lg transition-colors inline-block ${currentUser.id === a.id ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title={currentUser.id === a.id ? 'Cannot revoke self session' : 'Revoke credentials'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Archdioceses / Organizations List */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <Building className="h-4 w-4 text-indigo-500" />
              {t.activeOrganizations}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organizations.map(o => (
                <div key={o.id} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 bg-slate-50/50 flex items-center gap-3">
                  <img
                    src={o.logoUrl}
                    alt={o.name}
                    className="h-10 w-10 rounded-lg object-cover border border-gray-250 shrink-0 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">{o.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.churchCountLabel}: <strong className="text-indigo-600">{o.churchCount}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Choir Data Registry for reading all choir information across modules */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mt-6" id="super-choir-audit-registry">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              {language === 'ar' ? 'سجل المجموعات الصوتية والكورالات في النظام' : 'Global Choir & Assembly Registries'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {language === 'ar' ? 'عرض الكورالات والفرق وبيانات المنضمين النشطين عبر كافة الكنائس والمستويات' : 'Read, monitor, and audit the structure of choir groups active across all church branches.'}
            </p>
          </div>

          {/* Choir search bar input */}
          <div className="relative">
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث عن خدمة أو كورال...' : 'Filter choir registries...'}
              value={choirSearch}
              onChange={(e) => setChoirSearch(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none w-full sm:w-64 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {choirs
            .filter(choir => 
              choir.name.toLowerCase().includes(choirSearch.toLowerCase()) || 
              choir.description.toLowerCase().includes(choirSearch.toLowerCase())
            )
            .map(choir => {
              const linkedChurch = churches.find(c => c.id === choir.churchId);
              const linkedOrg = linkedChurch ? organizations.find(o => o.id === linkedChurch.organizationId) : null;
              const choirMembers = members.filter(m => m.choirId === choir.id);
              const activeCount = choirMembers.filter(m => m.status === 'Active').length;
              const inactiveCount = choirMembers.length - activeCount;

              const maleCount = choirMembers.filter(m => m.gender === 'male').length;
              const femaleCount = choirMembers.filter(m => m.gender === 'female').length;

              const isExpanded = expandedChoirId === choir.id;

              return (
                <div key={choir.id} className="p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 bg-slate-50/10 hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full transition-transform group-hover:scale-110 duration-300" />
                  
                  <div>
                    <span className="inline-block text-[9px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                      {linkedOrg ? linkedOrg.name : 'Central Archdiocese'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 leading-snug">{choir.name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{linkedChurch?.name || 'Diocesan Main Hall'}</p>
                    
                    <p className="text-xs text-gray-500 mt-2.5 leading-relaxed italic">
                      "{choir.description}"
                    </p>
                  </div>

                  {/* Choir Statistics - Human read data */}
                  <div className="pt-3.5 border-t border-gray-100/80 grid grid-cols-2 gap-3 text-[10px]">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150/60 shadow-inner">
                      <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{language === 'ar' ? 'الأعضاء النشطين' : 'Active Members'}</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5 leading-none">
                        {activeCount} <span className="text-[9px] font-normal text-gray-400">/{choirMembers.length} total</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150/60 shadow-inner">
                      <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{language === 'ar' ? 'توزيع الجنسين' : 'Gender Split'}</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5 leading-none">
                        {maleCount}M <span className="text-gray-400">/</span> {femaleCount}F
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100/80">
                    <button
                      type="button"
                      onClick={() => setExpandedChoirId(isExpanded ? null : choir.id)}
                      className="cursor-pointer w-full text-center text-[10px] font-bold py-1.5 px-3 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      {isExpanded 
                        ? (language === 'ar' ? 'إغلاق سجل الأعضاء ▲' : 'Close Member Roster ▲')
                        : (language === 'ar' ? 'عرض سجل الأعضاء في الكورال ▼' : 'View Member Roster ▼')
                      }
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 text-[10px] space-y-2 border-t border-gray-100 max-h-52 overflow-y-auto w-full">
                      <p className="font-bold text-gray-500 uppercase tracking-wider text-[9px]">
                        {language === 'ar' ? 'الأعضاء المسجلين في هذا الكورال:' : 'Enrolled Members List:'}
                      </p>
                      {choirMembers.length === 0 ? (
                        <p className="text-gray-400 italic font-medium">
                          {language === 'ar' ? 'لا يوجد أعضاء مشتركون حالياً.' : 'No members currently enrolled.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {choirMembers.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={m.profileImageUrl} 
                                  alt="" 
                                  className="h-6 w-6 rounded-full object-cover border border-gray-250" 
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="font-bold text-slate-800">{m.fullName}</p>
                                  <p className="text-[8px] font-mono text-gray-400">{m.memberCode} | {m.educationStage}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {m.status === 'Active' ? 'Active' : 'Inactive'}
                                </span>
                                <p className="text-[8px] text-gray-500 mt-0.5 font-sans">{m.mobileNumber || 'No Phone'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}

          {choirs.filter(choir => 
            choir.name.toLowerCase().includes(choirSearch.toLowerCase()) || 
            choir.description.toLowerCase().includes(choirSearch.toLowerCase())
          ).length === 0 && (
            <div className="col-span-1 lg:col-span-3 text-center py-8 text-gray-400 text-xs font-semibold">
              {language === 'ar' ? 'لا توجد نتائج بحث مطابقة للكورالات.' : 'No registered choirs or hymn groups matches your search criteria.'}
            </div>
          )}
        </div>
      </div>

      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-150 shadow-xl space-y-4">
            <div className="h-12 w-12 bg-red-50 border border-red-200 text-red-650 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 leading-none">
                {language === 'ar' ? 'تأكيد إلغاء تصريح الحساب' : 'Confirm Revoking Credentials'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ar' ? (
                  <>هل أنت متأكد تمامًا بحذف تصريح المشرف <strong>"{adminToDelete.name}"</strong> نهائياً من قاعدة بيانات الأيبارشية؟</>
                ) : (
                  <>Are you absolutely sure you want to permanently revoke credentials for <strong>"{adminToDelete.name}"</strong>? This supervisor session will be dismantled immediately.</>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="cursor-pointer px-4.5 py-2 border border-gray-250 bg-white text-gray-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeAdmin(adminToDelete.id);
                  setAdminToDelete(null);
                }}
                className="cursor-pointer px-4.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
              >
                {language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
