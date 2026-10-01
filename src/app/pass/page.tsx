'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Participant,
  EventSettings,
} from '@/types';
import { dataService } from '@/lib/services/dataService';
import { createPassQrPayload } from '@/lib/security/tokenService';
import { useToast } from '@/context/ToastContext';
import {
  Sparkles,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Share2,
} from 'lucide-react';

function PassContent() {
  const searchParams = useSearchParams();
  const passIdParam = searchParams.get('passId');
  const queryParam = searchParams.get('query');
  const autodownloadParam = searchParams.get('autodownload') === 'true';

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(queryParam || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedPassId, setCopiedPassId] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const ticketRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef(false);

  // Load pass based on passId, query, or fallback session ID
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const s = await dataService.getSettings();
      setSettings(s);

      let effectivePassId = passIdParam;
      if (!effectivePassId && typeof window !== 'undefined') {
        effectivePassId =
          sessionStorage.getItem('tgpcet_just_submitted') ||
          localStorage.getItem('tgpcet_last_pass_id');
      }

      let found: Participant | null = null;
      if (effectivePassId) {
        found = await dataService.getParticipantByPassId(effectivePassId);
      } else if (queryParam) {
        const all = await dataService.getParticipants();
        const q = queryParam.trim().toUpperCase();
        found =
          all.find(
            (p) =>
              p.passId.toUpperCase() === q ||
              p.collegeId.toUpperCase() === q ||
              p.mobile.replace(/[^0-9]/g, '') === q.replace(/[^0-9]/g, '')
          ) || null;
      }

      setParticipant(found);
      setLoading(false);

      if (found) {
        // Clean session drafts now that pass is loaded
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('tgpcet_active_registration');
          sessionStorage.removeItem('tgpcet_reg_draft');
        }

        // Generate cryptographic minimal QR payload (no raw personal data exposed)
        createPassQrPayload(found.passId).then(async (payload) => {
          try {
            const url = await QRCode.toDataURL(payload, {
              width: 320,
              margin: 1.5,
              color: {
                dark: '#1e0c38',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'H',
            });
            setQrDataUrl(url);
          } catch (err) {
            console.error('QR code generation error:', err);
          }
        });

        // Fire celebratory festive confetti on mount
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#7c3aed', '#10b981'],
        });
      }
    }
    loadData();
  }, [passIdParam, queryParam]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    const clean = searchQuery.trim().toUpperCase();
    const cleanPhone = searchQuery.replace(/[^0-9]/g, '');

    const all = await dataService.getParticipants();
    const found =
      all.find(
        (p) =>
          p.passId.toUpperCase() === clean ||
          p.collegeId.toUpperCase() === clean ||
          (cleanPhone.length >= 10 && p.mobile.replace(/[^0-9]/g, '') === cleanPhone)
      ) || null;

    setParticipant(found);
    setLoading(false);

    if (found) {
      toastSuccess('Pass Located', `Showing digital pass for ${found.fullName}`);
      const payload = await createPassQrPayload(found.passId);
      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#1e0c38',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } else {
      toastError(
        'Pass Not Found',
        'No matching registration found. Please check your College ID or Mobile number.'
      );
    }
  };

  const copyPassId = () => {
    if (!participant) return;
    navigator.clipboard.writeText(participant.passId);
    setCopiedPassId(true);
    toastInfo('Pass ID Copied', participant.passId);
    setTimeout(() => setCopiedPassId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // High-Resolution Pass PNG generator using HTML5 Canvas
  const handleDownloadImage = async () => {
    if (!participant || !qrDataUrl) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // 1. Dark royal gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0c071a');
      grad.addColorStop(0.5, '#190e33');
      grad.addColorStop(1, '#090514');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Gold decorative border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Inner thin border
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // 3. Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TGPCET GARBA NIGHT 2024', width / 2, 90);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('DIGITAL GATE PASS & ENTRY PERMIT', width / 2, 130);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(settings?.venue || 'TGPCET Sports Ground, Nagpur', width / 2, 160);

      // 4. Pass Status Badge Pill
      const statusText =
        participant.paymentStatus === 'verified'
          ? 'ACTIVE • PAYMENT VERIFIED'
          : participant.paymentStatus === 'pending'
          ? 'PENDING VERIFICATION'
          : 'PAYMENT REJECTED';

      const badgeColor =
        participant.paymentStatus === 'verified'
          ? '#10b981'
          : participant.paymentStatus === 'pending'
          ? '#f59e0b'
          : '#ef4444';

      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 160, 185, 320, 38, 19);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(statusText, width / 2, 210);

      // 5. Draw QR Code in center
      const qrImg = new Image();
      await new Promise<void>((res, rej) => {
        if (qrImg.complete && qrImg.naturalWidth > 0) {
          res();
          return;
        }
        qrImg.onload = () => res();
        qrImg.onerror = (e) => rej(e);
        qrImg.src = qrDataUrl;
        if (qrImg.complete) {
          res();
        }
      });

      // QR white frame
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 160, 255, 320, 320, 16);
      ctx.fill();
      ctx.drawImage(qrImg, width / 2 - 145, 270, 290, 290);

      // 6. Pass ID Box
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(participant.passId, width / 2, 620);

      // 7. Divider dashed line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(50, 660);
      ctx.lineTo(width - 50, 660);
      ctx.stroke();
      ctx.setLineDash([]);

      // 8. Participant details table
      ctx.textAlign = 'left';
      const startY = 720;
      const col1 = 70;
      const col2 = 420;

      const drawField = (label: string, val: string, x: number, y: number) => {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(label.toUpperCase(), x, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(val, x, y + 26);
      };

      drawField('Participant Name', participant.fullName, col1, startY);
      drawField('College ID', participant.collegeId, col2, startY);

      drawField('Department', participant.department, col1, startY + 80);
      drawField('Year of Study', participant.year, col2, startY + 80);

      drawField('Event Date', settings?.date || 'Friday, 18 Oct 2024', col1, startY + 160);
      drawField('Gate Timing', `${settings?.startTime || '06:30 PM'} - ${settings?.endTime || '11:30 PM'}`, col2, startY + 160);

      // 9. Mandatory Security footer note
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'IMPORTANT: Physical College ID Card is required alongside this Digital Pass for physical gate entry.',
        width / 2,
        height - 70
      );
      ctx.fillText(
        'Single-entry cryptographic barcode. Non-transferable.',
        width / 2,
        height - 45
      );

      // 10. Download data url as PNG
      const link = document.createElement('a');
      link.download = `TGPCET-Pass-${participant.passId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toastSuccess('Pass Downloaded', 'High-resolution PNG saved to your downloads.');
    } catch (err) {
      console.error('Failed to download pass image:', err);
      toastError('Download Failed', 'Could not generate pass PNG. Please try printing to PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-download trigger on arrival
  useEffect(() => {
    const isAutoReq =
      autodownloadParam ||
      (typeof window !== 'undefined' &&
        Boolean(sessionStorage.getItem('tgpcet_auto_download')));

    if (participant && qrDataUrl && isAutoReq && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('tgpcet_auto_download');
      }
      const timer = setTimeout(() => {
        handleDownloadImage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [participant, qrDataUrl, autodownloadParam]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Search Header for finding existing passes */}
      <div className="festive-glass rounded-3xl p-6 sm:p-8 space-y-4 border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Digital Gate Pass Portal</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Search by College ID, Registered Mobile, or Pass ID to view and download your pass anytime.
            </p>
          </div>

          <form onSubmit={handleManualSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="College ID or Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-purple-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-sm font-bold text-slate-300">Retrieving pass details...</p>
        </div>
      ) : participant ? (
        <div className="space-y-6">
          {/* Important Gate Entry & Verification Notice */}
          {participant.paymentStatus !== 'verified' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/50 text-amber-200 text-xs sm:text-sm space-y-2.5 shadow-xl animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-amber-300 text-sm sm:text-base">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <span>Pass Generated & Downloaded • Payment Verification Pending</span>
              </div>
              <p className="leading-relaxed text-slate-300 text-xs">
                Your official Digital Pass has been generated with unique Pass ID <strong className="text-amber-300 font-mono">{participant.passId}</strong> and saved to your device. Your uploaded payment receipt is currently awaiting manual verification by the TGPCET Finance Committee.
              </p>
              <div className="p-3 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Gate Entry Notice:</strong> Physical admission is permitted ONLY after payment verification. If scanned at the gate before verification, the scanner will display: <em className="text-white">&ldquo;Payment Not Verified. Kindly wait or contact the payment team.&rdquo;</em> Once approved by the coordinator, entry is granted!
                </span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-950/40 p-4 rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Pass Serial:</span>
              <code className="text-xs font-bold font-mono text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                {participant.passId}
              </code>
              <button
                onClick={copyPassId}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Copy Pass ID"
              >
                {copiedPassId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-purple-950 hover:bg-amber-400 transition-all shadow-md"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download PNG</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold festive-glass text-slate-200 hover:text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* THE DIGITAL PASS / TICKET CARD */}
          <div
            ref={ticketRef}
            className="max-w-md mx-auto festive-glass-glow rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl relative"
          >
            {/* Holographic Header Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-purple-800 p-6 text-center text-white relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-amber-200 border border-white/20 mb-2">
                <Sparkles className="w-3 h-3" />
                Official Gate Pass
              </div>
              <h2 className="text-2xl font-black tracking-tight">{settings?.title || 'TGPCET Garba Night 2024'}</h2>
              <p className="text-xs text-amber-100 font-medium mt-0.5">Dandiya Raas Mahotsav</p>
            </div>

            {/* Payment & Entry Status Pill */}
            <div className="p-5 pb-0 text-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                  participant.paymentStatus === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : participant.paymentStatus === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                }`}
              >
                {participant.paymentStatus === 'verified' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active • Payment Verified</span>
                  </>
                ) : participant.paymentStatus === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Payment Pending Verification</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Payment Rejected</span>
                  </>
                )}
              </div>

              {participant.checkedIn && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Admitted ({participant.entryStatus === 'checked_out' ? 'Checked Out' : 'Checked In'})
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Container */}
            <div className="p-6 text-center space-y-3">
              <div className="inline-block p-4 rounded-2xl bg-white shadow-xl shadow-amber-500/10 border-2 border-amber-400">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Pass QR Code ${participant.passId}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-900 animate-spin" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-mono font-black text-amber-300 tracking-wider">
                  {participant.passId}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Scan at Gate for One-Time Admission
                </p>
              </div>
            </div>

            {/* Tear Perforation Separator */}
            <div className="relative py-2 flex items-center justify-between">
              <div className="w-5 h-10 bg-[#0b0717] rounded-r-full border-r border-y border-amber-500/30" />
              <div className="flex-1 border-t-2 border-dashed border-amber-500/40 mx-2" />
              <div className="w-5 h-10 bg-[#0b0717] rounded-l-full border-l border-y border-amber-500/30" />
            </div>

            {/* Participant Details Body */}
            <div className="p-6 space-y-4 bg-purple-950/30 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Participant Name
                </span>
                <p className="text-base font-extrabold text-white">{participant.fullName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    College ID
                  </span>
                  <p className="font-mono font-bold text-amber-300 text-xs mt-0.5">
                    {participant.collegeId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Year of Study
                  </span>
                  <p className="font-bold text-white text-xs mt-0.5">{participant.year}</p>
                </div>
              </div>

              <div className="pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Department
                </span>
                <p className="font-bold text-white text-xs mt-0.5">{participant.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings?.date || '18 Oct 2024'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Sports Ground</span>
                </div>
              </div>
            </div>

            {/* Ticket Footer Security Warning */}
            <div className="bg-[#090514] p-4 text-center border-t border-amber-500/20 text-[10px] text-slate-400 space-y-1">
              <p className="font-semibold text-amber-300/90">
                ⚠️ Strict Campus ID Policy
              </p>
              <p>
                Please present your original college ID card along with this QR code at the entrance gate.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Not Found State */
        <div className="festive-glass rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Find Your Pass</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your College ID or registered mobile number in the search bar above to look up your digital gate pass.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs"
            >
              <span>Register for a Pass</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <PassContent />
    </Suspense>
  );
}
