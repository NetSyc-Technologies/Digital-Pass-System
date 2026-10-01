'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  EventSettings,
  OcrExtractedData,
  Participant,
} from '@/types';
import { dataService } from '@/lib/services/dataService';
import {
  validateImageFile,
  compressImageToBase64,
  performOcrAnalysis,
} from '@/lib/services/imageOcrService';
import { useToast } from '@/context/ToastContext';
import {
  CreditCard,
  QrCode,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Eye,
  Info,
  Smartphone,
  ShieldAlert,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();

  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [activeReg, setActiveReg] = useState<Omit<Participant, 'id' | 'registeredAt' | 'passId' | 'passStatus' | 'paymentStatus' | 'entryStatus' | 'checkedIn'> | null>(null);

  // Upload & OCR states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OcrExtractedData | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // User verified/extracted fields for validation
  const [utrInput, setUtrInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<number>(150);

  // Real-time verification errors
  const [duplicateUtrError, setDuplicateUtrError] = useState<{
    isDuplicate: boolean;
    passId?: string;
    name?: string;
    utr?: string;
  } | null>(null);
  const [amountMismatchError, setAmountMismatchError] = useState<string | null>(null);
  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      const s = await dataService.getSettings();
      setSettings(s);
      if (s?.passPrice) {
        setAmountInput(s.passPrice);
      }

      // If user just created pass and is navigating, avoid redirecting back
      const justSubmitted = typeof window !== 'undefined' ? sessionStorage.getItem('tgpcet_just_submitted') : null;
      if (justSubmitted) {
        router.push(`/pass?passId=${encodeURIComponent(justSubmitted)}`);
        return;
      }

      // Load active registration from sessionStorage or local drafts
      let saved = typeof window !== 'undefined' ? sessionStorage.getItem('tgpcet_active_registration') : null;
      if (!saved && typeof window !== 'undefined') {
        saved = sessionStorage.getItem('tgpcet_reg_draft');
      }
      if (!saved && typeof localStorage !== 'undefined') {
        saved = localStorage.getItem('tgpcet_active_registration');
      }

      if (!saved) {
        toastError('No Registration in Progress', 'Please fill the registration form first.');
        router.push('/register');
        return;
      }
      try {
        setActiveReg(JSON.parse(saved));
      } catch {
        router.push('/register');
      }
    }
    init();
  }, [router, toastError]);

  const copyUpiToClipboard = () => {
    if (!settings) return;
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    toastInfo('UPI ID Copied', settings.upiId);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Check duplicate UTR against database
  const verifyUtrUniqueness = async (utrCandidate: string) => {
    const cleanUtr = utrCandidate.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      setDuplicateUtrError(null);
      return;
    }

    try {
      const res = await dataService.checkDuplicateUtr(cleanUtr);
      if (res.isDuplicate) {
        setDuplicateUtrError({
          isDuplicate: true,
          passId: res.existingPassId,
          name: res.existingName,
          utr: cleanUtr,
        });
        toastError(
          'DUPLICATE PAYMENT REJECTED',
          `Transaction ID ${cleanUtr} has already been used on pass ${res.existingPassId}.`
        );
      } else {
        setDuplicateUtrError(null);
      }
    } catch {
      // Ignore
    }
  };

  // Validate amount match against required pass fee
  const verifyAmountMatch = (amountCandidate: number) => {
    const expected = settings?.passPrice ?? 150;
    if (amountCandidate < expected) {
      const errMsg = `Amount Insufficient: Screenshot indicates ₹${amountCandidate}, but the required pass fee is ₹${expected}. Full payment of ₹${expected} is required.`;
      setAmountMismatchError(errMsg);
      toastError('Payment Amount Insufficient', `Required pass fee is ₹${expected}.`);
    } else {
      setAmountMismatchError(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toastError('Invalid Image File', validation.error);
      return;
    }

    setSelectedFile(file);
    setIsProcessingOcr(true);
    setOcrProgress(15);
    setOcrData(null);
    setDuplicateUtrError(null);
    setAmountMismatchError(null);

    try {
      // 1. Client-side canvas compression to Base64
      const compressedBase64 = await compressImageToBase64(file);
      setPreviewUrl(compressedBase64);
      setBase64Image(compressedBase64);
      setOcrProgress(40);

      // 2. Perform intelligent OCR analysis
      const expectedAmt = settings?.passPrice ?? 150;
      const extracted = await performOcrAnalysis(compressedBase64, expectedAmt, (prog) => {
        setOcrProgress(prog);
      });

      setOcrData(extracted);

      // Set detected UTR & run duplicate verification
      const detectedUtr = extracted.utr || '';
      setUtrInput(detectedUtr);
      if (detectedUtr) {
        await verifyUtrUniqueness(detectedUtr);
      }

      // Set detected Amount & run price comparison
      const detectedAmount = extracted.amount ?? expectedAmt;
      setAmountInput(detectedAmount);
      verifyAmountMatch(detectedAmount);

      if (extracted.utr) {
        toastSuccess('Receipt Details Detected', `Extracted UTR: ${extracted.utr}`);
      } else {
        toastInfo('Receipt Uploaded', 'Please confirm or enter the 12-digit UTR from your receipt.');
      }
    } catch (err) {
      console.warn('OCR processing error:', err);
      toastInfo('Image Uploaded', 'Image saved. Please enter the 12-digit UTR manually.');
      setOcrData({
        confidence: 'manual_review',
        rawText: 'Manual entry required.',
      });
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleProceedToPass = async () => {
    if (!activeReg) {
      toastError('Registration missing', 'Please re-fill registration details.');
      router.push('/register');
      return;
    }

    if (!base64Image) {
      toastError('Payment Screenshot Required', 'Please upload a screenshot or photo of your UPI payment receipt.');
      return;
    }

    const expectedAmt = settings?.passPrice ?? 150;

    // 1. Mandatory Amount Match Check
    if (amountInput < expectedAmt) {
      toastError(
        'Amount Mismatch',
        `Payment amount of ₹${amountInput} is less than required ₹${expectedAmt}. Full pass payment is mandatory.`
      );
      return;
    }

    // 2. Mandatory UTR Check & Duplicate Rejection
    if (!utrInput || utrInput.trim().length < 6) {
      toastError(
        'UTR / Transaction ID Required',
        'Please enter the 12-digit UTR or Reference Number from your payment receipt.'
      );
      return;
    }

    const dupCheck = await dataService.checkDuplicateUtr(utrInput.trim());
    if (dupCheck.isDuplicate) {
      setDuplicateUtrError({
        isDuplicate: true,
        passId: dupCheck.existingPassId,
        name: dupCheck.existingName,
        utr: utrInput.trim(),
      });
      toastError(
        'DUPLICATE PAYMENT REJECTED',
        `This UTR (${utrInput.trim()}) is already registered on pass ${dupCheck.existingPassId}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ocrPayload: OcrExtractedData = {
        ...(ocrData || { confidence: 'manual_review' }),
        utr: utrInput.trim().toUpperCase(),
        amount: amountInput,
      };

      const result = await dataService.createRegistration(activeReg, {
        amount: amountInput,
        expectedAmount: expectedAmt,
        screenshotUrl: base64Image,
        ocrData: ocrPayload,
      });

      // Save flags for pass auto-download and local persistence
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tgpcet_just_submitted', result.participant.passId);
        sessionStorage.setItem('tgpcet_auto_download', result.participant.passId);
        localStorage.setItem('tgpcet_last_pass_id', result.participant.passId);
      }

      toastSuccess(
        'Pass Generated Successfully!',
        'Your Digital Pass has been created with status: Pending Verification.'
      );

      // Navigate cleanly to pass view with autodownload trigger
      router.push(`/pass?passId=${encodeURIComponent(result.participant.passId)}&autodownload=true`);
    } catch (err: unknown) {
      console.error('Registration submission error:', err);
      toastError('Submission Error', err instanceof Error ? err.message : 'Failed to save registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upiLink = settings
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
        settings.payeeName
      )}&am=${settings.passPrice}&cu=INR&tn=TGPCET Garba Pass`
    : '#';

  const isBlocked = Boolean(duplicateUtrError?.isDuplicate || amountMismatchError);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment & Anti-Fraud Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Complete Gate Pass Payment</h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Scan the official TGPCET Garba QR code below, pay the exact pass fee, and upload the payment receipt screenshot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Official Payment QR Code & Instructions */}
        <div className="lg:col-span-6 festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
              Official QR Code
            </span>
            <h3 className="text-xl font-black text-white">Scan to Pay with Any UPI App</h3>
            <p className="text-xs text-slate-300">
              GPay, PhonePe, Paytm, BHIM, CRED or Any Banking App
            </p>
          </div>

          {/* Prominent Payment QR Image Display */}
          <div className="relative mx-auto max-w-[280px] aspect-square rounded-2xl overflow-hidden p-2 bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 shadow-2xl shadow-amber-500/20 group">
            <div className="w-full h-full relative rounded-xl overflow-hidden bg-white">
              <Image
                src={settings?.payQrUrl || '/payqr.png'}
                alt="TGPCET Garba Night Official Payment QR Code"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
          </div>

          {/* Amount Highlight Card */}
          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Required Pass Amount</p>
              <p className="text-2xl font-black text-gradient-gold">
                ₹{settings?.passPrice ?? 150}
              </p>
            </div>
            <a
              href={upiLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-purple-950 hover:bg-amber-400 transition-colors shadow-md"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open UPI App</span>
            </a>
          </div>

          {/* UPI ID & Copy */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              Official UPI VPA ID
            </label>
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-black/40 border border-amber-500/30 text-xs">
              <code className="text-amber-300 font-mono font-bold select-all truncate">
                {settings?.upiId || 'tgpcetgarba@upi'}
              </code>
              <button
                onClick={copyUpiToClipboard}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold transition-colors shrink-0"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Strict Payment Instructions */}
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs text-amber-200">
            <p className="font-bold flex items-center gap-1.5 text-amber-300">
              <Info className="w-4 h-4 shrink-0" />
              <span>Crucial Payment Guidelines:</span>
            </p>
            <ul className="space-y-1 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
              <li>Pay the exact specified amount (₹{settings?.passPrice ?? 150}).</li>
              <li>Keep the 12-digit UTR / UPI Reference Number clearly visible in your screenshot.</li>
              <li>Each receipt can only be used ONCE. Duplicate UTR submissions are automatically rejected.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Receipt Upload & Intelligent OCR Analysis */}
        <div className="lg:col-span-6 space-y-6">
          <div className="festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-amber-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-white">Upload Payment Receipt</h3>
                <p className="text-xs text-slate-300">Screenshot of your completed UPI transaction</p>
              </div>
              <UploadCloud className="w-6 h-6 text-amber-400" />
            </div>

            {/* Drag & Drop / File Input Box */}
            <div className="space-y-3">
              <label
                htmlFor="receipt-upload"
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                  duplicateUtrError?.isDuplicate
                    ? 'border-rose-500 bg-rose-950/30'
                    : previewUrl
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-amber-500/40 hover:border-amber-400 bg-purple-950/30 hover:bg-purple-950/50'
                }`}
              >
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />

                {isProcessingOcr ? (
                  <div className="text-center space-y-3 py-4">
                    <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-white">Analyzing Payment Receipt...</p>
                      <p className="text-xs text-amber-300">Checking UTR uniqueness & amount match</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-48 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  </div>
                ) : previewUrl ? (
                  <div className="w-full space-y-4">
                    <div className="relative w-full h-52 rounded-xl overflow-hidden bg-black/60 border border-white/10">
                      <Image
                        src={previewUrl}
                        alt="Uploaded payment screenshot"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Click to replace with a different screenshot</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Click or tap to upload receipt</p>
                    <p className="text-xs text-slate-400">Supports JPG, PNG, WebP (Max 8MB)</p>
                  </div>
                )}
              </label>
            </div>

            {/* FRAUD ALERT: DUPLICATE UTR DETECTED & REJECTED */}
            {duplicateUtrError?.isDuplicate && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 flex items-start gap-3.5 text-rose-100 text-xs animate-in zoom-in-95 shadow-xl">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-rose-300 uppercase tracking-wide">
                    🚨 Duplicate Receipt Detected – Submission Blocked!
                  </p>
                  <p className="leading-relaxed">
                    The 12-digit UTR / Reference number <code className="font-mono font-bold bg-black/50 px-1 py-0.5 rounded text-white">{duplicateUtrError.utr}</code> has <strong className="text-white">already been used</strong> for registration: <strong className="text-amber-300 font-mono">{duplicateUtrError.passId}</strong>.
                  </p>
                  <p className="text-[11px] text-rose-300/90 font-medium pt-1">
                    Reusing or recycling payment receipts is strictly prohibited by event security. Please upload your own original receipt.
                  </p>
                </div>
              </div>
            )}

            {/* AMOUNT MISMATCH ERROR */}
            {amountMismatchError && (
              <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 flex items-start gap-3 text-amber-200 text-xs animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-amber-300">
                    Payment Amount Insufficient / Mismatch
                  </p>
                  <p className="leading-relaxed">{amountMismatchError}</p>
                </div>
              </div>
            )}

            {/* Extracted Receipt Data & Manual Confirmation Fields */}
            {previewUrl && (
              <div className="p-5 rounded-2xl bg-purple-950/60 border border-purple-500/30 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Receipt Data & Verification
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      duplicateUtrError?.isDuplicate
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : amountMismatchError
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    }`}
                  >
                    {duplicateUtrError?.isDuplicate
                      ? 'Duplicate Rejected'
                      : amountMismatchError
                      ? 'Amount Mismatch'
                      : 'Receipt Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* UTR Input & Validation */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase">
                        12-Digit UTR / Ref Number <span className="text-rose-400">*</span>
                      </label>
                      {utrInput && !duplicateUtrError?.isDuplicate && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Unique Transaction
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="e.g. 428901847291"
                      value={utrInput}
                      onChange={(e) => {
                        const val = e.target.value.trim().toUpperCase();
                        setUtrInput(val);
                        verifyUtrUniqueness(val);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-black/50 border font-mono text-sm font-bold text-amber-300 focus:outline-none focus:ring-2 ${
                        duplicateUtrError?.isDuplicate
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-amber-500/40 focus:ring-amber-500'
                      }`}
                    />
                    <p className="text-[10px] text-slate-400">
                      Auto-extracted by OCR. You can verify and correct digits if needed.
                    </p>
                  </div>

                  {/* Amount Check & Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase">
                      Paid Amount (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setAmountInput(val);
                        verifyAmountMatch(val);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-black/50 border font-bold text-sm text-white focus:outline-none focus:ring-2 ${
                        amountMismatchError
                          ? 'border-amber-500 focus:ring-amber-500 text-rose-300'
                          : 'border-emerald-500/40 focus:ring-emerald-500 text-emerald-300'
                      }`}
                    />
                    <p className="text-[10px] text-slate-400">
                      Required pass fee: ₹{settings?.passPrice ?? 150}
                    </p>
                  </div>

                  {/* Payment App */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase">
                      Detected App
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-200 text-xs font-semibold">
                      {ocrData?.paymentApp || 'UPI App / Bank'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Participant Quick Confirmation */}
            {activeReg && (
              <div className="text-xs text-slate-300 p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p>
                  Issuing pass to: <span className="font-bold text-white">{activeReg.fullName}</span> (
                  <span className="text-amber-300 font-mono">{activeReg.collegeId}</span>)
                </p>
                <p className="text-slate-400">{activeReg.department}</p>
              </div>
            )}

            {/* Proceed Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedToPass}
                disabled={!base64Image || isSubmitting || isProcessingOcr || isBlocked}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  isBlocked
                    ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying & Generating Digital Pass...</span>
                  </>
                ) : isBlocked ? (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Submission Blocked – Fix Issues Above</span>
                  </>
                ) : (
                  <>
                    <span>Proceed & Generate Digital Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 mt-2">
                {isBlocked
                  ? 'Resolve duplicate UTR or amount mismatch before continuing.'
                  : 'Your pass will be generated instantly with status: Pending Verification'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
