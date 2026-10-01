'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/services/dataService';
import { parseScannedQrPayload } from '@/lib/security/tokenService';
import { Participant, EventSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  QrCode,
  Zap,
  ZapOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DoorOpen,
  LogOut,
  ShieldAlert,
  Loader2,
  User,
  GraduationCap,
  Calendar,
  Check,
  X,
  Search,
} from 'lucide-react';

function ScannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialManualPassId = searchParams.get('manualPassId');

  const { user } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [scannerMode, setScannerMode] = useState<'check_in' | 'check_out'>('check_in');
  const [isOnline, setIsOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Verification Result Popup State
  const [scanResult, setScanResult] = useState<{
    type: 'SUCCESS_READY' | 'ALREADY_CHECKED_IN' | 'PAYMENT_NOT_VERIFIED' | 'INVALID_PASS' | 'CHECKOUT_READY';
    participant?: Participant;
    passId?: string;
    message?: string;
  } | null>(null);

  // Manual input fallback inside scanner
  const [manualInput, setManualInput] = useState(initialManualPassId || '');

  // Scanner element reference
  const html5QrCodeRef = useRef<any>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Audio feedback synthesizer using Web Audio API
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(330, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const triggerHaptic = (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toastError(
        'Connection Lost!',
        'Internet connection lost. Gate verification requires active connection to prevent false admissions.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    async function loadSettings() {
      const s = await dataService.getSettings();
      setSettings(s);
    }
    loadSettings();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toastError]);

  // Handle passed manualPassId parameter if provided from dashboard
  useEffect(() => {
    if (initialManualPassId) {
      handleVerifyPassId(initialManualPassId);
    }
  }, [initialManualPassId]);

  // Start Camera QR Scanner
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const scannerId = 'gate-qr-reader';
        const scannerElement = document.getElementById(scannerId);
        if (!scannerElement) return;

        // Clean up previous instance if any
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {
            // Ignore
          }
        }

        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            if (isMounted) {
              handleQrDecoded(decodedText);
            }
          },
          () => {
            // Scan ongoing frame (quiet)
          }
        );

        if (isMounted) {
          setScannerInitialized(true);
          setCameraError(null);

          // Check torch capability
          try {
            const videoElem = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
            if (videoElem && videoElem.srcObject) {
              const stream = videoElem.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              videoTrackRef.current = track;
              const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
              if (capabilities.torch) {
                setHasTorch(true);
              }
            }
          } catch {
            // Torch inspection failed
          }
        }
      } catch (err: any) {
        console.error('Html5Qrcode scanner failed to initialize:', err);
        if (isMounted) {
          setCameraError(
            err.message || 'Camera permission denied or camera not accessible. You can use Manual Pass Lookup.'
          );
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch {
          // Ignore
        }
      }
    };
  }, [cameraFacing]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const nextTorch = !torchOn;
      await (videoTrackRef.current as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      toastError('Torch Error', 'Flashlight control is not supported on this device.');
    }
  };

  // Switch between Rear and Front camera
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // CORE QR DECODE HANDLER
  const handleQrDecoded = (decodedText: string) => {
    // Prevent overlapping scans while popup is open
    if (isProcessingScan || scanResult !== null) return;
    setIsProcessingScan(true);

    const parsed = parseScannedQrPayload(decodedText);
    if (!parsed.isValid || !parsed.passId) {
      playBeep('error');
      triggerHaptic([200, 100, 200]);
      setScanResult({
        type: 'INVALID_PASS',
        message: parsed.error || 'The scanned QR code is not a valid TGPCET Pass token.',
      });
      setIsProcessingScan(false);
      return;
    }

    handleVerifyPassId(parsed.passId);
  };

  // Authoritative pass verification logic against server/Firestore
  const handleVerifyPassId = async (passId: string) => {
    setIsProcessingScan(true);

    // CRITICAL: Block verification if offline
    if (!navigator.onLine) {
      playBeep('error');
      triggerHaptic([300]);
      toastError(
        'OFFLINE WARNING',
        'Cannot authoritatively verify passes while disconnected. Please reconnect.'
      );
      setIsProcessingScan(false);
      return;
    }

    try {
      const cleanPassId = passId.trim().toUpperCase();
      const participant = await dataService.getParticipantByPassId(cleanPassId);

      if (!participant) {
        playBeep('error');
        triggerHaptic([200, 100, 200]);
        setScanResult({
          type: 'INVALID_PASS',
          passId: cleanPassId,
          message: `Pass "${cleanPassId}" does not exist in the official TGPCET registry.`,
        });
        setIsProcessingScan(false);
        return;
      }

      if (participant.passStatus === 'revoked') {
        playBeep('error');
        triggerHaptic([300, 100, 300]);
        setScanResult({
          type: 'INVALID_PASS',
          participant,
          passId: cleanPassId,
          message: 'This pass has been formally REVOKED by Campus Administration.',
        });
        setIsProcessingScan(false);
        return;
      }

      // MANDATORY SECURITY RULE: Payment must be verified before allowing entry!
      if (participant.paymentStatus !== 'verified') {
        playBeep('error');
        triggerHaptic([200, 100, 200, 100, 200]);
        setScanResult({
          type: 'PAYMENT_NOT_VERIFIED',
          participant,
          passId: cleanPassId,
          message:
            participant.paymentStatus === 'pending'
              ? 'Payment not verified kindly wait or contact the payment team.'
              : 'Payment was rejected. Kindly contact the payment team.',
        });
        setIsProcessingScan(false);
        return;
      }

      // CHECK-OUT MODE BEHAVIOR
      if (scannerMode === 'check_out') {
        if (participant.entryStatus !== 'checked_in') {
          playBeep('warning');
          setScanResult({
            type: 'INVALID_PASS',
            participant,
            passId: cleanPassId,
            message: `Participant is not currently checked in (Status: ${participant.entryStatus}).`,
          });
          setIsProcessingScan(false);
          return;
        }

        playBeep('success');
        triggerHaptic([100]);
        setScanResult({
          type: 'CHECKOUT_READY',
          participant,
          passId: cleanPassId,
        });
        setIsProcessingScan(false);
        return;
      }

      // CHECK-IN MODE BEHAVIOR
      // If already checked in
      if (participant.checkedIn && participant.entryStatus === 'checked_in') {
        playBeep('warning');
        triggerHaptic([300, 200, 300]);
        setScanResult({
          type: 'ALREADY_CHECKED_IN',
          participant,
          passId: cleanPassId,
          message: `ALREADY SCANNED & ADMITTED! Initial Check-In was at ${
            participant.checkInTimestamp
              ? new Date(participant.checkInTimestamp).toLocaleTimeString()
              : 'earlier'
          } by ${participant.checkedInBy || 'Gate Coordinator'}.`,
        });
        setIsProcessingScan(false);
        return;
      }

      // If previously checked out and re-entry is disallowed
      if (participant.entryStatus === 'checked_out' && !settings?.allowReEntry) {
        playBeep('warning');
        triggerHaptic([300, 200, 300]);
        setScanResult({
          type: 'ALREADY_CHECKED_IN',
          participant,
          passId: cleanPassId,
          message: 'Participant previously checked out. Campus re-entry is RESTRICTED.',
        });
        setIsProcessingScan(false);
        return;
      }

      // Pass is 100% valid and verified!
      playBeep('success');
      triggerHaptic([100, 50, 100]);
      setScanResult({
        type: 'SUCCESS_READY',
        participant,
        passId: cleanPassId,
      });
    } catch (err) {
      console.error('Verification error:', err);
      toastError('Verification Error', 'Failed to communicate with authorization server.');
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Gate coordinator presses [Accept Entry]
  const handleAcceptEntry = async () => {
    if (!scanResult?.participant || !user) return;
    setIsProcessingScan(true);

    try {
      const res = await dataService.processCheckIn(
        scanResult.participant.passId,
        { email: user.email, name: user.fullName },
        'Gate 1'
      );

      if (res.success && res.participant) {
        toastSuccess(
          'ENTRY ADMITTED',
          `${res.participant.fullName} (${res.participant.collegeId}) is checked in!`
        );
        playBeep('success');
        triggerHaptic([150]);
        setScanResult(null);
      } else {
        toastError('Check-in Rejected', res.message || 'Could not commit check-in.');
        setScanResult(null);
      }
    } catch {
      toastError('Error', 'Atomic check-in failed.');
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Gate coordinator presses [Confirm Check-Out]
  const handleConfirmCheckout = async () => {
    if (!scanResult?.participant || !user) return;
    setIsProcessingScan(true);

    try {
      const res = await dataService.processCheckOut(scanResult.participant.passId, {
        email: user.email,
        name: user.fullName,
      });

      if (res.success && res.participant) {
        toastSuccess('CHECKED OUT', `${res.participant.fullName} marked as exited.`);
        playBeep('success');
        setScanResult(null);
      } else {
        toastError('Checkout Failed', res.message || 'Could not commit checkout.');
      }
    } catch {
      toastError('Error', 'Checkout operation failed.');
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Gate coordinator presses [Reject Entry]
  const handleRejectScan = async () => {
    if (!scanResult?.participant || !user) {
      setScanResult(null);
      return;
    }

    try {
      await dataService.logAudit({
        action: 'CHECK_IN_REJECTED',
        targetId: scanResult.participant.passId,
        userEmail: user.email,
        userName: user.fullName,
        timestamp: new Date().toISOString(),
        details: { reason: 'COORDINATOR_MANUAL_REJECT' },
      });
      toastInfo('Entry Rejected', 'Scan rejected. Participant record remains unchanged.');
    } catch {
      // Ignore
    }
    setScanResult(null);
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'gate_coordinator']}>
      <div className="min-h-screen bg-black text-white flex flex-col justify-between select-none">
        {/* TOP STATUS BAR */}
        <div className="p-4 bg-[#0d071b] border-b border-amber-500/30 flex items-center justify-between z-20">
          <Link
            href="/gate-dashboard"
            className="flex items-center gap-1.5 text-xs text-amber-300 font-bold hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Gate Dashboard</span>
          </Link>

          {/* Mode Switcher: Check-In vs Check-Out */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setScannerMode('check_in')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                scannerMode === 'check_in'
                  ? 'bg-emerald-500 text-purple-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Entry Mode</span>
            </button>
            <button
              onClick={() => setScannerMode('check_out')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                scannerMode === 'check_out'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-Out</span>
            </button>
          </div>

          {/* Hardware & Network Status Controls */}
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-colors ${
                  torchOn ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'
                }`}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={toggleCameraFacing}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
              title="Switch Camera (Front/Back)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {isOnline ? (
              <span className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400" title="Online Sync Active">
                <Wifi className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-2 rounded-xl bg-rose-950/90 text-rose-400 animate-ping" title="Offline Warning">
                <WifiOff className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* OFFLINE NETWORK WARNING BANNER */}
        {!isOnline && (
          <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-30 animate-pulse">
            <WifiOff className="w-4 h-4" />
            <span>DISCONNECTED: Cannot authoritatively verify QR codes offline! Reconnecting...</span>
          </div>
        )}

        {/* CAMERA SCANNER VIEWPORT */}
        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-black">
          {/* Target Scanning Crosshair Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="relative w-64 h-64 border-2 border-amber-400/80 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

              {/* Laser animation line */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse duration-700" />
            </div>
          </div>

          {/* Camera Video View Container */}
          <div id="gate-qr-reader" className="w-full max-w-md h-full object-cover" />

          {/* Camera Permission / Error Fallback */}
          {cameraError && (
            <div className="absolute inset-4 z-20 flex flex-col items-center justify-center text-center p-6 bg-black/90 rounded-3xl border border-rose-500/40 space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-400" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Camera Access Error</h3>
                <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              </div>
              <p className="text-xs text-amber-300">
                Please allow camera permissions in your browser or use Manual Pass Lookup below.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM MANUAL ENTRY & BARCODE INPUT FALLBACK */}
        <div className="p-4 bg-[#0d071b] border-t border-amber-500/30 z-20 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) {
                handleVerifyPassId(manualInput.trim());
              }
            }}
            className="flex gap-2 max-w-md mx-auto"
          >
            <input
              type="text"
              placeholder="Manual Pass ID (TGP-GARBA-...) or College ID"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-purple-950/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isProcessingScan}
              className="px-5 py-3 rounded-xl bg-amber-500 text-purple-950 font-black text-xs hover:bg-amber-400 transition-colors shrink-0 disabled:opacity-50"
            >
              Verify
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400">
            Current Gate: <strong className="text-amber-300">Gate 1</strong> • Mode:{' '}
            <strong className="text-emerald-400 uppercase">{scannerMode.replace('_', ' ')}</strong>
          </p>
        </div>

        {/* VERIFICATION RESULT POPUPS & DECISION SCREENS */}
        {scanResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
            {/* CASE 1: SUCCESS VERIFIED & READY FOR ENTRY */}
            {scanResult.type === 'SUCCESS_READY' && scanResult.participant && (
              <div className="max-w-md w-full festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-emerald-500 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce duration-1000">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                    Pass Valid & Payment Verified
                  </span>
                  <h2 className="text-2xl font-black text-white pt-2">
                    {scanResult.participant.fullName}
                  </h2>
                  <p className="text-xs font-mono font-bold text-amber-300">
                    {scanResult.participant.passId}
                  </p>
                </div>

                {/* Identity Summary Card */}
                <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">College ID:</span>
                    <span className="font-bold text-white font-mono">
                      {scanResult.participant.collegeId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-white max-w-[200px] truncate text-right">
                      {scanResult.participant.department}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Year:</span>
                    <span className="font-bold text-white">{scanResult.participant.year}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/10">
                    <span className="text-slate-400">Payment Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">VERIFIED</span>
                  </div>
                </div>

                {/* Large Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleRejectScan}
                    disabled={isProcessingScan}
                    className="py-4 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptEntry}
                    disabled={isProcessingScan}
                    className="py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
                  >
                    {isProcessingScan ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Accept Entry</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: PAYMENT NOT VERIFIED POPUP */}
            {scanResult.type === 'PAYMENT_NOT_VERIFIED' && (
              <div className="max-w-md w-full festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-rose-500 text-center bg-rose-950/30">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-9 h-9" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-rose-400 tracking-tight">
                    PAYMENT NOT VERIFIED
                  </h2>
                  <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">
                    Entry Is Strictly Not Allowed
                  </p>
                  <div className="p-3.5 rounded-xl bg-black/70 border border-rose-500/50 text-sm font-bold text-rose-200 shadow-inner">
                    Payment not verified kindly wait or contact the payment team.
                  </div>
                </div>

                {scanResult.participant && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs text-left space-y-1.5">
                    <p className="text-slate-300">
                      Participant: <strong className="text-white">{scanResult.participant.fullName}</strong>
                    </p>
                    <p className="text-slate-400 font-mono">
                      College ID: {scanResult.participant.collegeId}
                    </p>
                    <p className="text-amber-300 font-mono">
                      Pass ID: {scanResult.participant.passId}
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-slate-300 italic">
                  Instruct participant to report to the TGPCET Finance & Registration Helpdesk.
                </p>

                <div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-colors"
                  >
                    Dismiss & Ready for Next Scan
                  </button>
                </div>
              </div>
            )}

            {/* CASE 3: ALREADY USED / ALREADY CHECKED IN */}
            {scanResult.type === 'ALREADY_CHECKED_IN' && (
              <div className="max-w-md w-full festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-amber-500 text-center bg-amber-950/30">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                    ALREADY USED / CHECKED IN
                  </h2>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    Duplicate Admission Blocked
                  </p>
                  <p className="text-xs text-amber-200/90 leading-relaxed pt-1">
                    {scanResult.message}
                  </p>
                </div>

                {scanResult.participant && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs text-left space-y-1.5">
                    <p className="text-slate-300">
                      Pass Owner: <strong className="text-white">{scanResult.participant.fullName}</strong>
                    </p>
                    <p className="text-slate-400 font-mono">
                      College ID: {scanResult.participant.collegeId}
                    </p>
                    <p className="text-amber-300 font-mono">
                      Pass ID: {scanResult.participant.passId}
                    </p>
                  </div>
                )}

                <div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-500 text-purple-950 font-black text-sm hover:bg-amber-400 transition-colors"
                  >
                    Dismiss & Continue
                  </button>
                </div>
              </div>
            )}

            {/* CASE 4: CHECKOUT READY */}
            {scanResult.type === 'CHECKOUT_READY' && scanResult.participant && (
              <div className="max-w-md w-full festive-glass-glow rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-purple-500 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/50 flex items-center justify-center mx-auto">
                  <LogOut className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                    Exit & Check-Out Mode
                  </span>
                  <h2 className="text-2xl font-black text-white pt-2">
                    {scanResult.participant.fullName}
                  </h2>
                  <p className="text-xs font-mono font-bold text-amber-300">
                    {scanResult.participant.passId}
                  </p>
                </div>

                <p className="text-xs text-slate-300">
                  {settings?.allowReEntry
                    ? 'Re-entry is allowed for this event.'
                    : 'Notice: If marked checked-out, participant cannot re-enter without admin override.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setScanResult(null)}
                    className="py-3.5 px-4 rounded-xl bg-white/10 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCheckout}
                    disabled={isProcessingScan}
                    className="py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg"
                  >
                    {isProcessingScan ? 'Updating...' : 'Confirm Check-Out'}
                  </button>
                </div>
              </div>
            )}

            {/* CASE 5: INVALID / UNKNOWN PASS */}
            {scanResult.type === 'INVALID_PASS' && (
              <div className="max-w-md w-full festive-glass rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-rose-500 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center mx-auto">
                  <XCircle className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-rose-400">INVALID PASS</h2>
                  <p className="text-xs text-slate-300 pt-2 leading-relaxed">
                    {scanResult.message}
                  </p>
                </div>

                <div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                  >
                    Dismiss & Ready for Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

export default function ScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <ScannerContent />
    </Suspense>
  );
}
