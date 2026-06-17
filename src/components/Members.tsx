import React, { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { Member } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Archive, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Printer, 
  ChevronDown, 
  Check, 
  UserPlus, 
  FileDown, 
  Upload, 
  AlertTriangle, 
  Info, 
  X, 
  HelpCircle 
} from 'lucide-react';

export interface ParsedImportRow {
  index: number;
  id: string;
  memberCode: string;
  fullName: string;
  gender: 'male' | 'female';
  profileImageUrl: string;
  mobileNumber: string;
  parentMobileNumber: string;
  school: string;
  educationStage: string;
  memberType: 'New' | 'Existing';
  status: 'Active' | 'Inactive';
  joinDate: string;
  choirId: string;
  notes: string;
  
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateType?: 'code' | 'name_phone';
  existingMember?: Member;
}

export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r' || char === '\n') {
        row.push(currentVal.trim());
        currentVal = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      lines.push(row);
    }
  }

  return lines;
}

export const mapHeadersToKeys = (headers: string[]): { [index: number]: keyof Member | null } => {
  const mapping: { [index: number]: keyof Member | null } = {};
  
  headers.forEach((header, index) => {
    const clean = header.trim().toLowerCase();
    
    if (clean === 'id' || clean === 'المعرف') {
      mapping[index] = 'id';
    } else if (clean === 'membercode' || clean === 'member code' || clean === 'code' || clean === 'كود العضو' || clean === 'كود') {
      mapping[index] = 'memberCode';
    } else if (clean === 'fullname' || clean === 'full name' || clean === 'name' || clean === 'الاسم الكامل' || clean === 'الاسم') {
      mapping[index] = 'fullName';
    } else if (clean === 'gender' || clean === 'الجنس' || clean === 'النوع') {
      mapping[index] = 'gender';
    } else if (clean === 'profileimageurl' || clean === 'profile image url' || clean === 'profile' || clean === 'image' || clean === 'صورة' || clean === 'رابط الصورة') {
      mapping[index] = 'profileImageUrl';
    } else if (clean === 'mobilenumber' || clean === 'mobile number' || clean === 'phone' || clean === 'mobile' || clean === 'رقم الهاتف' || clean === 'الهاتف') {
      mapping[index] = 'mobileNumber';
    } else if (clean === 'parentmobilenumber' || clean === 'parent mobile' || clean === 'parent phone' || clean === 'parent mobile number' || clean === 'رقم هاتف الولي' || clean === 'ولي الأمر') {
      mapping[index] = 'parentMobileNumber';
    } else if (clean === 'school' || clean === 'المدرسة') {
      mapping[index] = 'school';
    } else if (clean === 'educationstage' || clean === 'education stage' || clean === 'stage' || clean === 'المرحلة الكنسية' || clean === 'المرحلة الدراسية' || clean === 'المرحلة') {
      mapping[index] = 'educationStage';
    } else if (clean === 'membertype' || clean === 'member type' || clean === 'نوع العضو' || clean === 'نوع العضوية') {
      mapping[index] = 'memberType';
    } else if (clean === 'status' || clean === 'الحالة') {
      mapping[index] = 'status';
    } else if (clean === 'joindate' || clean === 'join date' || clean === 'تاريخ الانضمام' || clean === 'التاريخ') {
      mapping[index] = 'joinDate';
    } else if (clean === 'choirid' || clean === 'choir id' || clean === 'choir' || clean === 'department' || clean === 'معرف المجموعة' || clean === 'الخدمة') {
      mapping[index] = 'choirId';
    } else if (clean === 'notes' || clean === 'الملاحظات' || clean === 'ملاحظات') {
      mapping[index] = 'notes';
    } else {
      mapping[index] = null;
    }
  });
  
  return mapping;
};

export const formatStageName = (stage: string, lang: 'en' | 'ar') => {
  if (stage === 'First Stage') return lang === 'ar' ? 'المرحلة الأولى' : 'First Stage';
  if (stage === 'Second Stage') return lang === 'ar' ? 'المرحلة الثانية' : 'Second Stage';
  if (stage === 'Third Stage') return lang === 'ar' ? 'المرحلة الثالثة' : 'Third Stage';
  return stage;
};

interface MembersProps {
  onGoToCards: (selectedCodes: string[]) => void;
}

