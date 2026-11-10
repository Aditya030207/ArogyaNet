import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  Building2,
  FileText,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { AuditLogEntry, ConsentLogEntry } from '../domain/types';
import { hmsStore } from '../services/store';

export const AuditTrailView: React.FC = () => {
  const state = hmsStore.getState();

  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'consent_logs'>('audit_logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');

  const filteredAuditLogs = state.auditLogs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.resourceId.toLowerCase().includes(q);

    const matchesResource =
      selectedResourceType === 'all' || log.resourceType === selectedResourceType;

    return matchesSearch && matchesResource;
  });

  const filteredConsentLogs = state.consentLogs.filter((con) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      con.patientName.toLowerCase().includes(q) ||
      con.patientId.toLowerCase().includes(q) ||
      con.accessedByDoctor.toLowerCase().includes(q) ||
      con.purpose.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Healthcare Governance, Audit Trails & Patient Consent Logs
          </h2>
          <p className="text-xs text-slate-500">
            Immutable Activity Auditing • Medical Data Access Authorization • Regulatory Compliance
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('audit_logs')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'audit_logs'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Activity Trail ({state.auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('consent_logs')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'consent_logs'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient Consent Logs ({state.consentLogs.length})
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="flex-1 min-w-[240px] max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search logs by action, doctor, patient ID, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        {activeSubTab === 'audit_logs' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Resource:</span>
            <select
              value={selectedResourceType}
              onChange={(e) => setSelectedResourceType(e.target.value)}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="all">All Resources</option>
              <option value="Patient">Patient</option>
              <option value="Prescription">Prescription</option>
              <option value="Referral">Referral</option>
              <option value="Doctor">Doctor</option>
              <option value="Branch">Branch</option>
              <option value="Billing">Billing</option>
              <option value="Appointment">Appointment</option>
              <option value="AI Summary">AI Summary</option>
            </select>
          </div>
        )}
      </div>

      {activeSubTab === 'audit_logs' && (
        <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-3 py-3">Actor / User</th>
                <th className="px-3 py-3">Branch Location</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Resource Target</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No matching audit trail records found.
                  </td>
                </tr>
              ) : (
                filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>

                    <td className="px-3 py-3">
                      <strong className="text-slate-800 block text-xs">{log.userName}</strong>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {log.userRole.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      <span className="truncate max-w-[140px] block">
                        {log.branchName.split('-')[1] || log.branchName}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="font-semibold text-blue-700 block text-[11px]">
                        {log.resourceType}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{log.resourceId}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-700 max-w-md">
                      <span className="leading-snug block">{log.details}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'consent_logs' && (
        <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Access Time</th>
                <th className="px-3 py-3">Patient Profile</th>
                <th className="px-3 py-3">Accessing Doctor</th>
                <th className="px-3 py-3">Hospital Branch</th>
                <th className="px-3 py-3">Clinical Access Purpose</th>
                <th className="px-4 py-3">Consent Framework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No matching patient consent logs found.
                  </td>
                </tr>
              ) : (
                filteredConsentLogs.map((con) => (
                  <tr key={con.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(con.timestamp).toLocaleString('en-IN')}
                    </td>

                    <td className="px-3 py-3">
                      <strong className="text-slate-800 block text-xs">{con.patientName}</strong>
                      <span className="text-[10px] font-mono text-blue-700">{con.patientId}</span>
                    </td>

                    <td className="px-3 py-3 text-slate-800 font-medium">
                      {con.accessedByDoctor}
                      <span className="text-[10px] text-slate-400 block">{con.doctorRole}</span>
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      {con.branchName.split('-')[1] || con.branchName}
                    </td>

                    <td className="px-3 py-3 text-slate-700 font-medium max-w-sm">
                      {con.purpose}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {con.consentType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

