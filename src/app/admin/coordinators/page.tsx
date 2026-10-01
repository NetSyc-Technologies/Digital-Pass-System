'use client';

import React, { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import AdminNav from '@/components/admin/AdminNav';
import { useAuth, SUPER_ADMIN_EMAIL } from '@/context/AuthContext';
import { dataService } from '@/lib/services/dataService';
import { Coordinator, StaffRole } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Crown,
  QrCode,
  CreditCard,
  Mail,
  User,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function CoordinatorsPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);

  // Add coordinator modal form
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('gate_coordinator');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCoordinators() {
      setLoading(true);
      const list = await dataService.getCoordinators();
      setCoordinators(list);
      setLoading(false);
    }
    fetchCoordinators();
  }, []);

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toastError('Validation Error', 'Full Name and Google Email are required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = coordinators.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing) {
      toastError('Already Assigned', `Account ${cleanEmail} is already registered as a coordinator.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await dataService.addCoordinator({
        email: cleanEmail,
        fullName: fullName.trim(),
        role,
        isActive: true,
        assignedBy: user?.email || SUPER_ADMIN_EMAIL,
      });

      setCoordinators((prev) => [...prev, added]);
      toastSuccess('Coordinator Assigned', `${fullName} added with role: ${role.replace('_', ' ')}`);
      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setRole('gate_coordinator');
    } catch {
      toastError('Assignment Error', 'Failed to add coordinator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCoordinatorActive = async (coord: Coordinator) => {
    if (coord.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      toastError('Protected Account', 'The Master Super Admin account cannot be deactivated.');
      return;
    }

    try {
      const updated = await dataService.updateCoordinator(
        coord.id,
        { isActive: !coord.isActive },
        user?.email || SUPER_ADMIN_EMAIL
      );
      if (updated) {
        setCoordinators((prev) =>
          prev.map((c) => (c.id === coord.id ? { ...c, isActive: !coord.isActive } : c))
        );
        toastSuccess(
          'Status Updated',
          `${coord.fullName} is now ${!coord.isActive ? 'Active' : 'Inactive'}.`
        );
      }
    } catch {
      toastError('Update Error', 'Could not update coordinator status.');
    }
  };

  const handleRemoveCoordinator = async (coord: Coordinator) => {
    if (coord.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      toastError('Protected Account', 'The Master Super Admin account cannot be removed.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove coordinator "${coord.fullName}" (${coord.email})? They will lose all staff access immediately.`
      )
    ) {
      return;
    }

    try {
      await dataService.removeCoordinator(coord.id, user?.email || SUPER_ADMIN_EMAIL);
      setCoordinators((prev) => prev.filter((c) => c.id !== coord.id));
      toastSuccess('Coordinator Removed', `${coord.fullName} has been revoked.`);
    } catch (err: unknown) {
      toastError('Removal Error', err instanceof Error ? err.message : 'Failed to remove coordinator.');
    }
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white">Event Coordinators & RBAC</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Assign staff roles by Google Email. Only assigned accounts gain gate or verification access upon Google Sign-In.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Coordinator</span>
          </button>
        </div>

        <AdminNav />

        {/* Coordinators Table */}
        <div className="festive-glass rounded-3xl border-amber-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a24] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Coordinator</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4">Assigned By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coordinators.map((c) => {
                  const isMasterSuperAdmin = c.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center font-bold text-amber-300 text-xs">
                            {c.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{c.fullName}</span>
                              {isMasterSuperAdmin && (
                                <span title="Permanent Master Super Admin">
                                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{c.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.role === 'super_admin' || c.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : c.role === 'gate_coordinator'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {c.role === 'super_admin' ? (
                            <Crown className="w-3 h-3" />
                          ) : c.role === 'gate_coordinator' ? (
                            <QrCode className="w-3 h-3" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          <span>{c.role.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleCoordinatorActive(c)}
                          disabled={isMasterSuperAdmin}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          } ${isMasterSuperAdmin ? 'cursor-default' : 'hover:opacity-80'}`}
                        >
                          {c.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{c.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {c.lastLogin ? new Date(c.lastLogin).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-[150px]">
                        {c.assignedBy}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isMasterSuperAdmin ? (
                          <button
                            onClick={() => handleRemoveCoordinator(c)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                            title="Remove Coordinator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400/80 font-bold uppercase">
                            Permanent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD COORDINATOR MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6 border-amber-500/40">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Assign Coordinator</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCoordinator} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Rajesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase">
                    Google Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.kumar@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Coordinator will sign in using this Google account.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase">
                    Role & Permissions <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-4 py-3 rounded-xl bg-[#160d2b] border border-amber-500/30 text-sm text-white focus:outline-none"
                  >
                    <option value="gate_coordinator">
                      Gate Coordinator (QR Scanner & Admission Check-In)
                    </option>
                    <option value="payment_coordinator">
                      Payment Verification Coordinator (Finance & Receipt Approval)
                    </option>
                    <option value="admin">
                      Administrator (Settings, Analytics & Coordinators)
                    </option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Authorize Coordinator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
