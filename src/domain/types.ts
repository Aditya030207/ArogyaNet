export type UserRole =
  | 'super_admin'
  | 'branch_admin'
  | 'doctor'
  | 'receptionist'
  | 'billing'
  | 'pharmacy';

export interface EmergencyCodeConfig {
  code: string;
  color: string;
  name: string;
  description: string;
  responseTeam: string;
  priority: 'Critical' | 'High' | 'Moderate' | 'Advisory';
}

export interface HospitalBranch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  emergencyPhone: string;
  status: 'active' | 'inactive';
  departments: string[];
  emergencyCodesConfig: EmergencyCodeConfig[];
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  branchId: string;
  department: string;
  qualification: string;
  registrationNumber: string;
  council: string;
  specialization: string;
  yearsExperience: number;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  status: 'active' | 'deactivated';
  phone: string;
  role: 'doctor';
}

export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  registeredBranchId: string;
  registeredBranchName: string;
  registeredAt: string;
  registeredBy: string;
  abhaId?: string;
  aadhaarProvided: boolean;
  aadhaarMasked?: string;
  allergies: string[];
  chronicConditions: string[];
}

export interface LabResultItem {
  testName: string;
  result: string;
  normalRange: string;
  date: string;
  flag: 'normal' | 'abnormal' | 'critical';
}

export interface ConsultationVisit {
  id: string;
  patientId: string;
  branchId: string;
  branchName: string;
  doctorId: string;
  doctorName: string;
  doctorRegNo: string;
  department: string;
  visitDate: string;
  visitType: 'OPD' | 'Emergency' | 'Inpatient' | 'Follow-up' | 'Cross-Branch Referral';
  vitals: {
    bp: string;
    pulse: number;
    temp: string;
    spo2: number;
    weight: number;
  };
  chiefComplaint: string;
  symptomsAndObservations: string;
  diagnosis: string;
  clinicalNotes: string;
  labReports: LabResultItem[];
  prescriptionId?: string;
  referralId?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  route: string;
  instructions: string;
  dispensedQuantity?: number;
  dispensedStatus?: 'pending' | 'dispensed' | 'unavailable';
}

export interface DispensingRecord {
  id: string;
  timestamp: string;
  pharmacyBranchId: string;
  pharmacyBranchName: string;
  pharmacistName: string;
  itemsDispensed: string[];
  notes: string;
  type: 'full' | 'partial';
  batchNumbers?: Record<string, string>;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorRegNo: string;
  doctorQualification: string;
  branchId: string;
  branchName: string;
  consultationId: string;
  version: number;
  status: 'active' | 'superseded' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  supersededByPrescriptionId?: string;
  supersedesPrescriptionId?: string;
  modificationReason?: string;
  medicines: PrescriptionMedicine[];
  generalPrecautions: string;
  dietaryAdvice: string;
  followUpDate: string;
  verificationToken: string;
  qrPayload: string;
  issuedAt: string;
  dispensingHistory: DispensingRecord[];
}

export type ReferralStatus = 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled';
export type ReferralPriority = 'Routine' | 'Urgent' | 'Emergency';

export interface ReferralStatusUpdate {
  status: ReferralStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  fromBranchId: string;
  fromBranchName: string;
  fromDoctorId: string;
  fromDoctorName: string;
  fromDepartment: string;
  toBranchId: string;
  toBranchName: string;
  toDoctorId?: string;
  toDoctorName?: string;
  toDepartment: string;
  priority: ReferralPriority;
  emergencyCode?: string;
  reasonForReferral: string;
  provisionalDiagnosis: string;
  clinicalSummarySnippet: string;
  attachedReportSummary: string;
  status: ReferralStatus;
  statusHistory: ReferralStatusUpdate[];
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface AiMedicalSummary {
  id: string;
  patientId: string;
  generatedAt: string;
  modelUsed: string;
  summaryText: string;
  sections: {
    pastConsultations: string[];
    chronicConditions: string[];
    diagnosesHistory: string[];
    activeAndPastMedications: string[];
    allergiesAndPrecautions: string[];
    keyLabResults: string[];
    treatmentsAndProcedures: string[];
  };
  doctorReviewed: boolean;
  reviewedByDoctorId?: string;
  doctorNotesOrEdits?: string;
  reviewedAt?: string;
  disclaimer: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'No Show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  branchId: string;
  branchName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Procedure' | 'Bed Charge';
  amount: number;
}

export interface PatientBill {
  id: string;
  patientId: string;
  patientName: string;
  branchId: string;
  branchName: string;
  visitId?: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Insurance';
  receiptNumber?: string;
  createdAt: string;
  paidAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId: string;
  branchName: string;
  action: string;
  resourceType: 'Patient' | 'Prescription' | 'Referral' | 'Branch' | 'Doctor' | 'Billing' | 'Appointment' | 'AI Summary';
  resourceId: string;
  details: string;
  ipAddress?: string;
}

export interface ConsentLogEntry {
  id: string;
  patientId: string;
  patientName: string;
  accessedByDoctor: string;
  doctorRole: string;
  branchId: string;
  branchName: string;
  purpose: string;
  timestamp: string;
  consentType: 'Explicit Patient Digital Consent' | 'Emergency Access Waiver' | 'Authorized Referral Access';
}

