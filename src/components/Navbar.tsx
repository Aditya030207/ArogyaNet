import React from 'react';
import {
  Building2,
  Stethoscope,
  Sparkles,
  RotateCcw,
  UserPlus,
  ShieldAlert,
  FileText,
  Share2,
  Calendar,
  CreditCard,
  QrCode,
  Users,
} from 'lucide-react';
import { UserRole } from '../domain/types';
import { hmsStore } from '../services/store';

export type MainNavTab =
  | 'ehr'
  | 'prescriptions'
  | 'referrals'
  | 'admin'
  | 'appointments'
  | 'billing'
  | 'audit';

interface NavbarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenWalkthrough: () => void;
  onOpenNewPatient: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWalkthrough,
  onOpenNewPatient,
}) => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const roleOptions: { role: UserRole; label: string; icon: string }[] = [
    { role: 'doctor', label: 'Doctor (Clinical & EHR)', icon: '🩺' },
    { role: 'pharmacy', label: 'Pharmacy Staff (Dispensing)', icon: '💊' },
    { role: 'receptionist', label: 'Front Desk / Receptionist', icon: '🗂️' },
    { role: 'billing', label: 'Accounts & Billing Desk', icon: '💳' },
    { role: 'branch_admin', label: 'Branch Administrator', icon: '🏥' },
    { role: 'super_admin', label: 'Super Administrator', icon: '🛡️' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">

      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 text-xs">

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                  Arogya<span className="text-blue-600">Net</span>
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Open-Source HMS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                One Patient • One Unified Record • Multi-Branch System
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 font-medium text-[11px] hidden md:inline">Branch:</span>
            <select
              value={state.currentBranchId}
              onChange={(e) => hmsStore.setBranch(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer text-xs"
              title="Select current operational hospital branch"
            >
              {state.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium text-[11px] hidden md:inline">Role:</span>
            <select
              value={state.currentRole}
              onChange={(e) => hmsStore.setRole(e.target.value as UserRole)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer text-xs"
              title="Switch user role to test role-based access"
            >
              {roleOptions.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenWalkthrough}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Open guided demo tour of the 4 core MVP workflows"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Guided</span> Demo Walkthroughs
          </button>

          <button
            type="button"
            onClick={onOpenNewPatient}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Register</span> Patient
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset hospital network to initial demonstration seed data?')) {
                hmsStore.resetToDemoSeed();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Reset to clean demonstration seed data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <nav className="px-4 flex items-center gap-1 overflow-x-auto text-xs font-semibold bg-white">
        <button
          type="button"
          onClick={() => onSelectTab('ehr')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'ehr'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          Workflow 1: Unified EHR & AI Summary
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('prescriptions')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'prescriptions'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-600" />
          Workflow 2: Digital Prescriptions & Pharmacy QR
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('referrals')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'referrals'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Share2 className="w-4 h-4 text-purple-600" />
          Workflow 3: Doctor Referrals
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('admin')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'admin'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-600" />
          Workflow 4: Branch & Doctor Governance
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('appointments')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'appointments'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-cyan-600" />
          Appointments
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('billing')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'billing'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          Billing Desk
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('audit')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            currentTab === 'audit'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-slate-600" />
          Audit & Consent Trail
        </button>
      </nav>
    </header>
  );
};

