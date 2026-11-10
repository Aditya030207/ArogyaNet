import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Ban,
  UserX,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { HospitalBranch, Doctor } from '../domain/types';
import { hmsStore } from '../services/store';

export const BranchAndDoctorAdminView: React.FC = () => {
  const state = hmsStore.getState();

  const [activeSection, setActiveSection] = useState<'branches' | 'doctors'>('branches');

  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('KOL-01');
  const [branchCity, setBranchCity] = useState('');
  const [branchState, setBranchState] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('+91 33 4000 8000');
  const [branchEmail, setBranchEmail] = useState('');

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. ');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('+91 98');
  const [doctorBranchId, setDoctorBranchId] = useState(state.branches[0]?.id || '');
  const [doctorDepartment, setDoctorDepartment] = useState('Cardiology');
  const [doctorQualification, setDoctorQualification] = useState('MBBS, MD (Medicine)');
  const [doctorRegNo, setDoctorRegNo] = useState('MCI-2020-');
  const [doctorCouncil, setDoctorCouncil] = useState('National Medical Commission / State Council');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');
  const [doctorExperience, setDoctorExperience] = useState(8);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  const filteredDoctors = state.doctors.filter((d) => {
    if (selectedBranchFilter === 'all') return true;
    return d.branchId === selectedBranchFilter;
  });

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCity.trim()) return;

    hmsStore.createBranch({
      name: branchName.trim(),
      code: branchCode.trim() || 'HOSP-01',
      city: branchCity.trim(),
      state: branchState.trim() || 'India',
      address: branchAddress.trim() || `${branchCity}, India`,
      phone: branchPhone.trim(),
      email: branchEmail.trim() || `${branchCity.toLowerCase()}@arogyanet.org`,
    });

    setBranchName('');
    setBranchCity('');
    setShowCreateBranchModal(false);
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !doctorRegNo.trim()) return;

    hmsStore.addDoctor({
      name: doctorName.trim(),
      email: doctorEmail.trim() || `doctor.${Date.now()}@arogyanet.org`,
      phone: doctorPhone.trim(),
      branchId: doctorBranchId,
      department: doctorDepartment,
      qualification: doctorQualification.trim(),
      registrationNumber: doctorRegNo.trim(),
      council: doctorCouncil.trim(),
      specialization: doctorSpecialization.trim() || doctorDepartment,
      yearsExperience: Number(doctorExperience) || 5,
      status: 'active',
    });

    setDoctorName('Dr. ');
    setDoctorRegNo('MCI-2020-');
    setShowAddDoctorModal(false);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Hospital Organization & Doctor Governance
          </h2>
          <p className="text-xs text-slate-500">
            Enterprise Multi-Branch Administration • Role-Based Access Control (RBAC)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSection('branches')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeSection === 'branches'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hospital Branches ({state.branches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('doctors')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeSection === 'doctors'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doctors & Credentials ({state.doctors.length})
            </button>
          </div>

          {activeSection === 'branches' ? (
            <button
              type="button"
              onClick={() => setShowCreateBranchModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create New Hospital Branch
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add & Register Doctor
            </button>
          )}
        </div>
      </div>

      {activeSection === 'branches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.branches.map((branch) => {
              const branchDoctorCount = state.doctors.filter((d) => d.branchId === branch.id).length;
              const branchVisitCount = state.visits.filter((v) => v.branchId === branch.id).length;
              return (
                <div
                  key={branch.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between hover:border-blue-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {branch.code}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">{branch.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {branch.city}, {branch.state}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {branch.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{branch.email}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Clinical Departments ({branch.departments.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {branch.departments.slice(0, 5).map((dept) => (
                          <span
                            key={dept}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                          >
                            {dept}
                          </span>
                        ))}
                        {branch.departments.length > 5 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                            +{branch.departments.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Standard Emergency Protocols Initialized
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {branch.emergencyCodesConfig.map((ec) => (
                          <span
                            key={ec.code}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: ec.color }}
                          >
                            {ec.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Doctors: <strong className="text-slate-800">{branchDoctorCount}</strong>
                    </span>
                    <span>
                      Recorded Visits: <strong className="text-slate-800">{branchVisitCount}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'doctors' && (
        <div className="space-y-4">

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Filter by Branch:</span>
            <button
              type="button"
              onClick={() => setSelectedBranchFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Branches ({state.doctors.length})
            </button>
            {state.branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranchFilter(b.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedBranchFilter === b.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b.name.split('-')[1] || b.name}
              </button>
            ))}
          </div>

          <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Doctor & ID</th>
                  <th className="px-3 py-3">Branch & Dept</th>
                  <th className="px-3 py-3">MCI / State Reg No</th>
                  <th className="px-3 py-3">Qualification</th>
                  <th className="px-3 py-3">Verification Status</th>
                  <th className="px-3 py-3">Access Status</th>
                  <th className="px-4 py-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => {
                  const branchObj = state.branches.find((b) => b.id === doc.branchId);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {doc.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-slate-900 block text-xs sm:text-sm">{doc.name}</strong>
                            <span className="text-[10px] font-mono text-slate-400">{doc.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800 block">{doc.department}</span>
                        <span className="text-[11px] text-slate-500">{branchObj?.name || doc.branchId}</span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="font-mono font-bold text-slate-900 block">{doc.registrationNumber}</span>
                        <span className="text-[10px] text-slate-400">{doc.council}</span>
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        {doc.qualification}
                        <span className="text-[10px] text-slate-400 block">{doc.yearsExperience} yrs exp</span>
                      </td>

                      <td className="px-3 py-3">
                        {doc.verified ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            doc.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {!doc.verified && (
                          <button
                            type="button"
                            onClick={() => hmsStore.verifyDoctor(doc.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold cursor-pointer shadow-2xs"
                          >
                            Verify Credentials
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => hmsStore.deactivateDoctor(doc.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            doc.status === 'active'
                              ? 'bg-slate-100 hover:bg-red-100 text-red-700'
                              : 'bg-slate-100 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title={
                            doc.status === 'active'
                              ? 'Revoke access (historical records preserved)'
                              : 'Reactivate doctor access'
                          }
                        >
                          {doc.status === 'active' ? 'Revoke Access' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">Create Hospital Branch</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBranchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Standard clinical configurations, 9 hospital departments, and 5 standard emergency code protocols
              will automatically be initialized for this new branch.
            </p>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ArogyaNet Apollo City Hospital - Kolkata"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KOL-01"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolkata"
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. West Bengal"
                    value={branchState}
                    onChange={(e) => setBranchState(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Address</label>
                <input
                  type="text"
                  placeholder="Street address, PIN code"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Create & Initialize Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">Add & Onboard Doctor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Doctors are assigned independently to specific hospital branches as per multi-branch architectural rules.
            </p>

            <form onSubmit={handleAddDoctor} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Pradeep Nair"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assign to Branch *</label>
                  <select
                    value={doctorBranchId}
                    onChange={(e) => setDoctorBranchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {state.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department *</label>
                  <select
                    value={doctorDepartment}
                    onChange={(e) => setDoctorDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology & Neurosurgery">Neurology & Neurosurgery</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Medical Council Reg No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCI-2019-88124"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD, DM"
                    value={doctorQualification}
                    onChange={(e) => setDoctorQualification(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Medical Council</label>
                  <input
                    type="text"
                    value={doctorCouncil}
                    onChange={(e) => setDoctorCouncil(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Years Experience</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={doctorExperience}
                    onChange={(e) => setDoctorExperience(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add Doctor & Issue ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

