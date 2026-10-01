'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SUPER_ADMIN_EMAIL } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  LogOut,
  UserCheck,
  QrCode,
  CreditCard,
  Crown,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInAsDemoRole, signOut, loading, error } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        toastSuccess('Signed In Successfully', 'Welcome to TGPCET Coordinator Portal.');
        router.push('/admin');
      } else {
        toastError('Authentication Failed', 'Account is not authorized or sign-in was cancelled.');
      }
    } catch {
      toastError('Login Error', 'Failed to authenticate with Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoSignIn = async (role: 'super_admin' | 'gate_coordinator' | 'payment_coordinator') => {
    setIsSigningIn(true);
    try {
      await signInAsDemoRole(role);
      toastSuccess(
        'Staff Session Activated',
        `Switched to ${role === 'super_admin' ? 'Super Admin' : role === 'gate_coordinator' ? 'Gate Coordinator' : 'Payment Coordinator'}`
      );
      if (role === 'gate_coordinator') {
        router.push('/gate-dashboard');
      } else if (role === 'payment_coordinator') {
        router.push('/payment-dashboard');
      } else {
        router.push('/admin');
      }
    } catch {
      toastError('Role Activation Failed', 'Could not start demo role session.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        {/* Portal Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-700 p-0.5 shadow-xl shadow-amber-500/20 mx-auto">
            <div className="w-full h-full bg-[#120a24] rounded-[22px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white">Staff & Coordinator Portal</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Secure entry point for Gate Scanners, Payment Verifiers, and Administrators.
          </p>
        </div>

        {/* If Already Logged In */}
        {user ? (
          <div className="festive-glass-glow rounded-3xl p-8 space-y-6 text-center border-amber-500/40">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <UserCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Authenticated Session
              </span>
              <h2 className="text-xl font-bold text-white">{user.fullName || user.email}</h2>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Role: {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
                >
                  <Crown className="w-4 h-4" />
                  <span>Go to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              )}

              {(user.role === 'super_admin' || user.role === 'gate_coordinator') && (
                <button
                  onClick={() => router.push('/gate-dashboard')}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Go to Gate Scanner Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              )}

              {(user.role === 'super_admin' || user.role === 'payment_coordinator') && (
                <button
                  onClick={() => router.push('/payment-dashboard')}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-transform"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Go to Payment Verification Queue</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              )}

              <button
                onClick={() => signOut()}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 border border-rose-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Card */
          <div className="festive-glass-glow rounded-3xl p-8 space-y-6 border-amber-500/40">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Access Verification Notice</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Official Google Sign-In */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-900 shadow-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isSigningIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-950" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Authorized Google Account</span>
              </button>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-slate-300 text-center leading-relaxed">
                Super Admin Account:{' '}
                <code className="text-amber-300 font-bold font-mono">
                  {SUPER_ADMIN_EMAIL}
                </code>
              </div>
            </div>

            {/* Instant Demo Role Switcher for seamless testing */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="text-center">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  Evaluation & Testing Roles
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any role below to test its capabilities immediately:
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('super_admin')}
                  className="w-full p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-amber-500/30 text-left flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white block">Super Admin (All Privileges)</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        bhushanmallick2006@gmail.com
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('gate_coordinator')}
                  className="w-full p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-emerald-500/30 text-left flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">Gate Coordinator (QR Scanner)</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        gate.coordinator@tgpcet.edu
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('payment_coordinator')}
                  className="w-full p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-indigo-500/30 text-left flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-bold text-white block">Payment Verification Coordinator</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        payment.team@tgpcet.edu
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
