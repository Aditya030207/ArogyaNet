import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ArogyaNet Unified Multi-Branch HMS API',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/ai-summary', async (req, res) => {
  try {
    const { patient, visits, prescriptions } = req.body;
    if (!patient) {
      return res.status(400).json({ error: 'Patient data is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Falling back to local clinical synthesis.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert Clinical Data Synthesizer for ArogyaNet, a multi-branch Hospital Management and Electronic Health Record (EHR) System.
Generate a structured, objective, concise medical history summary for the following patient based ONLY on the provided clinical records across hospital branches.

CRITICAL CLINICAL BOUNDARIES:
- Do NOT provide diagnostic judgments, prognoses, or independent medical advice.
- Do NOT prescribe or modify treatments.
- Summarize only documented facts from previous visits, diagnoses, prescriptions, and lab investigations.
- Explicitly flag all recorded allergies.

PATIENT INFORMATION:
- ID: ${patient.id}
- Name: ${patient.fullName}
- Age: ${patient.age}, Gender: ${patient.gender}, Blood Group: ${patient.bloodGroup || 'Unknown'}
- Registered Branch: ${patient.registeredBranchName}
- Chronic Conditions: ${(patient.chronicConditions || []).join(', ') || 'None recorded'}
- Allergies: ${(patient.allergies || []).join(', ') || 'No known allergies'}

DOCUMENTED VISITS ACROSS BRANCHES:
${JSON.stringify(
  (visits || []).map((v: any) => ({
    date: v.visitDate,
    branch: v.branchName,
    doctor: `${v.doctorName} (${v.department})`,
    chiefComplaint: v.chiefComplaint,
    diagnosis: v.diagnosis,
    vitals: v.vitals,
    labReports: v.labReports,
    clinicalNotes: v.clinicalNotes,
  })),
  null,
  2
)}

DOCUMENTED PRESCRIPTION ORDERS:
${JSON.stringify(
  (prescriptions || []).map((p: any) => ({
    id: p.id,
    branch: p.branchName,
    status: p.status,
    issuedAt: p.issuedAt,
    medicines: (p.medicines || []).map((m: any) => `${m.name} (${m.strength}) ${m.frequency}`),
  })),
  null,
  2
)}

Return ONLY a valid JSON object strictly matching this schema:
{
  "summaryText": "Concise paragraph summarizing patient medical narrative across hospital branches",
  "modelUsed": "gemini-3.8-flash",
  "sections": {
    "pastConsultations": ["List of summarized past consultations with branch and date"],
    "chronicConditions": ["List of active chronic conditions"],
    "diagnosesHistory": ["List of past documented diagnoses"],
    "activeAndPastMedications": ["List of medications with strengths and frequencies"],
    "allergiesAndPrecautions": ["List of documented allergies and medical precautions"],
    "keyLabResults": ["Significant laboratory and diagnostic findings"],
    "treatmentsAndProcedures": ["Clinical treatments, orders, or interventions noted"]
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);

    return res.json({
      summaryText: parsed.summaryText,
      modelUsed: 'gemini-3.8-flash',
      sections: parsed.sections,
    });
  } catch (err: any) {
    console.error('Gemini AI summary generation error:', err);
    return res.status(500).json({
      error: 'AI summary failed',
      details: err?.message || 'Internal server error',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[ArogyaNet HMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

