import React, { useState, useEffect } from 'react';
import { hmsStore } from './services/store';
import { Navbar, MainNavTab } from './components/Navbar';
import { EmergencyCodeBanner } from './components/EmergencyCodeBanner';
import { WorkflowWalkthroughModal } from './components/WorkflowWalkthroughModal';
import { PatientRegistrationModal } from './components/PatientRegistrationModal';
import { CrossBranchEHRView } from './components/CrossBranchEHRView';
import { DigitalPrescriptionView } from './components/DigitalPrescriptionView';
import { ReferralManagementView } from './components/ReferralManagementView';
import { BranchAndDoctorAdminView } from './components/BranchAndDoctorAdminView';
import { AppointmentsView } from './components/AppointmentsView';
import { BillingView } from './components/BillingView';
import { AuditTrailView } from './components/AuditTrailView';
import {
  ShieldAlert,
  Building2,
  Stethoscope,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = hmsStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const state = hmsStore.getState();
  const currentBranch =
    state.branches.find((b) => b.id === state.currentBranchId) || state.branches[0];

  const [currentTab, setCurrentTab] = useState<MainNavTab>('ehr');
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const handleSelectWorkflow = (wfNum: number) => {
    switch (wfNum) {
      case 1:
        setCurrentTab('ehr');
        break;
      case 2:
        setCurrentTab('prescriptions');
        break;
      case 3:
        setCurrentTab('referrals');
        break;
      case 4:
        setCurrentTab('admin');
        break;
      default:
        setCurrentTab('ehr');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">

      {currentBranch && (
        <EmergencyCodeBanner
          branch={currentBranch}
          onBroadcastDrill={(code) => {
            hmsStore.logAudit({
              action: 'EMERGENCY_DRILL_SIMULATED',
              resourceType: 'Branch',
              resourceId: currentBranch.id,
              details: `Simulated rapid emergency protocol drill for ${code} at ${currentBranch.name}.`,
            });
          }}
        />
      )}

      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWalkthrough={() => setShowWalkthrough(true)}
        onOpenNewPatient={() => setShowPatientModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {currentTab === 'ehr' && (
          <CrossBranchEHRView
            onOpenNewPrescription={() => setCurrentTab('prescriptions')}
            onOpenNewReferral={() => setCurrentTab('referrals')}
          />
        )}

        {currentTab === 'prescriptions' && <DigitalPrescriptionView />}

        {currentTab === 'referrals' && (
          <ReferralManagementView onOpenPatientEHR={() => setCurrentTab('ehr')} />
        )}

        {currentTab === 'admin' && <BranchAndDoctorAdminView />}

        {currentTab === 'appointments' && <AppointmentsView />}

        {currentTab === 'billing' && <BillingView />}

        {currentTab === 'audit' && <AuditTrailView />}
      </main>

      <WorkflowWalkthroughModal
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        onSelectWorkflow={handleSelectWorkflow}
      />

      <PatientRegistrationModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onPatientCreated={() => {
          setCurrentTab('ehr');
        }}
      />

      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>ArogyaNet Unified Healthcare Alliance</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Open-Source Multi-Branch Hospital Management System with Unified Longitudinal EHR
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              ABDM / ABHA Standards Supported
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              Aadhaar Strictly Non-Mandatory
            </span>
            <span className="text-slate-500 font-mono">
              Role: <strong className="text-slate-300 uppercase">{state.currentRole}</strong>
            </span>
            <span className="text-slate-500 font-mono">
              Branch: <strong className="text-slate-300">{currentBranch?.code}</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

