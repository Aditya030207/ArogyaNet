import {
  HospitalBranch,
  Doctor,
  Patient,
  ConsultationVisit,
  Prescription,
  Referral,
  Appointment,
  PatientBill,
  AuditLogEntry,
  ConsentLogEntry,
  AiMedicalSummary,
  UserRole,
  ReferralStatus,
  AppointmentStatus,
  DispensingRecord,
  PrescriptionMedicine,
} from '../domain/types';
import {
  INITIAL_BRANCHES,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_VISITS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_REFERRALS,
  INITIAL_APPOINTMENTS,
  INITIAL_BILLS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONSENT_LOGS,
  INITIAL_AI_SUMMARIES,
} from '../domain/seed-data';
import {
  generateStandardBranchConfig,
  generateVerificationToken,
  createPrescriptionVersion,
  recordPrescriptionDispense,
} from '../domain/hms-engine';

const STORAGE_KEY = 'arogyanet_hms_state_v1';

export interface AppState {
  currentBranchId: string;
  currentRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  branches: HospitalBranch[];
  doctors: Doctor[];
  patients: Patient[];
  visits: ConsultationVisit[];
  prescriptions: Prescription[];
  referrals: Referral[];
  appointments: Appointment[];
  bills: PatientBill[];
  auditLogs: AuditLogEntry[];
  consentLogs: ConsentLogEntry[];
  aiSummaries: Record<string, AiMedicalSummary>;
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.branches && parsed.patients) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse state from localStorage, loading initial seed data', e);
  }

  return {
    currentBranchId: 'BR-DELHI',
    currentRole: 'doctor',
    currentUserId: 'DOC-DEL-01',
    currentUserName: 'Dr. Vikram Malhotra',
    branches: INITIAL_BRANCHES,
    doctors: INITIAL_DOCTORS,
    patients: INITIAL_PATIENTS,
    visits: INITIAL_VISITS,
    prescriptions: INITIAL_PRESCRIPTIONS,
    referrals: INITIAL_REFERRALS,
    appointments: INITIAL_APPOINTMENTS,
    bills: INITIAL_BILLS,
    auditLogs: INITIAL_AUDIT_LOGS,
    consentLogs: INITIAL_CONSENT_LOGS,
    aiSummaries: INITIAL_AI_SUMMARIES,
  };
}

class Store {
  private state: AppState = loadInitialState();
  private listeners: Set<() => void> = new Set();

  getState(): AppState {
    return this.state;
  }

  private saveAndNotify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  resetToDemoSeed() {
    this.state = {
      currentBranchId: 'BR-DELHI',
      currentRole: 'doctor',
      currentUserId: 'DOC-DEL-01',
      currentUserName: 'Dr. Vikram Malhotra',
      branches: INITIAL_BRANCHES,
      doctors: INITIAL_DOCTORS,
      patients: INITIAL_PATIENTS,
      visits: INITIAL_VISITS,
      prescriptions: INITIAL_PRESCRIPTIONS,
      referrals: INITIAL_REFERRALS,
      appointments: INITIAL_APPOINTMENTS,
      bills: INITIAL_BILLS,
      auditLogs: INITIAL_AUDIT_LOGS,
      consentLogs: INITIAL_CONSENT_LOGS,
      aiSummaries: INITIAL_AI_SUMMARIES,
    };
    this.saveAndNotify();
  }

  setBranch(branchId: string) {
    this.state.currentBranchId = branchId;

    const branchDoctors = this.state.doctors.filter((d) => d.branchId === branchId && d.status === 'active');
    if (this.state.currentRole === 'doctor' && branchDoctors.length > 0) {
      this.state.currentUserId = branchDoctors[0].id;
      this.state.currentUserName = branchDoctors[0].name;
    }
    this.saveAndNotify();
  }

