import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVerificationToken,
  createPrescriptionVersion,
  canDispensePrescription,
  recordPrescriptionDispense,
  filterPrescriptionForPharmacy,
  sortReferralsByEmergencyPriority,
  maskAadhaar,
} from './hms-engine';
import { Prescription, Doctor, Referral } from './types';

const mockDoctor: Doctor = {
  id: 'DOC-DEL-01',
  name: 'Dr. Vikram Malhotra, MD',
  email: 'vikram.m@arogyanet.org',
  branchId: 'BR-DELHI',
  department: 'Cardiology',
  qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
  registrationNumber: 'MCI-2015-99214',
  council: 'Delhi Medical Council',
  specialization: 'Interventional Cardiology',
  yearsExperience: 14,
  verified: true,
  status: 'active',
  phone: '+91 98110 22331',
  role: 'doctor',
};

const basePrescription: Prescription = {
  id: 'RX-DEL-2026-8801',
  patientId: 'PAT-100293',
  patientName: 'Rajesh Kumar Verma',
  patientAge: 52,
  patientGender: 'Male',
  doctorId: mockDoctor.id,
  doctorName: mockDoctor.name,
  doctorRegNo: mockDoctor.registrationNumber,
  doctorQualification: mockDoctor.qualification,
  branchId: 'BR-DELHI',
  branchName: 'ArogyaNet Apex Central - New Delhi',
  consultationId: 'VIS-2026-001',
  version: 1,
  status: 'active',
  medicines: [
    {
      id: 'MED-1',
      name: 'Telmisartan',
      genericName: 'Telmisartan',
      strength: '40mg',
      dosage: '1 Tablet',
      frequency: 'OD (Once daily)',
      timing: 'Morning after breakfast',
      duration: '30 days',
      route: 'Oral',
      instructions: 'Monitor blood pressure weekly',
      dispensedStatus: 'pending',
    },
    {
      id: 'MED-2',
      name: 'Atorvastatin',
      genericName: 'Atorvastatin Calcium',
      strength: '20mg',
      dosage: '1 Tablet',
      frequency: 'OD (Once daily)',
      timing: 'Bedtime',
      duration: '30 days',
      route: 'Oral',
      instructions: 'Take after dinner',
      dispensedStatus: 'pending',
    },
  ],
  generalPrecautions: 'Low sodium diet, brisk walking 30 mins daily',
  dietaryAdvice: 'Avoid deep-fried food and processed sugars',
  followUpDate: '2026-12-15',
  verificationToken: 'VER-RXDEL20268801-ABCD1234',
  qrPayload: '{"rxId":"RX-DEL-2026-8801"}',
  issuedAt: '2026-11-01T10:00:00.000Z',
  dispensingHistory: [],
};

test('generateVerificationToken produces formatted verification code', () => {
  const token = generateVerificationToken('RX-DEL-8801', 'MCI-2015-99214', '2026-11-01', 2);
  assert.match(token, /^VER-RXDEL8801-[0-9A-F]{8}$/);
});

test('prescription versioning supersedes previous version and creates v2 with modification reason', () => {
  const updatedMedicines = [
    {
      ...basePrescription.medicines[0],
      strength: '80mg',
    },
  ];

  const result = createPrescriptionVersion(
    basePrescription,
    updatedMedicines,
    mockDoctor,
    'Titrated Telmisartan from 40mg to 80mg due to sub-optimal BP control (150/94 mmHg)'
  );

  assert.equal(result.supersededOriginal.status, 'superseded');
  assert.equal(result.supersededOriginal.supersededByPrescriptionId, 'RX-DEL-2026-8801-v2');
  assert.equal(result.newVersion.version, 2);
  assert.equal(result.newVersion.id, 'RX-DEL-2026-8801-v2');
  assert.equal(result.newVersion.supersedesPrescriptionId, 'RX-DEL-2026-8801');
  assert.equal(result.newVersion.status, 'active');
  assert.equal(result.newVersion.medicines[0].strength, '80mg');
  assert.ok(result.newVersion.modificationReason?.includes('Titrated Telmisartan'));
});

test('canDispensePrescription blocks superseded, cancelled or already dispensed prescriptions', () => {
  const activeCheck = canDispensePrescription(basePrescription);
  assert.equal(activeCheck.canDispense, true);

  const supersededRx: Prescription = { ...basePrescription, status: 'superseded' };
  const supersededCheck = canDispensePrescription(supersededRx);
  assert.equal(supersededCheck.canDispense, false);
  assert.equal(supersededCheck.status, 'superseded');

  const cancelledRx: Prescription = { ...basePrescription, status: 'cancelled' };
  const cancelledCheck = canDispensePrescription(cancelledRx);
  assert.equal(cancelledCheck.canDispense, false);

  const dispensedRx: Prescription = { ...basePrescription, status: 'dispensed' };
  const dispensedCheck = canDispensePrescription(dispensedRx);
  assert.equal(dispensedCheck.canDispense, false);
});

