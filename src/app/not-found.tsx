import React from 'react';
import Link from 'next/link';
import { Sparkles, Home, Ticket, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full festive-glass-glow rounded-3xl p-8 sm:p-12 text-center space-y-6 border-amber-500/40">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
          <div className="w-full h-full bg-[#120a24] rounded-[22px] flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-5xl font-black text-gradient-gold block">404</span>
          <h1 className="text-2xl font-black text-white">Lost in the Garba Raas?</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The page or pass you are looking for doesn&apos;t seem to exist on this festive ground.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
          >
            <Home className="w-4 h-4" />
            <span>Return to Event Home</span>
          </Link>
          <Link
            href="/pass"
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs festive-glass text-amber-300 hover:bg-white/10 transition-colors"
          >
            <span>Search Existing Pass</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
