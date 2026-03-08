import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types/patient';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updatedPatient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: '1985-04-12',
    gender: 'female',
    mrn: 'HC-2024-001',
    lastVisit: '2024-03-01',
    contact: { phone: '555-0101', email: 'maria@email.com', emergencyContact: 'Juan Garcia' },
    history: {
      chiefComplaint: 'Dolor de cabeza crónico',
      historyOfPresentIllness: 'Paciente refiere cefalea de 3 meses de evolución...',
      pastMedicalHistory: ['Hipertensión'],
      familyHistory: ['Madre con migraña'],
      socialHistory: 'No fuma, bebe ocasionalmente.'
    },
    medications: [],
    clinicalScales: [],
    imagingStudies: [],
    alerts: []
  },
  {
    id: '2',
    firstName: 'Jose',
    lastName: 'Rodriguez',
    dateOfBirth: '1978-09-23',
    gender: 'male',
    mrn: 'HC-2024-002',
    lastVisit: '2024-02-15',
    contact: { phone: '555-0102', email: 'jose@email.com', emergencyContact: 'Ana Rodriguez' },
    history: {
      chiefComplaint: 'Pérdida de memoria a corto plazo',
      historyOfPresentIllness: 'Paciente acude por olvidos frecuentes...',
      pastMedicalHistory: [],
      familyHistory: [],
      socialHistory: ''
    },
    medications: [],
    clinicalScales: [],
    imagingStudies: [],
    alerts: []
  }
];

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('neuroflow_patients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing patients from local storage', e);
        return MOCK_PATIENTS;
      }
    }
    return MOCK_PATIENTS;
  });

  useEffect(() => {
    localStorage.setItem('neuroflow_patients', JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
  };

  const updatePatient = (id: string, updatedFields: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  return (
    <PatientContext.Provider value={{ patients, addPatient, updatePatient, deletePatient, getPatientById }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
