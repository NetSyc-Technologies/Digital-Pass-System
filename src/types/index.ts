export type Department =
  | 'Information Technology (IT)'
  | 'Computer Science & Engineering (CSE)'
  | 'Artificial Intelligence and Machine Learning (AIML)'
  | 'Computer Science & Engineering (Data Science)'
  | 'Electronics and Communication Engineering (ECE)'
  | 'Electronics & Computer Science (ECS)'
  | 'Computer Science & Engineering – Cyber Security (CSE-CS)'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Aeronautical Engineering'
  | 'Biotechnology'
  | 'Polytechnic'
  | 'MBA – Master of Business Administration'
  | 'MCA – Master of Computer Applications'
  | 'BBA – Bachelor of Business Administration'
  | 'BCA – Bachelor of Computer Applications'
  | 'Pharmacy'
  | 'VMIT';

export const DEPARTMENTS: Department[] = [
  'Information Technology (IT)',
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence and Machine Learning (AIML)',
  'Computer Science & Engineering (Data Science)',
  'Electronics and Communication Engineering (ECE)',
  'Electronics & Computer Science (ECS)',
  'Computer Science & Engineering – Cyber Security (CSE-CS)',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Aeronautical Engineering',
  'Biotechnology',
  'Polytechnic',
  'MBA – Master of Business Administration',
  'MCA – Master of Computer Applications',
  'BBA – Bachelor of Business Administration',
  'BCA – Bachelor of Computer Applications',
  'Pharmacy',
  'VMIT',
];

export type YearOfStudy = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export const YEARS_OF_STUDY: YearOfStudy[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type PassStatus = 'active' | 'pending_verification' | 'revoked';
export type EntryStatus = 'not_entered' | 'checked_in' | 'checked_out';

export type StaffRole =
  | 'super_admin'
  | 'admin'
  | 'gate_coordinator'
  | 'payment_coordinator';

export interface Participant {
  id: string;
  collegeId: string;
  fullName: string;
  department: Department;
  year: YearOfStudy;
  email: string;
  mobile: string;
  emergencyMobile: string;
  consentRules: boolean;
  registeredAt: string; // ISO string
  passId: string;
  passStatus: PassStatus;
  paymentStatus: PaymentStatus;
  entryStatus: EntryStatus;
  checkedIn: boolean;
  checkInTimestamp?: string | null;
  checkedInBy?: string | null;
  checkOutTimestamp?: string | null;
  checkedOutBy?: string | null;
  gateId?: string | null;
  verificationToken?: string;
  paymentId?: string;
}

export interface OcrExtractedData {
  utr?: string;
  transactionId?: string;
  payerName?: string;
  amount?: number;
  paymentDate?: string;
  paymentApp?: string;
  rawText?: string;
  confidence: 'high' | 'medium' | 'low' | 'manual_review';
}

export interface PaymentRecord {
  id: string;
  participantId: string;
  passId: string;
  participantName: string;
  collegeId: string;
  department: Department;
  amount: number;
  expectedAmount: number;
  screenshotUrl: string; // Base64 or Storage URL
  submittedAt: string;
  status: PaymentStatus;
  ocrData: OcrExtractedData;
  verifiedBy?: {
    uid: string;
    email: string;
    name: string;
  } | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  coordinatorNote?: string | null;
}

export interface Coordinator {
  id: string;
  uid?: string;
  email: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
  assignedBy: string;
}

export interface EventSettings {
  title: string;
  subtitle: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  passPrice: number;
  isRegistrationOpen: boolean;
  upiId: string;
  payeeName: string;
  payQrUrl: string;
  capacity: number;
  allowReEntry: boolean;
  contactEmail: string;
  contactPhone: string;
  rules: string[];
}

export interface AuditLog {
  id: string;
  action:
    | 'COORDINATOR_CREATED'
    | 'COORDINATOR_UPDATED'
    | 'COORDINATOR_REMOVED'
    | 'PAYMENT_VERIFIED'
    | 'PAYMENT_REJECTED'
    | 'QR_SCANNED'
    | 'CHECK_IN_SUCCESS'
    | 'CHECK_IN_REJECTED'
    | 'CHECK_OUT_SUCCESS'
    | 'SETTINGS_UPDATED'
    | 'REGISTRATION_CREATED'
    | 'MANUAL_RECORD_UPDATE';
  targetId: string;
  userEmail: string;
  userName?: string;
  role?: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface PassPayload {
  v: number; // version
  passId: string;
  token: string;
  ts: number;
}
