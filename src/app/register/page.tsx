'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DEPARTMENTS,
  YEARS_OF_STUDY,
  Department,
  YearOfStudy,
  EventSettings,
} from '@/types';
import { dataService } from '@/lib/services/dataService';
import { useToast } from '@/context/ToastContext';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    collegeId: '',
    fullName: '',
    department: 'Information Technology (IT)' as Department,
    year: '1st Year' as YearOfStudy,
    email: '',
    mobile: '',
    emergencyMobile: '',
    consentRules: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchSettings() {
      const data = await dataService.getSettings();
      setSettings(data);
    }
    fetchSettings();

    // Check if there was existing partial draft in sessionStorage
    const saved = sessionStorage.getItem('tgpcet_reg_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  // Normalization helpers
  const normalizeEmail = (val: string) => val.trim().toLowerCase();
  const normalizeMobile = (val: string) => val.replace(/[^0-9]/g, '');

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.collegeId.trim()) {
      errs.collegeId = 'College ID is required (e.g., TGPCET/2023/IT/042).';
    } else if (formData.collegeId.trim().length < 3) {
      errs.collegeId = 'Enter a valid College ID.';
    }

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your complete legal name.';
    }

    if (!formData.department) {
      errs.department = 'Please select your department.';
    }

    if (!formData.year) {
      errs.year = 'Please select your current year of study.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    const emailNorm = normalizeEmail(formData.email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNorm) {
      errs.email = 'Email Address is required.';
    } else if (!emailRegex.test(emailNorm)) {
      errs.email = 'Please enter a valid email address.';
    }

    const mobileNorm = normalizeMobile(formData.mobile);
    if (!mobileNorm) {
      errs.mobile = 'Mobile Number is required.';
    } else if (mobileNorm.length !== 10) {
      errs.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    const emergencyNorm = normalizeMobile(formData.emergencyMobile);
    if (!emergencyNorm) {
      errs.emergencyMobile = 'Emergency Contact Number is required.';
    } else if (emergencyNorm.length !== 10) {
      errs.emergencyMobile = 'Please enter a valid 10-digit emergency number.';
    } else if (emergencyNorm === mobileNorm) {
      errs.emergencyMobile = 'Emergency contact must be different from your personal mobile number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!formData.consentRules) {
      errs.consentRules = 'You must accept the event guidelines and campus security rules.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) {
        sessionStorage.setItem('tgpcet_reg_draft', JSON.stringify(formData));
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        // Pre-check duplicates before step 3
        setIsSubmitting(true);
        try {
          const duplicateCheck = await dataService.checkDuplicateRegistration(
            formData.collegeId,
            formData.email,
            formData.mobile
          );

          if (duplicateCheck.isDuplicate) {
            toastError(
              'Duplicate Registration Detected',
              `A pass has already been issued or registered with this ${duplicateCheck.field}. You can retrieve your pass directly.`
            );
            setErrors({
              general: `A registration already exists with this ${duplicateCheck.field}. Please check if you already created a pass.`,
            });
            setIsSubmitting(false);
            return;
          }

          sessionStorage.setItem('tgpcet_reg_draft', JSON.stringify(formData));
          setStep(3);
        } catch {
          // If error occurs in check, proceed
          setStep(3);
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    try {
      // Re-verify duplicates atomically
      const duplicateCheck = await dataService.checkDuplicateRegistration(
        formData.collegeId,
        formData.email,
        formData.mobile
      );

      if (duplicateCheck.isDuplicate) {
        toastError(
          'Already Registered',
          `This ${duplicateCheck.field} is already registered. Redirecting to pass retrieval.`
        );
        router.push(`/pass?query=${encodeURIComponent(formData.collegeId)}`);
        return;
      }

      // Store validated payload in session for payment submission
      sessionStorage.setItem('tgpcet_active_registration', JSON.stringify(formData));
      toastSuccess('Registration Details Saved', 'Proceeding to secure payment page...');
      router.push('/payment');
    } catch {
      toastError('Registration Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Registration Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TGPCET Garba Night 2024</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Participant Registration</h1>
        <p className="text-slate-300 text-sm max-w-lg mx-auto">
          Complete the 3-step registration to purchase your official Digital Gate Pass.
        </p>
      </div>

      {/* Step Tracker Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          {/* Progress bar background line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step >= 1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Profile</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step >= 2
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Contact</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === 3
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Consent & Pay</span>
          </div>
        </div>
      </div>

      {/* Main Glass Form Card */}
      <div className="festive-glass-glow rounded-3xl p-6 sm:p-10 space-y-6">
        {errors.general && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{errors.general}</p>
              <Link
                href="/pass"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-300 underline font-semibold hover:text-amber-200"
              >
                Go to Pass Retrieval page &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* STEP 1: Academic & Identity Info */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Student Identification & Department</h2>
            </div>

            {/* College ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                College ID / Enrollment Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TGPCET/2023/IT/042 or 2201048"
                value={formData.collegeId}
                onChange={(e) => {
                  setFormData({ ...formData, collegeId: e.target.value.toUpperCase() });
                  if (errors.collegeId) setErrors({ ...errors, collegeId: '' });
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-purple-950/40 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.collegeId ? 'border-rose-500' : 'border-amber-500/30'
                }`}
              />
              {errors.collegeId ? (
                <p className="text-xs text-rose-400">{errors.collegeId}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Must match your physical College ID card.</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Full Name (as per College Records) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Ramesh Deshmukh"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-purple-950/40 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.fullName ? 'border-rose-500' : 'border-amber-500/30'
                }`}
              />
              {errors.fullName && <p className="text-xs text-rose-400">{errors.fullName}</p>}
            </div>

            {/* Department Dropdown (EXACT LIST) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Department / Program <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value as Department });
                  if (errors.department) setErrors({ ...errors, department: '' });
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-[#160d2b] border text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.department ? 'border-rose-500' : 'border-amber-500/30'
                }`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#160d2b] text-white">
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <p className="text-xs text-rose-400">{errors.department}</p>}
            </div>

            {/* Year of Study Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Year of Study <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) => {
                  setFormData({ ...formData, year: e.target.value as YearOfStudy });
                  if (errors.year) setErrors({ ...errors, year: '' });
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-[#160d2b] border text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.year ? 'border-rose-500' : 'border-amber-500/30'
                }`}
              >
                {YEARS_OF_STUDY.map((yr) => (
                  <option key={yr} value={yr} className="bg-[#160d2b] text-white">
                    {yr}
                  </option>
                ))}
              </select>
              {/* Program-specific helper info */}
              {(formData.department.includes('MBA') ||
                formData.department.includes('MCA') ||
                formData.department.includes('Polytechnic')) && (
                <p className="text-[11px] text-amber-300/80">
                  Note: For 2-year or 3-year programs, please select your applicable current year (1st, 2nd, or 3rd).
                </p>
              )}
              {errors.year && <p className="text-xs text-rose-400">{errors.year}</p>}
            </div>
          </div>
        )}

        {/* STEP 2: Contact Information */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <Phone className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Contact & Emergency Coordinates</h2>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. yourname@gmail.com or student@tgpcet.edu"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-purple-950/40 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.email ? 'border-rose-500' : 'border-amber-500/30'
                }`}
              />
              {errors.email ? (
                <p className="text-xs text-rose-400">{errors.email}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Your pass details and verification updates will be associated with this email.</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Mobile Number (WhatsApp Enabled) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={(e) => {
                    setFormData({ ...formData, mobile: normalizeMobile(e.target.value) });
                    if (errors.mobile) setErrors({ ...errors, mobile: '' });
                  }}
                  className={`w-full pl-14 pr-4 py-3.5 rounded-xl bg-purple-950/40 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    errors.mobile ? 'border-rose-500' : 'border-amber-500/30'
                  }`}
                />
              </div>
              {errors.mobile && <p className="text-xs text-rose-400">{errors.mobile}</p>}
            </div>

            {/* Emergency Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 tracking-wide uppercase">
                Emergency Mobile Number (Parent / Guardian) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Parent or Guardian's 10-digit number"
                  value={formData.emergencyMobile}
                  onChange={(e) => {
                    setFormData({ ...formData, emergencyMobile: normalizeMobile(e.target.value) });
                    if (errors.emergencyMobile) setErrors({ ...errors, emergencyMobile: '' });
                  }}
                  className={`w-full pl-14 pr-4 py-3.5 rounded-xl bg-purple-950/40 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    errors.emergencyMobile ? 'border-rose-500' : 'border-amber-500/30'
                  }`}
                />
              </div>
              {errors.emergencyMobile ? (
                <p className="text-xs text-rose-400">{errors.emergencyMobile}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Strictly required for campus security and emergency safety protocol.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Review & Event Consent */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Review Summary & Campus Code Consent</h2>
            </div>

            {/* Registration Summary Box */}
            <div className="bg-purple-950/50 rounded-2xl p-5 border border-purple-500/30 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400 font-medium">Participant Name</span>
                <span className="text-white font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400 font-medium">College ID</span>
                <span className="text-amber-300 font-bold">{formData.collegeId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400 font-medium">Department</span>
                <span className="text-white font-bold text-right max-w-[200px] truncate">
                  {formData.department}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400 font-medium">Year</span>
                <span className="text-white font-bold">{formData.year}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400 font-medium">Pass Fee</span>
                <span className="text-emerald-400 font-extrabold text-base">
                  ₹{settings?.passPrice ?? 150}
                </span>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/15 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.consentRules}
                  onChange={(e) => {
                    setFormData({ ...formData, consentRules: e.target.checked });
                    if (errors.consentRules) setErrors({ ...errors, consentRules: '' });
                  }}
                  className="w-5 h-5 rounded mt-0.5 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-200 leading-relaxed">
                  I hereby certify that all information provided is accurate and corresponds to my official College ID. I agree to abide by all TGPCET Garba Night regulations, maintain discipline, carry my physical ID card upon entry, and understand that registration fees are non-refundable.
                </span>
              </label>
              {errors.consentRules && <p className="text-xs text-rose-400">{errors.consentRules}</p>}
            </div>
          </div>
        )}

        {/* Buttons / Controls */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold festive-glass text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-300 transition-colors font-medium"
            >
              Cancel
            </Link>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Continue to Pay (₹{settings?.passPrice ?? 150})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
