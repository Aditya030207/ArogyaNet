import React, { useState } from 'react';
import {
  Search,
  User,
  HeartPulse,
  Activity,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle,
  PlusCircle,
  Stethoscope,
  Clock,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Save,
  RotateCw,
} from 'lucide-react';
import { Patient, ConsultationVisit, Prescription, AiMedicalSummary } from '../domain/types';
import { hmsStore } from '../services/store';
import { generatePatientAiSummary } from '../services/ai-service';

interface CrossBranchEHRViewProps {
  onOpenNewPrescription?: (patientId: string) => void;
  onOpenNewReferral?: (patientId: string) => void;
}

export const CrossBranchEHRView: React.FC<CrossBranchEHRViewProps> = ({
  onOpenNewPrescription,
  onOpenNewReferral,
}) => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    state.patients[0]?.id || 'PAT-100293'
  );

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isEditingAiNotes, setIsEditingAiNotes] = useState(false);
  const [doctorNotesInput, setDoctorNotesInput] = useState('');

  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [bp, setBp] = useState('120/80 mmHg');
  const [pulse, setPulse] = useState(72);
  const [temp, setTemp] = useState('98.6 F');
  const [spo2, setSpo2] = useState(99);
  const [weight, setWeight] = useState(70);
  const [labTestName, setLabTestName] = useState('');
  const [labResult, setLabResult] = useState('');
  const [labRange, setLabRange] = useState('');
  const [labFlag, setLabFlag] = useState<'normal' | 'abnormal' | 'critical'>('normal');

  const selectedPatient = state.patients.find((p) => p.id === selectedPatientId) || state.patients[0];
  const patientVisits = state.visits.filter((v) => v.patientId === selectedPatient?.id);
  const patientPrescriptions = state.prescriptions.filter((p) => p.patientId === selectedPatient?.id);
  const aiSummary = selectedPatient ? state.aiSummaries[selectedPatient.id] : undefined;

  const filteredPatients = state.patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.id.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.abhaId && p.abhaId.toLowerCase().includes(q))
    );
  });

  const visitedBranchNames = Array.from(
    new Set([
      selectedPatient?.registeredBranchName,
      ...patientVisits.map((v) => v.branchName),
    ].filter(Boolean))
  );

  const handleGenerateAiSummary = async () => {
    if (!selectedPatient) return;
    setIsGeneratingAi(true);
    try {
      const summary = await generatePatientAiSummary(selectedPatient, patientVisits, patientPrescriptions);
      hmsStore.saveAiSummary(summary);
      setDoctorNotesInput(summary.doctorNotesOrEdits || '');
    } catch (e) {
      console.error('Failed to generate summary', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveDoctorNotes = () => {
    if (!selectedPatient) return;
    hmsStore.reviewAiSummary(selectedPatient.id, doctorNotesInput);
    setIsEditingAiNotes(false);
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !chiefComplaint.trim() || !diagnosis.trim()) return;

    const labReports = labTestName.trim()
      ? [
          {
            testName: labTestName.trim(),
            result: labResult.trim() || 'Recorded',
            normalRange: labRange.trim() || 'Standard Reference',
            date: new Date().toISOString().split('T')[0],
            flag: labFlag,
          },
        ]
      : [];

    hmsStore.addConsultationVisit({
      patientId: selectedPatient.id,
      department: 'Clinical Medicine',
      visitDate: new Date().toISOString(),
      visitType: 'OPD',
      vitals: {
        bp,
        pulse: Number(pulse) || 72,
        temp,
        spo2: Number(spo2) || 98,
        weight: Number(weight) || 70,
      },
      chiefComplaint: chiefComplaint.trim(),
      symptomsAndObservations: symptoms.trim() || 'Clinical evaluation performed.',
      diagnosis: diagnosis.trim(),
      clinicalNotes: clinicalNotes.trim() || 'Patient examined and advised clinical plan.',
      labReports,
    });

    setChiefComplaint('');
    setSymptoms('');
    setDiagnosis('');
    setClinicalNotes('');
    setLabTestName('');
    setLabResult('');
    setShowNewVisitModal(false);
  };

  return (
    <div className="space-y-6">

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Unified Patient Registry by ID, Name, Phone, or ABHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Quick Select:</span>
          {state.patients.map((pat) => (
            <button
              key={pat.id}
              type="button"
              onClick={() => {
                setSelectedPatientId(pat.id);

                hmsStore.logConsent({
                  patientId: pat.id,
                  patientName: pat.fullName,
                  purpose: `Cross-Branch Clinical Record Retrieval at ${currentBranch?.name}`,
                  consentType: 'Authorized Referral Access',
                });
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                pat.id === selectedPatient?.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {pat.fullName} ({pat.id})
            </button>
          ))}
        </div>
      </div>

      {selectedPatient ? (
        <>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-xl text-blue-200 shrink-0">
                    {selectedPatient.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {selectedPatient.fullName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {selectedPatient.id}
                      </span>
                      {selectedPatient.abhaId && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> ABHA: {selectedPatient.abhaId}
                        </span>
                      )}
                      {selectedPatient.aadhaarProvided && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-700 text-slate-300">
                          Aadhaar: {selectedPatient.aadhaarMasked || 'XXXX-XXXX-XXXX'}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-300 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Age: <strong>{selectedPatient.age} yrs</strong></span>
                      <span>Gender: <strong>{selectedPatient.gender}</strong></span>
                      <span>Blood Group: <strong className="text-red-300">{selectedPatient.bloodGroup || 'N/A'}</strong></span>
                      <span>Registered at: <strong>{selectedPatient.registeredBranchName}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewVisitModal(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Record Consultation at {currentBranch?.city || 'Current Branch'}
                  </button>
                  {onOpenNewPrescription && (
                    <button
                      type="button"
                      onClick={() => onOpenNewPrescription(selectedPatient.id)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Issue Digital Rx
                    </button>
                  )}
                  {onOpenNewReferral && (
                    <button
                      type="button"
                      onClick={() => onOpenNewReferral(selectedPatient.id)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-purple-400" />
                      Refer Patient
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-medium">Unified Record Connected Across:</span>
                  {visitedBranchNames.map((bName) => (
                    <span
                      key={bName}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-blue-200 border border-slate-700 flex items-center gap-1"
                    >
                      <Building2 className="w-3 h-3 text-blue-400" />
                      {bName}
                    </span>
                  ))}
                </div>
                <span className="text-slate-400 text-[11px]">
                  Total Recorded Visits: <strong>{patientVisits.length}</strong> | Active Prescriptions: <strong>{patientPrescriptions.length}</strong>
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/80 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Allergies:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                  selectedPatient.allergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 font-medium border border-red-200"
                    >
                      {allergy}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600">No known drug allergies (NKDA)</span>
                )}
              </div>

              <div className="h-4 w-px bg-amber-200 hidden sm:block"></div>

              <div className="flex items-center gap-1.5 text-slate-700 font-semibold shrink-0">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Chronic Conditions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0 ? (
                  selectedPatient.chronicConditions.map((cond, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium border border-blue-200"
                    >
                      {cond}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None logged</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 rounded-2xl border border-indigo-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      AI-Synthesized Longitudinal Clinical Digest
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                      Separate AI Storage Layer
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Concise multi-branch history digest powered by Gemini clinical synthesis with doctor verification
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiSummary}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'Synthesizing EHR...' : 'Refresh AI Summary'}
                </button>
              </div>
            </div>

            {aiSummary ? (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {aiSummary.summaryText}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Past Consultations Across Branches
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.pastConsultations.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Past Documented Diagnoses
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.diagnosesHistory.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></span>
                          <span className="font-medium text-slate-800">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Active & Past Medication History
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.activeAndPastMedications.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-red-600">
                      Allergies & High-Risk Precautions
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.allergiesAndPrecautions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                          <span className="text-red-900 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Significant Lab & Diagnostic Results
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.keyLabResults.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Treatments, Procedures & Orders
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {aiSummary.sections.treatmentsAndProcedures.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-xs text-slate-800">
                        Doctor Verification & Clinical Corrections Layer:
                      </span>
                      {aiSummary.doctorReviewed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Reviewed & Signed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          Pending Doctor Review
                        </span>
                      )}
                    </div>

                    {!isEditingAiNotes ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDoctorNotesInput(aiSummary.doctorNotesOrEdits || '');
                          setIsEditingAiNotes(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit / Add Clinical Notes
                      </button>
                    ) : null}
                  </div>

                  {isEditingAiNotes ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={doctorNotesInput}
                        onChange={(e) => setDoctorNotesInput(e.target.value)}
                        placeholder="Attending doctor notes, corrections, or clinical validations..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingAiNotes(false)}
                          className="px-3 py-1 text-xs border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDoctorNotes}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" /> Sign & Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    aiSummary.doctorNotesOrEdits && (
                      <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                        &quot;{aiSummary.doctorNotesOrEdits}&quot;
                        <span className="block text-[10px] text-slate-400 not-italic mt-1">
                          Signed by attending physician on{' '}
                          {new Date(aiSummary.reviewedAt || aiSummary.generatedAt).toLocaleDateString('en-IN')}
                        </span>
                      </p>
                    )
                  )}

                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span>
                      ⚠️ <em>Clinical Governance Boundary:</em> {aiSummary.disclaimer}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Engine: {aiSummary.modelUsed}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-xl border border-dashed border-indigo-200 text-slate-500 text-xs">
                <p>No AI medical summary has been generated for this patient yet.</p>
                <button
                  type="button"
                  onClick={handleGenerateAiSummary}
                  disabled={isGeneratingAi}
                  className="mt-2.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Longitudinal AI Digest
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Longitudinal Visit History Across All Branches
                </h3>
                <p className="text-xs text-slate-500">
                  Every hospital visit is permanently recorded and never overwritten
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {patientVisits.length} Recorded Visits
              </span>
            </div>

            {patientVisits.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                No past consultations recorded for this patient. Click &quot;Record Consultation&quot; above to log the first visit!
              </div>
            ) : (
              <div className="space-y-4">
                {patientVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800">
                          {visit.visitType}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({visit.id})</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium flex items-center gap-1 border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {visit.branchName}
                        </span>
                        <span className="text-slate-600 font-medium">
                          {visit.doctorName} ({visit.department})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">BP</span>
                        <span className="font-bold text-slate-800">{visit.vitals.bp}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Pulse Rate</span>
                        <span className="font-bold text-slate-800">{visit.vitals.pulse} bpm</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Temperature</span>
                        <span className="font-bold text-slate-800">{visit.vitals.temp}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Oxygen (SpO2)</span>
                        <span className="font-bold text-slate-800">{visit.vitals.spo2}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Weight</span>
                        <span className="font-bold text-slate-800">{visit.vitals.weight} kg</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Chief Complaints & Observations
                        </span>
                        <p className="text-slate-800 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <strong>Complaint:</strong> {visit.chiefComplaint}
                          <br />
                          <strong>Observations:</strong> {visit.symptomsAndObservations}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Diagnosis & Clinical Plan
                        </span>
                        <p className="text-slate-800 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <strong className="text-blue-900">Diagnosis:</strong> {visit.diagnosis}
                          <br />
                          <strong>Notes:</strong> {visit.clinicalNotes}
                        </p>
                      </div>
                    </div>

                    {visit.labReports && visit.labReports.length > 0 && (
                      <div>
                        <span className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                          Laboratory & Diagnostic Results
                        </span>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-1.5">Investigation</th>
                                <th className="px-3 py-1.5">Result</th>
                                <th className="px-3 py-1.5">Normal Range</th>
                                <th className="px-3 py-1.5">Date</th>
                                <th className="px-3 py-1.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {visit.labReports.map((lab, li) => (
                                <tr key={li} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-1.5 font-medium text-slate-800">{lab.testName}</td>
                                  <td className="px-3 py-1.5 font-bold text-slate-900">{lab.result}</td>
                                  <td className="px-3 py-1.5 text-slate-500">{lab.normalRange}</td>
                                  <td className="px-3 py-1.5 text-slate-500">{lab.date}</td>
                                  <td className="px-3 py-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                        lab.flag === 'abnormal'
                                          ? 'bg-amber-100 text-amber-800'
                                          : lab.flag === 'critical'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {lab.flag}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Search for a patient using their centralized Patient ID or select one of the demonstration patients above.
          </p>
        </div>
      )}

      {showNewVisitModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base">Record Consultation Visit</h3>
                  <p className="text-xs text-slate-400">
                    Patient: {selectedPatient.fullName} ({selectedPatient.id}) at {currentBranch?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">

              <div>
                <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-2">
                  Vital Signs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-slate-600 text-xs block mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-xs block mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-xs block mb-1">Temp</label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-xs block mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-xs block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe throbbing migraine in left temporal region with nausea"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Symptoms & Clinical Examination</label>
                <textarea
                  rows={2}
                  placeholder="Physical findings, systemic examination observations..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Provisional / Definitive Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Migraine without Aura; Mild dehydration"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Notes & Action Plan</label>
                <textarea
                  rows={2}
                  placeholder="Clinical guidance, referrals, follow-up instructions..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-semibold text-xs text-slate-700 block">
                  Add Laboratory / Diagnostic Investigation (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Test Name (e.g. Serum Creatinine)"
                      value={labTestName}
                      onChange={(e) => setLabTestName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Result (e.g. 1.1 mg/dL)"
                      value={labResult}
                      onChange={(e) => setLabResult(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <select
                      value={labFlag}
                      onChange={(e) => setLabFlag(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVisitModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save to Unified Medical History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

