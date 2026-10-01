'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/services/dataService';
import { PaymentRecord, PaymentStatus, EventSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  FileText,
  Check,
  X,
  Loader2,
  Maximize2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function PaymentDashboardPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: pending, verified, rejected, all
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Modals
  const [inspectPayment, setInspectPayment] = useState<PaymentRecord | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState<string | null>(null);

  // Verification & Rejection form states
  const [verificationNote, setVerificationNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConfirmVerify, setShowConfirmVerify] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allPayments, s] = await Promise.all([
        dataService.getPayments(),
        dataService.getSettings(),
      ]);
      setPayments(allPayments);
      setSettings(s);
      setLoading(false);
    }
    loadData();
  }, []);

  // Compute duplicate UTRs across all payments
  const utrOccurrenceMap: Record<string, string[]> = {};
  payments.forEach((p) => {
    const utr = p.ocrData?.utr?.trim();
    if (utr && utr.length >= 8) {
      if (!utrOccurrenceMap[utr]) utrOccurrenceMap[utr] = [];
      utrOccurrenceMap[utr].push(p.passId);
    }
  });

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.participantName.toLowerCase().includes(q) ||
      p.collegeId.toLowerCase().includes(q) ||
      p.passId.toLowerCase().includes(q) ||
      (p.ocrData?.utr && p.ocrData.utr.includes(q)) ||
      (p.ocrData?.transactionId && p.ocrData.transactionId.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleVerify = async () => {
    if (!inspectPayment || !user) return;
    setIsActionInProgress(true);
    try {
      const res = await dataService.verifyPayment(
        inspectPayment.id,
        { uid: user.uid, email: user.email, name: user.fullName },
        verificationNote.trim() || undefined
      );

      if (res.success && res.payment) {
        setPayments((prev) =>
          prev.map((p) => (p.id === inspectPayment.id ? res.payment! : p))
        );
        toastSuccess(
          'Payment Approved',
          `Pass ${inspectPayment.passId} is now Active and verified for entry.`
        );
        setShowConfirmVerify(false);
        setInspectPayment(null);
        setVerificationNote('');
      } else {
        toastError('Verification Failed', res.error || 'Could not verify payment.');
      }
    } catch {
      toastError('Verification Error', 'An unexpected error occurred.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!inspectPayment || !user) return;
    if (!rejectionReason.trim()) {
      toastError('Rejection Reason Required', 'Please provide a clear reason for the participant.');
      return;
    }

    setIsActionInProgress(true);
    try {
      const res = await dataService.rejectPayment(
        inspectPayment.id,
        { uid: user.uid, email: user.email, name: user.fullName },
        rejectionReason.trim()
      );

      if (res.success && res.payment) {
        setPayments((prev) =>
          prev.map((p) => (p.id === inspectPayment.id ? res.payment! : p))
        );
        toastSuccess('Payment Rejected', `Marked pass ${inspectPayment.passId} as rejected.`);
        setShowConfirmReject(false);
        setInspectPayment(null);
        setRejectionReason('');
      } else {
        toastError('Rejection Failed', res.error || 'Could not reject payment.');
      }
    } catch {
      toastError('Rejection Error', 'An unexpected error occurred.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const countPending = payments.filter((p) => p.status === 'pending').length;
  const countVerified = payments.filter((p) => p.status === 'verified').length;
  const countRejected = payments.filter((p) => p.status === 'rejected').length;

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'payment_coordinator']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white">Payment Verification Center</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Inspect uploaded UPI receipts, cross-reference OCR-extracted UTR numbers, detect duplicate transactions, and approve passes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30 text-xs font-bold">
              Reviewer: {user?.fullName || user?.email}
            </span>
          </div>
        </div>

        {/* Queue Tabs & Search */}
        <div className="festive-glass rounded-2xl p-4 border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-purple-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Queue ({countPending})</span>
            </button>

            <button
              onClick={() => setActiveTab('verified')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'verified'
                  ? 'bg-emerald-500 text-purple-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified ({countVerified})</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Rejected ({countRejected})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              All Records ({payments.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by UTR, Name, Pass ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* PAYMENTS QUEUE TABLE */}
        <div className="festive-glass rounded-3xl border-amber-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a24] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Pass ID / Participant</th>
                  <th className="py-3.5 px-4">Amount & Status</th>
                  <th className="py-3.5 px-4">OCR Extracted Data</th>
                  <th className="py-3.5 px-4">Duplicate UTR Alert</th>
                  <th className="py-3.5 px-4">Submission Time</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No payment submissions found in this queue.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const utr = p.ocrData?.utr?.trim();
                    const duplicatePasses = utr && utrOccurrenceMap[utr] ? utrOccurrenceMap[utr].filter((id) => id !== p.passId) : [];
                    const hasDuplicate = duplicatePasses.length > 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-white/5 transition-colors ${
                          hasDuplicate ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-amber-300">{p.passId}</p>
                          <p className="font-bold text-white text-sm">{p.participantName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.collegeId}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-black text-white text-base">₹{p.amount}</p>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                              p.status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-white font-mono font-bold">
                              UTR: <span className="text-amber-300">{p.ocrData?.utr || 'Not Found'}</span>
                            </p>
                            {p.ocrData?.paymentApp && (
                              <p className="text-[10px] text-slate-400">App: {p.ocrData.paymentApp}</p>
                            )}
                            {p.ocrData?.paymentDate && (
                              <p className="text-[10px] text-slate-400">{p.ocrData.paymentDate}</p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {hasDuplicate ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>DUPLICATE UTR! (Also in {duplicatePasses.join(', ')})</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">— Unique —</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(p.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          <br />
                          <span className="text-[10px]">{new Date(p.submittedAt).toLocaleDateString()}</span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setInspectPayment(p);
                              setShowConfirmVerify(false);
                              setShowConfirmReject(false);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-purple-950 font-bold text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect & Verify</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INSPECT & VERIFY MODAL */}
        {inspectPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="max-w-4xl w-full max-h-[92vh] festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6 overflow-y-auto border-amber-500/40 animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Payment Verification Inspector
                  </span>
                  <h3 className="text-2xl font-black text-white">{inspectPayment.participantName}</h3>
                  <p className="text-xs text-amber-300 font-mono font-bold">{inspectPayment.passId}</p>
                </div>
                <button
                  onClick={() => setInspectPayment(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Duplicate UTR Alert Warning */}
              {(() => {
                const utr = inspectPayment.ocrData?.utr?.trim();
                const dupes = utr && utrOccurrenceMap[utr] ? utrOccurrenceMap[utr].filter((id) => id !== inspectPayment.passId) : [];
                if (dupes.length > 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-start gap-3 text-rose-200 text-xs">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-rose-300">
                          CRITICAL FRAUD WARNING: Duplicate UTR Number!
                        </p>
                        <p className="mt-1">
                          The 12-digit UTR <code className="font-mono font-bold text-white bg-black/40 px-1 py-0.5 rounded">{utr}</code> has already been submitted on another pass: <strong className="text-amber-300">{dupes.join(', ')}</strong>.
                        </p>
                        <p className="mt-1 text-[11px] text-rose-300 font-medium">
                          Do not approve if the same bank transaction is being recycled.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Screenshot Viewer with Pan-Zoom trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Payment Screenshot
                    </span>
                    <button
                      onClick={() => setShowScreenshotModal(inspectPayment.screenshotUrl)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Fullscreen Zoom</span>
                    </button>
                  </div>
                  <div
                    onClick={() => setShowScreenshotModal(inspectPayment.screenshotUrl)}
                    className="relative h-72 rounded-2xl overflow-hidden bg-black/70 border border-amber-500/30 cursor-pointer group"
                  >
                    <Image
                      src={inspectPayment.screenshotUrl}
                      alt="Uploaded Screenshot"
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>

                {/* OCR & Bank Details Comparison */}
                <div className="space-y-4">
                  <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-500/30 space-y-3 text-xs">
                    <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>OCR Extracted Data</span>
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded-xl bg-black/30">
                        <span className="text-slate-400">12-Digit UTR:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {inspectPayment.ocrData?.utr || 'Manual Inspection Required'}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-xl bg-black/30">
                        <span className="text-slate-400">Transaction ID:</span>
                        <span className="font-mono font-bold text-white truncate max-w-[180px]">
                          {inspectPayment.ocrData?.transactionId || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-xl bg-black/30">
                        <span className="text-slate-400">Payer Name:</span>
                        <span className="font-bold text-white">
                          {inspectPayment.ocrData?.payerName || inspectPayment.participantName}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-xl bg-black/30">
                        <span className="text-slate-400">Payment App:</span>
                        <span className="font-bold text-white">
                          {inspectPayment.ocrData?.paymentApp || 'Generic UPI'}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-xl bg-black/30">
                        <span className="text-slate-400">Detected Amount:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{inspectPayment.amount} (Expected: ₹{inspectPayment.expectedAmount})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Decision Controls */}
                  <div className="space-y-3 pt-2">
                    {/* If Pending */}
                    {inspectPayment.status === 'pending' ? (
                      <div className="space-y-3">
                        {/* Verify Section */}
                        {!showConfirmReject && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Optional coordinator verification note..."
                              value={verificationNote}
                              onChange={(e) => setVerificationNote(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleVerify}
                              disabled={isActionInProgress}
                              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isActionInProgress ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span>Approve & Verify Payment (Activate Pass)</span>
                            </button>
                          </div>
                        )}

                        {/* Reject Toggle */}
                        {!showConfirmReject ? (
                          <button
                            type="button"
                            onClick={() => setShowConfirmReject(true)}
                            className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-colors"
                          >
                            Reject Payment Submission
                          </button>
                        ) : (
                          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                            <label className="block text-xs font-bold text-rose-300">
                              Mandatory Rejection Reason:
                            </label>
                            <textarea
                              rows={2}
                              required
                              placeholder="e.g. UTR not found in bank statement, amount is partial, screenshot is blurry..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-rose-500/50 text-xs text-white focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowConfirmReject(false)}
                                className="px-3 py-1.5 rounded-lg text-xs text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleReject}
                                disabled={isActionInProgress || !rejectionReason.trim()}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50"
                              >
                                {isActionInProgress ? 'Rejecting...' : 'Confirm Rejection'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1 text-center">
                        <p className="font-bold text-white">This payment is already {inspectPayment.status.toUpperCase()}.</p>
                        {inspectPayment.verifiedBy && (
                          <p className="text-[11px] text-slate-400">
                            Processed by {inspectPayment.verifiedBy.name} ({inspectPayment.verifiedBy.email})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN SCREENSHOT PREVIEW MODAL */}
        {showScreenshotModal && (
          <div
            onClick={() => setShowScreenshotModal(null)}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full max-h-[90vh] festive-glass rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Payment Receipt Fullscreen Zoom</span>
                <button
                  onClick={() => setShowScreenshotModal(null)}
                  className="p-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full h-[70vh] bg-black rounded-xl overflow-hidden">
                <Image
                  src={showScreenshotModal}
                  alt="Receipt Fullscreen"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
