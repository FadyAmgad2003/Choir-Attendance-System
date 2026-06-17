import { Organization, Church, ChoirDepartment, Member, AttendanceEvent } from './types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-stmary',
    name: 'Coptic Orthodox Archdiocese',
    logoUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb565?w=150&q=80',
    churchCount: 3,
  },
  {
    id: 'org-grace',
    name: 'Grace Community Alliance',
    logoUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=150&q=80',
    churchCount: 2,
  }
];

export const INITIAL_CHURCHES: Church[] = [
  // Org 1 Churches
  {
    id: 'ch-stmary-main',
    organizationId: 'org-stmary',
    name: 'St. Mary & St. Philopateer Church',
    location: 'District Avenue, Cairo, EG'
  },
  {
    id: 'ch-stmark-heliopolis',
    organizationId: 'org-stmary',
    name: 'St. Mark Cathedral Heliopolis',
    location: 'Heliopolis, Cairo, EG'
  },
  {
    id: 'ch-stgeorge-giza',
    organizationId: 'org-stmary',
    name: 'St. George Orthodox Church',
    location: 'Giza, Cairo, EG'
  },
  // Org 2 Churches
  {
    id: 'ch-grace-north',
    organizationId: 'org-grace',
    name: 'Grace Fellowship City North',
    location: 'Northside Avenue, Chicago, US'
  }
];

export const INITIAL_CHOIRS: ChoirDepartment[] = [
  {
    id: 'sub-stmary-choir1',
    churchId: 'ch-stmary-main',
    name: 'Melody of Angels Choir',
    description: 'Deacons & Hymn singers aged 12-18'
  },
  {
    id: 'sub-stmary-choir2',
    churchId: 'ch-stmary-main',
    name: 'St. Gregory Hymns Choir',
    description: 'Advanced Liturgical Study Group for Young Adults'
  },
  {
    id: 'sub-stmary-sunschool',
    churchId: 'ch-stmary-main',
    name: 'Sunday School - Primary Grade 4',
    description: 'Primary Grade 4 youth fellowship and service'
  },
  {
    id: 'sub-stmark-youth',
    churchId: 'ch-stmark-heliopolis',
    name: 'Youth Fellowship & Choir',
    description: 'Heliopolis Cathedral community department'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    memberCode: 'CH-2K8A3D',
    fullName: 'Fady Amgad',
    gender: 'male',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy',
    mobileNumber: '+20 120 743 8920',
    parentMobileNumber: '+20 122 839 4012',
    school: 'El Horreya Language School',
    educationStage: 'Third Stage',
    memberType: 'Existing',
    status: 'Active',
    joinDate: '2024-01-15',
    choirId: 'sub-stmary-choir1'
  },
  {
    id: 'mem-2',
    memberCode: 'CH-9K4F2A',
    fullName: 'Youssef Mina',
    gender: 'male',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie',
    mobileNumber: '+20 102 394 5566',
    parentMobileNumber: '+20 111 839 2200',
    school: 'Heliopolis Boys College',
    educationStage: 'Second Stage',
    memberType: 'New',
    status: 'Active',
    joinDate: '2026-03-10',
    choirId: 'sub-stmary-choir1'
  },
  {
    id: 'mem-3',
    memberCode: 'CH-4D8E9E',
    fullName: 'Kirolos Rafik',
    gender: 'male',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Scooter',
    mobileNumber: '+20 155 738 8200',
    parentMobileNumber: '+20 128 394 1133',
    school: 'British International School Cairo',
    educationStage: 'Second Stage',
    memberType: 'Existing',
    status: 'Active',
    joinDate: '2023-09-01',
    choirId: 'sub-stmary-choir1'
  },
  {
    id: 'mem-4',
    memberCode: 'CH-7X2W8S',
    fullName: 'Marina Nashaat',
    gender: 'female',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gizmo',
    mobileNumber: '+20 109 844 2200',
    parentMobileNumber: '+20 122 300 4499',
    school: 'Sacré Coeur Heliopolis',
    educationStage: 'Third Stage',
    memberType: 'Existing',
    status: 'Active',
    joinDate: '2024-05-12',
    choirId: 'sub-stmary-choir2'
  },
  {
    id: 'mem-5',
    memberCode: 'CH-1P3M4R',
    fullName: 'Monica Samuel',
    gender: 'female',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Trixie',
    mobileNumber: '+20 105 839 4920',
    parentMobileNumber: '+20 120 482 1100',
    school: 'Al Horreya Girls School',
    educationStage: 'First Stage',
    memberType: 'New',
    status: 'Active',
    joinDate: '2025-11-01',
    choirId: 'sub-stmary-sunschool'
  },
  {
    id: 'mem-6',
    memberCode: 'CH-8L9K2V',
    fullName: 'Michael Bassem',
    gender: 'male',
    profileImageUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Spike',
    mobileNumber: '+20 100 238 4930',
    parentMobileNumber: '+20 114 934 0022',
    school: 'St. George College Giza',
    educationStage: 'Third Stage',
    memberType: 'Existing',
    status: 'Inactive',
    joinDate: '2022-10-15',
    choirId: 'sub-stmary-choir1'
  }
];

