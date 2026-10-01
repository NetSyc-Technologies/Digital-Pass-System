'use client';

import React, { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import AdminNav from '@/components/admin/AdminNav';
import { dataService } from '@/lib/services/dataService';
import { AuditLog } from '@/types';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      const allLogs = await dataService.getAuditLogs();
      setLogs(allLogs);
    }
    load();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.userEmail.toLowerCase().includes(q) ||
      l.targetId.toLowerCase().includes(q) ||
      (l.userName && l.userName.toLowerCase().includes(q));

    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">Immutable Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Cryptographic and timestamped record of all coordinator actions, payment approvals, check-ins, and setting changes.
          </p>
        </div>

        <AdminNav />

        {/* Filters */}
        <div className="festive-glass rounded-2xl p-4 border-amber-500/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Coordinator Email, Target Pass ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-60 py-2.5 px-3 rounded-xl bg-[#160d2b] border border-amber-500/30 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Recorded Actions</option>
              <option value="CHECK_IN_SUCCESS">CHECK_IN_SUCCESS</option>
              <option value="CHECK_IN_REJECTED">CHECK_IN_REJECTED</option>
              <option value="CHECK_OUT_SUCCESS">CHECK_OUT_SUCCESS</option>
              <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
              <option value="PAYMENT_REJECTED">PAYMENT_REJECTED</option>
              <option value="COORDINATOR_CREATED">COORDINATOR_CREATED</option>
              <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="festive-glass rounded-3xl border-amber-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a24] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target ID / Pass</th>
                  <th className="py-3 px-4">Coordinator Account</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('SUCCESS') || log.action.includes('VERIFIED')
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.action.includes('REJECTED')
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-300 font-bold">{log.targetId}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      <p className="font-bold text-white text-xs">{log.userName || log.userEmail}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{log.userEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] font-mono max-w-xs truncate">
                      {JSON.stringify(log.details)}
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
