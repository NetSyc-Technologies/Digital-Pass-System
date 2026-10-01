import { OcrExtractedData } from '@/types';

/**
 * Image Validation & Compression Configuration
 */
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB limit for upload
export const TARGET_MAX_DIMENSION = 1280; // Optimal for OCR reading & small document payload
export const COMPRESSION_QUALITY = 0.8;

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No image file selected.' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPG, PNG, or WebP).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Image file size exceeds the 8MB limit. Please upload a smaller screenshot.',
    };
  }

  return { isValid: true };
}

/**
 * Compresses an image file on the client using HTML5 Canvas.
 * Produces an optimized Base64 JPEG data URL suitable for Firestore or Storage.
 */
export async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image for compression.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > TARGET_MAX_DIMENSION || height > TARGET_MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * TARGET_MAX_DIMENSION) / width);
            width = TARGET_MAX_DIMENSION;
          } else {
            width = Math.round((width * TARGET_MAX_DIMENSION) / height);
            height = TARGET_MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image on canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Image Persistence Service Abstraction
 * Currently stores as compressed Base64 data URL.
 * Easily switchable to Firebase Storage without changing component logic.
 */
export interface ImageStorageService {
  saveImage(fileOrBase64: string | File, path: string): Promise<string>;
}

export class Base64StorageProvider implements ImageStorageService {
  async saveImage(fileOrBase64: string | File): Promise<string> {
    if (typeof fileOrBase64 === 'string') {
      return fileOrBase64;
    }
    return compressImageToBase64(fileOrBase64);
  }
}

export const imageStorageService: ImageStorageService = new Base64StorageProvider();

/**
 * Regex Pattern Extractor for Indian UPI Screenshots
 * Works for Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, Cred, Bank Apps
 */
export function extractUpiDetailsFromText(rawText: string, expectedAmount?: number): OcrExtractedData {
  const text = rawText || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let utr: string | undefined;
  let transactionId: string | undefined;
  let payerName: string | undefined;
  let amount: number | undefined;
  let paymentDate: string | undefined;
  let paymentApp: string | undefined;

  // 1. Detect App
  const lowerText = text.toLowerCase();
  if (lowerText.includes('phonepe') || lowerText.includes('ybl') || lowerText.includes('ibl')) {
    paymentApp = 'PhonePe';
  } else if (lowerText.includes('google pay') || lowerText.includes('gpay') || lowerText.includes('okaxis') || lowerText.includes('oksbi')) {
    paymentApp = 'Google Pay';
  } else if (lowerText.includes('paytm') || lowerText.includes('paytm payments')) {
    paymentApp = 'Paytm';
  } else if (lowerText.includes('bhim') || lowerText.includes('upi')) {
    paymentApp = 'BHIM UPI';
  } else if (lowerText.includes('cred')) {
    paymentApp = 'CRED';
  } else if (lowerText.includes('amazon pay')) {
    paymentApp = 'Amazon Pay';
  }

  // 2. Extract 12-digit UTR / UPI Ref ID
  // Standard UTR in India is 12 digits, often starting with year/Julian date (e.g. 4... or 3...)
  const utrMatch =
    text.match(/(?:UPI\s*(?:Ref|Reference|Ref\s*No|Transaction\s*ID|Txn\s*ID|RR\s*No|UTR)|UTR\s*(?:No|Number)?|Ref\s*No)[\s:=#-]*([0-9]{12})/i) ||
    text.match(/\b([0-9]{12})\b/); // fallback standalone 12-digit sequence

  if (utrMatch) {
    utr = utrMatch[1];
  }

  // 3. Extract Transaction ID (alphanumeric, often starts with T... for PhonePe or digits/letters)
  const txnMatch = text.match(/(?:Transaction\s*ID|Txn\s*ID|Order\s*ID)[\s:=#-]*([A-Za-z0-9_-]{10,35})/i);
  if (txnMatch && txnMatch[1] !== utr) {
    transactionId = txnMatch[1];
  }

  // 4. Extract Amount (Look for ₹ or Rs or INR)
  const amountMatch =
    text.match(/(?:₹|Rs\.?|INR)[\s]*([0-9]+(?:\.[0-9]{2})?)/i) ||
    text.match(/(?:Paid|Amount|Total|Sent)[\s:=₹RsINR]*([0-9]+(?:\.[0-9]{2})?)/i);

  if (amountMatch) {
    const parsedAmount = parseFloat(amountMatch[1]);
    if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount < 50000) {
      amount = parsedAmount;
    }
  }

  // 5. Extract Date/Time pattern (e.g., 18 Oct 2024, 18/10/2024, 07:45 PM)
  const dateMatch =
    text.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}(?:,\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i) ||
    text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)?)/i);

  if (dateMatch) {
    paymentDate = dateMatch[1];
  }

  // 6. Name extraction heuristic (lines with "Paid to", "From", "To")
  for (const line of lines) {
    const fromMatch = line.match(/(?:From|Paid by|Sender)[:\s]+([A-Za-z\s]{3,35})/i);
    if (fromMatch) {
      payerName = fromMatch[1].trim();
      break;
    }
  }

  // 7. Calculate Confidence
  let confidence: 'high' | 'medium' | 'low' | 'manual_review' = 'low';
  if (utr && amount) {
    if (expectedAmount && Math.abs(amount - expectedAmount) < 1) {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }
  } else if (utr || amount) {
    confidence = 'medium';
  } else if (text.trim().length > 20) {
    confidence = 'low';
  } else {
    confidence = 'manual_review';
  }

  return {
    utr,
    transactionId,
    payerName,
    amount,
    paymentDate,
    paymentApp,
    rawText: text.slice(0, 1500),
    confidence,
  };
}

/**
 * Runs OCR on the uploaded image using Tesseract.js with fallback
 */
export async function performOcrAnalysis(
  imageDataUrl: string,
  expectedAmount?: number,
  onProgress?: (progress: number) => void
): Promise<OcrExtractedData> {
  try {
    // Dynamic import to keep initial bundle size lean
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    if (onProgress) {
      onProgress(30);
    }

    const ret = await worker.recognize(imageDataUrl);
    if (onProgress) {
      onProgress(85);
    }

    const text = ret.data.text;
    await worker.terminate();

    if (onProgress) {
      onProgress(100);
    }

    return extractUpiDetailsFromText(text, expectedAmount);
  } catch (error) {
    console.warn('Tesseract OCR engine encountered an issue or timed out:', error);
    // Safe graceful fallback: return empty OCR data with manual review flag
    return {
      confidence: 'manual_review',
      rawText: 'OCR could not automatically extract text. Manual coordinator verification required.',
    };
  }
}