export const Members: React.FC<MembersProps> = ({ onGoToCards }) => {
  const { members, choirs, addMember, updateMember, deleteMembers, bulkImportMembers, t, language, logoUrl } = useApp();

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'overwrite' | 'keep_both'>('overwrite');
  const [parsedImportRows, setParsedImportRows] = useState<ParsedImportRow[]>([]);
  const [importedCounts, setImportedCounts] = useState({ success: 0, updated: 0, skipped: 0 });

  // Selected state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CSV helper actions
  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    readAndProcessCSV(file);
  };

  const readAndProcessCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError(language === 'ar' ? 'الملف فارغ أو غير صالح.' : 'The selected CSV file appears to be empty or invalid.');
        return;
      }
      processCSVContent(text);
    };
    reader.onerror = () => {
      setImportError(language === 'ar' ? 'حدث خطأ أثناء تحميل الملف.' : 'An error occurred while reading the file.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const processCSVContent = (content: string) => {
    try {
      const rows = parseCSV(content);
      if (rows.length < 2) {
        setImportError(language === 'ar' ? 'يجب أن يحتوي ملف CSV على صف ترويسة رئيسي وبيانات.' : 'The CSV file must contain a header row and at least one member row.');
        return;
      }
      
      const headers = rows[0];
      const mapping = mapHeadersToKeys(headers);
      
      // Verify name mapping is matched
      const indexMap = Object.entries(mapping);
      const fullNameMapped = indexMap.some(([_, key]) => key === 'fullName');
      
      if (!fullNameMapped) {
        setImportError(language === 'ar' ? 
          'لم نتمكن من العثور على عمود الاسم الكامل (fullName) في ملف CSV. يرجى التحقق من عناوين الأعمدة.' : 
          'Could not find a match for the "fullName" column. Please check that your CSV has correct column headers.');
        return;
      }
      
      const parsedRows: ParsedImportRow[] = [];
      const currentUTC = new Date().toISOString().split('T')[0];
      
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (rowData.length === 0 || (rowData.length === 1 && rowData[0] === '')) {
          continue; // Skip empty rows
        }
        
        let rowId = '';
        let rowMemberCode = '';
        let rowFullName = '';
        let rowGender = '';
        let rowProfileImageUrl = '';
        let rowMobileNumber = '';
        let rowParentMobileNumber = '';
        let rowSchool = '';
        let rowEducationStage = '';
        let rowMemberType = '';
        let rowStatus = '';
        let rowJoinDate = '';
        let rowChoirId = '';
        let rowNotes = '';
        
        rowData.forEach((val, colIdx) => {
          const key = mapping[colIdx];
          if (!key) return;
          const cleanVal = val ? val.trim() : '';
          
          if (key === 'id') rowId = cleanVal;
          else if (key === 'memberCode') rowMemberCode = cleanVal;
          else if (key === 'fullName') rowFullName = cleanVal;
          else if (key === 'gender') rowGender = cleanVal;
          else if (key === 'profileImageUrl') rowProfileImageUrl = cleanVal;
          else if (key === 'mobileNumber') rowMobileNumber = cleanVal;
          else if (key === 'parentMobileNumber') rowParentMobileNumber = cleanVal;
          else if (key === 'school') rowSchool = cleanVal;
          else if (key === 'educationStage') rowEducationStage = cleanVal;
          else if (key === 'memberType') rowMemberType = cleanVal;
          else if (key === 'status') rowStatus = cleanVal;
          else if (key === 'joinDate') rowJoinDate = cleanVal;
          else if (key === 'choirId') rowChoirId = cleanVal;
          else if (key === 'notes') rowNotes = cleanVal;
        });
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!rowFullName) {
          errors.push(language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full Name is required');
        } else if (rowFullName.length < 3) {
          warnings.push(language === 'ar' ? 'الاسم الكامل قصير جداً' : 'Full Name is relatively short');
        }
        
        let validatedGender: 'male' | 'female' = 'male';
        const cleanGender = rowGender.toLowerCase();
        if (cleanGender === 'female' || cleanGender === 'f' || cleanGender === 'girl' || cleanGender === 'أنثى' || cleanGender === 'بنت') {
          validatedGender = 'female';
        } else if (cleanGender === 'male' || cleanGender === 'm' || cleanGender === 'boy' || cleanGender === 'ذكر' || cleanGender === 'ولد') {
          validatedGender = 'male';
        } else {
          validatedGender = 'male';
          if (rowGender) {
            warnings.push(language === 'ar' ? `الجنس غير واضح ("${rowGender}"): تم تعيين "ذكر"` : `Unrecognized gender ("${rowGender}"): defaulted to Male`);
          } else {
            warnings.push(language === 'ar' ? 'الجنس غير محدد: تم تعيين "ذكر" تلقائياً' : 'Gender not specified: defaulted to Male');
          }
        }
        
        let validatedStage = 'First Stage';
        const cleanStage = rowEducationStage.toLowerCase();
        if (cleanStage.includes('first') || cleanStage.includes('أولى') || cleanStage.includes('اولى') || cleanStage.includes('المرحلة الاولى') || cleanStage.includes('المرحلة الأولى') || cleanStage === '1' || cleanStage.includes('grade 1')) {
          validatedStage = 'First Stage';
        } else if (cleanStage.includes('second') || cleanStage.includes('ثانية') || cleanStage.includes('ثانيه') || cleanStage.includes('المرحلة الثانية') || cleanStage === '2' || cleanStage.includes('grade 2')) {
          validatedStage = 'Second Stage';
        } else if (cleanStage.includes('third') || cleanStage.includes('ثالثة') || cleanStage.includes('ثالثه') || cleanStage.includes('المرحلة الثالثة') || cleanStage === '3' || cleanStage.includes('grade 3')) {
          validatedStage = 'Third Stage';
        } else {
          validatedStage = 'First Stage';
          if (rowEducationStage) {
            warnings.push(language === 'ar' ? `المرحلة غير مطابقة ("${rowEducationStage}"): تم تعيين "المرحلة الأولى"` : `Non-matching education stage ("${rowEducationStage}"): defaulted to First Stage`);
          } else {
            warnings.push(language === 'ar' ? 'المرحلة الدراسية غير محددة: تم تعيين "المرحلة الأولى"' : 'Education Stage not specified: defaulted to First Stage');
          }
        }
        
        if (!rowMobileNumber && !rowParentMobileNumber) {
          warnings.push(language === 'ar' ? 'لا يوجد أرقام تواصل مسجلة للعضو.' : 'No contact numbers provided.');
        }
        
        let validatedType: 'New' | 'Existing' = 'Existing';
        const cleanType = rowMemberType.toLowerCase();
        if (cleanType.includes('new') || cleanType.includes('جديد')) {
          validatedType = 'New';
        }
        
        let validatedStatus: 'Active' | 'Inactive' = 'Active';
        const cleanStatus = rowStatus.toLowerCase();
        if (cleanStatus.includes('inc') || cleanStatus.includes('inact') || cleanStatus.includes('خامل') || cleanStatus.includes('غير نشط') || cleanStatus.includes('غير فعال')) {
          validatedStatus = 'Inactive';
        }
        
        let validatedJoinDate = rowJoinDate;
        if (!rowJoinDate || !/^\d{4}-\d{2}-\d{2}$/.test(rowJoinDate)) {
          validatedJoinDate = currentUTC;
          if (rowJoinDate) {
            warnings.push(language === 'ar' ? `تاريخ الانضمام غير صالح ("${rowJoinDate}"): تم تعيينه إلى اليوم` : `Invalid join date format ("${rowJoinDate}"): defaulted to today`);
          }
        }
        
        let validatedChoirId = rowChoirId;
        const existsChoir = choirs.some(c => c.id === rowChoirId);
        if (!rowChoirId || !existsChoir) {
          const mappedChoir = choirs.find(c => c.name.toLowerCase() === rowChoirId.toLowerCase());
          if (mappedChoir) {
            validatedChoirId = mappedChoir.id;
          } else {
            validatedChoirId = choirs[0]?.id || '';
            if (rowChoirId) {
              warnings.push(language === 'ar' ? `المجموعة الكنسية "${rowChoirId}" غير موجودة: تم تعيين المجموعة الافتراضية` : `Group/Choir "${rowChoirId}" does not exist: assigned to default group`);
            } else {
              warnings.push(language === 'ar' ? 'المجموعة الكنسية غير محددة: تم تعيين المجموعة الافتراضية' : 'Group/Choir not specified: assigned to default group');
            }
          }
        }
        
        let validatedProfileImage = rowProfileImageUrl;
        if (!rowProfileImageUrl) {
          validatedProfileImage = `https://api.dicebear.com/7.x/adventurer/svg?seed=ImportedMember-${i}-${Date.now()}`;
        }
        
        let validatedCode = rowMemberCode.trim().toUpperCase();
        if (!validatedCode) {
          const randPattern = Math.random().toString(36).substring(2, 8).toUpperCase();
          validatedCode = `CH-${randPattern}`;
          warnings.push(language === 'ar' ? 'كود العضو فارغ: تم إصدار كود جديد تلقائياً' : 'Member Code empty: auto-generated new code');
        }
        
        const collisionInCsvIdx = parsedRows.findIndex(r => r.memberCode === validatedCode);
        if (collisionInCsvIdx !== -1) {
          const randPattern = Math.random().toString(36).substring(2, 8).toUpperCase();
          validatedCode = `CH-${randPattern}`;
          warnings.push(language === 'ar' ? `تم رصد كود مكرر في الملف: تم توليد كود بديل "${validatedCode}" لتفادي التصادم` : `Duplicate code detected in CSV: issued alternate code "${validatedCode}" to prevent collision`);
        }
        
        let validatedId = rowId.trim();
        if (!validatedId) {
          validatedId = `mem-imported-${Date.now()}-${i}`;
        }
        
        let isDuplicate = false;
        let duplicateType: 'code' | 'name_phone' | undefined;
        let existingMember: Member | undefined;
        
        const dupByCode = members.find(m => m.memberCode === validatedCode);
        if (dupByCode) {
          isDuplicate = true;
          duplicateType = 'code';
          existingMember = dupByCode;
        } else {
          if (rowFullName && (rowMobileNumber || rowParentMobileNumber)) {
            const dupByNamePhone = members.find(m => 
              m.fullName.toLowerCase() === rowFullName.toLowerCase() && 
              ((rowMobileNumber && m.mobileNumber === rowMobileNumber) || 
               (rowParentMobileNumber && m.parentMobileNumber === rowParentMobileNumber))
            );
            if (dupByNamePhone) {
              isDuplicate = true;
              duplicateType = 'name_phone';
              existingMember = dupByNamePhone;
            }
          }
        }
        
        parsedRows.push({
          index: i,
          id: validatedId,
          memberCode: validatedCode,
          fullName: rowFullName,
          gender: validatedGender,
          profileImageUrl: validatedProfileImage,
          mobileNumber: rowMobileNumber,
          parentMobileNumber: rowParentMobileNumber,
          school: rowSchool,
          educationStage: validatedStage,
          memberType: validatedType,
          status: validatedStatus,
          joinDate: validatedJoinDate,
          choirId: validatedChoirId,
          notes: rowNotes,
          
          errors,
          warnings,
          isDuplicate,
          duplicateType,
          existingMember
        });
      }
      
      setParsedImportRows(parsedRows);
      setImportStep('preview');
      setImportError(null);
    } catch (err: any) {
      setImportError(language === 'ar' ? `فشل تحليل ملف CSV: ${err.message}` : `Failed to parse CSV: ${err.message}`);
    }
  };

  const handleFinalizeImport = () => {
    const importToSave: Member[] = [];
    let successCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    parsedImportRows.forEach(row => {
      if (row.errors.length > 0) {
        skippedCount++;
        return;
      }
      
      if (row.isDuplicate && row.existingMember) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
        } else if (duplicateStrategy === 'overwrite') {
          const updated: Member = {
            id: row.existingMember.id,
            memberCode: row.existingMember.memberCode,
            fullName: row.fullName || row.existingMember.fullName,
            gender: row.gender,
            profileImageUrl: row.profileImageUrl || row.existingMember.profileImageUrl,
            mobileNumber: row.mobileNumber || row.existingMember.mobileNumber,
            parentMobileNumber: row.parentMobileNumber || row.existingMember.parentMobileNumber,
            school: row.school || row.existingMember.school,
            educationStage: row.educationStage || row.existingMember.educationStage,
            memberType: row.memberType || row.existingMember.memberType,
            status: row.status || row.existingMember.status,
            joinDate: row.joinDate || row.existingMember.joinDate,
            choirId: row.choirId || row.existingMember.choirId,
            notes: row.notes || row.existingMember.notes
          };
          importToSave.push(updated);
          updatedCount++;
        } else if (duplicateStrategy === 'keep_both') {
          const randPattern = Math.random().toString(36).substring(2, 8).toUpperCase();
          const freshCode = `CH-${randPattern}`;
          const brandNew: Member = {
            id: `mem-imported-${Date.now()}-${row.index}`,
            memberCode: freshCode,
            fullName: row.fullName,
            gender: row.gender,
            profileImageUrl: row.profileImageUrl,
            mobileNumber: row.mobileNumber,
            parentMobileNumber: row.parentMobileNumber,
            school: row.school,
            educationStage: row.educationStage,
            memberType: row.memberType,
            status: row.status,
            joinDate: row.joinDate,
            choirId: row.choirId,
            notes: row.notes
          };
          importToSave.push(brandNew);
          successCount++;
        }
      } else {
        const brandNew: Member = {
          id: row.id,
          memberCode: row.memberCode,
          fullName: row.fullName,
          gender: row.gender,
          profileImageUrl: row.profileImageUrl,
          mobileNumber: row.mobileNumber,
          parentMobileNumber: row.parentMobileNumber,
          school: row.school,
          educationStage: row.educationStage,
          memberType: row.memberType,
          status: row.status,
          joinDate: row.joinDate,
          choirId: row.choirId,
          notes: row.notes
        };
        importToSave.push(brandNew);
        successCount++;
      }
    });
    
    bulkImportMembers(importToSave);
    
    setImportedCounts({
      success: successCount,
      updated: updatedCount,
      skipped: skippedCount
    });
    setImportStep('success');
  };

  const downloadSampleTemplate = () => {
    const headers = [
      'id',
      'memberCode',
      'fullName',
      'gender',
      'profileImageUrl',
      'mobileNumber',
      'parentMobileNumber',
      'school',
      'educationStage',
      'memberType',
      'status',
      'joinDate',
      'choirId',
      'notes'
    ];
    
    const sampleRows = [
      ['', '', 'Abanoub Habib', 'male', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sample1', '+20 120 111 2222', '+20 100 333 4444', 'St. Mary College', 'Second Stage', 'New', 'Active', '2026-06-16', 'sub-stmary-choir1', 'Sunday class leader'],
      ['', '', 'Monica Adel', 'female', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sample2', '+20 115 555 6666', '+20 122 777 8888', 'Heliopolis School for Girls', 'Third Stage', 'Existing', 'Active', '2025-01-10', 'sub-stmary-choir2', 'Serves choir melody study']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'church_attendance_member_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Deletion Custom Dialog states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [isBulkDelete, setIsBulkDelete] = useState<boolean>(false);
  
  // Search and filter options
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChoir, setFilterChoir] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Modal profiles edit options
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male' as 'male' | 'female',
    mobileNumber: '',
    parentMobileNumber: '',
    school: '',
    educationStage: 'First Stage',
    memberType: 'Existing' as 'New' | 'Existing',
    profileImageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
    choirId: choirs[0]?.id || '',
    notes: ''
  });

  // Dynamic stages lookup extracted for filters
  const stagesList = useMemo(() => {
    const list = new Set(members.map(m => m.educationStage));
    return Array.from(list);
  }, [members]);

  // Filtering Logic
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.mobileNumber.includes(searchQuery);
      
      const matchStage = filterStage === 'all' || m.educationStage === filterStage;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchChoir = filterChoir === 'all' || m.choirId === filterChoir;
      const matchGender = filterGender === 'all' || m.gender === filterGender;

      return matchSearch && matchStage && matchStatus && matchChoir && matchGender;
    });
  }, [members, searchQuery, filterStage, filterStatus, filterChoir, filterGender]);

  // Handle Checkbox Selection
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle All
  const handleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m.id));
    }
  };

  // Open Modal Helpers
  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      fullName: '',
      gender: 'male',
      mobileNumber: '',
      parentMobileNumber: '',
      school: '',
      educationStage: 'First Stage',
      memberType: 'Existing',
      profileImageUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=120&q=80`,
      choirId: choirs[0]?.id || '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setIsEditing(true);
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      gender: member.gender || 'male',
      mobileNumber: member.mobileNumber,
      parentMobileNumber: member.parentMobileNumber,
      school: member.school,
      educationStage: member.educationStage,
      memberType: member.memberType,
      profileImageUrl: member.profileImageUrl,
      choirId: member.choirId,
      notes: member.notes || ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Actions
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) return;

    if (isEditing && editingMember) {
      updateMember({
        ...editingMember,
        fullName: formData.fullName,
        gender: formData.gender,
        mobileNumber: formData.mobileNumber,
        parentMobileNumber: formData.parentMobileNumber,
        school: formData.school,
        educationStage: formData.educationStage,
        memberType: formData.memberType,
        profileImageUrl: formData.profileImageUrl,
        choirId: formData.choirId,
        notes: formData.notes
      });
    } else {
      addMember(formData);
    }

    setIsModalOpen(false);
    setEditingMember(null);
  };

  // Toggle Single Status (Activate / Deactivate)
  const toggleMemberStatus = (member: Member) => {
    updateMember({
      ...member,
      status: member.status === 'Active' ? 'Inactive' : 'Active'
    });
  };

  // Bulk Actions Handlers
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDelete(true);
    setDeleteName(language === 'ar' ? `${selectedIds.length} من الأعضاء` : `${selectedIds.length} selected members`);
    setDeleteId('bulk_action');
  };

  const handleDeleteMember = (id: string, name: string) => {
    setIsBulkDelete(false);
    setDeleteName(name);
    setDeleteId(id);
  };

  const confirmDeletion = () => {
    if (isBulkDelete) {
      deleteMembers(selectedIds);
      setSelectedIds([]);
    } else if (deleteId) {
      deleteMembers([deleteId]);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== deleteId));
    }
    // Reset confirmation states cleanly
    setDeleteId(null);
    setDeleteName('');
    setIsBulkDelete(false);
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;

    const headers = [
      'id',
      'memberCode',
      'fullName',
      'gender',
      'profileImageUrl',
      'mobileNumber',
      'parentMobileNumber',
      'school',
      'educationStage',
      'memberType',
      'status',
      'joinDate',
      'choirId',
      'notes'
    ];

    const rows = filteredMembers.map(m => [
      m.id,
      m.memberCode,
      m.fullName,
      m.gender,
      m.profileImageUrl,
      m.mobileNumber,
      m.parentMobileNumber,
      m.school,
      m.educationStage,
      m.memberType,
      m.status,
      m.joinDate,
      m.choirId,
      m.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `church_member_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredMembers.length === 0) return;

    const printWin = window.open('', '_blank');
    if (printWin) {
      const isRtl = language === 'ar';
      const totalCount = filteredMembers.length;
      const maleCount = filteredMembers.filter(m => m.gender === 'male').length;
      const femaleCount = filteredMembers.filter(m => m.gender === 'female').length;

      const rowsHtml = filteredMembers.map((m, index) => {
        return `
          <tr style="border-bottom: 0.5px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center; font-size: 11px;">${index + 1}</td>
            <td style="padding: 8px; font-weight: bold; font-size: 11px;">${m.fullName}</td>
            <td style="padding: 8px; text-align: center; font-family: monospace; font-size: 10px; color: #4f46e5;">${m.memberCode}</td>
            <td style="padding: 8px; text-align: center; font-size: 11px;">
              ${m.gender === 'male' ? (isRtl ? 'ذكر' : 'Male') : (isRtl ? 'أنثى' : 'Female')}
            </td>
            <td style="padding: 8px; text-align: center; font-size: 11px;">
              ${formatStageName(m.educationStage, language)}
            </td>
            <td style="padding: 8px; text-align: center; font-size: 11px; direction: ltr;">${m.mobileNumber || '-'}</td>
            <td style="padding: 8px; font-size: 11px; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.notes || '-'}</td>
          </tr>
        `;
      }).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="${language}" dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${isRtl ? 'تقرير سجل الأعضاء' : 'Church Member Registry Report'}</title>
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
                grid-template-columns: repeat(3, 1fr);
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
                <h1>${isRtl ? 'سجل وكشف أعضاء الخدمة الكنسية' : 'Church Member Registry'}</h1>
                <p>${isRtl ? 'منظومة إثبات الحضور وبطاقات الهوية الكنسية' : 'Diocesan Attendance & Identity System'}</p>
              </div>
              <img src="${logoUrl}" class="header-logo" referrerPolicy="no-referrer" />
            </div>

            <div class="meta-grid">
              <div class="meta-item">${isRtl ? 'إجمالي الأعضاء المصفين:' : 'Filtered Registry Total:'} <span>${totalCount}</span></div>
              <div class="meta-item">${isRtl ? 'الذكور:' : 'Males:'} <span>${maleCount} ♂</span></div>
              <div class="meta-item">${isRtl ? 'الإناث:' : 'Females:'} <span>${femaleCount} ♀</span></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">${isRtl ? 'م' : 'No.'}</th>
                  <th style="text-align: ${isRtl ? 'right' : 'left'};">${isRtl ? 'الاسم الكامل' : 'Full Name'}</th>
                  <th style="width: 15%;">${isRtl ? 'كود العضو' : 'Member Code'}</th>
                  <th style="width: 10%;">${isRtl ? 'الجنس' : 'Gender'}</th>
                  <th style="width: 15%;">${isRtl ? 'المرحلة' : 'Stage'}</th>
                  <th style="width: 15%;">${isRtl ? 'رقم الهاتف' : 'Mobile'}</th>
                  <th style="text-align: ${isRtl ? 'right' : 'left'}; width: 25%;">${isRtl ? 'ملاحظات' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer">
              ${isRtl ? 'مسحوب تلقائياً وتصديره كملف تقرير PDF رسمي' : 'System generated and compiled PDF operational report.'} - ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
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

  const handleBulkPrint = () => {
    const selectedCodes = members
      .filter(m => selectedIds.includes(m.id))
      .map(m => m.memberCode);
    
    if (selectedCodes.length > 0) {
      onGoToCards(selectedCodes);
    }
  };

  const handlePrintAll = () => {
    const allCodes = filteredMembers.map(m => m.memberCode);
    if (allCodes.length > 0) {
      onGoToCards(allCodes);
    }
  };

  // Profile Image generator helper options for premium aesthetic selection
  const avatarPresets = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=d1f4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Victoria&backgroundColor=ffd5ea',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=f4ffd5',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella&backgroundColor=e8f9fd',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=George&backgroundColor=fff5e6'
  ];

  return (
    <div className="space-y-6" id="members-registry-view">
      {/* Upper Navigation Row with Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            {t.memberDirectory}
          </h1>
          <p className="text-sm text-slate-550 mt-1">
            {language === 'ar' ? 'تنظيم بطاقات الهوية وسجلات العضوية الكنسية العامة.' : 'Manage church registry records, assign ministries, and prepare ID card sheets.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Import CSV button */}
          <button
            onClick={() => {
              setImportStep('upload');
              setImportFile(null);
              setImportError(null);
              setParsedImportRows([]);
              setIsImportModalOpen(true);
            }}
            className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 border border-gray-250 bg-white dark:bg-slate-800 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title={language === 'ar' ? 'استيراد أعضاء من ملف CSV' : 'Import Members from CSV'}
          >
            <Upload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'ar' ? 'استيراد من CSV' : 'Import CSV'}</span>
          </button>

          {/* Export Excel (CSV) button */}
          <button
            onClick={handleExportCSV}
            className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 border border-gray-250 bg-white dark:bg-slate-800 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title={language === 'ar' ? 'تصدير إكسل' : 'Export Excel'}
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-600" />
            <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          {/* Export PDF button */}
          <button
            onClick={handleExportPDF}
            className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 border border-gray-250 bg-white dark:bg-slate-800 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title={language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            {t.addMember}
          </button>
        </div>
      </div>

      {/* Dynamic Filter options layout */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        {/* Dynamic searchable inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Query search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchMembers}
              className="w-full rounded-lg border border-gray-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Ministry Stage selection */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{language === 'ar' ? 'جميع المراحل الدراسية' : 'All Stages Of Education'}</option>
              <option value="First Stage">{language === 'ar' ? 'المرحلة الأولى' : 'First Stage'}</option>
              <option value="Second Stage">{language === 'ar' ? 'المرحلة الثانية' : 'Second Stage'}</option>
              <option value="Third Stage">{language === 'ar' ? 'المرحلة الثالثة' : 'Third Stage'}</option>
            </select>
          </div>

          {/* Gender selection */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{language === 'ar' ? 'جميع الجنسين' : 'All Genders'}</option>
              <option value="male">{language === 'ar' ? 'الذكور ♂' : 'Males ♂'}</option>
              <option value="female">{language === 'ar' ? 'الإناث ♀' : 'Females ♀'}</option>
            </select>
          </div>

        </div>

        {/* Multi-selection bulk panel bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-50 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <span>{language === 'ar' ? 'تصفية النتائج:' : 'Filtered:'} <strong>{filteredMembers.length}</strong> / {members.length}</span>
            {selectedIds.length > 0 && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-2 py-0.5 font-semibold">
                {selectedIds.length} {language === 'ar' ? 'محددة حالياً' : 'Selected'}
              </span>
            )}
          </div>

          {/* Bulk queue options button groups */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <button
                onClick={handleBulkPrint}
                className="cursor-pointer inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                {t.generateCardSelected}
              </button>
            ) : (
              <button
                onClick={handlePrintAll}
                className="cursor-pointer inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                {t.generateCardAll}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Registry Table view */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="member-roster-table text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                </th>
                <th className="py-3 px-4">{t.fullName}</th>
                <th className="py-3 px-4">{t.memberCode}</th>
                <th className="py-3 px-4">{t.educationStageLabel}</th>
                <th className="py-3 px-4">{t.mobileNumberLabel}</th>
                <th className="py-3 px-4">{language === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                <th className="py-3 px-4">{t.statusLabel}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-gray-400 italic">
                    {language === 'ar' ? 'لم يتم العثور على أعضاء يطابقون تصفية البحث الحالية.' : 'No member profiles found matching current filtered criteria.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isChecked = selectedIds.includes(m.id);
                  const matchedChoir = choirs.find(c => c.id === m.choirId);
                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-indigo-50/5 text-xs transition-colors ${isChecked ? 'bg-indigo-50/20' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(m.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={m.profileImageUrl} 
                            alt={m.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-gray-150"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-semibold text-gray-800 leading-none">{m.fullName}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-block text-[9px] px-1 rounded ${m.memberType === 'New' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                {m.memberType === 'New' ? t.newReg : t.existingReg}
                              </span>
                              <span className={`inline-block text-[9px] px-1.5 rounded font-medium ${m.gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' : 'bg-rose-50 text-rose-700 border border-rose-100/50'}`}>
                                {m.gender === 'male' ? (language === 'ar' ? '♂ ذكر' : '♂ Male') : (language === 'ar' ? '♀ أنثى' : '♀ Female')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-indigo-600">
                        {m.memberCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-700 mr-2">
                          <p>{formatStageName(m.educationStage, language)}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{m.school}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-750 mr-2">
                          <p>{m.mobileNumber}</p>
                          <p className="text-[10px] text-gray-400 font-normal">P: {m.parentMobileNumber}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-[140px] truncate" title={m.notes || ''}>
                        {m.notes || <span className="text-gray-300 italic">-</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleMemberStatus(m)}
                          className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {m.status === 'Active' ? t.active : t.inactive}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(m)}
                            className="cursor-pointer p-1.5 hover:bg-blue-50 border border-transparent hover:border-blue-200 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {/* Format Single ID Card */}
                          <button
                            onClick={() => onGoToCards([m.memberCode])}
                            className="cursor-pointer p-1.5 hover:bg-indigo-55 border border-transparent hover:border-indigo-200 text-indigo-600 rounded-lg transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Enrollee / Editor Form Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-xl animate-[fadeIn_0.2s_ease-out]">
            {/* Modal Title */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-indigo-600" />
                {isEditing ? t.editMember : t.addMember}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 text-xl font-bold font-mono leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Profile Image Select */}
              <div className="space-y-3">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الصورة الشخصية للملف الشخصي:' : 'Member Profile Photo / Portrait Picture:'}
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="relative shrink-0">
                    <img
                      src={formData.profileImageUrl}
                      alt="Active Preview"
                      className="h-16 w-16 rounded-full object-cover border-2 border-indigo-600 shadow-md bg-white"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setFormData({ ...formData, profileImageUrl: event.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-lg p-2.5 text-center bg-white cursor-pointer transition-colors"
                      onClick={() => document.getElementById('member-avatar-file-upload')?.click()}
                      id="member-avatar-drag-zone"
                    >
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {language === 'ar' ? 'اسحب صورة العضو هنا أو اضغط للاختيار' : 'Drag & drop member photo or click to browse'}
                      </p>
                      <input
                        id="member-avatar-file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setFormData({ ...formData, profileImageUrl: event.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={formData.profileImageUrl.startsWith('data:image') ? 'Uploaded Custom Photo' : formData.profileImageUrl}
                        disabled={formData.profileImageUrl.startsWith('data:image')}
                        onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                        placeholder="Or enter image URL..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-1 text-[10px] bg-white text-slate-650 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets Grid */}
                <div>
                  <span className="block text-[10px] text-gray-400 font-medium mb-1.5">
                    {language === 'ar' ? 'أو اختر صورة رمزية معدة مسبقاً:' : 'Or choose standard vector avatar:'}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto py-1">
                    {avatarPresets.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, profileImageUrl: u })}
                        className={`cursor-pointer rounded-full border overflow-hidden shrink-0 ${formData.profileImageUrl === u ? 'border-2 border-indigo-600 scale-105 shadow' : 'border-gray-200'}`}
                        id={`member-preset-avatar-${i}`}
                      >
                        <img src={u} alt="" className="h-8 w-8 object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid: Name and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Full name */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">{t.fullName}</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Fady Amgad"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Gender */}
                <div className="sm:col-span-1">
                  <label className="block font-medium text-gray-700 mb-1">{language === 'ar' ? 'الجنس' : 'Gender'}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="male">{language === 'ar' ? 'ذكر ♂' : 'Male ♂'}</option>
                    <option value="female">{language === 'ar' ? 'أنثى ♀' : 'Female ♀'}</option>
                  </select>
                </div>
              </div>

              {/* Grid: phone numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Mobile */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1">{t.mobileNumberLabel}</label>
                  <input
                    type="text"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+20 120 ..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Parent Mobile */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1">{t.parentMobileLabel}</label>
                  <input
                    type="text"
                    value={formData.parentMobileNumber}
                    onChange={(e) => setFormData({ ...formData, parentMobileNumber: e.target.value })}
                    placeholder="+20 111 ..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Grid: School and Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* School */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1">{t.schoolLabel}</label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Stage */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1">{t.educationStageLabel}</label>
                  <select
                    value={formData.educationStage}
                    onChange={(e) => setFormData({ ...formData, educationStage: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="First Stage">{language === 'ar' ? 'المرحلة الأولى' : 'First Stage'}</option>
                    <option value="Second Stage">{language === 'ar' ? 'المرحلة الثانية' : 'Second Stage'}</option>
                    <option value="Third Stage">{language === 'ar' ? 'المرحلة الثالثة' : 'Third Stage'}</option>
                  </select>
                </div>
              </div>

              {/* Grid: Category */}
              <div className="grid grid-cols-1 gap-3">
                {/* Member Category */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1">{t.memberTypeLabel}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, memberType: 'New' })}
                      className={`cursor-pointer w-full py-1.5 rounded-lg border text-center transition-all ${formData.memberType === 'New' ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold' : 'border-gray-200 text-gray-500 bg-white'}`}
                    >
                      {t.newReg}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, memberType: 'Existing' })}
                      className={`cursor-pointer w-full py-1.5 rounded-lg border text-center transition-all ${formData.memberType === 'Existing' ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold' : 'border-gray-200 text-gray-500 bg-white'}`}
                    >
                      {t.existingReg}
                    </button>
                  </div>
                </div>
              </div>

              {/* Member Notes Textbox: Centered, Rectangular, and Larger */}
              <div className="w-full">
                <label className="block font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'تفاصيل وملاحظات العضو الكنسي' : 'Member Notes & Comments'}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder={language === 'ar' ? 'اكتب ملاحظات العضو، المتابعات، الغيابات، أو أي تنبيهات إدارية هامة هنا...' : 'Write custom member notations, spiritual logs, observations, or general check-list details here...'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {isEditing && editingMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleDeleteMember(editingMember.id, editingMember.fullName);
                    }}
                    className="cursor-pointer px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs"
                    title={language === 'ar' ? 'حذف هذا العضو نهائياً' : 'Delete Member Permanently'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{language === 'ar' ? 'حذف العضو' : 'Delete Member'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-slate-50 font-semibold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold"
                  >
                    {t.saveProfile}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal Overlay */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center z-[140] p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {language === 'ar' ? 'استيراد الأعضاء من ملف CSV' : 'Bulk Import Members'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'ar' ? 'إضافة وتحديث سجلات الأعضاء بكفاءة ودقة' : 'Import bulk church membership logs and manage formatting/duplicates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="cursor-pointer text-gray-450 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Step 1: Upload */}
              {importStep === 'upload' && (
                <div className="space-y-6">
                  {/* Info Box Banner */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex gap-3 text-xs leading-relaxed text-indigo-900 dark:text-indigo-300">
                    <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-450 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-850 dark:text-gray-200">
                        {language === 'ar' ? 'إرشادات التنسيق الصحيح لملف CSV:' : 'Excel/CSV Column Formatting Guidelines:'}
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 dark:text-gray-350">
                        <li>
                          {language === 'ar' ? 
                            'يجب أن يحتوي الملف على عمود الاسم الكامل (fullName) كحد أدنى.' : 
                            'The file must contain a "fullName" column heading at a minimum.'}
                        </li>
                        <li>
                          {language === 'ar' ? 
                            'العواميد الاختيارية الإضافية تشمل: id, memberCode, gender, mobileNumber, parentMobileNumber, school, educationStage, memberType, status, joinDate, choirId, notes.' : 
                            'Supported optional headers: id, memberCode, gender, mobileNumber, parentMobileNumber, school, educationStage, memberType, status, joinDate, choirId, notes.'}
                        </li>
                        <li>
                          {language === 'ar' ? 
                            'سيتم تلقائياً تتبع وإنتاج كروت عضوية فريدة لكل سطر لا يحتوي على كود عضو مسبق.' : 
                            'Rows without a memberCode will receive an auto-generated unique registration code.'}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Dropzone Container */}
                  <div className="border-2 border-dashed border-gray-200 dark:border-slate-750 hover:border-indigo-450 dark:hover:border-indigo-550 rounded-2xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileImportChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                        <Upload className="h-6 w-6 animate-bounce animate-duration-1000" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {language === 'ar' ? 'اسحر ملف CSV هنا أو انقر للتصفح' : 'Drag and drop your CSV file here, or click to browse'}
                        </p>
                        <p className="text-xs text-slate-405 mt-1">
                          {language === 'ar' ? 'يدعم فقط صيغة .csv و ترميز UTF-8 بمقاس أقصى 10 ميجابايت' : 'Supports standard CSV format up to 10MB'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sample CSV Download Actions */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-200 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-gray-405" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          {language === 'ar' ? 'هل تريد البدء سريعاً بنموذج جاهز؟' : 'Need a template to verify column matching?'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 mt-0.5">
                          {language === 'ar' ? 'قم بتنزيل ملف نموذج فارغ منسق ومملوء بالبيانات لتسهيل العمل.' : 'Download our pre-structured template CSV containing sample rows.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 text-gray-700 dark:text-gray-305 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      <FileDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{language === 'ar' ? 'تنزيل النموذج الفارغ' : 'Download Sample CSV'}</span>
                    </button>
                  </div>

                  {importError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Interactive Preview and Strategy Config */}
              {importStep === 'preview' && (
                <div className="space-y-5">
                  {/* Duplicate Handling Strategies Option */}
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>{language === 'ar' ? 'سياسة التعامل مع الأعضاء المكررين:' : 'Duplicate Profile Conflict Resolution Strategy:'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 
                        `تم الكشف عن مكررات مرشحة بناءً على كود العضو أو الاسم ورقم الهاتف.` : 
                        `Some rows match existing church records by Member Code or Name/Phone combination. Select how to resolve:`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <label className={`cursor-pointer border p-3 rounded-xl flex flex-col justify-between space-y-1.5 transition-all text-left ${duplicateStrategy === 'overwrite' ? 'border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/15' : 'border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {language === 'ar' ? 'تحديث وتعديل القائم' : 'Overwrite / Update'}
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="overwrite"
                            checked={duplicateStrategy === 'overwrite'}
                            onChange={() => setDuplicateStrategy('overwrite')}
                            className="text-indigo-605 focus:ring-indigo-555"
                          />
                        </div>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed">
                          {language === 'ar' ? 'تعديل البيانات الحالية ببيانات الملف الجديد.' : 'Update the existing church profile fields with new CSV data.'}
                        </span>
                      </label>

                      <label className={`cursor-pointer border p-3 rounded-xl flex flex-col justify-between space-y-1.5 transition-all text-left ${duplicateStrategy === 'skip' ? 'border-amber-500 bg-amber-50/25 dark:bg-amber-950/15' : 'border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {language === 'ar' ? 'تخطي المكرر' : 'Skip Duplicates'}
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="skip"
                            checked={duplicateStrategy === 'skip'}
                            onChange={() => setDuplicateStrategy('skip')}
                            className="text-amber-605 focus:ring-amber-555"
                          />
                        </div>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed">
                          {language === 'ar' ? 'ترك العضو الحالي كما هو وإهمال صف الملف الجديد.' : 'Keep the old file profile intact and ignore this duplicate row.'}
                        </span>
                      </label>

                      <label className={`cursor-pointer border p-3 rounded-xl flex flex-col justify-between space-y-1.5 transition-all text-left ${duplicateStrategy === 'keep_both' ? 'border-slate-600 bg-slate-500/5 dark:bg-slate-450/5' : 'border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {language === 'ar' ? 'حفظ الاثنين معاً' : 'Keep Both Profiles'}
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="keep_both"
                            checked={duplicateStrategy === 'keep_both'}
                            onChange={() => setDuplicateStrategy('keep_both')}
                            className="text-slate-605 focus:ring-slate-555"
                          />
                        </div>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed">
                          {language === 'ar' ? 'إنشاء عضو جديد تماماً بكود فريد مضاف.' : 'Create a fresh duplicate enrollment with an alternate code.'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-gray-350">
                      {language === 'ar' ? 'الملخص المالي للملف:' : 'File Summary Statistics:'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100/50">
                      <span>{language === 'ar' ? 'إجمالي الصفوف:' : 'Total Rows:'}</span>
                      <strong>{parsedImportRows.length}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50">
                      <span>{language === 'ar' ? 'جاهز للاستيراد:' : 'Ready:'}</span>
                      <strong>{parsedImportRows.filter(r => r.errors.length === 0 && !r.isDuplicate).length}</strong>
                    </span>
                    {parsedImportRows.some(r => r.isDuplicate) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100/50">
                        <span>{language === 'ar' ? 'مكررات تم رصدها:' : 'Conflicts/Duplicates:'}</span>
                        <strong>{parsedImportRows.filter(r => r.isDuplicate).length}</strong>
                      </span>
                    )}
                    {parsedImportRows.some(r => r.errors.length > 0) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-405 border border-rose-100/50">
                        <span>{language === 'ar' ? 'أخطاء التنسيق:' : 'Validation Errors:'}</span>
                        <strong>{parsedImportRows.filter(r => r.errors.length > 0).length}</strong>
                      </span>
                    )}
                  </div>

                  {/* Preview Interactive Grid Table */}
                  <div className="border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="min-w-full text-left text-xs text-slate-705 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-gray-150 dark:border-slate-805">
                        <tr>
                          <th className="px-4 py-2.5 font-bold">#</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'ar' ? 'كود الفرد' : 'Code'}</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'ar' ? 'المرحلة' : 'Stage'}</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'ar' ? 'الحالة الكنسية' : 'Status/Conflict'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {parsedImportRows.map((row, idx) => {
                          const hasErr = row.errors.length > 0;
                          const hasWar = row.warnings.length > 0;
                          
                          return (
                            <tr key={idx} className={`${hasErr ? 'bg-red-50/20 dark:bg-red-950/5' : row.isDuplicate ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''}`}>
                              <td className="px-4 py-3 font-semibold font-mono text-slate-400">{row.index}</td>
                              <td className="px-4 py-3 font-semibold font-mono text-indigo-600 dark:text-indigo-400">{row.memberCode}</td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="font-bold text-slate-850 dark:text-white">{row.fullName || <span className="italic text-rose-500">None</span>}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">({row.gender === 'male' ? (language === 'ar' ? 'ذكر' : 'M') : (language === 'ar' ? 'أنثى' : 'F')})</span>
                                </div>
                                {row.school && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{row.school}</div>}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <div>{row.mobileNumber || '-'}</div>
                                {row.parentMobileNumber && <div className="text-[10px] text-slate-450 mt-0.5">Par: {row.parentMobileNumber}</div>}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-gray-300 font-semibold">{formatStageName(row.educationStage, language)}</td>
                              <td className="px-4 py-3 space-y-1">
                                {hasErr ? (
                                  row.errors.map((e, ei) => (
                                    <span key={ei} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/30 text-rose-600 dark:text-rose-450 font-bold">
                                      <XCircle className="h-2.5 w-2.5" />
                                      {e}
                                    </span>
                                  ))
                                ) : (
                                  <>
                                    {row.isDuplicate ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/30 text-amber-705 dark:text-amber-400 font-bold">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        {language === 'ar' ? 'موجود مسبقاً' : 'Existing Match'} ({row.duplicateType === 'code' ? 'Code' : 'Name-Phone'})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                                        <CheckCircle className="h-2.5 w-2.5" />
                                        {language === 'ar' ? 'جاهز وصالح' : 'Fresh Clean'}
                                      </span>
                                    )}
                                  </>
                                )}
                                {hasWar && row.warnings.map((w, wi) => (
                                  <div key={wi} className="text-[10px] text-amber-600 dark:text-amber-405 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                    <span>{w}</span>
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 3: Success Metrics View */}
              {importStep === 'success' && (
                <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {language === 'ar' ? 'تمت عملية الاستيراد بنجاح!' : 'Members Imported Successfully!'}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'ar' ? 'تمت معالجة جميع حقول الاستيراد وتحديث البيانات بنجاح في قاعدة البيانات.' : 'All valid rows from the CSV have been processed and integrated.'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-gray-150 dark:border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{importedCounts.success}</div>
                      <div className="text-[10px] font-semibold text-slate-450 uppercase">{language === 'ar' ? 'أعضاء جديدة' : 'Created New'}</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{importedCounts.updated}</div>
                      <div className="text-[10px] font-semibold text-slate-450 uppercase">{language === 'ar' ? 'تم تعديلها' : 'Updated'}</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-gray-500 font-mono">{importedCounts.skipped}</div>
                      <div className="text-[10px] font-semibold text-slate-450 uppercase">{language === 'ar' ? 'صفوف تم تخطيها' : 'Skipped'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
              <div>
                {importStep === 'preview' && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportStep('upload');
                      setImportFile(null);
                      setParsedImportRows([]);
                    }}
                    className="cursor-pointer px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all"
                  >
                    {language === 'ar' ? 'تغيير الملف' : 'Change File'}
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="cursor-pointer px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all"
                >
                  {importStep === 'success' ? (language === 'ar' ? 'موافق' : 'Done') : (language === 'ar' ? 'إلغاء' : 'Cancel')}
                </button>
                
                {importStep === 'preview' && (
                  <button
                    type="button"
                    onClick={handleFinalizeImport}
                    disabled={parsedImportRows.length === 0 || parsedImportRows.every(r => r.errors.length > 0)}
                    className="cursor-pointer px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all animate-none"
                  >
                    {language === 'ar' ? 'حفظ وتثبيت البيانات' : 'Commit Import Batch'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Security Deletion Confirmation Custom Modal Overlay */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 min-w-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 flex items-center justify-center border border-rose-100 dark:border-rose-900">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'تأكيد الحذف النهائي للفرد' : 'Verify Permanent Deletion'}
                </h3>
                <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider font-mono mt-0.5">
                  {language === 'ar' ? 'إجراء حرج لا يمكن التراجع عنه' : 'Critical Irreversible Action'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              {language === 'ar' ? (
                <span>
                  هل أنت متأكد تمامًا برغبتك في مسح <strong className="text-slate-900 dark:text-slate-100 font-bold">"{deleteName}"</strong> نهائيًا؟ هذا سيؤدي إلى زوال الملف من قطاع الأعضاء، كروت الهوية، وكافة سجلات الحضور السابقة نهائياً.
                </span>
              ) : (
                <span>
                  Are you absolutely sure you want to permanently erase <strong className="text-slate-900 dark:text-slate-100 font-bold">"{deleteName}"</strong>? This will purge their record from enrollees lists, print templates, and attendance sheets forever.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName('');
                  setIsBulkDelete(false);
                }}
                className="cursor-pointer px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                {language === 'ar' ? 'إلغاء الأمر' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                className="cursor-pointer px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                {language === 'ar' ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
