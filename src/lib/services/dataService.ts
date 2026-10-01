import {
  Participant,
  PaymentRecord,
  Coordinator,
  EventSettings,
  AuditLog,
  Department,
  YearOfStudy,
  PaymentStatus,
  EntryStatus,
  StaffRole,
} from '@/types';
import { isFirebaseConfigured, db } from '@/lib/firebase/config';
import { generatePassId, createPassQrPayload } from '@/lib/security/tokenService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

// Default initial settings
export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  title: 'TGPCET Garba Night 2024',
  subtitle: 'Grand Dandiya & Navratri Mahotsav | TGPCET Campus',
  date: 'Friday, 18 October 2024',
  startTime: '06:30 PM',
  endTime: '11:30 PM',
  venue: 'Main Sports Ground, TGPCET Campus, Mohgaon, Wardha Road, Nagpur',
  passPrice: 150,
  isRegistrationOpen: true,
  upiId: 'tgpcetgarba@upi',
  payeeName: 'TGPCET Garba Night Committee',
  payQrUrl: '/payqr.png',
  capacity: 2500,
  allowReEntry: false,
  contactEmail: 'garba.helpdesk@tgpcet.edu',
  contactPhone: '+91 98765 43210',
  rules: [
    'Valid College ID Card is mandatory along with this Digital Gate Pass for physical entry.',
    'Strictly restricted to registered TGPCET and affiliated college students and official guests.',
    'Traditional Garba / Ethnic attire (Chaniya Choli, Kurta Pyjama, Kedia) is strongly encouraged.',
    'Any possession or consumption of alcohol, tobacco, drugs or restricted substances is strictly prohibited and will result in immediate disqualification and campus disciplinary action.',
    'Digital Pass is strictly non-transferable and valid for one-time admission only.',
    'Attendees must adhere to campus security, parking guidelines and volunteer instructions.',
  ],
};

// Realistic mock seed data for out-of-the-box local testing
const SEED_COORDINATORS: Coordinator[] = [
  {
    id: 'coord_super_admin',
    email: 'bhushanmallick2006@gmail.com',
    fullName: 'Bhushan Mallick (Super Admin)',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    lastLogin: new Date().toISOString(),
    assignedBy: 'System / Master Default',
  },
  {
    id: 'coord_gate_01',
    email: 'gate.coordinator@tgpcet.edu',
    fullName: 'Rohan Sharma (Gate Lead)',
    role: 'gate_coordinator',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    assignedBy: 'bhushanmallick2006@gmail.com',
  },
  {
    id: 'coord_payment_01',
    email: 'payment.team@tgpcet.edu',
    fullName: 'Priya Verma (Finance Coordinator)',
    role: 'payment_coordinator',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastLogin: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedBy: 'bhushanmallick2006@gmail.com',
  },
];

const SEED_PARTICIPANTS: Participant[] = [
  {
    id: 'part_001',
    collegeId: 'TGPCET/2022/IT/042',
    fullName: 'Aarav Deshmukh',
    department: 'Information Technology (IT)',
    year: '3rd Year',
    email: 'aarav.it@tgpcet.edu',
    mobile: '9823456789',
    emergencyMobile: '9823456780',
    consentRules: true,
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO01',
    passStatus: 'active',
    paymentStatus: 'verified',
    entryStatus: 'checked_in',
    checkedIn: true,
    checkInTimestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    checkedInBy: 'gate.coordinator@tgpcet.edu',
    gateId: 'Gate 1 (North Entry)',
    paymentId: 'pay_001',
  },
  {
    id: 'part_002',
    collegeId: 'TGPCET/2023/CSE/108',
    fullName: 'Ananya Kulkarni',
    department: 'Computer Science & Engineering (CSE)',
    year: '2nd Year',
    email: 'ananya.cse@tgpcet.edu',
    mobile: '9765432109',
    emergencyMobile: '9765432100',
    consentRules: true,
    registeredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO02',
    passStatus: 'active',
    paymentStatus: 'verified',
    entryStatus: 'not_entered',
    checkedIn: false,
    paymentId: 'pay_002',
  },
  {
    id: 'part_003',
    collegeId: 'TGPCET/2024/AIML/015',
    fullName: 'Vihaan Patil',
    department: 'Artificial Intelligence and Machine Learning (AIML)',
    year: '1st Year',
    email: 'vihaan.aiml@tgpcet.edu',
    mobile: '9123456781',
    emergencyMobile: '9123456780',
    consentRules: true,
    registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO03',
    passStatus: 'pending_verification',
    paymentStatus: 'pending',
    entryStatus: 'not_entered',
    checkedIn: false,
    paymentId: 'pay_003',
  },
  {
    id: 'part_004',
    collegeId: 'TGPCET/2023/MCA/028',
    fullName: 'Sneha Joshi',
    department: 'MCA – Master of Computer Applications',
    year: '2nd Year',
    email: 'sneha.mca@tgpcet.edu',
    mobile: '9845123456',
    emergencyMobile: '9845123450',
    consentRules: true,
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO04',
    passStatus: 'pending_verification',
    paymentStatus: 'pending',
    entryStatus: 'not_entered',
    checkedIn: false,
    paymentId: 'pay_004',
  },
  {
    id: 'part_005',
    collegeId: 'TGPCET/2021/ME/065',
    fullName: 'Harshwardhan Raut',
    department: 'Mechanical Engineering',
    year: '4th Year',
    email: 'harsh.me@tgpcet.edu',
    mobile: '9988776655',
    emergencyMobile: '9988776650',
    consentRules: true,
    registeredAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO05',
    passStatus: 'pending_verification',
    paymentStatus: 'rejected',
    entryStatus: 'not_entered',
    checkedIn: false,
    paymentId: 'pay_005',
  },
  {
    id: 'part_006',
    collegeId: 'TGPCET/2022/ECE/033',
    fullName: 'Tanvi Gadgil',
    department: 'Electronics and Communication Engineering (ECE)',
    year: '3rd Year',
    email: 'tanvi.ece@tgpcet.edu',
    mobile: '9345678901',
    emergencyMobile: '9345678900',
    consentRules: true,
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    passId: 'TGP-GARBA-2024-DEMO06',
    passStatus: 'active',
    paymentStatus: 'verified',
    entryStatus: 'checked_out',
    checkedIn: true,
    checkInTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    checkedInBy: 'gate.coordinator@tgpcet.edu',
    checkOutTimestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    checkedOutBy: 'gate.coordinator@tgpcet.edu',
    paymentId: 'pay_006',
  },
];

