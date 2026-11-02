import {
  Prescription,
  PrescriptionMedicine,
  DispensingRecord,
  EmergencyCodeConfig,
  HospitalBranch,
  Referral,
  Doctor,
} from './types';

export function generateVerificationToken(
  prescriptionId: string,
  doctorRegNo: string,
  issuedAt: string,
  itemCount: number
): string {
  const payload = `${prescriptionId}|${doctorRegNo}|${issuedAt}|${itemCount}|AROGYANET_HMAC`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `VER-${prescriptionId.replace(/[^A-Z0-9]/g, '')}-${hex}`;
}

export function generateStandardEmergencyCodes(): EmergencyCodeConfig[] {
  return [
    {
      code: 'Code Blue',
      color: '#2563EB',
      name: 'Cardiac / Medical Arrest',
      description: 'Adult or pediatric cardiopulmonary arrest or acute vital instability requiring resuscitation team.',
      responseTeam: 'Crash Cart Team, ICU Intensivist, Anesthesiologist, Code Nurse',
      priority: 'Critical',
    },
    {
      code: 'Code Red',
      color: '#DC2626',
      name: 'Fire / Major Hazard',
      description: 'Active smoke, flame, or thermal danger requiring zone isolation or evacuation.',
      responseTeam: 'Fire Safety Marshal, Security Team, Floor Incharge',
      priority: 'Critical',
    },
    {
      code: 'Code Yellow',
      color: '#D97706',
      name: 'Trauma / Mass Casualty Disaster',
      description: 'External mass casualty incident, multi-vehicle trauma incoming, or internal disaster.',
      responseTeam: 'Trauma Surgery Team, Emergency Registrar, Triage Nurses',
      priority: 'High',
    },
    {
      code: 'Code Amber',
      color: '#EA580C',
      name: 'Missing Patient / Infant Security',
      description: 'Missing infant, child, or vulnerable patient reported unaccounted on floor.',
      responseTeam: 'Hospital Security, Perimeter Access Control, Floor Supervisors',
      priority: 'High',
    },
    {
      code: 'Code Green',
      color: '#16A34A',
      name: 'Evacuation Precaution / All Clear',
      description: 'Controlled phased evacuation order or confirmation of threat neutralized.',
      responseTeam: 'Hospital Operations, Nursing Administration',
      priority: 'Moderate',
    },
  ];
}

export function generateStandardBranchConfig(
  id: string,
  code: string,
  name: string,
  city: string,
  state: string,
  address: string,
  phone: string,
  email: string
): HospitalBranch {
  return {
    id,
    code,
    name,
    city,
    state,
    address,
    phone,
    email,
    emergencyPhone: '1066 / +91-11-2659-8800',
    status: 'active',
    departments: [
      'Emergency & Trauma',
      'Cardiology',
      'Neurology',
      'General Medicine',
      'Orthopedics & Joint Replacement',
      'Pediatrics',
      'Pulmonology',
      'Gastroenterology',
      'Radiology & Imaging',
    ],
    emergencyCodesConfig: generateStandardEmergencyCodes(),
    createdAt: new Date().toISOString(),
  };
}

