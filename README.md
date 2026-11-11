# ArogyaNet — Unified Multi-Branch Hospital Management & EHR System

ArogyaNet is an enterprise-grade Hospital Management System (HMS) and centralized Electronic Health Records (EHR) platform engineered to interconnect multi-branch hospital networks. It provides seamless cross-branch patient care, digital prescription workflows, emergency broadcast protocols, pharmacy dispensing, referral pipelines, and AI-assisted clinical summarization.

---

## Key Features

### 1. Multi-Branch Patient Identity & Compliance
- **Centralized Health Identifier (UHID)**: Unique patient identification shared seamlessly across all hospital branches.
- **ABDM / ABHA Integration**: Support for national digital health standards (Ayushman Bharat Digital Mission).
- **Non-Mandatory Aadhaar Compliance**: Strict adherence to healthcare identity privacy regulations with masked records.
- **Medical Safety Flags**: Real-time identification of critical drug allergies, chronic conditions, and emergency contact details.

### 2. Cross-Branch Electronic Health Records (EHR)
- **Unified Clinical Timeline**: Comprehensive medical record aggregating visits, clinical notes, lab results, and vitals from every branch in the network.
- **Cross-Branch Audit Logging**: Every doctor access to records across branches is immutably logged with role and timestamp.
- **Clinical Consent Framework**: Explicit consent tracking for cross-branch record review and transfers.

### 3. Digital Prescriptions & Versioned Titration
- **Prescription Versioning**: Track medication dose titration history across visits without overwriting earlier regimens.
- **Automated Prescription Codes & QR Validation**: Secure cryptographic QR codes embedded on prescriptions for instant pharmacy verification.
- **Drug Interaction & Timing Instructions**: Structured dosage, frequency, route, and timing instructions (Before Food, After Food, With Food).

### 4. Hospital Pharmacy Portal & Dispensing
- **Real-Time Dispensation Tracking**: Pharmacists can verify prescriptions via QR or Rx Code and dispense complete or partial quantities.
- **Dispensing Records**: Automatic recording of dispensing branch, dispensing pharmacist, and remaining quantity balances.

### 5. Multi-Branch Referrals & Transfer Pipeline
- **Doctor-to-Doctor Referrals**: Structured referral routing across hospital network locations.
- **Triage Priority Levels**: Color-coded urgency levels (`Emergency`, `Urgent`, `Routine`).
- **Transfer Status Pipeline**: Kanban and list tracking (`Initiated`, `Accepted`, `In-Transit`, `Completed`, `Cancelled`).

### 6. Emergency Broadcast Alert System
- **Standardized Healthcare Color Codes**: Instant broadcast of hospital codes:
  - **Code Blue**: Cardiac Arrest / Adult Medical Emergency
  - **Code Red**: Fire Emergency / Evacuation
  - **Code Yellow**: Disaster / Mass Casualty Protocol
  - **Code Orange**: Hazardous Material Incident / External Spill
  - **Code Green**: Operational All Clear / System Normal
- **Network-wide Visibility**: Immediate notification banners visible across all departments and workstations.

### 7. Departmental Billing & Invoicing
- **Multi-Department Charges**: Consolidated billing for Consultations, Pharmacy, Diagnostics, and Procedures.
- **Payment Lifecycle**: Invoice generation, itemized charge breakdowns, status tracking (`Paid`, `Pending`, `Refunded`), and printable receipts.

### 8. AI-Powered Clinical Summaries
- **Gemini Clinical Summaries**: Server-side AI clinical assistant synthesizing complex multi-visit timelines into actionable diagnostic insights.
- **Fallback Deterministic Synthesis**: Built-in deterministic clinical synthesis engine ensuring uninterrupted operation even when offline.

---

## Architecture & Project Structure

```
arogyanet/
├── src/
│   ├── components/                     # User interface modules
│   │   ├── AppointmentsView.tsx        # Doctor scheduling & OPD bookings
│   │   ├── AuditTrailView.tsx          # Access logs & patient consent audits
│   │   ├── BillingView.tsx             # Departmental billing & invoices
│   │   ├── BranchAndDoctorAdminView.tsx# Hospital branches & doctor directory
│   │   ├── CrossBranchEHRView.tsx      # Consolidated medical records
│   │   ├── DigitalPrescriptionView.tsx # Rx generation & pharmacy portal
│   │   ├── EmergencyCodeBanner.tsx     # Hospital-wide emergency code alerts
│   │   ├── Navbar.tsx                  # Global branch/role switcher & nav
│   │   ├── PatientRegistrationModal.tsx# ABDM-compliant patient onboarding
│   │   ├── QRCodeDisplay.tsx           # Deterministic SVG QR code generator
│   │   ├── ReferralManagementView.tsx  # Cross-branch transfer Kanban
│   │   └── WorkflowWalkthroughModal.tsx# Guided interactive clinical tour
│   ├── domain/                         # Core domain logic & entities
│   │   ├── hms-engine.ts               # State engines & business validations
│   │   ├── hms-engine.test.ts          # Domain engine test suites
│   │   ├── seed-data.ts                # Realistic multi-branch initial data
│   │   └── types.ts                    # TypeScript domain models & schemas
│   ├── services/                       # Infrastructure & state
│   │   ├── ai-service.ts               # Gemini AI clinical proxy integration
│   │   └── store.ts                    # Reactive HMS state store
│   ├── App.tsx                         # Root application shell
│   ├── index.css                       # Tailwind CSS styling
│   └── main.tsx                        # React application entry point
├── server.ts                           # Express backend proxy for Gemini API
├── vite.config.ts                      # Vite configuration & plugin pipeline
├── tsconfig.json                       # TypeScript compiler configuration
└── package.json                        # Dependencies and script definitions
```

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Animations & Icons**: Motion, Lucide React
- **Backend / Proxy**: Express, tsx
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Build Tool**: Vite 8

---

## Getting Started

### Prerequisites

- Node.js (v18.0 or higher recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/arogyanet-unified-multi-branch-hospital-management-ehr.git
   cd arogyanet-unified-multi-branch-hospital-management-ehr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env` if you want to use live AI clinical summarization:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