const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_001',
    participantId: 'part_001',
    passId: 'TGP-GARBA-2024-DEMO01',
    participantName: 'Aarav Deshmukh',
    collegeId: 'TGPCET/2022/IT/042',
    department: 'Information Technology (IT)',
    amount: 150,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'verified',
    ocrData: {
      utr: '428901847291',
      transactionId: 'T2410161423450912',
      payerName: 'Aarav Deshmukh',
      amount: 150,
      paymentDate: '16 Oct 2024, 02:23 PM',
      paymentApp: 'Google Pay',
      confidence: 'high',
    },
    verifiedBy: {
      uid: 'coord_payment_01',
      email: 'payment.team@tgpcet.edu',
      name: 'Priya Verma',
    },
    verifiedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    coordinatorNote: 'UTR and amount verified in college bank statement.',
  },
  {
    id: 'pay_002',
    participantId: 'part_002',
    passId: 'TGP-GARBA-2024-DEMO02',
    participantName: 'Ananya Kulkarni',
    collegeId: 'TGPCET/2023/CSE/108',
    department: 'Computer Science & Engineering (CSE)',
    amount: 150,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'verified',
    ocrData: {
      utr: '429011982736',
      transactionId: 'T2410170912180041',
      payerName: 'Ananya Kulkarni',
      amount: 150,
      paymentDate: '17 Oct 2024, 09:12 AM',
      paymentApp: 'PhonePe',
      confidence: 'high',
    },
    verifiedBy: {
      uid: 'coord_super_admin',
      email: 'bhushanmallick2006@gmail.com',
      name: 'Bhushan Mallick',
    },
    verifiedAt: new Date(Date.now() - 86400000 * 1 + 2400000).toISOString(),
  },
  {
    id: 'pay_003',
    participantId: 'part_003',
    passId: 'TGP-GARBA-2024-DEMO03',
    participantName: 'Vihaan Patil',
    collegeId: 'TGPCET/2024/AIML/015',
    department: 'Artificial Intelligence and Machine Learning (AIML)',
    amount: 150,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'pending',
    ocrData: {
      utr: '429188204910',
      transactionId: 'TXN891238472918',
      payerName: 'Vihaan Patil',
      amount: 150,
      paymentDate: 'Today, 10:14 AM',
      paymentApp: 'Paytm',
      confidence: 'high',
    },
  },
  {
    id: 'pay_004',
    participantId: 'part_004',
    passId: 'TGP-GARBA-2024-DEMO04',
    participantName: 'Sneha Joshi',
    collegeId: 'TGPCET/2023/MCA/028',
    department: 'MCA – Master of Computer Applications',
    amount: 150,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'pending',
    ocrData: {
      // NOTE: This sample has the SAME UTR as pay_001 to demonstrate DUPLICATE UTR DETECTION!
      utr: '428901847291',
      transactionId: 'T2410181145229011',
      payerName: 'Sneha Joshi',
      amount: 150,
      paymentDate: 'Today, 11:45 AM',
      paymentApp: 'PhonePe',
      confidence: 'medium',
    },
  },
  {
    id: 'pay_005',
    participantId: 'part_005',
    passId: 'TGP-GARBA-2024-DEMO05',
    participantName: 'Harshwardhan Raut',
    collegeId: 'TGPCET/2021/ME/065',
    department: 'Mechanical Engineering',
    amount: 100,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    status: 'rejected',
    ocrData: {
      utr: '428800112233',
      transactionId: 'TXN1122334455',
      payerName: 'Harshwardhan',
      amount: 100,
      paymentDate: 'Yesterday, 08:30 PM',
      paymentApp: 'Google Pay',
      confidence: 'medium',
    },
    verifiedBy: {
      uid: 'coord_payment_01',
      email: 'payment.team@tgpcet.edu',
      name: 'Priya Verma',
    },
    verifiedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    rejectionReason: 'Partial payment amount (₹100 instead of required ₹150). Please re-submit full pass amount.',
  },
  {
    id: 'pay_006',
    participantId: 'part_006',
    passId: 'TGP-GARBA-2024-DEMO06',
    participantName: 'Tanvi Gadgil',
    collegeId: 'TGPCET/2022/ECE/033',
    department: 'Electronics and Communication Engineering (ECE)',
    amount: 150,
    expectedAmount: 150,
    screenshotUrl: '/payqr.png',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'verified',
    ocrData: {
      utr: '428905541288',
      transactionId: 'TXN998877665544',
      payerName: 'Tanvi Gadgil',
      amount: 150,
      paymentDate: '16 Oct 2024, 04:10 PM',
      paymentApp: 'BHIM UPI',
      confidence: 'high',
    },
    verifiedBy: {
      uid: 'coord_payment_01',
      email: 'payment.team@tgpcet.edu',
      name: 'Priya Verma',
    },
    verifiedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    action: 'SETTINGS_UPDATED',
    targetId: 'settings',
    userEmail: 'bhushanmallick2006@gmail.com',
    userName: 'Bhushan Mallick',
    role: 'super_admin',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    details: { message: 'Initialized TGPCET Garba Night 2024 event configuration and pass price.' },
  },
  {
    id: 'log_002',
    action: 'COORDINATOR_CREATED',
    targetId: 'coord_gate_01',
    userEmail: 'bhushanmallick2006@gmail.com',
    userName: 'Bhushan Mallick',
    role: 'super_admin',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    details: { assignedEmail: 'gate.coordinator@tgpcet.edu', role: 'gate_coordinator' },
  },
  {
    id: 'log_003',
    action: 'PAYMENT_VERIFIED',
    targetId: 'pay_001',
    userEmail: 'payment.team@tgpcet.edu',
    userName: 'Priya Verma',
    role: 'payment_coordinator',
    timestamp: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    details: { passId: 'TGP-GARBA-2024-DEMO01', utr: '428901847291' },
  },
  {
    id: 'log_004',
    action: 'CHECK_IN_SUCCESS',
    targetId: 'TGP-GARBA-2024-DEMO01',
    userEmail: 'gate.coordinator@tgpcet.edu',
    userName: 'Rohan Sharma',
    role: 'gate_coordinator',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    details: { participant: 'Aarav Deshmukh', gate: 'Gate 1 (North Entry)' },
  },
];

