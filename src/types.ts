export type UserRole = 'super_admin' | 'admin' | 'officer';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Optional login support
  organizationId?: string; // Empty for super_admin
  choirId?: string; // Optional context
  status: 'active' | 'inactive';
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  churchCount: number;
}

export interface Church {
  id: string;
  organizationId: string;
  name: string;
  location: string;
}

export interface ChoirDepartment {
  id: string;
  churchId: string;
  name: string;
  description: string;
}

export interface Member {
  id: string;
  memberCode: string; // Permanent unique code e.g. CH-9K4F2A
  fullName: string;
  gender: 'male' | 'female';
  profileImageUrl: string;
  mobileNumber: string;
  parentMobileNumber: string;
  school: string;
  educationStage: string; // e.g., Grade 3, High School, Kindergarten
  memberType: 'New' | 'Existing';
  status: 'Active' | 'Inactive';
  joinDate: string; // YYYY-MM-DD
  choirId: string; // Linked to ChoirDepartment
  notes?: string;
}

export interface AttendanceEvent {
  id: string;
  memberCode: string;
  adminId: string;
  adminName: string;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD for fast analytics
  choirId: string;
  deviceInfo?: string;
  synced: boolean; // For offline support
}

export interface IDCardTemplate {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  churchName: string;
  logoUrl?: string;
}
