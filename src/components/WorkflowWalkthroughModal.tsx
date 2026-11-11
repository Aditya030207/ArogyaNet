import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  UserCheck,
  Building2,
  QrCode,
  Share2,
  ShieldAlert,
  X,
} from 'lucide-react';

interface WorkflowWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (workflowNumber: number) => void;
}

export const WorkflowWalkthroughModal: React.FC<WorkflowWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkflow,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);

  if (!isOpen) return null;

  const workflows = [
    {
      num: 1,
      title: 'Workflow 1: Cross-Branch Patient History',
      icon: FileText,
      badge: 'Core Concept',
      color: 'blue',
      summary:
        'One Patient, One Unified Record. A patient visits Delhi Central for Cardiology, and later visits Mumbai West Coast. The Mumbai doctor immediately retrieves their complete history, previous prescriptions, lab reports, and AI summary using their centralized Patient ID.',
      steps: [
        'Select "Delhi Central" branch and doctor role to inspect patient Rajesh Kumar Verma (PAT-100293).',
        'Review his Delhi Cardiology visit, ECG findings, and HbA1c lab tests.',
        'Switch the top branch dropdown to "Mumbai West Coast Hospital" and doctor role to Dr. Aditi Deshmukh (Neurology).',
        'Search patient ID "PAT-100293". Notice the entire longitudinal history is instantly accessible without re-registration!',
        'Click "Generate / Refresh AI Summary" to obtain a structured clinical digest and sign off on it.',
      ],
      quickActionLabel: 'Launch Cross-Branch EHR View',
    },
    {
      num: 2,
      title: 'Workflow 2: Digital Prescription & Pharmacy Verification',
      icon: QrCode,
      badge: 'Safety & Dispensing',
      color: 'emerald',
      summary:
        'Eliminate illegible handwriting. Doctors issue cryptographically verifiable prescriptions with unique IDs and QR payloads. When dosage changes, versioning archives v1 and creates v2. The pharmacy portal verifies authenticity and blocks superseded prescriptions.',
      steps: [
        'Navigate to "Digital Prescriptions" tab as a Doctor.',
        'View the structured prescription with strength, dosage, frequency, route, and precautions.',
        'Click "Titrate / Modify (Create v2)" to change dosage (e.g., Telmisartan 40mg -> 80mg) with a clinical reason.',
        'Notice v1 is marked "SUPERSEDED" with cross-references, while v2 becomes the active order.',
        'Switch your role to "Pharmacy Staff" in the top bar to test the Pharmacy Verification Portal.',
        'Input prescription ID "RX-DEL-2026-8801" (v1): Notice the system BLOCKS dispensing with an alert!',
        'Input active prescription ID (v2): Pharmacist reviews the privacy-preserved medicines and records dispensing.',
      ],
      quickActionLabel: 'Launch Digital Prescriptions & Pharmacy View',
    },
    {
      num: 3,
      title: 'Workflow 3: Doctor-to-Doctor Cross-Branch Referral',
      icon: Share2,
      badge: 'Coordination',
      color: 'purple',
      summary:
        'Streamline inter-branch patient referrals. A cardiologist at Delhi Central refers a patient with transient ischemic symptoms to a neurologist at Mumbai West Coast with emergency prioritization (Code Yellow / Emergency).',
      steps: [
        'Open "Cross-Branch Referrals" to view the multi-branch referral pipeline.',
        'Observe how referrals are strictly prioritized: Emergency > Urgent > Routine with color coding.',
        'Review referral REF-2026-1029 (Delhi Central -> Mumbai West Coast for Rajesh Kumar Verma).',
        'Switch branch to "Mumbai West Coast" to act as the receiving hospital.',
        'Click "Accept Referral" and enter clinical intake notes.',
        'Directly jump from the referral packet into the patient’s unified EHR.',
      ],
      quickActionLabel: 'Launch Referral Pipeline',
    },
    {
      num: 4,
      title: 'Workflow 4: Branch & Doctor Management',
      icon: Building2,
      badge: 'Governance & RBAC',
      color: 'amber',
      summary:
        'Enterprise hospital governance. Administrators create new branches that automatically initialize standard clinical departments and emergency codes. Doctors are added independently, verified against state council registries, and can have access revoked without destroying historical records.',
      steps: [
        'Switch role in top bar to "Super Administrator" and open "Hospital & Doctor Admin".',
        'Click "Create New Hospital Branch" (e.g. "Kolkata Apollo City Hospital").',
        'Observe how standard emergency codes (Code Blue, Red, Yellow, Green) and 9 clinical departments are auto-configured.',
        'Add a new doctor to that branch independently with their State Medical Council registration.',
        'Click "Verify Credentials" to grant active clinical authorization.',
        'Click "Deactivate / Revoke Access" on a doctor: Notice their login is revoked immediately, while all past clinical notes and prescriptions remain safely preserved.',
      ],
      quickActionLabel: 'Launch Governance & Administration',
    },
  ];

  const currentWf = workflows.find((w) => w.num === activeTab) || workflows[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">

        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Interactive MVP Workflow Walkthroughs</h2>
              <p className="text-xs text-slate-400">
                Click any workflow to review its step-by-step verification instructions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          {workflows.map((wf) => {
            const Icon = wf.icon;
            const isSelected = activeTab === wf.num;
            return (
              <button
                key={wf.num}
                type="button"
                onClick={() => setActiveTab(wf.num)}
                className={`py-3 px-3 text-left border-r last:border-r-0 border-slate-200 flex flex-col gap-1 transition ${
                  isSelected
                    ? 'bg-white text-blue-700 border-b-2 border-b-blue-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Workflow {wf.num}</span>
                </div>
                <span className="text-[11px] font-normal truncate">{wf.badge}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {currentWf.badge}
              </span>
              <h3 className="font-bold text-base text-slate-900">{currentWf.title}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {currentWf.summary}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-3">
              Step-by-Step Test Journey
            </h4>
            <div className="space-y-2.5">
              {currentWf.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 text-xs sm:text-sm leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Tip: Use the top navigation bar to switch between branches and staff roles at any time.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectWorkflow(currentWf.num);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {currentWf.quickActionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

