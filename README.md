# 🪔 TGPCET Garba Night – Digital Gate Pass & Entry Management System

A production-grade, secure, responsive, and visually stunning web application engineered for **Tulsiramji Gaikwad-Patil College of Engineering and Technology (TGPCET)** annual Garba Night & Dandiya Raas festival.

---

## 🌟 Key Highlights & Features

- **Royal Festive Garba Theme**: High-energy Navratri aesthetics with deep indigo/royal purple backgrounds, marigold gold gradients, animated particle shimmers, glassmorphism, responsive micro-interactions, and mobile-optimized layouts.
- **Dynamic Public Landing Page**:
  - Hero section with live countdown, date, timing, and venue configurable by the Administrator.
  - Attractions & Highlights: Live Dhol & Orchestra, Mega Garba Contests, 360° Photo Booths, Food Street.
  - Pass pricing cards, guidelines, and interactive FAQ accordion.
- **3-Step Participant Registration**:
  - **Academic Info**: College ID, Full Legal Name, Department (all 19 official TGPCET departments), Year of Study (1st to 4th year).
  - **Contact Coordinates**: Normalized Email, 10-digit WhatsApp Mobile, and Emergency Guardian Contact Number.
  - **Duplicate Prevention**: Prevents accidental duplicate passes across College ID, Email, or Mobile.
  - **Campus Code Consent**: Mandatory agreement to campus safety, anti-substance policies, and entry rules.
- **Configurable UPI Payment with `payqr.png` & OCR Analysis**:
  - Dynamic pass fee controlled from Admin Dashboard (e.g., ₹150).
  - Prominent display of the official UPI QR code graphic `payqr.png`.
  - One-click UPI app deep-linking and copyable UPI VPA ID.
  - Client-side image validation, dimension normalization, and canvas JPEG compression (< 300KB Base64 / Cloud Storage).
  - **Intelligent OCR Engine (Tesseract.js)**: Automatically parses 12-digit UTR numbers, Transaction IDs, payer names, amounts, timestamps, and UPI app info.
- **Cryptographic Digital Gate Pass**:
  - Holographic ticket design with Tear-off border and live Payment/Entry Status badges.
  - **Zero PII Exposure**: Personal information is NEVER encoded directly inside the QR code. The QR carries a minimal signed payload (`v`, `passId`, cryptographic nonce/token).
  - High-resolution **PNG Download** and **Print/PDF** options.
  - Public Pass Finder/Retrieval tool by College ID or Mobile number.
- **Role-Based Staff Portal & Google Sign-In**:
  - Permanent Master Super Admin: `bhushanmallick2006@gmail.com`.
  - Firebase Authentication with Google Sign-In + 1-click test role switchers for instant evaluation.
  - Strict RBAC: **Super Admin / Admin**, **Gate Coordinator**, and **Payment Verification Coordinator**.
  - Coordinator assignment by Google Email, role delegation, status toggles (Active/Inactive), and last-login tracking.
- **Payment Verification Dashboard**:
  - Filterable queues: Pending Review, Verified, Rejected, All.
  - Fullscreen screenshot inspection and OCR comparison with expected amounts.
  - **Duplicate UTR Fraud Warning Badges**: Automatically flags any UTR number submitted more than once across passes.
  - Mandatory rejection reasons and coordinator verification audit logging.
- **Mobile-First Fullscreen Gate Scanner**:
  - High-speed camera QR code scanner with camera switching (Front/Back) and Torch/Flashlight support.
  - Real-time Web Audio API beeps and vibration feedback.
  - **Offline Network Warning Banner**: Prevents accidental offline false-positive admissions.
  - **Atomic One-Time Admission**: The scan itself previews participant details; only pressing **[Accept Entry]** commits admission.
  - **"Already Used / Checked In" Alert**: Displays original admission timestamp and coordinator info if scanned again.
  - **"Payment Not Verified – Entry Not Allowed"**: Immediate barrier if pass is pending or rejected.
  - **Check-Out Mode**: Supports scanning attendees exiting the venue and decrements live occupancy count. Configurable `allowReEntry` policy.
- **Comprehensive Admin Dashboard & Analytics**:
  - 12 real-time KPI metric cards (Total Registrations, Payments, Collections, Gate Check-Ins, Inside Count, Rejected Scans).
  - Live Venue Capacity utilization meter.
  - Department-wise participation and year-wise breakdown charts.
  - Full participant registry table with detail drawers and **CSV Roster Export**.
  - Immutable Audit Trail recording every coordinator action and timestamp.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Festive Design System (`src/app/globals.css`)
