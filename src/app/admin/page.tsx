'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import AdminNav from '@/components/admin/AdminNav';
import { dataService } from '@/lib/services/dataService';
import {
  Participant,
  PaymentRecord,
  EventSettings,
  AuditLog,
} from '@/types';
import {
  Users,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Ticket,
  DoorOpen,
  LogOut,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [partList, payList, setts, logs] = await Promise.all([
        dataService.getParticipants(),
        dataService.getPayments(),
        dataService.getSettings(),
        dataService.getAuditLogs(),
      ]);
      setParticipants(partList);
      setPayments(payList);
      setSettings(setts);
      setAuditLogs(logs);
      setLoading(false);
    }
    loadData();
  }, []);

  // Aggregated KPIs
  const totalRegistrations = participants.length;
  const totalPaymentsSubmitted = payments.length;
  const paymentsPending = payments.filter((p) => p.status === 'pending').length;
  const paymentsVerified = payments.filter((p) => p.status === 'verified').length;
  const paymentsRejected = payments.filter((p) => p.status === 'rejected').length;

  const passPrice = settings?.passPrice ?? 150;
  const totalExpectedCollection = totalRegistrations * passPrice;
  const totalVerifiedCollection = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPassesIssued = participants.length;
  const totalCheckedIn = participants.filter((p) => p.checkedIn).length;
  const totalCheckedOut = participants.filter((p) => p.entryStatus === 'checked_out').length;
  const currentlyInside = participants.filter((p) => p.entryStatus === 'checked_in').length;

  const rejectedScans = auditLogs.filter(
    (l) => l.action === 'CHECK_IN_REJECTED'
  ).length;

  const venueCapacity = settings?.capacity || 2500;
  const occupancyPercent = Math.min(100, Math.round((currentlyInside / venueCapacity) * 100));

  // Department Distribution
  const deptMap: Record<string, number> = {};
  participants.forEach((p) => {
    // Shorten department name for chart display
    const label = p.department.split('–')[0].replace('(IT)', 'IT').replace('(CSE)', 'CSE').trim();
    deptMap[label] = (deptMap[label] || 0) + 1;
  });
  const topDepts = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Year Distribution
  const yearMap: Record<string, number> = {
    '1st Year': 0,
    '2nd Year': 0,
    '3rd Year': 0,
    '4th Year': 0,
  };
  participants.forEach((p) => {
    if (yearMap[p.year] !== undefined) yearMap[p.year]++;
  });

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">Event Administration & Operations</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time gate metrics, payment verification progress, and attendee insights.
          </p>
        </div>

        <AdminNav />

        {/* 12 METRIC CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Registrations */}
          <div className="festive-glass rounded-2xl p-4 border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Registrations</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalRegistrations}</p>
            <p className="text-[10px] text-amber-300 font-medium">Registered participants</p>
          </div>

          {/* Card 2: Total Payments Submitted */}
          <div className="festive-glass rounded-2xl p-4 border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Payments Submitted</span>
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalPaymentsSubmitted}</p>
            <p className="text-[10px] text-purple-300 font-medium">Receipts uploaded</p>
          </div>

          {/* Card 3: Payments Pending Verification */}
          <div className="festive-glass rounded-2xl p-4 border-amber-500/40 space-y-2 bg-amber-950/20">
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{paymentsPending}</p>
            <Link
              href="/payment-dashboard"
              className="text-[10px] text-amber-300 underline font-semibold flex items-center gap-1"
            >
              <span>Inspect Queue &rarr;</span>
            </Link>
          </div>

          {/* Card 4: Verified Payments */}
          <div className="festive-glass rounded-2xl p-4 border-emerald-500/40 space-y-2 bg-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span>Verified Payments</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">{paymentsVerified}</p>
            <p className="text-[10px] text-emerald-300 font-medium">Approved passes</p>
          </div>

          {/* Card 5: Rejected Payments */}
          <div className="festive-glass rounded-2xl p-4 border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
              <span>Rejected Payments</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">{paymentsRejected}</p>
            <p className="text-[10px] text-rose-300 font-medium">Requires re-upload</p>
          </div>

          {/* Card 6: Total Expected Collection */}
          <div className="festive-glass rounded-2xl p-4 border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Expected Collection</span>
              <IndianRupee className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-300">
              ₹{totalExpectedCollection.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">@ ₹{passPrice}/pass</p>
          </div>

          {/* Card 7: Verified Collection */}
          <div className="festive-glass rounded-2xl p-4 border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>Verified Collection</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gradient-gold">
              ₹{totalVerifiedCollection.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-300 font-medium">Cleared funds</p>
          </div>

          {/* Card 8: Total Passes Issued */}
          <div className="festive-glass rounded-2xl p-4 border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Passes Issued</span>
              <Ticket className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalPassesIssued}</p>
            <p className="text-[10px] text-amber-300 font-medium">Serial barcodes issued</p>
          </div>

          {/* Card 9: Checked-In Total */}
          <div className="festive-glass rounded-2xl p-4 border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Checked-In (Total)</span>
              <DoorOpen className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-teal-300">{totalCheckedIn}</p>
            <p className="text-[10px] text-slate-400 font-medium">Admitted today</p>
          </div>

          {/* Card 10: Checked-Out Total */}
          <div className="festive-glass rounded-2xl p-4 border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Checked-Out</span>
              <LogOut className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-300">{totalCheckedOut}</p>
            <p className="text-[10px] text-slate-500 font-medium">Exited grounds</p>
          </div>

          {/* Card 11: Currently Inside Count */}
          <div className="festive-glass-glow rounded-2xl p-4 border-emerald-500/40 space-y-2 bg-purple-950/40">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>Currently Inside</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{currentlyInside}</p>
            <p className="text-[10px] text-emerald-300 font-medium">Active in arena</p>
          </div>

          {/* Card 12: Rejected / Invalid Scans */}
          <div className="festive-glass rounded-2xl p-4 border-rose-500/40 space-y-2 bg-rose-950/20">
            <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
              <span>Rejected Scan Attempts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">{rejectedScans}</p>
            <p className="text-[10px] text-rose-300 font-medium">Unverified/duplicate attempts</p>
          </div>
        </div>

        {/* VISUAL CHARTS & PROGRESS METERS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Venue Live Occupancy Meter */}
          <div className="lg:col-span-4 festive-glass rounded-3xl p-6 border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Venue Capacity Utilization</span>
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300">
                {currentlyInside} / {venueCapacity}
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full h-4 bg-purple-950 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-500"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>0 Occupancy</span>
                <span className="font-bold text-white">{occupancyPercent}% Filled</span>
                <span>Max {venueCapacity}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <p className="font-semibold text-amber-300">Re-Entry Policy Status:</p>
              <p>
                {settings?.allowReEntry
                  ? '✅ Re-Entry is currently ENABLED by Admin.'
                  : '🔒 Re-Entry is RESTRICTED. Checked-out passes cannot be reused.'}
              </p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="lg:col-span-5 festive-glass rounded-3xl p-6 border-amber-500/30 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Department Participation Breakdown</span>
            </h3>

            <div className="space-y-2.5">
              {topDepts.map(([dept, count]) => {
                const pct = totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200 truncate max-w-[240px]">{dept}</span>
                      <span className="text-amber-300 font-bold font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-purple-950/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Year of Study Distribution */}
          <div className="lg:col-span-3 festive-glass rounded-3xl p-6 border-amber-500/30 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>Year-wise Attendees</span>
            </h3>

            <div className="space-y-3 pt-2">
              {Object.entries(yearMap).map(([year, count]) => (
                <div
                  key={year}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-white/5 text-xs"
                >
                  <span className="font-semibold text-slate-300">{year}</span>
                  <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded-md font-mono text-amber-300">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT REGISTRATIONS PREVIEW */}
        <div className="festive-glass rounded-3xl p-6 border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Pass Submissions</h3>
            <Link
              href="/admin/participants"
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>View All Participants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Pass ID</th>
                  <th className="py-3 px-3">Participant</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Gate Entry</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participants.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{p.passId}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{p.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.collegeId}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-[180px] truncate">{p.department}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.entryStatus === 'checked_in'
                            ? 'text-teal-300 bg-teal-500/20'
                            : p.entryStatus === 'checked_out'
                            ? 'text-slate-400 bg-slate-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {p.entryStatus === 'checked_in'
                          ? 'Inside Venue'
                          : p.entryStatus === 'checked_out'
                          ? 'Checked Out'
                          : 'Not Entered'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/pass?passId=${p.passId}`}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
                      >
                        Pass
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
