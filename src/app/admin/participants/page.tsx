'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import AdminNav from '@/components/admin/AdminNav';
import { dataService } from '@/lib/services/dataService';
import {
  Participant,
  PaymentRecord,
  Department,
  DEPARTMENTS,
  PaymentStatus,
  EntryStatus,
  AuditLog,
} from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';

export default function ParticipantsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [entryStatusFilter, setEntryStatusFilter] = useState<string>('ALL');

  // Selected participant for drawer view
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [partList, payList, logs] = await Promise.all([
        dataService.getParticipants(),
        dataService.getPayments(),
        dataService.getAuditLogs(),
      ]);
      setParticipants(partList);
      setPayments(payList);
      setAuditLogs(logs);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter logic
  const filteredParticipants = participants.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.collegeId.toLowerCase().includes(q) ||
      p.passId.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.mobile.includes(q);

    const matchesDept = deptFilter === 'ALL' || p.department === deptFilter;
    const matchesYear = yearFilter === 'ALL' || p.year === yearFilter;
    const matchesPayment =
      paymentStatusFilter === 'ALL' || p.paymentStatus === paymentStatusFilter;
    const matchesEntry =
      entryStatusFilter === 'ALL' || p.entryStatus === entryStatusFilter;

    return matchesSearch && matchesDept && matchesYear && matchesPayment && matchesEntry;
  });

  // CSV Export utility
  const exportCsv = () => {
    if (!participants.length) {
      toastError('Export Error', 'No participants data to export.');
      return;
    }

    const headers = [
      'Pass ID',
      'Full Name',
      'College ID',
      'Department',
      'Year',
      'Email',
      'Mobile',
      'Emergency Mobile',
      'Payment Status',
      'Entry Status',
      'Checked In',
      'Check-In Time',
      'Checked In By',
      'Registration Time',
    ];

    const rows = participants.map((p) => [
      `"${p.passId}"`,
      `"${p.fullName}"`,
      `"${p.collegeId}"`,
      `"${p.department}"`,
      `"${p.year}"`,
      `"${p.email}"`,
      `"${p.mobile}"`,
      `"${p.emergencyMobile}"`,
      `"${p.paymentStatus}"`,
      `"${p.entryStatus}"`,
      `"${p.checkedIn ? 'YES' : 'NO'}"`,
      `"${p.checkInTimestamp || 'N/A'}"`,
      `"${p.checkedInBy || 'N/A'}"`,
      `"${p.registeredAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TGPCET_Garba_Participants_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('CSV Exported', 'Participant roster downloaded successfully.');
  };

  const getPaymentForParticipant = (p: Participant) => {
    return payments.find((pay) => pay.participantId === p.id || pay.passId === p.passId);
  };

  const getAuditHistoryForPass = (passId: string) => {
    return auditLogs.filter((l) => l.targetId === passId || l.details?.passId === passId);
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white">Registered Participants</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage participant records, gate passes, OCR verification history, and attendance.
            </p>
          </div>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Roster</span>
          </button>
        </div>

        <AdminNav />

        {/* SEARCH & FILTERS BAR */}
        <div className="festive-glass rounded-2xl p-5 border-amber-500/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, College ID, Pass ID, Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#160d2b] border border-amber-500/30 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#160d2b] border border-amber-500/30 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending Verification</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Entry Filter */}
            <div>
              <select
                value={entryStatusFilter}
                onChange={(e) => setEntryStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#160d2b] border border-amber-500/30 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Gate Statuses</option>
                <option value="checked_in">Checked In (Inside)</option>
                <option value="checked_out">Checked Out</option>
                <option value="not_entered">Not Entered</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>
              Showing <strong className="text-white">{filteredParticipants.length}</strong> of{' '}
              <strong className="text-white">{participants.length}</strong> participants
            </span>
            {(searchQuery || deptFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || entryStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDeptFilter('ALL');
                  setYearFilter('ALL');
                  setPaymentStatusFilter('ALL');
                  setEntryStatusFilter('ALL');
                }}
                className="text-amber-300 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* RESPONSIVE TABLE & CARD CONTAINER */}
        <div className="festive-glass rounded-3xl border-amber-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a24] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Pass Serial</th>
                  <th className="py-3.5 px-4">Participant</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Gate Attendance</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No participants match the specified search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedParticipant(p)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{p.passId}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm">{p.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.collegeId}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <p className="max-w-[200px] truncate font-medium">{p.department}</p>
                        <p className="text-[10px] text-slate-400">{p.year}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.paymentStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : p.paymentStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.entryStatus === 'checked_in'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : p.entryStatus === 'checked_out'
                              ? 'bg-slate-800 text-slate-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {p.entryStatus === 'checked_in'
                            ? 'Checked In'
                            : p.entryStatus === 'checked_out'
                            ? 'Checked Out'
                            : 'Not Entered'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(p);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PARTICIPANT DETAIL DRAWER / MODAL */}
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] festive-glass-glow rounded-none sm:rounded-3xl border-l sm:border border-amber-500/40 overflow-y-auto p-6 sm:p-8 space-y-6 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Participant Profile
                  </span>
                  <h2 className="text-2xl font-black text-white">{selectedParticipant.fullName}</h2>
                  <p className="text-xs font-mono text-amber-300 font-bold">
                    {selectedParticipant.passId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Payment Status</span>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        selectedParticipant.paymentStatus === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : selectedParticipant.paymentStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {selectedParticipant.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Gate Attendance</span>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-teal-500/20 text-teal-300">
                      {selectedParticipant.entryStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic & Contact Details */}
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  Academic & Contact Info
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">College ID</span>
                    <span className="font-bold text-white font-mono">{selectedParticipant.collegeId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Year of Study</span>
                    <span className="font-bold text-white">{selectedParticipant.year}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <span className="font-bold text-white">{selectedParticipant.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-bold text-white truncate block">{selectedParticipant.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile</span>
                    <span className="font-bold text-white">{selectedParticipant.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Emergency Mobile</span>
                    <span className="font-bold text-white">{selectedParticipant.emergencyMobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registered On</span>
                    <span className="font-bold text-white">
                      {new Date(selectedParticipant.registeredAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & OCR Analysis Data */}
              {(() => {
                const pay = getPaymentForParticipant(selectedParticipant);
                if (!pay) return null;
                return (
                  <div className="space-y-3 bg-purple-950/40 p-4 rounded-2xl border border-purple-500/30 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" />
                        <span>Payment & OCR Analysis</span>
                      </h4>
                      <span className="font-bold text-emerald-400 text-sm">₹{pay.amount}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Extracted UTR</span>
                        <span className="font-mono font-bold text-amber-300">
                          {pay.ocrData?.utr || 'Not Detected'}
                        </span>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-400 block text-[10px]">Transaction ID</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {pay.ocrData?.transactionId || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Screenshot Preview thumbnail */}
                    {pay.screenshotUrl && (
                      <div className="pt-2">
                        <span className="text-slate-400 block text-[10px] mb-1">
                          Uploaded Payment Screenshot
                        </span>
                        <div
                          onClick={() => setShowScreenshotModal(pay.screenshotUrl)}
                          className="relative h-40 rounded-xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer group"
                        >
                          <Image
                            src={pay.screenshotUrl}
                            alt="Receipt"
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-purple-950 font-bold text-xs">
                              Click to Enlarge
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {pay.verifiedBy && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">
                        <p className="font-bold">Verified by {pay.verifiedBy.name} ({pay.verifiedBy.email})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {pay.verifiedAt ? new Date(pay.verifiedAt).toLocaleString() : ''}
                        </p>
                        {pay.coordinatorNote && (
                          <p className="mt-1 italic text-emerald-300 font-normal">
                            &quot;{pay.coordinatorNote}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    {pay.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200">
                        <p className="font-bold">Rejection Reason:</p>
                        <p className="mt-0.5">{pay.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Gate Entry & Audit History */}
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gate Entry Record</span>
                </h4>
                {selectedParticipant.checkedIn ? (
                  <div className="space-y-1">
                    <p className="text-white">
                      Checked in at: <span className="font-bold text-emerald-400">{selectedParticipant.checkInTimestamp ? new Date(selectedParticipant.checkInTimestamp).toLocaleString() : 'N/A'}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Admitted by: <span className="font-mono text-slate-300">{selectedParticipant.checkedInBy || 'Gate Coordinator'}</span>
                    </p>
                    {selectedParticipant.checkOutTimestamp && (
                      <p className="text-slate-400 text-[11px]">
                        Checked out at: <span className="font-bold text-slate-300">{new Date(selectedParticipant.checkOutTimestamp).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Participant has not yet presented this pass at the gate.</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                <Link
                  href={`/pass?passId=${selectedParticipant.passId}`}
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-purple-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open Public Pass</span>
                </Link>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
                >
                  Close
                </button>
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
