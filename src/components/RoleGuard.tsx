'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { StaffRole } from '@/types';
import { ShieldAlert, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: StaffRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse mb-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-wide">Verifying Staff Credentials...</h3>
        <p className="text-xs text-slate-400 mt-1">Checking coordinator access permissions</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full festive-glass-glow rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Coordinator Authentication Required</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              This dashboard is restricted to designated TGPCET staff and event coordinators. Please sign in with your authorized Google account to continue.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
            >
              <span>Go to Staff Sign-In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but insufficient role
  if (!hasRole(allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full festive-glass border-rose-500/40 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Access Restricted</h2>
            <p className="text-sm text-rose-200/90 leading-relaxed">
              Your account <span className="font-semibold text-white">({user.email})</span> is assigned the{' '}
              <span className="capitalize font-bold text-amber-300">{user.role.replace('_', ' ')}</span> role, which does not have permission to view this section.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={
                user.role === 'gate_coordinator'
                  ? '/gate-dashboard'
                  : user.role === 'payment_coordinator'
                  ? '/payment-dashboard'
                  : '/admin'
              }
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 text-purple-950 hover:bg-amber-400 transition-colors"
            >
              Go to Your Assigned Dashboard
            </Link>
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