  setRole(role: UserRole) {
    this.state.currentRole = role;
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const branchName = currentBranch?.name || 'Central';

    switch (role) {
      case 'super_admin':
        this.state.currentUserId = 'ADMIN-SUPER-01';
        this.state.currentUserName = 'Chief Medical Director (Super Admin)';
        break;
      case 'branch_admin':
        this.state.currentUserId = `ADMIN-${this.state.currentBranchId}`;
        this.state.currentUserName = `Medical Superintendent (${currentBranch?.city || 'Branch'})`;
        break;
      case 'doctor': {
        const branchDoctors = this.state.doctors.filter(
          (d) => d.branchId === this.state.currentBranchId && d.status === 'active'
        );
        if (branchDoctors.length > 0) {
          this.state.currentUserId = branchDoctors[0].id;
          this.state.currentUserName = branchDoctors[0].name;
        } else {
          this.state.currentUserId = 'DOC-GEN-01';
          this.state.currentUserName = 'Dr. Senior Registrar';
        }
        break;
      }
      case 'receptionist':
        this.state.currentUserId = `REC-${this.state.currentBranchId}`;
        this.state.currentUserName = `Front Desk Officer (${currentBranch?.city || 'Desk'})`;
        break;
      case 'billing':
        this.state.currentUserId = `BILL-${this.state.currentBranchId}`;
        this.state.currentUserName = `Accounts & Billing Desk (${currentBranch?.city || 'Branch'})`;
        break;
      case 'pharmacy':
        this.state.currentUserId = `PHARM-${this.state.currentBranchId}`;
        this.state.currentUserName = `Chief Pharmacist (${currentBranch?.city || 'Outpatient'})`;
        break;
    }

    this.logAudit({
      action: 'SWITCH_ROLE',
      resourceType: 'Doctor',
      resourceId: this.state.currentUserId,
      details: `Switched active role to ${role} for session.`,
    });

    this.saveAndNotify();
  }