export const INITIAL_EVENTS: AttendanceEvent[] = [
  // Activity on 2026-06-16 (Today)
  {
    id: 'evt-1',
    memberCode: 'CH-2K8A3D',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-16T10:05:00Z',
    date: '2026-06-16',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'iOS App | Safari 19',
    synced: true
  },
  {
    id: 'evt-2',
    memberCode: 'CH-9K4F2A',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-16T10:08:23Z',
    date: '2026-06-16',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'iOS App | Safari 19',
    synced: true
  },
  {
    id: 'evt-3',
    memberCode: 'CH-4D8E9E',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-16T10:12:45Z',
    date: '2026-06-16',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'iOS App | Safari 19',
    synced: true
  },
  // Activity on 2026-06-09 (Last Week)
  {
    id: 'evt-4',
    memberCode: 'CH-2K8A3D',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-09T09:58:12Z',
    date: '2026-06-09',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'Android scanner',
    synced: true
  },
  {
    id: 'evt-5',
    memberCode: 'CH-4D8E9E',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-09T10:03:00Z',
    date: '2026-06-09',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'Android scanner',
    synced: true
  },
  {
    id: 'evt-6',
    memberCode: 'CH-7X2W8S',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-09T10:10:15Z',
    date: '2026-06-09',
    choirId: 'sub-stmary-choir2',
    deviceInfo: 'Android scanner',
    synced: true
  },
  // Activity on 2026-06-02 (Two weeks ago)
  {
    id: 'evt-7',
    memberCode: 'CH-2K8A3D',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-02T10:01:44Z',
    date: '2026-06-02',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'Web Console',
    synced: true
  },
  {
    id: 'evt-8',
    memberCode: 'CH-9K4F2A',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-02T10:05:11Z',
    date: '2026-06-02',
    choirId: 'sub-stmary-choir1',
    deviceInfo: 'Web Console',
    synced: true
  },
  {
    id: 'evt-9',
    memberCode: 'CH-7X2W8S',
    adminId: 'usr-officer1',
    adminName: 'Peter Mansour',
    timestamp: '2026-06-02T10:11:59Z',
    date: '2026-06-02',
    choirId: 'sub-stmary-choir2',
    deviceInfo: 'Web Console',
    synced: true
  }
];