test('recordPrescriptionDispense records full and partial dispensing correctly', () => {
  const partialRecord = {
    id: 'DISP-001',
    timestamp: '2026-11-02T11:00:00.000Z',
    pharmacyBranchId: 'BR-DELHI',
    pharmacyBranchName: 'ArogyaNet Apex Central Pharmacy',
    pharmacistName: 'Priya Sharma, RPh',
    itemsDispensed: ['MED-1'],
    notes: 'Telmisartan 40mg (Strip of 30) dispensed. Atorvastatin currently out of stock.',
    type: 'partial' as const,
  };

  const partiallyDispensed = recordPrescriptionDispense(basePrescription, partialRecord);
  assert.equal(partiallyDispensed.status, 'partially_dispensed');
  assert.equal(partiallyDispensed.medicines[0].dispensedStatus, 'dispensed');
  assert.equal(partiallyDispensed.medicines[1].dispensedStatus, 'pending');
  assert.equal(partiallyDispensed.dispensingHistory.length, 1);

  const fullRecord = {
    id: 'DISP-002',
    timestamp: '2026-11-03T15:00:00.000Z',
    pharmacyBranchId: 'BR-DELHI',
    pharmacyBranchName: 'ArogyaNet Apex Central Pharmacy',
    pharmacistName: 'Priya Sharma, RPh',
    itemsDispensed: ['MED-2'],
    notes: 'Remaining Atorvastatin dispensed.',
    type: 'full' as const,
  };

  const fullyDispensed = recordPrescriptionDispense(partiallyDispensed, fullRecord);
  assert.equal(fullyDispensed.status, 'dispensed');
  assert.equal(fullyDispensed.medicines[1].dispensedStatus, 'dispensed');
  assert.equal(fullyDispensed.dispensingHistory.length, 2);
});

test('filterPrescriptionForPharmacy strips full medical records for patient privacy', () => {
  const pharmacyView = filterPrescriptionForPharmacy(basePrescription);
  assert.equal(pharmacyView.id, basePrescription.id);
  assert.equal(pharmacyView.patientName, 'Rajesh Kumar Verma');
  assert.equal(pharmacyView.medicines.length, 2);

  assert.equal((pharmacyView as any).clinicalNotes, undefined);
  assert.equal((pharmacyView as any).labReports, undefined);
});

test('sortReferralsByEmergencyPriority prioritizes Emergency over Urgent over Routine', () => {
  const referrals: Referral[] = [
    {
      id: 'REF-1',
      patientId: 'P1',
      patientName: 'Pat 1',
      patientAge: 40,
      patientGender: 'Male',
      fromBranchId: 'B1',
      fromBranchName: 'Branch 1',
      fromDoctorId: 'D1',
      fromDoctorName: 'Doc 1',
      fromDepartment: 'General',
      toBranchId: 'B2',
      toBranchName: 'Branch 2',
      toDepartment: 'Cardio',
      priority: 'Routine',
      reasonForReferral: 'Checkup',
      provisionalDiagnosis: 'HTN',
      clinicalSummarySnippet: 'Stable',
      attachedReportSummary: 'Normal ECG',
      status: 'Pending',
      statusHistory: [],
      createdAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'REF-2',
      patientId: 'P2',
      patientName: 'Pat 2',
      patientAge: 45,
      patientGender: 'Female',
      fromBranchId: 'B1',
      fromBranchName: 'Branch 1',
      fromDoctorId: 'D1',
      fromDoctorName: 'Doc 1',
      fromDepartment: 'Emergency',
      toBranchId: 'B2',
      toBranchName: 'Branch 2',
      toDepartment: 'Cardio',
      priority: 'Emergency',
      reasonForReferral: 'Acute NSTEMI',
      provisionalDiagnosis: 'ACS',
      clinicalSummarySnippet: 'Elevated Troponin-I',
      attachedReportSummary: 'ST depression V4-V6',
      status: 'Pending',
      statusHistory: [],
      createdAt: '2026-11-01T10:30:00.000Z',
    },
    {
      id: 'REF-3',
      patientId: 'P3',
      patientName: 'Pat 3',
      patientAge: 50,
      patientGender: 'Male',
      fromBranchId: 'B1',
      fromBranchName: 'Branch 1',
      fromDoctorId: 'D1',
      fromDoctorName: 'Doc 1',
      fromDepartment: 'Medicine',
      toBranchId: 'B2',
      toBranchName: 'Branch 2',
      toDepartment: 'Neurology',
      priority: 'Urgent',
      reasonForReferral: 'Unexplained TIA episode',
      provisionalDiagnosis: 'TIA',
      clinicalSummarySnippet: 'Resolved weakness',
      attachedReportSummary: 'MRI Brain pending',
      status: 'Pending',
      statusHistory: [],
      createdAt: '2026-11-01T09:00:00.000Z',
    },
  ];

  const sorted = sortReferralsByEmergencyPriority(referrals);
  assert.equal(sorted[0].id, 'REF-2');
  assert.equal(sorted[1].id, 'REF-3');
  assert.equal(sorted[2].id, 'REF-1');
});

test('maskAadhaar formats only last 4 digits and never requires input', () => {
  assert.equal(maskAadhaar(undefined), undefined);
  assert.equal(maskAadhaar(''), undefined);
  assert.equal(maskAadhaar('5523 9012 4912'), 'XXXX-XXXX-4912');
  assert.equal(maskAadhaar('992384192341'), 'XXXX-XXXX-2341');
});

