import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('neuroflow.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mrn TEXT UNIQUE NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    dateOfBirth TEXT NOT NULL,
    gender TEXT NOT NULL,
    contact TEXT NOT NULL, -- JSON
    history TEXT NOT NULL, -- JSON
    lastVisit TEXT NOT NULL,
    nextAppointment TEXT,
    alerts TEXT -- JSON array
  );

  CREATE TABLE IF NOT EXISTS clinical_scales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER NOT NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    details TEXT, -- JSON
    FOREIGN KEY (patientId) REFERENCES patients (id)
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT,
    active INTEGER DEFAULT 1, -- boolean
    FOREIGN KEY (patientId) REFERENCES patients (id)
  );
`);

export default db;