/**
 * In-browser Reactive Store Manager for Local/Mock Mode
 * Automatically syncs with localStorage when Firebase keys are not provided.
 */
class LocalReactiveStore {
  private initialized = false;
  private settings: EventSettings = { ...DEFAULT_EVENT_SETTINGS };
  private coordinators: Coordinator[] = [...SEED_COORDINATORS];
  private participants: Participant[] = [...SEED_PARTICIPANTS];
  private payments: PaymentRecord[] = [...SEED_PAYMENTS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      const storedSettings = localStorage.getItem('tgpcet_garba_settings');
      if (storedSettings) this.settings = JSON.parse(storedSettings);

      const storedCoordinators = localStorage.getItem('tgpcet_garba_coordinators');
      if (storedCoordinators) this.coordinators = JSON.parse(storedCoordinators);

      const storedParticipants = localStorage.getItem('tgpcet_garba_participants');
      if (storedParticipants) this.participants = JSON.parse(storedParticipants);

      const storedPayments = localStorage.getItem('tgpcet_garba_payments');
      if (storedPayments) this.payments = JSON.parse(storedPayments);

      const storedLogs = localStorage.getItem('tgpcet_garba_audit_logs');
      if (storedLogs) this.auditLogs = JSON.parse(storedLogs);

      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tgpcet_garba_settings', JSON.stringify(this.settings));
      localStorage.setItem('tgpcet_garba_coordinators', JSON.stringify(this.coordinators));
      localStorage.setItem('tgpcet_garba_participants', JSON.stringify(this.participants));
      localStorage.setItem('tgpcet_garba_payments', JSON.stringify(this.payments));
      localStorage.setItem('tgpcet_garba_audit_logs', JSON.stringify(this.auditLogs));
    } catch (e) {
      console.warn('Failed to persist local store:', e);
    }
  }

  getSettings(): EventSettings {
    this.init();
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<EventSettings>, email: string): EventSettings {
    this.init();
    this.settings = { ...this.settings, ...newSettings };
    this.addAuditLog({
      action: 'SETTINGS_UPDATED',
      targetId: 'settings',
      userEmail: email,
      timestamp: new Date().toISOString(),
      details: newSettings,
    });
    this.persist();
    return { ...this.settings };
  }

  getCoordinators(): Coordinator[] {
    this.init();
    return [...this.coordinators];
  }

  addCoordinator(coord: Omit<Coordinator, 'id' | 'createdAt'>): Coordinator {
    this.init();
    const newCoord: Coordinator = {
      ...coord,
      id: `coord_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.coordinators.push(newCoord);
    this.addAuditLog({
      action: 'COORDINATOR_CREATED',
      targetId: newCoord.id,
      userEmail: coord.assignedBy,
      timestamp: new Date().toISOString(),
      details: { email: coord.email, role: coord.role, name: coord.fullName },
    });
    this.persist();
    return newCoord;
  }

  updateCoordinator(id: string, updates: Partial<Coordinator>, actorEmail: string): Coordinator | null {
    this.init();
    const idx = this.coordinators.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.coordinators[idx] = { ...this.coordinators[idx], ...updates };
    this.addAuditLog({
      action: 'COORDINATOR_UPDATED',
      targetId: id,
      userEmail: actorEmail,
      timestamp: new Date().toISOString(),
      details: updates,
    });
    this.persist();
    return this.coordinators[idx];
  }

  removeCoordinator(id: string, actorEmail: string): boolean {
    this.init();
    const coord = this.coordinators.find((c) => c.id === id);
    if (!coord) return false;
    // Protect default super admin
    if (coord.email.toLowerCase() === 'bhushanmallick2006@gmail.com') {
      throw new Error('Permanent Super Admin account cannot be removed.');
    }
    this.coordinators = this.coordinators.filter((c) => c.id !== id);
    this.addAuditLog({
      action: 'COORDINATOR_REMOVED',
      targetId: id,
      userEmail: actorEmail,
      timestamp: new Date().toISOString(),
      details: { email: coord.email, name: coord.fullName },
    });
    this.persist();
    return true;
  }

  getParticipants(): Participant[] {
    this.init();
    return [...this.participants];
  }

  getParticipantByPassId(passId: string): Participant | null {
    this.init();
    const clean = passId.trim().toUpperCase();
    return this.participants.find((p) => p.passId.toUpperCase() === clean) || null;
  }

  getParticipantById(id: string): Participant | null {
    this.init();
    return this.participants.find((p) => p.id === id) || null;
  }

  checkDuplicateRegistration(collegeId: string, email: string, mobile: string): {
    isDuplicate: boolean;
    field?: string;
  } {
    this.init();
    const normCollegeId = collegeId.trim().toUpperCase();
    const normEmail = email.trim().toLowerCase();
    const normMobile = mobile.replace(/[^0-9]/g, '');

    const foundCollegeId = this.participants.find(
      (p) => p.collegeId.trim().toUpperCase() === normCollegeId
    );
    if (foundCollegeId) return { isDuplicate: true, field: 'College ID' };

    const foundEmail = this.participants.find(
      (p) => p.email.trim().toLowerCase() === normEmail
    );
    if (foundEmail) return { isDuplicate: true, field: 'Email Address' };

    const foundMobile = this.participants.find(
      (p) => p.mobile.replace(/[^0-9]/g, '') === normMobile
    );
    if (foundMobile) return { isDuplicate: true, field: 'Mobile Number' };

    return { isDuplicate: false };
  }

  checkDuplicateUtr(utr: string): { isDuplicate: boolean; existingPassId?: string; existingName?: string } {
    this.init();
    if (!utr || utr.trim().length < 6) return { isDuplicate: false };
    const cleanUtr = utr.trim().toUpperCase();
    const found = this.payments.find(
      (p) =>
        (p.ocrData?.utr && p.ocrData.utr.trim().toUpperCase() === cleanUtr) ||
        (p.ocrData?.transactionId && p.ocrData.transactionId.trim().toUpperCase() === cleanUtr)
    );
    if (found) {
      return {
        isDuplicate: true,
        existingPassId: found.passId,
        existingName: found.participantName,
      };
    }
    return { isDuplicate: false };
  }

  createRegistration(
    participantData: Omit<Participant, 'id' | 'registeredAt' | 'passId' | 'passStatus' | 'paymentStatus' | 'entryStatus' | 'checkedIn'>,
    paymentData: {
      amount: number;
      expectedAmount: number;
      screenshotUrl: string;
      ocrData: PaymentRecord['ocrData'];
    }
  ): { participant: Participant; payment: PaymentRecord } {
    this.init();

    // Enforce duplicate UTR rejection
    if (paymentData.ocrData?.utr) {
      const dupUtr = this.checkDuplicateUtr(paymentData.ocrData.utr);
      if (dupUtr.isDuplicate) {
        throw new Error(
          `Duplicate UTR Error: This transaction ID (${paymentData.ocrData.utr}) has already been used for pass ${dupUtr.existingPassId}. Receipt recycling is rejected.`
        );
      }
    }

    const passId = generatePassId();
    const partId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const participant: Participant = {
      ...participantData,
      id: partId,
      collegeId: participantData.collegeId.trim().toUpperCase(),
      email: participantData.email.trim().toLowerCase(),
      mobile: participantData.mobile.replace(/[^0-9]/g, ''),
      emergencyMobile: participantData.emergencyMobile.replace(/[^0-9]/g, ''),
      registeredAt: now,
      passId,
      passStatus: 'pending_verification',
      paymentStatus: 'pending',
      entryStatus: 'not_entered',
      checkedIn: false,
      paymentId: payId,
    };

    const payment: PaymentRecord = {
      id: payId,
      participantId: partId,
      passId,
      participantName: participant.fullName,
      collegeId: participant.collegeId,
      department: participant.department,
      amount: paymentData.amount,
      expectedAmount: paymentData.expectedAmount,
      screenshotUrl: paymentData.screenshotUrl,
      submittedAt: now,
      status: 'pending',
      ocrData: paymentData.ocrData,
    };

    this.participants.unshift(participant);
    this.payments.unshift(payment);

    this.addAuditLog({
      action: 'REGISTRATION_CREATED',
      targetId: passId,
      userEmail: participant.email,
      timestamp: now,
      details: {
        fullName: participant.fullName,
        collegeId: participant.collegeId,
        department: participant.department,
        amount: payment.amount,
      },
    });

    this.persist();
    return { participant, payment };
  }

  addRegistration(participant: Participant, payment: PaymentRecord) {
    this.init();
    this.participants = this.participants.filter(
      (p) => p.id !== participant.id && p.passId !== participant.passId
    );
    this.payments = this.payments.filter(
      (p) => p.id !== payment.id && p.passId !== payment.passId
    );
    this.participants.unshift(participant);
    this.payments.unshift(payment);
    this.persist();
  }

  getPayments(): PaymentRecord[] {
    this.init();
    return [...this.payments];
  }

  verifyPayment(
    paymentId: string,
    coordinator: { uid: string; email: string; name: string },
    coordinatorNote?: string
  ): { success: boolean; payment?: PaymentRecord; error?: string } {
    this.init();
    const payIdx = this.payments.findIndex((p) => p.id === paymentId);
    if (payIdx === -1) return { success: false, error: 'Payment record not found.' };

    const now = new Date().toISOString();
    this.payments[payIdx] = {
      ...this.payments[payIdx],
      status: 'verified',
      verifiedBy: coordinator,
      verifiedAt: now,
      coordinatorNote: coordinatorNote || undefined,
      rejectionReason: undefined,
    };

    // Update corresponding participant
    const partIdx = this.participants.findIndex(
      (p) => p.id === this.payments[payIdx].participantId || p.passId === this.payments[payIdx].passId
    );
    if (partIdx !== -1) {
      this.participants[partIdx] = {
        ...this.participants[partIdx],
        paymentStatus: 'verified',
        passStatus: 'active',
      };
    }

    this.addAuditLog({
      action: 'PAYMENT_VERIFIED',
      targetId: paymentId,
      userEmail: coordinator.email,
      userName: coordinator.name,
      timestamp: now,
      details: {
        passId: this.payments[payIdx].passId,
        amount: this.payments[payIdx].amount,
        note: coordinatorNote,
      },
    });

    this.persist();
    return { success: true, payment: this.payments[payIdx] };
  }

  rejectPayment(
    paymentId: string,
    coordinator: { uid: string; email: string; name: string },
    rejectionReason: string
  ): { success: boolean; payment?: PaymentRecord; error?: string } {
    this.init();
    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: 'A specific rejection reason is strictly required.' };
    }

    const payIdx = this.payments.findIndex((p) => p.id === paymentId);
    if (payIdx === -1) return { success: false, error: 'Payment record not found.' };

    const now = new Date().toISOString();
    this.payments[payIdx] = {
      ...this.payments[payIdx],
      status: 'rejected',
      verifiedBy: coordinator,
      verifiedAt: now,
      rejectionReason: rejectionReason.trim(),
    };

    // Update corresponding participant
    const partIdx = this.participants.findIndex(
      (p) => p.id === this.payments[payIdx].participantId || p.passId === this.payments[payIdx].passId
    );
    if (partIdx !== -1) {
      this.participants[partIdx] = {
        ...this.participants[partIdx],
        paymentStatus: 'rejected',
        passStatus: 'pending_verification',
      };
    }

    this.addAuditLog({
      action: 'PAYMENT_REJECTED',
      targetId: paymentId,
      userEmail: coordinator.email,
      userName: coordinator.name,
      timestamp: now,
      details: {
        passId: this.payments[payIdx].passId,
        reason: rejectionReason,
      },
    });

    this.persist();
    return { success: true, payment: this.payments[payIdx] };
  }

  /**
   * One-Time Check-In Execution (Atomic)
   */
  processCheckIn(
    passId: string,
    coordinator: { email: string; name?: string },
    gateId: string = 'Gate 1'
  ): {
    success: boolean;
    reason?: 'PASS_NOT_FOUND' | 'PAYMENT_NOT_VERIFIED' | 'ALREADY_CHECKED_IN' | 'PASS_REVOKED';
    participant?: Participant;
    message?: string;
  } {
    this.init();
    const cleanPassId = passId.trim().toUpperCase();
    const partIdx = this.participants.findIndex(
      (p) => p.passId.toUpperCase() === cleanPassId
    );

    if (partIdx === -1) {
      this.addAuditLog({
        action: 'CHECK_IN_REJECTED',
        targetId: cleanPassId,
        userEmail: coordinator.email,
        timestamp: new Date().toISOString(),
        details: { reason: 'PASS_NOT_FOUND' },
      });
      return { success: false, reason: 'PASS_NOT_FOUND', message: 'Pass does not exist in registry.' };
    }

    const participant = this.participants[partIdx];

    if (participant.passStatus === 'revoked') {
      return { success: false, reason: 'PASS_REVOKED', participant, message: 'This pass has been revoked by Administration.' };
    }

    // MANDATORY SECURITY RULE: Payment must be verified before allowing entry!
    if (participant.paymentStatus !== 'verified') {
      this.addAuditLog({
        action: 'CHECK_IN_REJECTED',
        targetId: cleanPassId,
        userEmail: coordinator.email,
        timestamp: new Date().toISOString(),
        details: { reason: 'PAYMENT_NOT_VERIFIED', paymentStatus: participant.paymentStatus },
      });
      return {
        success: false,
        reason: 'PAYMENT_NOT_VERIFIED',
        participant,
        message: 'Payment not verified kindly wait or contact the payment team.',
      };
    }

    // Atomic one-time entry check
    if (participant.checkedIn && participant.entryStatus === 'checked_in') {
      this.addAuditLog({
        action: 'CHECK_IN_REJECTED',
        targetId: cleanPassId,
        userEmail: coordinator.email,
        timestamp: new Date().toISOString(),
        details: {
          reason: 'ALREADY_CHECKED_IN',
          firstCheckedInAt: participant.checkInTimestamp,
          firstCheckedInBy: participant.checkedInBy,
        },
      });
      return {
        success: false,
        reason: 'ALREADY_CHECKED_IN',
        participant,
        message: 'Pass has ALREADY been scanned and admitted!',
      };
    }

    // If previously checked out and re-entry is disallowed
    if (participant.entryStatus === 'checked_out' && !this.settings.allowReEntry) {
      return {
        success: false,
        reason: 'ALREADY_CHECKED_IN',
        participant,
        message: 'Participant previously checked out. Re-entry is disabled for this event.',
      };
    }

    // Approve entry
    const now = new Date().toISOString();
    this.participants[partIdx] = {
      ...participant,
      checkedIn: true,
      entryStatus: 'checked_in',
      checkInTimestamp: now,
      checkedInBy: coordinator.email,
      gateId,
    };

    this.addAuditLog({
      action: 'CHECK_IN_SUCCESS',
      targetId: cleanPassId,
      userEmail: coordinator.email,
      userName: coordinator.name,
      timestamp: now,
      details: {
        participantName: participant.fullName,
        collegeId: participant.collegeId,
        gate: gateId,
      },
    });

    this.persist();
    return { success: true, participant: this.participants[partIdx] };
  }

  /**
   * Check-Out Execution
   */
  processCheckOut(
    passId: string,
    coordinator: { email: string; name?: string }
  ): {
    success: boolean;
    participant?: Participant;
    message?: string;
  } {
    this.init();
    const cleanPassId = passId.trim().toUpperCase();
    const partIdx = this.participants.findIndex(
      (p) => p.passId.toUpperCase() === cleanPassId
    );

    if (partIdx === -1) {
      return { success: false, message: 'Pass does not exist.' };
    }

    const participant = this.participants[partIdx];
    if (participant.entryStatus !== 'checked_in') {
      return {
        success: false,
        participant,
        message: 'Participant is not currently checked in.',
      };
    }

    const now = new Date().toISOString();
    this.participants[partIdx] = {
      ...participant,
      entryStatus: 'checked_out',
      checkOutTimestamp: now,
      checkedOutBy: coordinator.email,
    };

    this.addAuditLog({
      action: 'CHECK_OUT_SUCCESS',
      targetId: cleanPassId,
      userEmail: coordinator.email,
      userName: coordinator.name,
      timestamp: now,
      details: { participantName: participant.fullName },
    });

    this.persist();
    return { success: true, participant: this.participants[partIdx] };
  }

  addAuditLog(log: Omit<AuditLog, 'id'>) {
    this.auditLogs.unshift({
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    });
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
  }

  getAuditLogs(): AuditLog[] {
    this.init();
    return [...this.auditLogs];
  }
}

export const localStore = new LocalReactiveStore();

/**
 * Universal Data Service
 * Routes calls to Firebase Firestore when available, or to localStore for local testing.
 */
export const dataService = {
  // Settings
  async getSettings(): Promise<EventSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'eventSettings', 'primary');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as EventSettings;
        } else {
          // Auto-seed primary settings if not present
          try {
            await setDoc(docRef, DEFAULT_EVENT_SETTINGS);
            return DEFAULT_EVENT_SETTINGS;
          } catch {
            return DEFAULT_EVENT_SETTINGS;
          }
        }
      } catch (err) {
        console.warn('Firestore getSettings error, falling back:', err);
      }
    }
    return localStore.getSettings();
  },

  async updateSettings(settings: Partial<EventSettings>, email: string): Promise<EventSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'eventSettings', 'primary');
        await setDoc(docRef, settings, { merge: true });
        await dataService.logAudit({
          action: 'SETTINGS_UPDATED',
          targetId: 'primary',
          userEmail: email,
          timestamp: new Date().toISOString(),
          details: settings,
        });
        return (await this.getSettings());
      } catch (err) {
        console.warn('Firestore updateSettings error, using local:', err);
      }
    }
    return localStore.updateSettings(settings, email);
  },

  // Coordinators
  async getCoordinators(): Promise<Coordinator[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'coordinators');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coordinator));
        } else {
          // Auto-seed coordinators if collection is empty
          try {
            for (const c of SEED_COORDINATORS) {
              await setDoc(doc(db, 'coordinators', c.id), c);
            }
            return SEED_COORDINATORS;
          } catch {
            return SEED_COORDINATORS;
          }
        }
      } catch (err) {
        console.warn('Firestore getCoordinators error:', err);
      }
    }
    return localStore.getCoordinators();
  },

  async addCoordinator(coord: Omit<Coordinator, 'id' | 'createdAt'>): Promise<Coordinator> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'coordinators');
        const newDocRef = doc(colRef);
        const data = {
          ...coord,
          id: newDocRef.id,
          createdAt: new Date().toISOString(),
        };
        await setDoc(newDocRef, data);
        await dataService.logAudit({
          action: 'COORDINATOR_CREATED',
          targetId: newDocRef.id,
          userEmail: coord.assignedBy,
          timestamp: new Date().toISOString(),
          details: { email: coord.email, role: coord.role, name: coord.fullName },
        });
        return data;
      } catch (err) {
        console.warn('Firestore addCoordinator error:', err);
      }
    }
    return localStore.addCoordinator(coord);
  },

  async updateCoordinator(id: string, updates: Partial<Coordinator>, actorEmail: string): Promise<Coordinator | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'coordinators', id);
        await updateDoc(docRef, updates);
        return { ...(await getDoc(docRef)).data(), id } as Coordinator;
      } catch (err) {
        console.warn('Firestore updateCoordinator error:', err);
      }
    }
    return localStore.updateCoordinator(id, updates, actorEmail);
  },

  async removeCoordinator(id: string, actorEmail: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'coordinators', id);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        console.warn('Firestore removeCoordinator error:', err);
      }
    }
    return localStore.removeCoordinator(id, actorEmail);
  },

  // Participants & Registration
  async checkDuplicateRegistration(collegeId: string, email: string, mobile: string) {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'participants');
        const qCollege = query(colRef, where('collegeId', '==', collegeId.trim().toUpperCase()));
        const snapCollege = await getDocs(qCollege);
        if (!snapCollege.empty) return { isDuplicate: true, field: 'College ID' };

        const qEmail = query(colRef, where('email', '==', email.trim().toLowerCase()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) return { isDuplicate: true, field: 'Email Address' };

        const qMobile = query(colRef, where('mobile', '==', mobile.replace(/[^0-9]/g, '')));
        const snapMobile = await getDocs(qMobile);
        if (!snapMobile.empty) return { isDuplicate: true, field: 'Mobile Number' };

        return { isDuplicate: false };
      } catch (err) {
        console.warn('Firestore checkDuplicateRegistration fallback:', err);
      }
    }
    return localStore.checkDuplicateRegistration(collegeId, email, mobile);
  },

  async checkDuplicateUtr(utr: string): Promise<{ isDuplicate: boolean; existingPassId?: string; existingName?: string }> {
    if (!utr || utr.trim().length < 6) return { isDuplicate: false };
    const cleanUtr = utr.trim().toUpperCase();

    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'payments');
        const qUtr = query(colRef, where('ocrData.utr', '==', cleanUtr));
        const snapUtr = await getDocs(qUtr);
        if (!snapUtr.empty) {
          const docData = snapUtr.docs[0].data() as PaymentRecord;
          return { isDuplicate: true, existingPassId: docData.passId, existingName: docData.participantName };
        }
      } catch (err) {
        console.warn('Firestore checkDuplicateUtr fallback:', err);
      }
    }
    return localStore.checkDuplicateUtr(utr);
  },

  async createRegistration(
    participantData: Omit<Participant, 'id' | 'registeredAt' | 'passId' | 'passStatus' | 'paymentStatus' | 'entryStatus' | 'checkedIn'>,
    paymentData: {
      amount: number;
      expectedAmount: number;
      screenshotUrl: string;
      ocrData: PaymentRecord['ocrData'];
    }
  ): Promise<{ participant: Participant; payment: PaymentRecord }> {
    // Strict duplicate UTR rejection
    if (paymentData.ocrData?.utr) {
      const dupCheck = await this.checkDuplicateUtr(paymentData.ocrData.utr);
      if (dupCheck.isDuplicate) {
        throw new Error(
          `Duplicate UTR: This payment transaction (${paymentData.ocrData.utr}) is already registered on pass ${dupCheck.existingPassId}. Receipt recycling is rejected.`
        );
      }
    }

    const passId = generatePassId();
    const partId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const participant: Participant = {
      ...participantData,
      id: partId,
      collegeId: participantData.collegeId.trim().toUpperCase(),
      email: participantData.email.trim().toLowerCase(),
      mobile: participantData.mobile.replace(/[^0-9]/g, ''),
      emergencyMobile: participantData.emergencyMobile.replace(/[^0-9]/g, ''),
      registeredAt: now,
      passId,
      passStatus: 'pending_verification',
      paymentStatus: 'pending',
      entryStatus: 'not_entered',
      checkedIn: false,
      paymentId: payId,
    };

    const payment: PaymentRecord = {
      id: payId,
      participantId: partId,
      passId,
      participantName: participant.fullName,
      collegeId: participant.collegeId,
      department: participant.department,
      amount: paymentData.amount,
      expectedAmount: paymentData.expectedAmount,
      screenshotUrl: paymentData.screenshotUrl,
      submittedAt: now,
      status: 'pending',
      ocrData: paymentData.ocrData,
    };

    // Always store immediately in local reactive cache for instant UI rendering
    localStore.addRegistration(participant, payment);

    if (isFirebaseConfigured && db) {
      try {
        const partRef = doc(db, 'participants', partId);
        const payRef = doc(db, 'payments', payId);
        await setDoc(partRef, participant);
        await setDoc(payRef, payment);
      } catch (err) {
        console.warn('Firestore createRegistration sync error:', err);
      }
    }

    return { participant, payment };
  },

  async getParticipantByPassId(passId: string): Promise<Participant | null> {
    if (isFirebaseConfigured && db) {
      try {
        const clean = passId.trim().toUpperCase();
        const colRef = collection(db, 'participants');
        const q = query(colRef, where('passId', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          return { id: docSnap.id, ...docSnap.data() } as Participant;
        }
      } catch (err) {
        console.warn('Firestore getParticipantByPassId error:', err);
      }
    }
    return localStore.getParticipantByPassId(passId);
  },

  async getParticipants(): Promise<Participant[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'participants');
        const snap = await getDocs(colRef);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Participant));
      } catch (err) {
        console.warn('Firestore getParticipants error:', err);
      }
    }
    return localStore.getParticipants();
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'payments');
        const snap = await getDocs(colRef);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
      } catch (err) {
        console.warn('Firestore getPayments error:', err);
      }
    }
    return localStore.getPayments();
  },

  async verifyPayment(
    paymentId: string,
    coordinator: { uid: string; email: string; name: string },
    coordinatorNote?: string
  ) {
    if (isFirebaseConfigured && db) {
      try {
        const payRef = doc(db, 'payments', paymentId);
        const now = new Date().toISOString();
        await updateDoc(payRef, {
          status: 'verified',
          verifiedBy: coordinator,
          verifiedAt: now,
          coordinatorNote: coordinatorNote || null,
        });

        const paySnap = await getDoc(payRef);
        if (paySnap.exists()) {
          const payData = paySnap.data() as PaymentRecord;
          const partRef = doc(db, 'participants', payData.participantId);
          await updateDoc(partRef, {
            paymentStatus: 'verified',
            passStatus: 'active',
          });
        }
      } catch (err) {
        console.warn('Firestore verifyPayment error:', err);
      }
    }
    return localStore.verifyPayment(paymentId, coordinator, coordinatorNote);
  },

  async rejectPayment(
    paymentId: string,
    coordinator: { uid: string; email: string; name: string },
    rejectionReason: string
  ) {
    if (isFirebaseConfigured && db) {
      try {
        const payRef = doc(db, 'payments', paymentId);
        const now = new Date().toISOString();
        await updateDoc(payRef, {
          status: 'rejected',
          verifiedBy: coordinator,
          verifiedAt: now,
          rejectionReason,
        });

        const paySnap = await getDoc(payRef);
        if (paySnap.exists()) {
          const payData = paySnap.data() as PaymentRecord;
          const partRef = doc(db, 'participants', payData.participantId);
          await updateDoc(partRef, {
            paymentStatus: 'rejected',
            passStatus: 'pending_verification',
          });
        }
      } catch (err) {
        console.warn('Firestore rejectPayment error:', err);
      }
    }
    return localStore.rejectPayment(paymentId, coordinator, rejectionReason);
  },

  // Gate Check-in / Check-out
  async processCheckIn(
    passId: string,
    coordinator: { email: string; name?: string },
    gateId: string = 'Gate 1'
  ) {
    return localStore.processCheckIn(passId, coordinator, gateId);
  },

  async processCheckOut(
    passId: string,
    coordinator: { email: string; name?: string }
  ) {
    return localStore.processCheckOut(passId, coordinator);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'auditLogs');
        const q = query(colRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
      } catch (err) {
        console.warn('Firestore getAuditLogs error:', err);
      }
    }
    return localStore.getAuditLogs();
  },

  async logAudit(log: Omit<AuditLog, 'id'>) {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'auditLogs');
        await setDoc(doc(colRef), {
          ...log,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore logAudit error:', err);
      }
    }
    localStore.addAuditLog(log);
  },
};