export function createPrescriptionVersion(
  original: Prescription,
  updatedMedicines: PrescriptionMedicine[],
  modifyingDoctor: Doctor,
  modificationReason: string,
  newGeneralPrecautions?: string,
  newFollowUpDate?: string
): { supersededOriginal: Prescription; newVersion: Prescription } {
  if (original.status === 'superseded') {
    throw new Error('Cannot modify an already superseded prescription.');
  }
  if (original.status === 'cancelled') {
    throw new Error('Cannot modify a cancelled prescription.');
  }

  const newVersionNum = original.version + 1;
  const newPrescriptionId = `${original.id.split('-v')[0]}-v${newVersionNum}`;
  const now = new Date().toISOString();

  const newVerificationToken = generateVerificationToken(
    newPrescriptionId,
    modifyingDoctor.registrationNumber,
    now,
    updatedMedicines.length
  );

  const qrPayload = JSON.stringify({
    rxId: newPrescriptionId,
    v: newVersionNum,
    patId: original.patientId,
    docReg: modifyingDoctor.registrationNumber,
    token: newVerificationToken,
    issued: now,
  });

  const supersededOriginal: Prescription = {
    ...original,
    status: 'superseded',
    supersededByPrescriptionId: newPrescriptionId,
  };

  const newVersion: Prescription = {
    ...original,
    id: newPrescriptionId,
    version: newVersionNum,
    status: 'active',
    supersedesPrescriptionId: original.id,
    modificationReason,
    doctorId: modifyingDoctor.id,
    doctorName: modifyingDoctor.name,
    doctorRegNo: modifyingDoctor.registrationNumber,
    doctorQualification: modifyingDoctor.qualification,
    medicines: updatedMedicines,
    generalPrecautions: newGeneralPrecautions ?? original.generalPrecautions,
    followUpDate: newFollowUpDate ?? original.followUpDate,
    verificationToken: newVerificationToken,
    qrPayload,
    issuedAt: now,
    dispensingHistory: [],
  };

  return { supersededOriginal, newVersion };
}

export function canDispensePrescription(prescription: Prescription): {
  canDispense: boolean;
  status: Prescription['status'];
  reason?: string;
} {
  if (prescription.status === 'superseded') {
    return {
      canDispense: false,
      status: 'superseded',
      reason: `Prescription has been SUPERSEDED by version ${prescription.supersededByPrescriptionId || 'newer'}. Dispensing is blocked to prevent medication errors.`,
    };
  }

  if (prescription.status === 'cancelled') {
    return {
      canDispense: false,
      status: 'cancelled',
      reason: 'This prescription was cancelled by the treating physician.',
    };
  }

  if (prescription.status === 'dispensed') {
    return {
      canDispense: false,
      status: 'dispensed',
      reason: 'This prescription has already been fully dispensed.',
    };
  }

  return {
    canDispense: true,
    status: prescription.status,
  };
}

export function recordPrescriptionDispense(
  prescription: Prescription,
  record: DispensingRecord
): Prescription {
  const validation = canDispensePrescription(prescription);
  if (!validation.canDispense) {
    throw new Error(validation.reason || 'Prescription cannot be dispensed.');
  }

  const isFull = record.type === 'full';
  const newStatus: Prescription['status'] = isFull ? 'dispensed' : 'partially_dispensed';

  const updatedMedicines = prescription.medicines.map((med) => {
    if (record.itemsDispensed.includes(med.id) || isFull) {
      return {
        ...med,
        dispensedStatus: 'dispensed' as const,
      };
    }
    return med;
  });

  return {
    ...prescription,
    status: newStatus,
    medicines: updatedMedicines,
    dispensingHistory: [record, ...prescription.dispensingHistory],
  };
}

export function filterPrescriptionForPharmacy(prescription: Prescription) {
  return {
    id: prescription.id,
    version: prescription.version,
    status: prescription.status,
    patientId: prescription.patientId,
    patientName: prescription.patientName,
    patientAge: prescription.patientAge,
    patientGender: prescription.patientGender,
    doctorName: prescription.doctorName,
    doctorRegNo: prescription.doctorRegNo,
    doctorQualification: prescription.doctorQualification,
    branchName: prescription.branchName,
    issuedAt: prescription.issuedAt,
    medicines: prescription.medicines,
    generalPrecautions: prescription.generalPrecautions,
    dietaryAdvice: prescription.dietaryAdvice,
    followUpDate: prescription.followUpDate,
    verificationToken: prescription.verificationToken,
    dispensingHistory: prescription.dispensingHistory,
  };
}

export function sortReferralsByEmergencyPriority(referrals: Referral[]): Referral[] {
  const priorityWeight: Record<Referral['priority'], number> = {
    Emergency: 3,
    Urgent: 2,
    Routine: 1,
  };

  return [...referrals].sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function maskAadhaar(rawDigits?: string): string | undefined {
  if (!rawDigits) return undefined;
  const digits = rawDigits.replace(/\D/g, '');
  if (digits.length < 4) return undefined;
  const lastFour = digits.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

