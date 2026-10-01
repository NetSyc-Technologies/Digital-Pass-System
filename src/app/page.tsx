'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  Music,
  Award,
  UtensilsCrossed,
  Camera,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Flame,
} from 'lucide-react';
import { dataService, DEFAULT_EVENT_SETTINGS } from '@/lib/services/dataService';
import { EventSettings } from '@/types';

export default function LandingPage() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await dataService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const highlights = [
    {
      icon: Music,
      title: 'Live Dhol & Orchestra',
      desc: 'Renowned Garba singers, live Gujarati orchestra, and authentic multi-dhol troupe to keep you dancing all night.',
      accent: 'from-amber-400 to-orange-500',
    },
    {
      icon: Award,
      title: 'Mega Garba Contests',
      desc: 'Exciting cash awards for Best Traditional Attire (Male/Female), Best Dandiya Dancer, and Best Garba Circle.',
      accent: 'from-purple-400 to-pink-500',
    },
    {
      icon: ShieldCheck,
      title: 'Digital Fast-Track Entry',
      desc: 'High-speed one-time QR scanning at dedicated gates with strict security, ensuring safe and hassle-free entry.',
      accent: 'from-emerald-400 to-teal-500',
    },
    {
      icon: UtensilsCrossed,
      title: 'Food & Beverage Stalls',
      desc: 'Curated pure vegetarian festive culinary zone serving hot snacks, Gujarati delicacies, mocktails, and desserts.',
      accent: 'from-rose-400 to-red-500',
    },
    {
      icon: Camera,
      title: '360° Glam Photo Booths',
      desc: 'State-of-the-art 360-degree slow-motion cameras and floral festive photo backdrops to capture your memories.',
      accent: 'from-blue-400 to-indigo-500',
    },
    {
      icon: Flame,
      title: 'Grand Maha Aarti',
      desc: 'A divine and breathtaking 1000-diya Maha Aarti blessing ceremony kicking off the Garba Raas under starry skies.',
      accent: 'from-yellow-400 to-amber-600',
    },
  ];

  const faqs = [
    {
      q: 'Who is eligible to register for TGPCET Garba Night?',
      a: 'All enrolled students, alumni, and faculty from TGPCET and affiliated institutions across all departments and years are eligible. A valid College Identity Card is mandatory upon physical entry.',
    },
    {
      q: 'How do I receive my Digital Gate Pass?',
      a: 'After completing the registration form and uploading your UPI payment screenshot, the system generates a unique cryptographic Digital Pass with your Pass ID and QR code. You can download it immediately or retrieve it anytime using your College ID or Mobile Number.',
    },
    {
      q: 'How does payment verification work?',
      a: 'Once submitted, our intelligent OCR engine analyzes the payment screenshot (UTR number, amount, timestamp). The finance coordinator cross-verifies with the bank records and approves the pass, updating its status to "Active/Verified".',
    },
    {
      q: 'Can I transfer my Digital Pass to a friend?',
      a: 'No. Passes are non-transferable, uniquely serialized, and mapped directly to your College ID and personal mobile number. The QR code is cryptographically protected against tampering.',
    },
    {
      q: 'What is the dress code?',
      a: 'Traditional festive attire is strongly encouraged! Chaniya Choli, Kurti, Ghagra for women and Kurta-Pyjama, Dhoti, Kedia for men.',
    },
    {
      q: 'Is re-entry allowed if I leave the campus grounds?',
      a: 'By default, re-entry is restricted once you check out, in order to maintain security and crowd capacity. Please carry all personal belongings with you.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Cinematic Backdrop Image with Deep Festive Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-garba.jpg"
            alt="TGPCET Garba Night Celebration"
            fill
            priority
            className="object-cover object-center opacity-30 scale-105 transform motion-safe:animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0717]/85 via-[#0b0717]/90 to-[#0b0717]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Festive Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full festive-glass border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10 animate-bounce duration-[3000ms]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Tulsiramji Gaikwad-Patil College of Engineering & Technology
            </span>
            <span className="hidden sm:inline text-xs font-extrabold text-rose-400">• Nagpur</span>
          </div>

          {/* Grand Hero Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
              <span className="block text-gradient-festive drop-shadow-[0_4px_24px_rgba(245,158,11,0.3)]">
                {settings?.title || 'TGPCET Garba Night 2024'}
              </span>
              <span className="block text-2xl sm:text-4xl md:text-5xl font-extrabold text-white/95 mt-2">
                Dandiya Raas & Cultural Mahotsav
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Experience Nagpur&apos;s most electrifying collegiate Navratri festival. Seamless digital entry, energetic beats, dazzling traditional lights, and unforgettable memories.
            </p>
          </div>

          {/* Key Event Badges: Date, Time, Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
            <div className="festive-glass rounded-2xl p-4 flex items-center gap-3.5 border-amber-500/30">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Event Date</p>
                <p className="text-sm font-bold text-white">{settings?.date || 'Friday, 18 Oct 2024'}</p>
              </div>
            </div>

            <div className="festive-glass rounded-2xl p-4 flex items-center gap-3.5 border-purple-500/30">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Gate Timing</p>
                <p className="text-sm font-bold text-white">
                  {settings ? `${settings.startTime} - ${settings.endTime}` : '06:30 PM - 11:30 PM'}
                </p>
              </div>
            </div>

            <div className="festive-glass rounded-2xl p-4 flex items-center gap-3.5 border-rose-500/30">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Venue</p>
                <p className="text-sm font-bold text-white truncate" title={settings?.venue || 'TGPCET Campus'}>
                  TGPCET Sports Ground
                </p>
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {settings?.isRegistrationOpen !== false ? (
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300 group"
              >
                <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Get Digital Gate Pass – ₹{settings?.passPrice ?? 150}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Registrations are currently closed by Administration</span>
              </div>
            )}

            <Link
              href="/pass"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm festive-glass hover:bg-white/10 text-amber-300 border-amber-500/40 transition-all duration-200"
            >
              <QrCode className="w-4 h-4" />
              <span>Retrieve Existing Pass</span>
            </Link>
          </div>

          {/* Registration Notice Pill */}
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Instant Digital Verification & High-Resolution Pass Generation</span>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            Festive Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Event Highlights & Attractions</h2>
          <p className="text-slate-400 text-sm">
            Everything you need for an unforgettable night of high-spirited Garba and Navratri celebrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={i}
                className="festive-glass festive-card-interactive rounded-3xl p-7 space-y-4 relative overflow-hidden"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${h.accent} p-0.5 shadow-lg shadow-amber-500/10`}
                >
                  <div className="w-full h-full bg-[#160d2b] rounded-[14px] flex items-center justify-center">
                    <Icon className="w-7 h-7 text-amber-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{h.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pass Pricing & Inclusions Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="festive-glass-glow rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
                Official Gate Pass
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">All-Access Digital Entry</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                One pass grants complete access to the arena, live performance, garba circles, and high-octane DJ raas.
              </p>

              <div className="pt-2 flex items-baseline gap-3">
                <span className="text-5xl font-black text-gradient-gold">
                  ₹{settings?.passPrice ?? 150}
                </span>
                <span className="text-sm text-slate-400 font-medium">per participant</span>
              </div>
            </div>

            <div className="space-y-4 bg-purple-950/40 rounded-2xl p-6 border border-purple-500/30">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Pass Inclusions:</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full access to Garba grounds & live music stage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eligibility for Best Dressed & Dancer contest awards</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant scannable cryptographic digital pass on phone</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Access to complimentary safe drinking water stations</span>
                </li>
              </ul>

              <div className="pt-4">
                <Link
                  href="/register"
                  className="w-full py-3.5 px-6 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
                >
                  <span>Book Your Pass Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines & Safety Rules */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="festive-glass rounded-3xl p-8 sm:p-10 border-amber-500/30 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Entry Guidelines & Campus Code</h3>
              <p className="text-xs text-amber-300">Mandatory for all attendees and participants</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            {(settings?.rules || DEFAULT_EVENT_SETTINGS.rules).map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-xl p-3.5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Everything you need to know about passes, payments, and event entry.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="festive-glass rounded-2xl border-amber-500/20 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-amber-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom CTA for Mobile */}
      <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
        <Link
          href="/register"
          className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/40"
        >
          <Ticket className="w-5 h-5" />
          <span>Get Gate Pass – ₹{settings?.passPrice ?? 150}</span>
        </Link>
      </div>
    </div>
  );
}