- **Backend & Auth**: Firebase Authentication (Google Sign-In) + Cloud Firestore
- **OCR Engine**: Tesseract.js with regex-based UPI transaction analysis
- **QR Code Engine**: `qrcode` (Generation) & `html5-qrcode` (Live Camera Scanning)
- **Icons**: Lucide React
- **Celebration Effects**: `canvas-confetti`

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your Firebase Project credentials in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=bhushanmallick2006@gmail.com
```

> **Note on Out-of-the-Box Evaluation**:
> If Firebase credentials are placeholder values or unset, the system automatically activates a local reactive persistent store preloaded with sample participants, payments, and coordinators so you can immediately test all workflows without any setup barrier.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
garba/
├── public/
│   ├── payqr.png              # Official UPI payment QR image
│   ├── hero-garba.jpg         # Hero festive backdrop graphic
│   └── manifest.json          # PWA Mobile Add-to-HomeScreen manifest
├── src/
│   ├── app/
│   │   ├── page.tsx           # Public Landing Page & Event Highlights
│   │   ├── register/page.tsx  # 3-Step Participant Registration Form
│   │   ├── payment/page.tsx   # QR Payment, Receipt Upload & OCR Parsing
│   │   ├── pass/page.tsx      # Digital Pass & High-Res PNG Download
│   │   ├── login/page.tsx     # Staff & Coordinator Google Sign-In Portal
│   │   ├── admin/             # Administrator Overview, KPIs & Charts
│   │   │   ├── page.tsx
│   │   │   ├── participants/  # Searchable Table, Drawer View & CSV Export
│   │   │   ├── coordinators/  # Staff Assignment & RBAC Management
│   │   │   ├── settings/      # Pass Price, Capacity & Event Timing Settings
│   │   │   └── audit-logs/    # Immutable Audit Log Trail
│   │   ├── payment-dashboard/ # Verification Queue, Duplicate UTR Detection
│   │   ├── gate-dashboard/    # Gate Overview & Manual Pass Search
│   │   │   └── scanner/       # Fullscreen Mobile Camera QR Scanner
│   │   └── globals.css        # Festive Design System & Print Stylesheet
│   ├── components/
│   │   ├── Navbar.tsx         # Responsive Header with Staff Status
│   │   ├── Footer.tsx         # TGPCET Campus Address & Guidelines
│   │   ├── FestiveBackground.tsx # Floating Golden Sparkle Particles
│   │   └── RoleGuard.tsx      # Client-Side Authorization Gatekeeper
│   ├── context/
│   │   ├── AuthContext.tsx    # Firebase Auth + Role Evaluation
│   │   └── ToastContext.tsx   # Micro-Interaction Toast Notifications
│   ├── lib/
│   │   ├── firebase/config.ts # Firebase Initializer & Fallback Detector
│   │   ├── security/tokenService.ts # Cryptographic Nonce & Token Generation
│   │   └── services/
│   │       ├── dataService.ts # Universal Firestore / Reactive Store Layer
│   │       └── imageOcrService.ts # Canvas Compression & Tesseract OCR
│   └── types/index.ts         # TypeScript Enums & Data Models
├── firestore.rules            # Cloud Firestore Security Rules
└── firestore.indexes.json     # Firestore Query Index Definitions
```

---

## 🛡️ Security Architecture

1. **Minimal QR Token Payload**:
   The QR contains ONLY:
   ```json
   {
     "v": 1,
     "passId": "TGP-GARBA-2024-XXXXXX",
     "token": "nonce.hash",
     "ts": 1727780000000
   }
   ```
   No participant name, phone, or college ID is embedded in the QR image.

2. **Server-Side Authoritative Verification**:
   When a pass is scanned, authorization is verified directly against database records. Pass admissions cannot be forged or replayed.

3. **Atomic One-Time Admission**:
   Check-in transactions ensure that even if two coordinators scan the exact same QR code simultaneously, only one admission can succeed.

4. **Permanent Super Admin**:
   The Google Account **`bhushanmallick2006@gmail.com`** is hardcoded as the Permanent Super Admin and cannot be removed or deactivated.

---

## 🖨️ Printing & Gate Check-In Tips

- **Gate Volunteers**: Add the web app to your phone's Home Screen via Safari / Chrome for a native full-screen PWA scanner experience.
- **Flashlight / Torch**: Use the on-screen torch button in low-light night conditions.
- **Pass Holders**: Passes can be downloaded as crisp PNGs to save in mobile photo galleries or printed using the on-page Print button.
