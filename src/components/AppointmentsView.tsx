import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../domain/types';
import { hmsStore } from '../services/store';

export const AppointmentsView: React.FC = () => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const [showBookModal, setShowBookModal] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(state.patients[0]?.id || '');
  const [branchId, setBranchId] = useState(state.currentBranchId);
  const [department, setDepartment] = useState('Cardiology');
  const [doctorId, setDoctorId] = useState(state.doctors[0]?.id || '');
  const [appointmentDate, setAppointmentDate] = useState('2026-11-15');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [reason, setReason] = useState('Clinical consultation and review');
  const [conflictWarning, setConflictWarning] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAppointments = state.appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  const availableDoctors = state.doctors.filter(
    (d) => d.branchId === branchId && d.status === 'active'
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = state.patients.find((p) => p.id === targetPatientId);
    const doctor = state.doctors.find((d) => d.id === doctorId);
    const branch = state.branches.find((b) => b.id === branchId);

    if (!patient || !doctor || !branch) return;

    const conflict = state.appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.appointmentDate === appointmentDate &&
        a.appointmentTime === appointmentTime &&
        a.status !== 'Cancelled'
    );

    if (conflict) {
      setConflictWarning(
        `Doctor Conflict: ${doctor.name} already has an appointment booked on ${appointmentDate} at ${appointmentTime}. Please select an alternate slot.`
      );
      return;
    }

    hmsStore.bookAppointment({
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      branchId,
      branchName: branch.name,
      department: doctor.department || department,
      doctorId: doctor.id,
      doctorName: doctor.name,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'Confirmed',
    });

    setConflictWarning('');
    setShowBookModal(false);
  };

  const statusList: AppointmentStatus[] = [
    'Scheduled',
    'Confirmed',
    'Checked In',
    'In Progress',
    'Completed',
    'Cancelled',
    'No Show',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Centralized Hospital Appointment Scheduling
          </h2>
          <p className="text-xs text-slate-500">
            Multi-Branch Booking • Schedule Conflict Prevention • Real-time Status Tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Filter Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="all">All Appointments ({state.appointments.length})</option>
              {statusList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setConflictWarning('');
              setShowBookModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Book Patient Appointment
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Patient & ID</th>
              <th className="px-3 py-3">Doctor & Branch</th>
              <th className="px-3 py-3">Date & Slot</th>
              <th className="px-3 py-3">Consultation Reason</th>
              <th className="px-3 py-3">Current Status</th>
              <th className="px-4 py-3 text-right">Status Transition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                  No appointments found for the selected status.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 block">{apt.patientName}</strong>
                    <span className="text-[10px] font-mono text-slate-400">
                      {apt.patientId} • {apt.patientPhone}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <strong className="text-slate-800 block">{apt.doctorName}</strong>
                    <span className="text-[11px] text-slate-500">
                      {apt.branchName.split('-')[1] || apt.branchName} ({apt.department})
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-semibold text-slate-800 block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {apt.appointmentDate}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {apt.appointmentTime}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-700 max-w-xs truncate">
                    {apt.reason}
                    {apt.notes && <span className="block text-[10px] text-blue-600 mt-0.5 italic">{apt.notes}</span>}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                        apt.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.status === 'Checked In'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.status === 'In Progress'
                          ? 'bg-purple-100 text-purple-800'
                          : apt.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <select
                      value={apt.status}
                      onChange={(e) => hmsStore.updateAppointmentStatus(apt.id, e.target.value as any)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium cursor-pointer"
                    >
                      {statusList.map((st) => (
                        <option key={st} value={st}>
                          Mark as {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">Book Patient Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {conflictWarning && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Patient *</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => {
                      setBranchId(e.target.value);
                      const bDocs = state.doctors.filter(
                        (d) => d.branchId === e.target.value && d.status === 'active'
                      );
                      if (bDocs.length > 0) setDoctorId(bDocs[0].id);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {state.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name.split('-')[1] || b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Doctor *</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {availableDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Time Slot *</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Consultation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up for hypertension / Cardiac review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

