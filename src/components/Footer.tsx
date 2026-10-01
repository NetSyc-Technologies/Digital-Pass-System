import React from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, Mail, Phone, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-amber-500/20 bg-[#090514] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-700 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#120a24] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base tracking-tight">TGPCET Garba Night</h3>
                <p className="text-xs text-amber-400/90 font-medium">Navratri Dandiya Mahotsav</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The premier annual cultural festival of Tulsiramji Gaikwad-Patil College of Engineering & Technology, celebrating tradition, rhythm, and togetherness.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">Quick Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-300 transition-colors">
                  Event Overview & Schedule
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-300 transition-colors">
                  Register & Buy Gate Pass
                </Link>
              </li>
              <li>
                <Link href="/pass" className="hover:text-amber-300 transition-colors">
                  Retrieve / Download My Pass
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Staff & Coordinator Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Guidelines */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">Security & Guidelines</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Valid College ID mandatory with Digital Pass.</li>
              <li>• Pass is strictly non-transferable.</li>
              <li>• Single admission barcode check-in.</li>
              <li>• Zero-tolerance substance policy on campus.</li>
            </ul>
          </div>

          {/* Campus Location & Contacts */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">Venue & Inquiries</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Main Sports Ground, TGPCET Campus, Mohgaon, Wardha Road, Nagpur – 441108</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>garba.helpdesk@tgpcet.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-amber-500/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TGPCET Nagpur. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for TGPCET Cultural Committee
          </p>
        </div>
      </div>
    </footer>
  );
}
