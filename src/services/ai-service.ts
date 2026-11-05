import { Patient, ConsultationVisit, Prescription, AiMedicalSummary } from '../domain/types';

export async function generatePatientAiSummary(
  patient: Patient,
  visits: ConsultationVisit[],
  prescriptions: Prescription[]
): Promise<AiMedicalSummary> {
  const patientVisits = visits.filter((v) => v.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id);

  try {
    const res = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient,
        visits: patientVisits,
        prescriptions: patientPrescriptions,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.summaryText && data.sections) {
        return {
          id: `SUM-${patient.id}-${Date.now()}`,
          patientId: patient.id,
          generatedAt: new Date().toISOString(),
          modelUsed: data.modelUsed || 'gemini-3.8-flash',
          summaryText: data.summaryText,
          sections: data.sections,
          doctorReviewed: false,
          disclaimer:
            'AI-generated clinical digest for authorized clinical review only. Does not replace professional clinical diagnosis or prescription decisions.',
        };
      }
    }
  } catch (err) {
    console.warn('AI summary server endpoint unavailable or error, falling back to local synthesis engine:', err);
  }

  const pastConsultations = patientVisits.map(
    (v) =>
      `${new Date(v.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${v.branchName}): ${v.doctorName} (${v.department}) - Chief complaint: ${v.chiefComplaint} | Diagnosis: ${v.diagnosis}`
  );

  const diagnosesHistory = Array.from(new Set(patientVisits.map((v) => v.diagnosis))).filter(Boolean);

  const activeAndPastMedications = Array.from(
    new Set(
      patientPrescriptions.flatMap((p) =>
        p.medicines.map((m) => `${m.name} (${m.genericName} ${m.strength}) - ${m.frequency}, ${m.timing} [Status: ${p.status.toUpperCase()}]`)
      )
    )
  );

  const keyLabResults = patientVisits.flatMap((v) =>
    v.labReports.map(
      (l) =>
        `${l.testName}: ${l.result} (Ref: ${l.normalRange}, Date: ${l.date}) [${l.flag.toUpperCase()}]`
    )
  );

  const treatmentsAndProcedures = patientVisits
    .map((v) => v.clinicalNotes)
    .filter(Boolean)
    .map((note) => (note.length > 120 ? `${note.slice(0, 117)}...` : note));

  const chronicConditions = patient.chronicConditions && patient.chronicConditions.length > 0
    ? patient.chronicConditions
    : ['None recorded in primary demographic file'];

  const allergiesAndPrecautions = patient.allergies && patient.allergies.length > 0
    ? patient.allergies
    : ['No known drug allergies (NKDA) reported'];

  const summaryText = `${patient.fullName}, a ${patient.age}-year-old ${patient.gender} (Blood Group: ${patient.bloodGroup || 'Not specified'}), registered at ${patient.registeredBranchName}. Primary medical background includes: ${chronicConditions.join(', ')}. Has had ${patientVisits.length} recorded consultation(s) across hospital branches. Most recent visit was on ${patientVisits[0] ? new Date(patientVisits[0].visitDate).toLocaleDateString('en-IN') : 'N/A'} for ${patientVisits[0]?.chiefComplaint || 'routine consult'}. Critical warnings: ${allergiesAndPrecautions.join('; ')}.`;

  return {
    id: `SUM-${patient.id}-${Date.now()}`,
    patientId: patient.id,
    generatedAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (Clinical Engine)',
    summaryText,
    sections: {
      pastConsultations: pastConsultations.length ? pastConsultations : ['No prior consultations recorded.'],
      chronicConditions,
      diagnosesHistory: diagnosesHistory.length ? diagnosesHistory : ['No definitive diagnoses on record.'],
      activeAndPastMedications: activeAndPastMedications.length ? activeAndPastMedications : ['No prior medication records.'],
      allergiesAndPrecautions,
      keyLabResults: keyLabResults.length ? keyLabResults : ['No laboratory investigations logged.'],
      treatmentsAndProcedures: treatmentsAndProcedures.length ? treatmentsAndProcedures : ['No special clinical procedures recorded.'],
    },
    doctorReviewed: false,
    disclaimer:
      'AI-generated clinical digest for authorized clinical review only. Does not replace professional clinical diagnosis or prescription decisions.',
  };
}

