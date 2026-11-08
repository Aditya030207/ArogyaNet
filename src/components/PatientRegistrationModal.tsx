import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { hmsStore } from '../services/store';
import { maskAadhaar } from '../domain/hms-engine';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: (patientId: string) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(35);
  const [dob, setDob] = useState('1991-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [abhaId, setAbhaId] = useState('');
  const [provideAadhaar, setProvideAadhaar] = useState(false);
  const [rawAadhaar, setRawAadhaar] = useState('');

  const [allergiesInput, setAllergiesInput] = useState('');
  const [chronicConditionsInput, setChronicConditionsInput] = useState('');

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Patient Full Name is required.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError('A valid contact phone number is required.');
      return;
    }

    const allergies = allergiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const chronicConditions = chronicConditionsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const maskedAadhaar = provideAadhaar ? maskAadhaar(rawAadhaar) : undefined;

    const newPatient = hmsStore.registerPatient({
      fullName: fullName.trim(),
      dob,
      age: Number(age) || 30,
      gender,
      bloodGroup,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || `${currentBranch?.city}, India`,
      emergencyContact: {
        name: emergencyName.trim() || 'Next of Kin',
        relation: emergencyRelation,
        phone: emergencyPhone.trim() || phone.trim(),
      },
      abhaId: abhaId.trim() || undefined,
      aadhaarProvided: provideAadhaar && Boolean(maskedAadhaar),
      aadhaarMasked: maskedAadhaar,
      allergies: allergies.length > 0 ? allergies : ['No known drug allergies (NKDA)'],
      chronicConditions: chronicConditions.length > 0 ? chronicConditions : ['None reported'],
    });

    if (onPatientCreated) {
      onPatientCreated(newPatient.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">

        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Patient Registration</h3>
              <p className="text-xs text-slate-400">
                Registering at {currentBranch?.name} ({currentBranch?.city})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2.5">
              Demographic Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sumanth Narayan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street, Locality, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Digital Health ID & Privacy Compliance
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ABHA / ABDM Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91-4421-9902-1842@abdm"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Ayushman Bharat Digital Mission identifier
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="provideAadhaar"
                    checked={provideAadhaar}
                    onChange={(e) => setProvideAadhaar(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <label htmlFor="provideAadhaar" className="text-slate-700 font-medium cursor-pointer text-xs">
                    Voluntarily provide Aadhaar verification
                  </label>
                </div>
                {provideAadhaar ? (
                  <div>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar number"
                      maxLength={14}
                      value={rawAadhaar}
                      onChange={(e) => setRawAadhaar(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-xs"
                    />
                    <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
                      🔒 Only masked digits ({maskAadhaar(rawAadhaar) || 'XXXX-XXXX-XXXX'}) will be stored.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-white/70 p-2 rounded border border-slate-200">
                    Aadhaar is never mandatory under ArogyaNet open-source internal hospital guidelines.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2.5">
              Clinical Alerts & History
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Known Drug & Substance Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs, Aspirin (or leave blank if NKDA)"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Existing Chronic Conditions (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Essential Hypertension, Type 2 Diabetes, Asthma"
                  value={chronicConditionsInput}
                  onChange={(e) => setChronicConditionsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2.5">
              Emergency Contact (Next of Kin)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Relationship</label>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Emergency Phone</label>
                <input
                  type="text"
                  placeholder="Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Complete Registration & Issue Global ID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

