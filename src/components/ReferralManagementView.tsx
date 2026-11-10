import React, { useState } from 'react';
import {
  Share2,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  User,
  FileText,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Referral, ReferralStatus, ReferralPriority } from '../domain/types';
import { hmsStore } from '../services/store';
import { sortReferralsByEmergencyPriority } from '../domain/hms-engine';

interface ReferralManagementViewProps {
  onOpenPatientEHR?: (patientId: string) => void;
}

export const ReferralManagementView: React.FC<ReferralManagementViewProps> = ({
  onOpenPatientEHR,
}) => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const [filterMode, setFilterMode] = useState<'all' | 'incoming' | 'sent'>('all');
  const [selectedReferralId, setSelectedReferralId] = useState<string>(
    state.referrals[0]?.id || ''
  );

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ReferralStatus>('Accepted');
  const [statusNote, setStatusNote] = useState('Reviewed clinical summary and accepted for consultation.');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(state.patients[0]?.id || '');
  const [toBranchId, setToBranchId] = useState(
    state.branches.find((b) => b.id !== state.currentBranchId)?.id || state.branches[0].id
  );
  const [toDepartment, setToDepartment] = useState('Neurology & Neurosurgery');
  const [toDoctorId, setToDoctorId] = useState('');
  const [priority, setPriority] = useState<ReferralPriority>('Urgent');
  const [emergencyCode, setEmergencyCode] = useState('Code Yellow');
  const [reasonForReferral, setReasonForReferral] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [clinicalSnippet, setClinicalSnippet] = useState('');
  const [attachedReports, setAttachedReports] = useState('Recent 12-lead ECG, HbA1c panel and EHR timeline attached.');

  let filtered = [...state.referrals];
  if (filterMode === 'incoming') {
    filtered = filtered.filter((r) => r.toBranchId === state.currentBranchId);
  } else if (filterMode === 'sent') {
    filtered = filtered.filter((r) => r.fromBranchId === state.currentBranchId);
  }

  const sortedReferrals = sortReferralsByEmergencyPriority(filtered);
  const selectedReferral = state.referrals.find((r) => r.id === selectedReferralId) || sortedReferrals[0];

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = state.patients.find((p) => p.id === targetPatientId);
    if (!patient || !reasonForReferral.trim()) return;

    const targetBranchObj = state.branches.find((b) => b.id === toBranchId);
    const targetDocObj = state.doctors.find((d) => d.id === toDoctorId);

    const newRef = hmsStore.createReferral({
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      fromDepartment: 'Clinical Department',
      toBranchId,
      toBranchName: targetBranchObj?.name || toBranchId,
      toDoctorId: targetDocObj?.id,
      toDoctorName: targetDocObj?.name,
      toDepartment,
      priority,
      emergencyCode: priority === 'Emergency' ? 'Code Blue' : priority === 'Urgent' ? 'Code Yellow' : undefined,
      reasonForReferral: reasonForReferral.trim(),
      provisionalDiagnosis: provisionalDiagnosis.trim() || 'Evaluation required',
      clinicalSummarySnippet: clinicalSnippet.trim() || 'Longitudinal EHR available via ArogyaNet network.',
      attachedReportSummary: attachedReports.trim(),
    });

    setSelectedReferralId(newRef.id);
    setShowCreateModal(false);
  };

  const handleUpdateStatus = () => {
    if (!selectedReferral) return;
    hmsStore.updateReferralStatus(selectedReferral.id, targetStatus, statusNote);
    setShowStatusModal(false);
  };

  const statusColumns: ReferralStatus[] = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            Cross-Branch Doctor-to-Doctor Referral Network
          </h2>
          <p className="text-xs text-slate-500">
            Current Branch: <strong>{currentBranch?.name}</strong> • Prioritized by Clinical Emergency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Network ({state.referrals.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('incoming')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterMode === 'incoming' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incoming to Current Branch (
              {state.referrals.filter((r) => r.toBranchId === state.currentBranchId).length}
              )
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('sent')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterMode === 'sent' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sent from Current Branch (
              {state.referrals.filter((r) => r.fromBranchId === state.currentBranchId).length}
              )
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Initiate Cross-Branch Referral
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs">
        <span className="font-semibold text-slate-200">Emergency Triage Hierarchy:</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-semibold text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            Emergency (Code Blue / Immediate Life Support)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Urgent (Code Yellow / &lt; 24h Specialist Review)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Routine (Elective OPD Consultation)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {statusColumns.map((colStatus) => {
          const colReferrals = sortedReferrals.filter((r) => r.status === colStatus);
          return (
            <div
              key={colStatus}
              className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-3 flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                <span className="font-bold text-slate-800">{colStatus}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                  {colReferrals.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                {colReferrals.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic">No referrals</div>
                ) : (
                  colReferrals.map((ref) => {
                    const isSelected = ref.id === selectedReferralId;
                    return (
                      <div
                        key={ref.id}
                        onClick={() => setSelectedReferralId(ref.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ref.priority === 'Emergency'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : ref.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {ref.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {ref.id}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900">{ref.patientName}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                          {ref.provisionalDiagnosis}
                        </p>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[90px]">
                            {ref.fromBranchName.split('-')[1] || ref.fromBranchName}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[90px] font-semibold text-purple-700">
                            {ref.toBranchName.split('-')[1] || ref.toBranchName}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedReferral && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedReferral.priority === 'Emergency'
                      ? 'bg-red-600 text-white'
                      : selectedReferral.priority === 'Urgent'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {selectedReferral.priority} Priority
                </span>
                {selectedReferral.emergencyCode && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                    {selectedReferral.emergencyCode}
                  </span>
                )}
                <span className="font-mono text-xs text-slate-400">{selectedReferral.id}</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {selectedReferral.patientName} ({selectedReferral.patientAge}y/{selectedReferral.patientGender})
              </h3>
              <p className="text-xs text-slate-500">
                Provisional Diagnosis: <strong className="text-slate-800">{selectedReferral.provisionalDiagnosis}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenPatientEHR && (
                <button
                  type="button"
                  onClick={() => onOpenPatientEHR(selectedReferral.patientId)}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Open Full Longitudinal EHR
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setTargetStatus(
                    selectedReferral.status === 'Pending'
                      ? 'Accepted'
                      : selectedReferral.status === 'Accepted'
                      ? 'In Progress'
                      : 'Completed'
                  );
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                Update Referral Status
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider block">
                Referring Hospital & Physician
              </span>
              <p className="text-slate-800">
                <strong>Hospital:</strong> {selectedReferral.fromBranchName}
                <br />
                <strong>Referring Doctor:</strong> {selectedReferral.fromDoctorName} ({selectedReferral.fromDepartment})
                <br />
                <strong>Dispatched:</strong> {new Date(selectedReferral.createdAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
              <span className="font-bold text-purple-900 uppercase tracking-wider block">
                Destination Hospital & Specialist Target
              </span>
              <p className="text-slate-800">
                <strong>Receiving Hospital:</strong> {selectedReferral.toBranchName}
                <br />
                <strong>Target Department:</strong> {selectedReferral.toDepartment}
                <br />
                <strong>Assigned Specialist:</strong> {selectedReferral.toDoctorName || 'Department Triage Pool'}
              </p>
            </div>
          </div>

          <div>
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider block mb-1">
              Referral Reason & Clinical Presentation
            </span>
            <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-xs sm:text-sm">
              {selectedReferral.reasonForReferral}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Clinical Summary Snippet</span>
              <p className="text-slate-600">{selectedReferral.clinicalSummarySnippet}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Attached Reports & Diagnostics</span>
              <p className="text-slate-600">{selectedReferral.attachedReportSummary}</p>
            </div>
          </div>

          <div className="pt-2">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider block mb-2">
              Referral Coordination Audit History
            </span>
            <div className="space-y-1.5 text-xs text-slate-600">
              {selectedReferral.statusHistory.map((sh, sidx) => (
                <div key={sidx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0"></span>
                  <div>
                    <strong className="text-slate-800">{sh.status}</strong> on{' '}
                    {new Date(sh.timestamp).toLocaleString('en-IN')} by <em>{sh.updatedBy}</em>
                    {sh.note && <span className="block text-slate-500 mt-0.5">Note: {sh.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between border-b border-purple-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-base">Create Cross-Branch Referral</h3>
                  <p className="text-xs text-purple-200">
                    From {currentBranch?.name} ({currentBranch?.city})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-purple-300 hover:text-white p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Patient *</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Hospital Branch *</label>
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {state.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Department *</label>
                  <select
                    value={toDepartment}
                    onChange={(e) => setToDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology & Neurosurgery">Neurology & Neurosurgery</option>
                    <option value="Orthopedics & Sports Medicine">Orthopedics & Sports Medicine</option>
                    <option value="Pulmonology & Sleep Medicine">Pulmonology & Sleep Medicine</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Emergency Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="Routine">Routine (Elective OPD)</option>
                    <option value="Urgent">Urgent (Code Yellow / &lt; 24 hrs)</option>
                    <option value="Emergency">Emergency (Code Blue / Immediate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Provisional Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unstable Angina / Suspected TIA"
                    value={provisionalDiagnosis}
                    onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Reason for Referral *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why specialist consultation or cross-branch transfer is required..."
                  value={reasonForReferral}
                  onChange={(e) => setReasonForReferral(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical History Snippet</label>
                <textarea
                  rows={2}
                  placeholder="Key background vitals, existing medications..."
                  value={clinicalSnippet}
                  onChange={(e) => setClinicalSnippet(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Dispatch Cross-Branch Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatusModal && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Update Referral Status</h3>
            <p className="text-xs text-slate-500">
              Referral {selectedReferral.id} for {selectedReferral.patientName}
            </p>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">New Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                {statusColumns.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Clinical Coordination Note *
              </label>
              <textarea
                rows={3}
                required
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Appointment scheduled with specialist; patient triaged..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
              >
                Commit Status Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

