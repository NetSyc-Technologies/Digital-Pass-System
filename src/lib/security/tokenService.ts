import { PassPayload } from '@/types';

/**
 * Security Token & Pass ID Service
 * Generates secure nonces, random Pass IDs, and minimal QR payloads.
 * Strictly avoids embedding PII (name, phone, college ID) in the QR code payload.
 */

// Generate random uppercase alphanumeric pass code
export function generatePassId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding ambiguous chars
  let randomPart = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `TGP-GARBA-2024-${randomPart}`;
}

// Generate cryptographically secure random nonce
export function generateSecureNonce(length = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Compute a SHA-256 hash using Web Crypto API
export async function computeTokenHash(
  passId: string,
  nonce: string,
  timestamp: number
): Promise<string> {
  const data = `${passId}:${nonce}:${timestamp}:tgpcet_salt`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).slice(0, 16).join('');
    } catch {
      // Fallback
    }
  }
  // Simple deterministic fallback for non-crypto environments
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(12, '0');
}

/**
 * Creates the minimal signed QR payload containing ONLY version, passId, token, and timestamp.
 * NO PERSONAL INFORMATION IS EXPOSED.
 */
export async function createPassQrPayload(passId: string): Promise<string> {
  const ts = Date.now();
  const nonce = generateSecureNonce(8);
  const token = await computeTokenHash(passId, nonce, ts);
  
  const payload: PassPayload = {
    v: 1,
    passId,
    token: `${nonce}.${token}`,
    ts,
  };

  return JSON.stringify(payload);
}

/**
 * Parses and validates raw scanned QR content.
 * Accepts either:
 * 1. JSON string: {"v":1,"passId":"TGP-GARBA-...","token":"...","ts":...}
 * 2. Plain pass ID: "TGP-GARBA-2024-XXXXXX"
 * 3. Scanned URL containing passId query parameter
 */
export function parseScannedQrPayload(scannedText: string): {
  isValid: boolean;
  passId?: string;
  token?: string;
  error?: string;
} {
  if (!scannedText || typeof scannedText !== 'string') {
    return { isValid: false, error: 'Empty or malformed scan' };
  }

  const trimmed = scannedText.trim();

  // Case 1: JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.passId && typeof parsed.passId === 'string') {
        return {
          isValid: true,
          passId: parsed.passId.trim().toUpperCase(),
          token: parsed.token,
        };
      }
    } catch {
      // Invalid JSON
    }
  }

  // Case 2: URL with passId
  if (trimmed.includes('passId=') || trimmed.includes('/pass/')) {
    try {
      if (trimmed.includes('/pass/')) {
        const parts = trimmed.split('/pass/');
        const candidate = parts[1].split('?')[0].split('#')[0].trim();
        if (candidate.startsWith('TGP-GARBA-')) {
          return { isValid: true, passId: candidate.toUpperCase() };
        }
      }
      const url = new URL(trimmed);
      const passIdParam = url.searchParams.get('passId');
      if (passIdParam && passIdParam.startsWith('TGP-GARBA-')) {
        return { isValid: true, passId: passIdParam.toUpperCase() };
      }
    } catch {
      // Not a valid URL
    }
  }

  // Case 3: Raw Pass ID match
  if (trimmed.toUpperCase().startsWith('TGP-GARBA-')) {
    return { isValid: true, passId: trimmed.toUpperCase() };
  }

  return { isValid: false, error: 'Unrecognized pass QR code format' };
}
