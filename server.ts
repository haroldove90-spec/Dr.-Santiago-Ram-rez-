import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/db.js';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Get all patients
  app.get('/api/patients', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM patients ORDER BY lastVisit DESC');
      const patients = stmt.all();
      // Parse JSON fields
      const parsedPatients = patients.map((p: any) => ({
        ...p,
        contact: JSON.parse(p.contact),
        history: JSON.parse(p.history),
        alerts: JSON.parse(p.alerts || '[]')
      }));
      res.json(parsedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  // Create patient
  app.post('/api/patients', (req, res) => {
    try {
      const { mrn, firstName, lastName, dateOfBirth, gender, contact, history, lastVisit, alerts } = req.body;
      const stmt = db.prepare(`
        INSERT INTO patients (mrn, firstName, lastName, dateOfBirth, gender, contact, history, lastVisit, alerts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        mrn,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        JSON.stringify(contact),
        JSON.stringify(history),
        lastVisit,
        JSON.stringify(alerts || [])
      );
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  });

  // Get patient details
  app.get('/api/patients/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const patientStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
      const patient = patientStmt.get(id) as any;

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const medsStmt = db.prepare('SELECT * FROM medications WHERE patientId = ?');
      const medications = medsStmt.all(id);

      const scalesStmt = db.prepare('SELECT * FROM clinical_scales WHERE patientId = ?');
      const scales = scalesStmt.all(id);

      // Parse JSON fields
      const parsedPatient = {
        ...patient,
        contact: JSON.parse(patient.contact),
        history: JSON.parse(patient.history),
        alerts: JSON.parse(patient.alerts || '[]'),
        medications: medications.map((m: any) => ({ ...m, active: Boolean(m.active) })),
        clinicalScales: scales.map((s: any) => ({ ...s, details: JSON.parse(s.details || '{}') })),
        imagingStudies: [] // Placeholder as we don't have a table yet
      };

      res.json(parsedPatient);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      res.status(500).json({ error: 'Failed to fetch patient details' });
    }
  });

  // Process Dictation with Gemini
  app.post('/api/dictation/process', async (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-2.5-flash";

      const prompt = `
        You are a medical assistant. Extract structured data from the following clinical dictation.
        Return ONLY a JSON object with the following structure (do not include markdown formatting):
        {
          "chiefComplaint": "string",
          "historyOfPresentIllness": "string",
          "medications": [{"name": "string", "dosage": "string", "frequency": "string", "active": true}],
          "suggestedAlerts": ["string"],
          "clinicalScales": [{"name": "string", "score": number, "notes": "string"}]
        }

        Dictation: "${transcript}"
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text();
      // Clean up markdown code blocks if present
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const structuredData = JSON.parse(jsonStr);

      res.json(structuredData);

    } catch (error) {
      console.error('Error processing dictation:', error);
      res.status(500).json({ error: 'Failed to process dictation' });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
      const criticalAlerts = db.prepare("SELECT COUNT(*) as count FROM patients WHERE alerts LIKE '%High Stroke Risk%'").get() as { count: number };
      const recentScales = db.prepare('SELECT COUNT(*) as count FROM clinical_scales WHERE date >= date("now", "-7 days")').get() as { count: number };
      
      // Get recent patients
      const recentPatients = db.prepare('SELECT id, firstName, lastName, mrn, lastVisit, alerts FROM patients ORDER BY lastVisit DESC LIMIT 5').all();
      const parsedRecent = recentPatients.map((p: any) => ({
        ...p,
        alerts: JSON.parse(p.alerts || '[]')
      }));

      res.json({
        totalPatients: totalPatients.count,
        criticalAlerts: criticalAlerts.count,
        recentScales: recentScales.count,
        recentPatients: parsedRecent
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Save Clinical Scale
  app.post('/api/scales', (req, res) => {
    try {
      const { patientId, name, score, date, notes, details } = req.body;
      const stmt = db.prepare(`
        INSERT INTO clinical_scales (patientId, name, score, date, notes, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(patientId, name, score, date, notes, JSON.stringify(details || {}));
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error('Error saving scale:', error);
      res.status(500).json({ error: 'Failed to save scale' });
    }
  });

  // Update Patient History (from Dictation)
  app.post('/api/patients/:id/history', (req, res) => {
    try {
      const { id } = req.params;
      const { history, medications, alerts } = req.body;

      // Transaction to update multiple tables
      const updateTransaction = db.transaction(() => {
        // 1. Update History
        if (history) {
          const currentHistory = db.prepare('SELECT history FROM patients WHERE id = ?').get(id) as { history: string };
          const newHistory = { ...JSON.parse(currentHistory.history), ...history };
          db.prepare('UPDATE patients SET history = ? WHERE id = ?').run(JSON.stringify(newHistory), id);
        }

        // 2. Add Medications
        if (medications && Array.isArray(medications)) {
          const insertMed = db.prepare(`
            INSERT INTO medications (patientId, name, dosage, frequency, startDate, active)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const today = new Date().toISOString().split('T')[0];
          for (const med of medications) {
            insertMed.run(id, med.name, med.dosage, med.frequency || 'Daily', today, 1);
          }
        }

        // 3. Update Alerts
        if (alerts && Array.isArray(alerts)) {
          const currentAlerts = db.prepare('SELECT alerts FROM patients WHERE id = ?').get(id) as { alerts: string };
          const existingAlerts = JSON.parse(currentAlerts.alerts || '[]');
          const newAlerts = [...new Set([...existingAlerts, ...alerts])]; // Unique
          db.prepare('UPDATE patients SET alerts = ? WHERE id = ?').run(JSON.stringify(newAlerts), id);
        }
      });

      updateTransaction();
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating patient history:', error);
      res.status(500).json({ error: 'Failed to update patient history' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if built)
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