  logAudit(entry: {
    action: string;
    resourceType: AuditLogEntry['resourceType'];
    resourceId: string;
    details: string;
  }) {
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: this.state.currentUserId,
      userName: this.state.currentUserName,
      userRole: this.state.currentRole,
      branchId: this.state.currentBranchId,
      branchName: currentBranch?.name || 'ArogyaNet Health System',
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: '10.14.2.18',
    };
    this.state.auditLogs = [newEntry, ...this.state.auditLogs];
  }

  logConsent(entry: {
    patientId: string;
    patientName: string;
    purpose: string;
    consentType: ConsentLogEntry['consentType'];
  }) {
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const newEntry: ConsentLogEntry = {
      id: `CON-${Date.now()}`,
      patientId: entry.patientId,
      patientName: entry.patientName,
      accessedByDoctor: this.state.currentUserName,
      doctorRole: this.state.currentRole,
      branchId: this.state.currentBranchId,
      branchName: currentBranch?.name || 'ArogyaNet',
      purpose: entry.purpose,
      timestamp: new Date().toISOString(),
      consentType: entry.consentType,
    };
    this.state.consentLogs = [newEntry, ...this.state.consentLogs];
  }

  createBranch(params: {
    name: string;
    code: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
  }): HospitalBranch {
    const id = `BR-${params.city.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}-${Date.now().toString().slice(-4)}`;
    const newBranch = generateStandardBranchConfig(
      id,
      params.code,
      params.name,
      params.city,
      params.state,
      params.address,
      params.phone,
      params.email
    );

    this.state.branches = [...this.state.branches, newBranch];

    this.logAudit({
      action: 'CREATE_BRANCH',
      resourceType: 'Branch',
      resourceId: id,
      details: `Created new hospital branch: ${newBranch.name} (${newBranch.city}). Initialized standard emergency codes & 9 departments.`,
    });

    this.saveAndNotify();
    return newBranch;
  }

  addDoctor(doctor: Omit<Doctor, 'id' | 'role' | 'verified'>): Doctor {
    const branch = this.state.branches.find((b) => b.id === doctor.branchId);
    const branchPrefix = branch ? branch.code.replace(/[^A-Z]/g, '') : 'DOC';
    const id = `DOC-${branchPrefix}-${Date.now().toString().slice(-4)}`;

    const newDoctor: Doctor = {
      ...doctor,
      id,
      role: 'doctor',
      verified: false,
    };

    this.state.doctors = [newDoctor, ...this.state.doctors];

    this.logAudit({
      action: 'ADD_DOCTOR',
      resourceType: 'Doctor',
      resourceId: id,
      details: `Added new doctor candidate ${newDoctor.name} to ${branch?.name || doctor.branchId} in ${newDoctor.department}. Pending credential verification.`,
    });

    this.saveAndNotify();
    return newDoctor;
  }

  verifyDoctor(doctorId: string): boolean {
    const doc = this.state.doctors.find((d) => d.id === doctorId);
    if (!doc) return false;

    doc.verified = true;
    doc.verifiedAt = new Date().toISOString();
    doc.verifiedBy = this.state.currentUserName;

    this.logAudit({
      action: 'VERIFY_DOCTOR',
      resourceType: 'Doctor',
      resourceId: doctorId,
      details: `Verified medical council credentials (Reg: ${doc.registrationNumber}) for ${doc.name}. Granted clinical authorization.`,
    });

    this.saveAndNotify();
    return true;
  }

  deactivateDoctor(doctorId: string): boolean {
    const doc = this.state.doctors.find((d) => d.id === doctorId);
    if (!doc) return false;

    doc.status = doc.status === 'active' ? 'deactivated' : 'active';

    this.logAudit({
      action: doc.status === 'active' ? 'REACTIVE_DOCTOR' : 'DEACTIVATE_DOCTOR',
      resourceType: 'Doctor',
      resourceId: doctorId,
      details: `${doc.status === 'active' ? 'Reactivated' : 'Deactivated and revoked access for'} ${doc.name}. Historical clinical records preserved intact.`,
    });

    this.saveAndNotify();
    return true;
  }

  registerPatient(patientData: Omit<Patient, 'id' | 'registeredBranchId' | 'registeredBranchName' | 'registeredAt' | 'registeredBy'>): Patient {
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const id = `PAT-${randomSuffix}`;

    const newPatient: Patient = {
      ...patientData,
      id,
      registeredBranchId: this.state.currentBranchId,
      registeredBranchName: currentBranch?.name || 'ArogyaNet',
      registeredAt: new Date().toISOString(),
      registeredBy: this.state.currentUserName,
    };

    this.state.patients = [newPatient, ...this.state.patients];

    this.logAudit({
      action: 'REGISTER_PATIENT',
      resourceType: 'Patient',
      resourceId: id,
      details: `Registered new patient ${newPatient.fullName} (${newPatient.gender}, ${newPatient.age} yrs) at ${currentBranch?.name}. ABHA: ${newPatient.abhaId || 'None'}. Aadhaar voluntary: ${newPatient.aadhaarProvided ? 'Yes (Masked)' : 'No'}.`,
    });

    this.saveAndNotify();
    return newPatient;
  }

  addConsultationVisit(visitData: Omit<ConsultationVisit, 'id' | 'branchId' | 'branchName' | 'doctorId' | 'doctorName' | 'doctorRegNo'>): ConsultationVisit {
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const doctor = this.state.doctors.find((d) => d.id === this.state.currentUserId) || this.state.doctors[0];
    const id = `VIS-${Date.now().toString().slice(-6)}`;

    const newVisit: ConsultationVisit = {
      ...visitData,
      id,
      branchId: this.state.currentBranchId,
      branchName: currentBranch?.name || 'ArogyaNet',
      doctorId: doctor?.id || 'DOC-GEN',
      doctorName: doctor?.name || 'Attending Physician',
      doctorRegNo: doctor?.registrationNumber || 'REG-PENDING',
    };

    this.state.visits = [newVisit, ...this.state.visits];

    this.logAudit({
      action: 'RECORD_CONSULTATION',
      resourceType: 'Patient',
      resourceId: newVisit.patientId,
      details: `Recorded clinical visit ${id} at ${currentBranch?.name} by ${doctor?.name}. Diagnosis: ${newVisit.diagnosis}`,
    });

    this.saveAndNotify();
    return newVisit;
  }

  createPrescription(data: {
    patientId: string;
    medicines: PrescriptionMedicine[];
    generalPrecautions: string;
    dietaryAdvice: string;
    followUpDate: string;
    consultationId?: string;
  }): Prescription {
    const patient = this.state.patients.find((p) => p.id === data.patientId);
    const doctor = this.state.doctors.find((d) => d.id === this.state.currentUserId) || this.state.doctors[0];
    const currentBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);

    const rxId = `RX-${currentBranch?.code.replace(/[^A-Z]/g, '') || 'NET'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const token = generateVerificationToken(rxId, doctor?.registrationNumber || 'DOC-REG', now, data.medicines.length);

    const qrPayload = JSON.stringify({
      rxId,
      v: 1,
      patId: patient?.id,
      patName: patient?.fullName,
      docName: doctor?.name,
      docReg: doctor?.registrationNumber,
      token,
      hosp: currentBranch?.name,
      issued: now,
    });

    const newRx: Prescription = {
      id: rxId,
      patientId: data.patientId,
      patientName: patient?.fullName || 'Patient',
      patientAge: patient?.age || 0,
      patientGender: patient?.gender || 'Unknown',
      doctorId: doctor?.id || 'DOC-01',
      doctorName: doctor?.name || 'Dr. Medical Officer',
      doctorRegNo: doctor?.registrationNumber || 'REG-000',
      doctorQualification: doctor?.qualification || 'MBBS',
      branchId: this.state.currentBranchId,
      branchName: currentBranch?.name || 'ArogyaNet Health System',
      consultationId: data.consultationId || `VIS-${Date.now().toString().slice(-5)}`,
      version: 1,
      status: 'active',
      medicines: data.medicines,
      generalPrecautions: data.generalPrecautions,
      dietaryAdvice: data.dietaryAdvice,
      followUpDate: data.followUpDate,
      verificationToken: token,
      qrPayload,
      issuedAt: now,
      dispensingHistory: [],
    };

    this.state.prescriptions = [newRx, ...this.state.prescriptions];

    this.logAudit({
      action: 'CREATE_PRESCRIPTION',
      resourceType: 'Prescription',
      resourceId: rxId,
      details: `Generated signed digital prescription ${rxId} with ${data.medicines.length} medicines for ${patient?.fullName}.`,
    });

    this.saveAndNotify();
    return newRx;
  }

  supersedePrescription(
    prescriptionId: string,
    updatedMedicines: PrescriptionMedicine[],
    modificationReason: string,
    newPrecautions?: string,
    newFollowUpDate?: string
  ): { original: Prescription; newVersion: Prescription } {
    const original = this.state.prescriptions.find((p) => p.id === prescriptionId);
    if (!original) throw new Error('Prescription not found.');

    const modifyingDoctor = this.state.doctors.find((d) => d.id === this.state.currentUserId) || this.state.doctors[0];
    const { supersededOriginal, newVersion } = createPrescriptionVersion(
      original,
      updatedMedicines,
      modifyingDoctor,
      modificationReason,
      newPrecautions,
      newFollowUpDate
    );

    this.state.prescriptions = this.state.prescriptions.map((p) => (p.id === original.id ? supersededOriginal : p));
    this.state.prescriptions = [newVersion, ...this.state.prescriptions];

    this.logAudit({
      action: 'SUPERSEDE_PRESCRIPTION',
      resourceType: 'Prescription',
      resourceId: newVersion.id,
      details: `Prescription ${original.id} superseded by v${newVersion.version} (${newVersion.id}). Reason: ${modificationReason}. Old prescription barred from pharmacy dispensing.`,
    });

    this.saveAndNotify();
    return { original: supersededOriginal, newVersion };
  }

  dispensePrescription(prescriptionId: string, record: DispensingRecord): Prescription {
    const rx = this.state.prescriptions.find((p) => p.id === prescriptionId);
    if (!rx) throw new Error('Prescription not found');

    const updated = recordPrescriptionDispense(rx, record);

    this.state.prescriptions = this.state.prescriptions.map((p) => (p.id === rx.id ? updated : p));

    this.logAudit({
      action: 'DISPENSE_PRESCRIPTION',
      resourceType: 'Prescription',
      resourceId: prescriptionId,
      details: `Pharmacy at ${record.pharmacyBranchName} (${record.pharmacistName}) recorded ${record.type} dispensing for prescription ${prescriptionId}. Items: ${record.itemsDispensed.join(', ')}.`,
    });

    this.saveAndNotify();
    return updated;
  }

  createReferral(referralData: Omit<Referral, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'fromBranchId' | 'fromBranchName' | 'fromDoctorId' | 'fromDoctorName'>): Referral {
    const fromBranch = this.state.branches.find((b) => b.id === this.state.currentBranchId);
    const fromDoctor = this.state.doctors.find((d) => d.id === this.state.currentUserId) || this.state.doctors[0];
    const toBranch = this.state.branches.find((b) => b.id === referralData.toBranchId);

    const id = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newReferral: Referral = {
      ...referralData,
      id,
      fromBranchId: this.state.currentBranchId,
      fromBranchName: fromBranch?.name || 'ArogyaNet',
      fromDoctorId: fromDoctor?.id || 'DOC-01',
      fromDoctorName: fromDoctor?.name || 'Referring Physician',
      toBranchName: toBranch?.name || referralData.toBranchId,
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: now,
          updatedBy: `${fromDoctor?.name} (${fromBranch?.city})`,
          note: `Cross-branch referral created with priority: ${referralData.priority}`,
        },
      ],
      createdAt: now,
    };

    this.state.referrals = [newReferral, ...this.state.referrals];

    this.logAudit({
      action: 'CREATE_REFERRAL',
      resourceType: 'Referral',
      resourceId: id,
      details: `Referred patient ${referralData.patientName} from ${fromBranch?.name} to ${toBranch?.name} (${referralData.toDepartment}) with priority ${referralData.priority}. Reason: ${referralData.reasonForReferral}`,
    });

    this.saveAndNotify();
    return newReferral;
  }

  updateReferralStatus(referralId: string, newStatus: ReferralStatus, note?: string): boolean {
    const referral = this.state.referrals.find((r) => r.id === referralId);
    if (!referral) return false;

    referral.status = newStatus;
    const now = new Date().toISOString();
    if (newStatus === 'Accepted') referral.acceptedAt = now;
    if (newStatus === 'Completed') referral.completedAt = now;

    referral.statusHistory.push({
      status: newStatus,
      timestamp: now,
      updatedBy: this.state.currentUserName,
      note,
    });

    this.logAudit({
      action: `REFERRAL_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      resourceType: 'Referral',
      resourceId: referralId,
      details: `Referral status updated to "${newStatus}" by ${this.state.currentUserName}. Note: ${note || 'None'}`,
    });

    this.saveAndNotify();
    return true;
  }

  bookAppointment(data: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const id = `APT-${Date.now().toString().slice(-6)}`;
    const newApt: Appointment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    this.state.appointments = [newApt, ...this.state.appointments];

    this.logAudit({
      action: 'BOOK_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: id,
      details: `Booked appointment for ${data.patientName} with ${data.doctorName} at ${data.branchName} on ${data.appointmentDate} at ${data.appointmentTime}.`,
    });

    this.saveAndNotify();
    return newApt;
  }

  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus, note?: string): boolean {
    const apt = this.state.appointments.find((a) => a.id === appointmentId);
    if (!apt) return false;

    apt.status = status;
    if (note) apt.notes = note;

    this.logAudit({
      action: `APPOINTMENT_${status.toUpperCase().replace(/\s+/g, '_')}`,
      resourceType: 'Appointment',
      resourceId: appointmentId,
      details: `Appointment for ${apt.patientName} changed to ${status}.`,
    });

    this.saveAndNotify();
    return true;
  }

  createBill(billData: Omit<PatientBill, 'id' | 'createdAt'>): PatientBill {
    const id = `BILL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBill: PatientBill = {
      ...billData,
      id,
      createdAt: new Date().toISOString(),
    };

    this.state.bills = [newBill, ...this.state.bills];

    this.logAudit({
      action: 'CREATE_BILL',
      resourceType: 'Billing',
      resourceId: id,
      details: `Generated bill ${id} for ₹${newBill.totalAmount} for patient ${newBill.patientName}. Items: ${newBill.items.length}.`,
    });

    this.saveAndNotify();
    return newBill;
  }

  recordBillPayment(billId: string, paymentMethod: PatientBill['paymentMethod']): boolean {
    const bill = this.state.bills.find((b) => b.id === billId);
    if (!bill) return false;

    bill.paidAmount = bill.totalAmount;
    bill.balanceAmount = 0;
    bill.paymentStatus = 'Paid';
    bill.paymentMethod = paymentMethod;
    bill.receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    bill.paidAt = new Date().toISOString();

    this.logAudit({
      action: 'COLLECT_BILL_PAYMENT',
      resourceType: 'Billing',
      resourceId: billId,
      details: `Collected ₹${bill.paidAmount} via ${paymentMethod} for Bill ${billId}. Issued receipt ${bill.receiptNumber}.`,
    });

    this.saveAndNotify();
    return true;
  }

  saveAiSummary(summary: AiMedicalSummary) {
    this.state.aiSummaries[summary.patientId] = summary;
    this.logAudit({
      action: 'GENERATE_AI_SUMMARY',
      resourceType: 'AI Summary',
      resourceId: summary.patientId,
      details: `Generated comprehensive AI medical history digest using ${summary.modelUsed}.`,
    });
    this.saveAndNotify();
  }

  reviewAiSummary(patientId: string, notes: string): boolean {
    const summary = this.state.aiSummaries[patientId];
    if (!summary) return false;

    summary.doctorReviewed = true;
    summary.reviewedByDoctorId = this.state.currentUserId;
    summary.doctorNotesOrEdits = notes;
    summary.reviewedAt = new Date().toISOString();

    this.logAudit({
      action: 'REVIEW_AI_SUMMARY',
      resourceType: 'AI Summary',
      resourceId: patientId,
      details: `Doctor ${this.state.currentUserName} reviewed and validated AI summary. Notes added.`,
    });

    this.saveAndNotify();
    return true;
  }
}

export const hmsStore = new Store();

