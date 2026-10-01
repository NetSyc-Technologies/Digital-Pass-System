'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Ticket, ShieldCheck, QrCode, CreditCard, LogOut, Menu, X, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine staff dashboard link based on role
  const getStaffDashboardUrl = () => {
    if (!user) return '/login';
    if (user.role === 'super_admin' || user.role === 'admin') return '/admin';
    if (user.role === 'payment_coordinator') return '/payment-dashboard';
    if (user.role === 'gate_coordinator') return '/gate-dashboard';
    return '/login';
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Get Gate Pass', href: '/register' },
    { name: 'Find Pass', href: '/pass' },
  ];

  return (
    <header className="sticky top-0 z-50 festive-glass border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-700 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#120a24] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-xl text-white">TGPCET</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold tracking-wider uppercase">
                  Garba 2024
                </span>
              </div>
              <p className="text-xs text-amber-300/80 font-medium">Digital Gate Pass & Entry System</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action & Staff Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 bg-purple-950/60 border border-purple-500/30 rounded-xl px-3 py-1.5">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'gate_coordinator' ? 'Gate Lead' : 'Finance'}
                  </span>
                </div>
                <Link
                  href={getStaffDashboardUrl()}
                  className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
                  title="Dashboard"
                >
                  <ShieldCheck className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 transition-all duration-200"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Staff Portal
              </Link>
            )}

            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-200"
            >
              <Ticket className="w-4 h-4" />
              <span>Get Digital Pass</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-purple-950 font-bold"
            >
              Get Pass
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 text-amber-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden festive-glass border-b border-amber-500/30 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  pathname === link.href
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={getStaffDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/30 flex items-center justify-between"
                >
                  <span>Staff Dashboard ({user.role})</span>
                  <ShieldCheck className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2.5 text-left rounded-lg text-sm font-semibold text-rose-300 hover:bg-rose-950/40 flex items-center justify-between"
                >
                  <span>Sign Out ({user.email})</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-300 hover:bg-white/5 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Staff & Coordinator Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
