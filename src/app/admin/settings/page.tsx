'use client';

import React, { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import AdminNav from '@/components/admin/AdminNav';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/services/dataService';
import { EventSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Settings,
  IndianRupee,
  Calendar,
  Clock,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CreditCard,
  Users,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      const s = await dataService.getSettings();
      setSettings(s);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await dataService.updateSettings(settings, user?.email || 'admin');
      toastSuccess('Settings Saved', 'Event configuration updated successfully across all pages.');
    } catch {
      toastError('Save Failed', 'Could not save event configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <RoleGuard allowedRoles={['super_admin', 'admin']}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AdminNav />
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">Event Configuration & Pricing</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Control pass fees, venue timing, gate registration availability, and campus re-entry rules in real time.
          </p>
        </div>

        <AdminNav />

        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
          {/* PRICING & REGISTRATION CONTROLS */}
          <div className="festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6 border-amber-500/40">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <IndianRupee className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Pass Pricing & Registration Switch</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pass Price */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Pass Fee Amount (₹ INR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    required
                    value={settings.passPrice}
                    onChange={(e) =>
                      setSettings({ ...settings, passPrice: parseInt(e.target.value) || 0 })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  This exact amount will be shown on the landing page and payment QR screen.
                </p>
              </div>

              {/* Venue Capacity */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Venue Capacity Limit <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min={100}
                    max={50000}
                    required
                    value={settings.capacity}
                    onChange={(e) =>
                      setSettings({ ...settings, capacity: parseInt(e.target.value) || 100 })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Used for real-time occupancy and capacity dashboard meters.
                </p>
              </div>

              {/* Registration Open Toggle */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Public Registrations</p>
                  <p className="text-[11px] text-slate-400">
                    {settings.isRegistrationOpen
                      ? 'Registration is currently LIVE and open to all students.'
                      : 'Registration is currently CLOSED.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, isRegistrationOpen: !settings.isRegistrationOpen })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    settings.isRegistrationOpen
                      ? 'bg-emerald-500 text-purple-950 shadow-md shadow-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {settings.isRegistrationOpen ? 'Open (Live)' : 'Closed'}
                </button>
              </div>

              {/* Re-Entry Policy Toggle */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Allow Gate Re-Entry</p>
                  <p className="text-[11px] text-slate-400">
                    {settings.allowReEntry
                      ? 'Permitted: Checked-out students can re-enter.'
                      : 'Restricted: Passes cannot be re-admitted after checkout.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, allowReEntry: !settings.allowReEntry })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    settings.allowReEntry
                      ? 'bg-amber-500 text-purple-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.allowReEntry ? 'Allowed' : 'Disabled (Default)'}
                </button>
              </div>
            </div>
          </div>

          {/* EVENT SCHEDULE & VENUE DETAILS */}
          <div className="festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-amber-500/30">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Event Information & Venue</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Event Date
                </label>
                <input
                  type="text"
                  required
                  value={settings.date}
                  onChange={(e) => setSettings({ ...settings, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.startTime}
                    onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase">
                    End Time
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.endTime}
                    onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Venue Description & Location
                </label>
                <textarea
                  rows={2}
                  required
                  value={settings.venue}
                  onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* UPI PAYMENT METADATA */}
          <div className="festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-amber-500/30">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">UPI Payment Destination</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  required
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase">
                  Payee / Account Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.payeeName}
                  onChange={(e) => setSettings({ ...settings, payeeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
