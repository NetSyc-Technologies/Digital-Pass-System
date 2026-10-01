'use client';

import React from 'react';

export default function FestiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Deep Royal Atmospheric Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-[140px]" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px]" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-rose-600/10 rounded-full blur-[150px]" />

      {/* Subtle Dandiya & Diya Golden Sparkles */}
      <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-amber-400/40 blur-[1px] animate-pulse" />
      <div className="absolute top-48 right-16 w-3 h-3 rounded-full bg-amber-300/30 blur-[1px] animate-pulse delay-700" />
      <div className="absolute top-1/2 left-12 w-2 h-2 rounded-full bg-rose-400/40 blur-[1px] animate-pulse delay-1000" />
      <div className="absolute bottom-40 right-20 w-3 h-3 rounded-full bg-amber-400/30 blur-[1px] animate-pulse delay-500" />
      <div className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-yellow-300/40 blur-[1px] animate-pulse delay-300" />

      {/* Decorative Traditional Rangoli/Mandala Watermark in Background */}
      <svg
        className="absolute -right-32 -bottom-32 w-[650px] h-[650px] text-amber-500/[0.03] select-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M 50 0 L 50 100 M 0 50 L 100 50 M 15 15 L 85 85 M 15 85 L 85 15" stroke="currentColor" strokeWidth="0.4" />
      </svg>
    </div>
  );
}
