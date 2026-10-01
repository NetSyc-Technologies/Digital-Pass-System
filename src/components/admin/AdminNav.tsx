'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserPlus,
  Settings,
  History,
  QrCode,
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Participants', href: '/admin/participants', icon: Users },
    { name: 'Coordinators', href: '/admin/coordinators', icon: UserPlus },
    { name: 'Event Settings', href: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-purple-950 shadow-md shadow-amber-500/20'
                  : 'festive-glass text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Launchers for operational dashboards */}
      <div className="flex items-center gap-2">
        <Link
          href="/payment-dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Queue</span>
        </Link>
        <Link
          href="/gate-dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/70 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Gate Scanner</span>
        </Link>
      </div>
    </div>
  );
}