export const TRANSLATIONS = {
  en: {
    // Basic Navigation
    appName: 'Church Admin',
    churchAttendance: 'Church Attendance Management System',
    dashboard: 'Dashboard',
    members: 'Member Registry',
    qrScanner: 'QR Scanner',
    attendanceLogs: 'Attendance Logs',
    idCards: 'ID Card System',
    settings: 'Settings',
    superAdmin: 'Hidden System Panel',
    activeUser: 'Active Role',
    
    // Auth & Role Swapping
    loginAs: 'Role Selection Portal',
    switchedTo: 'Switched session role to',
    adminScope: 'Organization Administrator',
    officerScope: 'Attendance Field Officer',
    superScope: 'Archdiocese Controller (Super Admin)',
    logout: 'Log Out',
    changeRole: 'Impersonate / Change Account',

    // Dashboard Items
    totalMembers: 'Total Registered Members',
    activeMembers: 'Active Stand-by Members',
    inactiveMembers: 'Inactive Members',
    attendanceRate: 'Average Attendance Rate',
    scannedToday: 'Recorded Scans (Today)',
    absenceRate: 'Absent Rate',
    weeklyTrends: 'Weekly Attendance Trends',
    memberRanking: 'High Attendance Participation Leaders',
    participationByStage: 'Education Stage Demographics',
    weeklyAttendanceText: 'Unique individuals checked-in per assembly session.',
    present: 'Present',
    absent: 'Absent',
    rate: 'Success Rate',

    // Members Management
    memberDirectory: 'Church Member Directory',
    addMember: 'Enroll New Member',
    editMember: 'Modify Profile',
    searchMembers: 'Search by Code, Name, Stage or Mobile...',
    fullName: 'Full Name',
    memberCode: 'QR Member Code',
    educationStageLabel: 'Education Stage',
    schoolLabel: 'School Name',
    mobileNumberLabel: 'Primary mobile',
    parentMobileLabel: 'Parent rescue mobile',
    memberTypeLabel: 'Registration Category',
    statusLabel: 'Engagement Status',
    joinDateLabel: 'Establishment Date',
    selectChoir: 'Assign Choir / Ministry Group',
    allChoirs: 'All Departments / Assemblies',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    newReg: 'New Enrollee',
    existingReg: 'Existing Member',
    saveProfile: 'Save Profile Credentials',
    cardGenerated: 'QR code generated and embedded into printed template context.',
    batchActions: 'Batch actions',
    deleteSelected: 'Delete Selected Members',
    generateCardSelected: 'Format ID Cards (Selected)',
    generateCardAll: 'Print All Directory Cards',

    // QR Operations
    scannerHeader: 'Field Scanning Interface',
    tapToScan: 'Engage Webcam Hardware Scanner',
    simulatedScan: 'Rapid Emulate Scan (Offline/No Camera Fallback)',
    selectMemberToSimulatedScan: 'Click any registered member below to test-simulate a physical QR Card sweep:',
    recordingSuccess: 'Scan Recorded Successfully!',
    alreadyRecorded: 'Duplicate Scan Prevented! Attendance already committed for today.',
    lastScanResults: 'Instant Operational Feedback Log',
    currentTimeStamp: 'Timestamp',
    operatorId: 'Operator',
    pendingQueue: 'Offline Resilience Buffer Queue',
    syncStatus: 'Synchronization Status',
    activeConnection: 'System Connected (Cloud Ingress Normal)',
    offlineConnection: 'System Offline (Caching Scan Events Locally)',
    totalCached: 'events buffered locally, awaiting handshake',
    syncCommitNow: 'Force Intermittent Buffer Flush',

    // ID Card Generating Template
    cardPrintingSystem: 'Dynamic Diocesan ID Card Print System',
    downloadPdf: 'Generate and Download Print-ready PDF Layout',
    customCardTitle: 'Archdiocesan ID Credentials',
    permanentID: 'PERMANENT ID CARD',
    churchIssued: 'Parochial Youth Ministry Card',
    printSelectedTitle: 'Print Queue Layout Buffer',

    // Settings
    orgSettings: 'Parish Configuration Center',
    orgName: 'Organization / Diocese Name',
    currentLogo: 'Corporate Seal Graphic Upload',
    defaultLanguage: 'Default System Language',
    activeTimezone: 'Assembly Session Rules Status',
    timezoneLog: 'Time Windows Status: Event-Based Infinite Logs (No Lockouts)',
    updateSettingsBtn: 'Update Configuration',

    // Super Admin Control Room
    superPanelTitle: 'Super-Admin Strategic Command (Hidden System)',
    superPanelDesc: 'Create regional administrative hubs, manage organization endpoints, and assign master system licenses.',
    activeOrganizations: 'Active Archdioceses & Congregations',
    adminsList: 'Account Credentials Registry',
    createNewAdmin: 'Provision Administrator Account',
    adminEmail: 'Authorized E-mail Workspace',
    churchCountLabel: 'Parish House Count',
    provisionBtn: 'Deliver Operational Auth Certificate',
    deleteAdminConfirm: 'Are you sure you want to terminate this operational license?',

    // General Words
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    loading: 'Processing Secure Communication...',
    noEventsRecorded: 'No attendance records generated yet for this filter criterion.'
  },
  ar: {
    // Basic Navigation
    appName: 'نظام إدارة الكنيسة',
    churchAttendance: 'نظام إدارة حضور الكنيسة والخدمة',
    dashboard: 'لوحة التحكم والمؤشرات',
    members: 'سجل الأعضاء والخدام',
    qrScanner: 'ماسيح الرموز QR',
    attendanceLogs: 'سجلات الحضور',
    idCards: 'نظام بطاقات الهوية',
    settings: 'إعدادات النظام',
    superAdmin: 'لوحة التحكم الفائقة (مخفية)',
    activeUser: 'الدور النشط',

    // Auth & Role Swapping
    loginAs: 'بوابة اختيار الصلاحيات والتبديل',
    switchedTo: 'تم تبديل جلسة العمل لصلاحية',
    adminScope: 'مدير المؤسسة / الأيبارشية',
    officerScope: 'مسؤول الحضور الميداني',
    superScope: 'المراقب العام للأيبارشيات (سوبر أدمن)',
    logout: 'تسجيل خروج',
    changeRole: 'تبديل الحساب / تجربة الأدوار',

    // Dashboard Items
    totalMembers: 'إجمالي الأعضاء المسجلين',
    activeMembers: 'الأعضاء النشطين بالخدمة',
    inactiveMembers: 'أعضاء غير نشطين',
    attendanceRate: 'متوسط الحضور العام',
    scannedToday: 'حضور اليوم المسجل',
    absenceRate: 'نسبة الغياب',
    weeklyTrends: 'مؤشرات اتجاه الحضور الأسبوعي',
    memberRanking: 'أعلى الأعضاء التزاماً بالحضور',
    participationByStage: 'توزيع الأعضاء حسب المراحل الدراسية',
    weeklyAttendanceText: 'عدد الأفراد الفريدين الذين سجلوا حضوراً في كل اجتماع.',
    present: 'حاضر',
    absent: 'غائب',
    rate: 'نسبة النجاح',

    // Members Management
    memberDirectory: 'سجل عضوية الكنيسة العام',
    addMember: 'إضافة عضو جديد',
    editMember: 'تعديل البيانات',
    searchMembers: 'البحث بالرمز، الاسم، المرحلة أو الهاتف...',
    fullName: 'الاسم الكامل',
    memberCode: 'رمز QR الدائم للعضو',
    educationStageLabel: 'المرحلة الدراسية / السن',
    schoolLabel: 'اسم المدرسة / الكلية',
    mobileNumberLabel: 'رقم المحمول الشخصي',
    parentMobileLabel: 'رقم محمول ولي الأمر بالطوارئ',
    memberTypeLabel: 'تصنيف العضوية',
    statusLabel: 'حالة النشاط',
    joinDateLabel: 'تاريخ الانضمام للخدمة',
    selectChoir: 'تحديد الأسرة / المجموعة الصوتية',
    allChoirs: 'جميع المجموعات والأسر الكنسية',
    actions: 'الإجراءات',
    active: 'نشط',
    inactive: 'غير نشط',
    newReg: 'عضو جديد',
    existingReg: 'عضو قديم/مستمر',
    saveProfile: 'حفظ بيانات العضو',
    cardGenerated: 'تم توليد الوجيز المشفر بنجاح ودمجه داخل قالب الطباعة الموحد.',
    batchActions: 'عمليات مجمعة',
    deleteSelected: 'حذف الأعضاء المحددين نهائياً',
    generateCardSelected: 'طباعة بطاقات المحددين',
    generateCardAll: 'طباعة بطاقات السجل بأكمله',

    // QR Operations
    scannerHeader: 'واجهة المسح والتدقيق الميداني',
    tapToScan: 'بدء تشغيل كاميرا المسح',
    simulatedScan: 'محاكاة المسح السريع (في الحالات الطارئة/عدم وجود كاميرا)',
    selectMemberToSimulatedScan: 'اضغط على أي اسم عضو من السجل لمحاكاة مسح بطاقة الهوية الخاصة به تلقائياً:',
    recordingSuccess: 'تم تسجيل عملية الحضور وتأكيد الهوية بنجاح!',
    alreadyRecorded: 'حضور مسجل مسبقاً! تم منع تكرار التسجيل لنفس اليوم.',
    lastScanResults: 'مذكرة الحركات الفورية وسجل التدقيق الفوري',
    currentTimeStamp: 'التوقيت الفعلي',
    operatorId: 'المشرف',
    pendingQueue: 'ذاكرة الحفظ المؤقت المحمي (بلا إنترنت)',
    syncStatus: 'حالة مزامنة البيانات للغيمة',
    activeConnection: 'شبكة الإنترنت متصلة (مزامنة تلقائية فورية)',
    offlineConnection: 'النظام يعمل دون اتصال (يتم حفظ القراءات محلياً في الذاكرة الآمنة)',
    totalCached: 'حركات بانتظار استعادة الاتصال للمزامنة الكاملة دون فقدان بيانات',
    syncCommitNow: 'بدء تصدير البيانات المخزنة يدوياً الآن',

    // ID Card Generating Template
    cardPrintingSystem: 'منظومة تصميم وطباعة بطاقات الهوية الكنسية الرقمية',
    downloadPdf: 'تصدير وتحميل بطاقات الهوية بصيغة PDF قابلة للطباعة فورياً',
    customCardTitle: 'بطاقة إثبات العضوية والخدمة الكنسية',
    permanentID: 'بطاقة هوية خدمة دائمة',
    churchIssued: 'كنيسة وقاعة الخدمة الكنسية للشباب',
    printSelectedTitle: 'مستودع عرض وتدقيق البطاقات قبل الطباعة',

    // Settings
    orgSettings: 'إعدادات إدارة الكنيسة والأيبارشية',
    orgName: 'اسم الكنيسة / الأيبارشية الكبرى',
    currentLogo: 'شعار الكلمة أو الختم البطريركي المعتمد',
    defaultLanguage: 'لغة النظام الافتراضية للواجهات',
    activeTimezone: 'قواعد نافذة الحضور والاجتماعات للمسرح',
    timezoneLog: 'فترات الحضور: مستند إلى الأحداث المفتوحة وغير المقيد بنافذة زمنية مغلقة لمنع الإخفاق.',
    updateSettingsBtn: 'حفظ وحقن التعديلات للإدارة',

    // Super Admin Control Room
    superPanelTitle: 'منظومة الرقابة الإستراتيجية العليا (لوحة السوبر أدمن المخفية)',
    superPanelDesc: 'تأسيس قطاعات خدمية جديدة، منح وتوثيق تراخيص الإيبارشيات، وإدارة صلاحيات المشرفين المسؤولين.',
    activeOrganizations: 'الأيبارشية والقطاعات الكنسية المعتمدة',
    adminsList: 'سجل تراخيص المشرفين والحسابات الإدارية المعتمدة',
    createNewAdmin: 'ترخيص حساب إداري كنسي جديد',
    adminEmail: 'البريد الإلكتروني المعتمد للمشرف الميداني',
    churchCountLabel: 'عدد دور الخدمة والكنائس المدرجة',
    provisionBtn: 'توليد ومنح ترخيص صلاحية مشرف معتمد',
    deleteAdminConfirm: 'هل أنت متأكد تماماً من إنهاء ترخيص صلاحية المشرف هذا؟',

    // General Words
    cancel: 'إلغاء الأمر',
    save: 'حفظ التعديلات',
    edit: 'تعديل',
    loading: 'تحميل وقنوات الاتصال الآمن جارية...',
    noEventsRecorded: 'لا توجد حركات حضور مسجلة تطابق محددات البحث الحالية.'
  }
};
export type AppLanguage = 'en' | 'ar';
