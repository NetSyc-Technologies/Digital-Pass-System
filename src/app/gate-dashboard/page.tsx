'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/services/dataService';
import { Participant, EventSettings, AuditLog } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  QrCode,
  DoorOpen,
  LogOut,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function GateDashboardPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Pass ID Quick Check
  const [manualPassId, setManualPassId] = useState('');
  const [selectedPass, setSelectedPass] = useState<Participant | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allParts, s, logs] = await Promise.all([
        dataService.getParticipants(),
        dataService.getSettings(),
        dataService.getAuditLogs(),
      ]);
      setParticipants(allParts);
      setSettings(s);
      setAuditLogs(logs);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalCheckedIn = participants.filter((p) => p.checkedIn).length;
  const currentlyInside = participants.filter((p) => p.entryStatus === 'checked_in').length;
  const venueCapacity = settings?.capacity || 2500;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPassId.trim()) return;

    const clean = manualPassId.trim().toUpperCase();
    const found =
      participants.find(
        (p) =>
          p.passId.toUpperCase() === clean ||
          p.collegeId.toUpperCase() === clean
      ) || null;

    setSelectedPass(found);
    if (!found) {
      toastError('Pass Not Found', 'No pass matches this Pass ID or College ID.');
    }
  };

  const recentGateLogs = auditLogs
    .filter((l) => l.action.startsWith('CHECK_IN') || l.action.startsWith('CHECK_OUT'))
    .slice(0, 8);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'gate_coordinator']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white">Gate Admission & Entry Control</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              High-speed barcode verification, one-time gate check-in, and venue capacity monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Gate Lead: {user?.fullName || user?.email}
            </span>
          </div>
        </div>

        {/* HERO SCANNER LAUNCH CARD */}
        <div className="festive-glass-glow rounded-3xl p-8 sm:p-10 border-2 border-amber-500/40 relative overflow-hidden text-center space-y-6">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 p-1 mx-auto shadow-2xl shadow-amber-500/30">
              <div className="w-full h-full bg-[#120a24] rounded-[20px] flex items-center justify-center">
                <QrCode className="w-10 h-10 text-amber-400" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Launch Camera QR Scanner
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Opens full-screen high-speed camera scanner with vibration feedback, torch toggle, and one-time admission verification.
            </p>
          </div>

          <div>
            <Link
              href="/gate-dashboard/scanner"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white font-black text-base shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-transform"
            >
              <Smartphone className="w-5 h-5" />
              <span>Open Fullscreen Gate Scanner</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* LIVE GATE COUNTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="festive-glass rounded-2xl p-5 border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
              <span>Currently Inside Arena</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-3xl font-black text-white">{currentlyInside}</p>
            <p className="text-[11px] text-slate-400">
              Max capacity: {venueCapacity} attendees
            </p>
          </div>

          <div className="festive-glass rounded-2xl p-5 border-teal-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-teal-400 font-bold uppercase">
              <span>Total Admitted (Check-Ins)</span>
              <DoorOpen className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-3xl font-black text-teal-300">{totalCheckedIn}</p>
            <p className="text-[11px] text-slate-400">Unique passes scanned</p>
          </div>

          <div className="festive-glass rounded-2xl p-5 border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-purple-400 font-bold uppercase">
              <span>Re-Entry Setting</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-black text-white">
              {settings?.allowReEntry ? 'Allowed' : 'Strictly Restricted'}
            </p>
            <p className="text-[11px] text-slate-400">Controlled by Admin</p>
          </div>
        </div>

        {/* MANUAL PASS LOOKUP FALLBACK */}
        <div className="festive-glass rounded-3xl p-6 sm:p-8 space-y-5 border-amber-500/30">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Manual Pass ID / College ID Lookup</h3>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Pass ID (TGP-GARBA-...) or College ID..."
              value={manualPassId}
              onChange={(e) => setManualPassId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-amber-500 text-purple-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
            >
              Verify Pass
            </button>
          </form>

          {/* Quick pass preview result if searched */}
          {selectedPass && (
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-base">{selectedPass.fullName}</h4>
                  <p className="text-xs text-amber-300 font-mono">{selectedPass.passId}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedPass.paymentStatus === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  Payment: {selectedPass.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-white/5">
                <div>College ID: <span className="font-bold text-white">{selectedPass.collegeId}</span></div>
                <div>Department: <span className="font-bold text-white">{selectedPass.department}</span></div>
                <div>Entry Status: <span className="font-bold text-white">{selectedPass.entryStatus}</span></div>
                <div>
                  Checked In:{' '}
                  <span className="font-bold text-white">
                    {selectedPass.checkedIn ? 'YES (Admitted)' : 'NO'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/gate-dashboard/scanner?manualPassId=${selectedPass.passId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-purple-950 font-bold text-xs"
                >
                  <span>Proceed to Gate Admission Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RECENT SCANS LOG */}
        <div className="festive-glass rounded-3xl p-6 border-amber-500/30 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Gate Activity Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a24] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Pass ID</th>
                  <th className="py-2.5 px-3">Coordinator</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {recentGateLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No gate admission activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentGateLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'CHECK_IN_SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : log.action === 'CHECK_OUT_SUCCESS'
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">{log.targetId}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">{log.userEmail}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
