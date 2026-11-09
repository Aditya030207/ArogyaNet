import React, { useState } from 'react';
import {
  FileText,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  Trash2,
  Building2,
  User,
  History,
  Search,
  Check,
  Ban,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Pill,
} from 'lucide-react';
import { Prescription, PrescriptionMedicine, DispensingRecord } from '../domain/types';
import { hmsStore } from '../services/store';
import { QRCodeDisplay } from './QRCodeDisplay';
import { canDispensePrescription, filterPrescriptionForPharmacy } from '../domain/hms-engine';

export const DigitalPrescriptionView: React.FC = () => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);
  const isPharmacistRole = state.currentRole === 'pharmacy';

  const [activeTab, setActiveTab] = useState<'doctor_prescriptions' | 'pharmacy_portal'>(
    isPharmacistRole ? 'pharmacy_portal' : 'doctor_prescriptions'
  );

  const [selectedRxId, setSelectedRxId] = useState<string>(
    state.prescriptions[0]?.id || ''
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(state.patients[0]?.id || '');
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      id: 'MED-NEW-1',
      name: 'Telmisartan Tablets IP',
      genericName: 'Telmisartan',
      strength: '40mg',
      dosage: '1 Tablet',
      frequency: 'OD (Once daily)',
      timing: 'Morning after breakfast',
      duration: '30 days',
      route: 'Oral',
      instructions: 'Take regularly at 8:00 AM. Monitor blood pressure weekly.',
      dispensedStatus: 'pending',
    },
  ]);
  const [generalPrecautions, setGeneralPrecautions] = useState(
    'Low salt diet (<4g daily). Avoid sudden posture change. Maintain daily hydration.'
  );
  const [dietaryAdvice, setDietaryAdvice] = useState(
    'Include garlic, green oats, and potassium-rich fruits. Avoid deep-fried foods.'
  );
  const [followUpDate, setFollowUpDate] = useState('2026-12-15');

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionReason, setVersionReason] = useState(
    'Titrated Telmisartan from 40mg to 80mg due to systolic BP remaining > 145 mmHg'
  );
  const [versionMedicines, setVersionMedicines] = useState<PrescriptionMedicine[]>([]);

  const [verifyRxQuery, setVerifyRxQuery] = useState('');
  const [dispenseNotes, setDispenseNotes] = useState('Batch #B-98124 inspected. Dispensed original packaging.');
  const [dispenseType, setDispenseType] = useState<'full' | 'partial'>('full');
  const [selectedItemsToDispense, setSelectedItemsToDispense] = useState<string[]>([]);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState('');

  const selectedPrescription = state.prescriptions.find((p) => p.id === selectedRxId);

  const pharmacyResolvedRx = state.prescriptions.find(
    (p) =>
      p.id.toLowerCase() === verifyRxQuery.trim().toLowerCase() ||
      (selectedRxId && p.id === selectedRxId && verifyRxQuery === '')
  );

  const pharmacyValidation = pharmacyResolvedRx ? canDispensePrescription(pharmacyResolvedRx) : null;
  const privacyPreservedPharmacyData = pharmacyResolvedRx
    ? filterPrescriptionForPharmacy(pharmacyResolvedRx)
    : null;

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        id: `MED-NEW-${Date.now()}`,
        name: '',
        genericName: '',
        strength: '500mg',
        dosage: '1 Tablet',
        frequency: 'BD (Twice daily)',
        timing: 'After meals',
        duration: '5 days',
        route: 'Oral',
        instructions: 'Take with plenty of water',
        dispensedStatus: 'pending',
      },
    ]);
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientId || medicines.length === 0) return;

    const newRx = hmsStore.createPrescription({
      patientId: targetPatientId,
      medicines,
      generalPrecautions,
      dietaryAdvice,
      followUpDate,
    });

    setSelectedRxId(newRx.id);
    setShowCreateModal(false);
  };

  const handleOpenVersionModal = (rx: Prescription) => {
    setVersionMedicines(JSON.parse(JSON.stringify(rx.medicines)));
    setShowVersionModal(true);
  };

  const handleExecuteVersioning = () => {
    if (!selectedPrescription || !versionReason.trim()) return;

    try {
      const { newVersion } = hmsStore.supersedePrescription(
        selectedPrescription.id,
        versionMedicines,
        versionReason.trim()
      );
      setSelectedRxId(newVersion.id);
      setShowVersionModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to version prescription');
    }
  };

  const handleDispenseAction = () => {
    if (!pharmacyResolvedRx) return;

    const itemsToDispense =
      dispenseType === 'full'
        ? pharmacyResolvedRx.medicines.map((m) => m.id)
        : selectedItemsToDispense;

    if (itemsToDispense.length === 0) {
      alert('Please select at least one medication item to dispense.');
      return;
    }

    const record: DispensingRecord = {
      id: `DISP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      pharmacyBranchId: state.currentBranchId,
      pharmacyBranchName: currentBranch?.name || 'ArogyaNet Outpatient Pharmacy',
      pharmacistName: state.currentUserName,
      itemsDispensed: itemsToDispense,
      notes: dispenseNotes,
      type: dispenseType,
    };

    try {
      hmsStore.dispensePrescription(pharmacyResolvedRx.id, record);
      setDispenseSuccessMessage(
        `Successfully logged ${dispenseType.toUpperCase()} dispensing for ${pharmacyResolvedRx.id}. Records synced organization-wide.`
      );
      setTimeout(() => setDispenseSuccessMessage(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Dispensing failed');
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('doctor_prescriptions')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'doctor_prescriptions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Doctor Digital Prescriptions & Versioning
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pharmacy_portal')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'pharmacy_portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Pharmacy Verification & Dispensing Portal
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              Privacy Guardrail
            </span>
          </button>
        </div>

        {activeTab === 'doctor_prescriptions' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Issue Structured Digital Prescription
          </button>
        )}
      </div>

      {activeTab === 'doctor_prescriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Hospital Prescriptions</h3>
              <span className="text-xs text-slate-500 font-semibold">
                {state.prescriptions.length} Records
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {state.prescriptions.map((rx) => {
                const isSelected = rx.id === selectedRxId;
                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRxId(rx.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {rx.id}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                          v{rx.version}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rx.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : rx.status === 'superseded'
                              ? 'bg-amber-100 text-amber-800'
                              : rx.status === 'dispensed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rx.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{rx.patientName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rx.doctorName} • {rx.branchName.split('-')[1] || rx.branchName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{rx.medicines.length} medicines</span>
                      <span>{new Date(rx.issuedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedPrescription ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">

                {selectedPrescription.status === 'superseded' && (
                  <div className="bg-amber-500 text-white px-5 py-2 text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        SUPERSEDED PRESCRIPTION: This version was replaced by{' '}
                        <strong>{selectedPrescription.supersededByPrescriptionId}</strong>.
                        Pharmacies cannot dispense this outdated order.
                      </span>
                    </div>
                    {selectedPrescription.supersededByPrescriptionId && (
                      <button
                        type="button"
                        onClick={() => setSelectedRxId(selectedPrescription.supersededByPrescriptionId!)}
                        className="underline text-white hover:text-amber-100 font-bold ml-2 cursor-pointer"
                      >
                        View Latest v{selectedPrescription.version + 1}
                      </button>
                    )}
                  </div>
                )}

                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-700" />
                        <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">
                          {selectedPrescription.branchName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ArogyaNet Unified Healthcare Alliance • NABH Accredited
                      </p>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Prescribing Physician: <strong>{selectedPrescription.doctorName}</strong> (
                        {selectedPrescription.doctorQualification})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Medical Council Reg: <strong className="font-mono">{selectedPrescription.doctorRegNo}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <QRCodeDisplay
                        value={selectedPrescription.qrPayload}
                        size={84}
                        label={selectedPrescription.verificationToken}
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Cryptographic Verification QR
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">PATIENT NAME</span>
                      <strong className="text-slate-800 text-sm">{selectedPrescription.patientName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">PATIENT ID</span>
                      <strong className="text-blue-700 font-mono text-sm">{selectedPrescription.patientId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">AGE / GENDER</span>
                      <strong className="text-slate-800">{selectedPrescription.patientAge} yrs / {selectedPrescription.patientGender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">DATE OF ISSUE</span>
                      <strong className="text-slate-800">{new Date(selectedPrescription.issuedAt).toLocaleDateString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-serif text-blue-900">℞</span>
                      <h3 className="font-bold text-sm text-slate-800">Prescribed Medications</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Version: <strong>v{selectedPrescription.version}</strong>
                    </span>
                  </div>

                  {selectedPrescription.modificationReason && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950">
                      <strong>Clinical Modification Reason for v{selectedPrescription.version}:</strong>{' '}
                      {selectedPrescription.modificationReason}
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Medicine Name & Generic</th>
                          <th className="px-3 py-2.5">Strength</th>
                          <th className="px-3 py-2.5">Dosage</th>
                          <th className="px-3 py-2.5">Frequency</th>
                          <th className="px-3 py-2.5">Duration</th>
                          <th className="px-3 py-2.5">Route</th>
                          <th className="px-3.5 py-2.5">Dispensing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPrescription.medicines.map((med, idx) => (
                          <tr key={med.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5">
                              <span className="font-bold text-slate-900 block">{med.name}</span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                ({med.genericName})
                              </span>
                              {med.instructions && (
                                <span className="text-[11px] text-amber-800 block mt-0.5 italic">
                                  ℹ️ {med.instructions}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-800">{med.strength}</td>
                            <td className="px-3 py-2.5 text-slate-700">{med.dosage}</td>
                            <td className="px-3 py-2.5 font-medium text-blue-900">
                              {med.frequency}
                              <span className="text-[10px] text-slate-500 block">{med.timing}</span>
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-800">{med.duration}</td>
                            <td className="px-3 py-2.5 text-slate-600">{med.route}</td>
                            <td className="px-3.5 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  med.dispensedStatus === 'dispensed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {med.dispensedStatus || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">
                        Instructions & Medical Precautions
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedPrescription.generalPrecautions || 'None specified.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">
                        Dietary & Lifestyle Advice
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedPrescription.dietaryAdvice || 'Maintain balanced nutrition.'}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.dispensingHistory.length > 0 && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-emerald-700" />
                        Pharmacy Dispensing Audit Trail
                      </span>
                      {selectedPrescription.dispensingHistory.map((rec, ri) => (
                        <div key={ri} className="text-emerald-900 text-xs">
                          • {new Date(rec.timestamp).toLocaleString('en-IN')}: Dispensed ({rec.type}) by{' '}
                          <strong>{rec.pharmacistName}</strong> at <strong>{rec.pharmacyBranchName}</strong>. Notes:{' '}
                          {rec.notes}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Next Follow-up Review:{' '}
                      <strong className="text-slate-800 font-semibold">
                        {selectedPrescription.followUpDate || 'As advised'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedPrescription.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVersionModal(selectedPrescription)}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <History className="w-4 h-4" />
                          Titrate / Modify (Create v{selectedPrescription.version + 1})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        Print / Download Rx
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                Select a prescription from the sidebar to review or print.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pharmacy_portal' && (
        <div className="space-y-6">

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-sm">
                Pharmacy Data Privacy Guardrail Active
              </strong>
              <p className="text-emerald-800 mt-0.5">
                In strict compliance with healthcare data protection principles, authorized pharmacies are only
                granted access to the authentic digital prescription and medication order, not the patient’s full EHR
                medical history.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Verify Digital Prescription by ID or QR Code
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[280px]">
                <input
                  type="text"
                  placeholder="Enter Prescription ID (e.g. RX-DEL-2026-8801 or RX-DEL-2026-8801-v2)..."
                  value={verifyRxQuery}
                  onChange={(e) => setVerifyRxQuery(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Quick Test:</span>
                {state.prescriptions.map((rx) => (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => setVerifyRxQuery(rx.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-xs cursor-pointer"
                  >
                    {rx.id} ({rx.status})
                  </button>
                ))}
              </div>
            </div>

            {dispenseSuccessMessage && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-lg flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{dispenseSuccessMessage}</span>
              </div>
            )}
          </div>

          {privacyPreservedPharmacyData ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">

              {pharmacyValidation?.canDispense ? (
                <div className="bg-emerald-600 text-white px-6 py-3 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    VERIFIED AUTHENTIC: Prescription ID <strong>{privacyPreservedPharmacyData.id}</strong> is active
                    and authentic. Cryptographic verification passed.
                  </span>
                </div>
              ) : (
                <div className="bg-red-600 text-white px-6 py-3 text-xs font-semibold flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-200" />
                  <span>
                    DISPENSING BLOCKED: {pharmacyValidation?.reason || 'Cannot dispense this prescription.'}
                  </span>
                </div>
              )}

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Prescription Verification Payload
                    </span>
                    <h3 className="text-xl font-bold font-mono text-slate-900">
                      {privacyPreservedPharmacyData.id}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Patient: <strong>{privacyPreservedPharmacyData.patientName}</strong> (ID:{' '}
                      {privacyPreservedPharmacyData.patientId}) • {privacyPreservedPharmacyData.patientAge}y/{' '}
                      {privacyPreservedPharmacyData.patientGender}
                    </p>
                    <p className="text-xs text-slate-600">
                      Doctor: <strong>{privacyPreservedPharmacyData.doctorName}</strong> (Reg:{' '}
                      <span className="font-mono">{privacyPreservedPharmacyData.doctorRegNo}</span>) •{' '}
                      {privacyPreservedPharmacyData.branchName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                        privacyPreservedPharmacyData.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : privacyPreservedPharmacyData.status === 'superseded'
                          ? 'bg-red-100 text-red-800'
                          : privacyPreservedPharmacyData.status === 'dispensed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {privacyPreservedPharmacyData.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono block mt-1">
                      Token: {privacyPreservedPharmacyData.verificationToken}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                    Authorized Medications & Instructions
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          {pharmacyValidation?.canDispense && (
                            <th className="px-3 py-2 w-10">Select</th>
                          )}
                          <th className="px-3.5 py-2">Medicine & Generic</th>
                          <th className="px-3 py-2">Strength</th>
                          <th className="px-3 py-2">Dosage & Frequency</th>
                          <th className="px-3 py-2">Duration</th>
                          <th className="px-3 py-2">Dispensing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {privacyPreservedPharmacyData.medicines.map((med) => {
                          const isChecked = selectedItemsToDispense.includes(med.id);
                          return (
                            <tr key={med.id} className="hover:bg-slate-50/50">
                              {pharmacyValidation?.canDispense && (
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={dispenseType === 'full' || isChecked}
                                    disabled={dispenseType === 'full' || med.dispensedStatus === 'dispensed'}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedItemsToDispense([...selectedItemsToDispense, med.id]);
                                      } else {
                                        setSelectedItemsToDispense(
                                          selectedItemsToDispense.filter((id) => id !== med.id)
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                  />
                                </td>
                              )}
                              <td className="px-3.5 py-2">
                                <strong className="text-slate-900 block">{med.name}</strong>
                                <span className="text-[11px] text-slate-500 font-medium">{med.genericName}</span>
                                <span className="text-[11px] text-amber-900 block mt-0.5">
                                  {med.instructions}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-800">{med.strength}</td>
                              <td className="px-3 py-2 text-slate-700">
                                {med.dosage} • {med.frequency} ({med.timing})
                              </td>
                              <td className="px-3 py-2 font-medium">{med.duration}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    med.dispensedStatus === 'dispensed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {med.dispensedStatus || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {pharmacyValidation?.canDispense && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Record Medicine Dispensation
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-700 text-xs font-semibold block mb-1">
                          Dispensing Mode
                        </label>
                        <select
                          value={dispenseType}
                          onChange={(e) => setDispenseType(e.target.value as any)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          <option value="full">Full Dispensing (All items available)</option>
                          <option value="partial">Partial Dispensing (Selective items)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-slate-700 text-xs font-semibold block mb-1">
                          Pharmacist Verification Notes & Batch Numbers
                        </label>
                        <input
                          type="text"
                          value={dispenseNotes}
                          onChange={(e) => setDispenseNotes(e.target.value)}
                          placeholder="Batch numbers, manufacturer expiry verified, patient counselled..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleDispenseAction}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Record Pharmacy Dispensation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              Enter a Prescription ID above to verify authenticity and record dispensing.
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base">Issue Structured Digital Prescription</h3>
                  <p className="text-xs text-slate-400">
                    Issuing at {currentBranch?.name} by {state.currentUserName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Patient *</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) - {p.age}y/{p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                    Medication Items *
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {medicines.map((med, index) => (
                    <div
                      key={med.id || index}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-600 block mb-0.5">Trade / Brand Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Telmisartan Tablets IP"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].name = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-600 block mb-0.5">Generic Molecule</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Telmisartan"
                            value={med.genericName}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].genericName = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Strength</label>
                          <input
                            type="text"
                            placeholder="e.g. 40mg"
                            value={med.strength}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].strength = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Dosage</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 Tablet"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].dosage = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Frequency</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].frequency = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            <option value="OD (Once daily)">OD (Once daily)</option>
                            <option value="BD (Twice daily)">BD (Twice daily)</option>
                            <option value="TDS (Thrice daily)">TDS (Thrice daily)</option>
                            <option value="QID (4 times daily)">QID (4 times daily)</option>
                            <option value="SOS (As needed)">SOS (As needed)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 30 days"
                            value={med.duration}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].duration = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Route</label>
                          <select
                            value={med.route}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[index].route = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            <option value="Oral">Oral</option>
                            <option value="Inhalation">Inhalation</option>
                            <option value="Topical">Topical</option>
                            <option value="Sublingual">Sublingual</option>
                            <option value="Intramuscular">Intramuscular</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Specific timing / precautions (e.g. Take at 8 AM after breakfast)"
                          value={med.instructions}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[index].instructions = e.target.value;
                            setMedicines(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMedicines(medicines.filter((_, i) => i !== index))}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove drug"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    General Precautions
                  </label>
                  <textarea
                    rows={2}
                    value={generalPrecautions}
                    onChange={(e) => setGeneralPrecautions(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Dietary Advice
                  </label>
                  <textarea
                    rows={2}
                    value={dietaryAdvice}
                    onChange={(e) => setDietaryAdvice(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Sign & Issue Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVersionModal && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between border-b border-amber-700">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-base">Prescription Versioning Engine</h3>
                  <p className="text-xs text-amber-100">
                    Modifying {selectedPrescription.id} (v{selectedPrescription.version}) → Generating v
                    {selectedPrescription.version + 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <strong>Prescription Safety Guardrail:</strong> Modifying a finalized prescription creates a new version
                with a fresh cryptographic verification hash. The original prescription will be marked as{' '}
                <span className="font-bold">SUPERSEDED</span>, barring pharmacies from dispensing outdated instructions.
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Clinical Reason for Modification / Titration *
                </label>
                <textarea
                  rows={2}
                  required
                  value={versionReason}
                  onChange={(e) => setVersionReason(e.target.value)}
                  placeholder="e.g. Titrated Telmisartan from 40mg to 80mg due to sub-optimal blood pressure control"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="font-semibold text-xs text-slate-700 block mb-2">
                  Adjust Medication Dosages / Items:
                </span>
                <div className="space-y-2">
                  {versionMedicines.map((med, idx) => (
                    <div
                      key={med.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                      <div>
                        <span className="text-[10px] text-slate-500 block">Medicine</span>
                        <strong className="text-xs text-slate-800">{med.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Adjust Strength</span>
                        <input
                          type="text"
                          value={med.strength}
                          onChange={(e) => {
                            const updated = [...versionMedicines];
                            updated[idx].strength = e.target.value;
                            setVersionMedicines(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Adjust Frequency</span>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => {
                            const updated = [...versionMedicines];
                            updated[idx].frequency = e.target.value;
                            setVersionMedicines(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVersioning}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <History className="w-4 h-4" />
                  Supersede & Issue v{selectedPrescription.version + 1}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

