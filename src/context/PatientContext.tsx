import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types/patient';
import { supabase } from '../lib/supabase';
import { subDays } from 'date-fns';

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  isConfigured: boolean;
  addPatient: (patient: Patient) => Promise<Patient | null>;
  updatePatient: (id: string, updatedPatient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatientById: (id: string) => Patient | undefined;
  refreshPatients: () => Promise<void>;
  saveDictationResult: (patientId: string, data: any) => Promise<void>;
  addClinicalScale: (patientId: string, scaleData: any) => Promise<void>;
  fetchPatientDetails: (id: string) => Promise<Patient | null>;
  fetchRecentScalesCount: (days?: number) => Promise<number>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  const checkConfig = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isMissing = !url || url.includes('placeholder') || !key || key.includes('placeholder');
    setIsConfigured(!isMissing);
    return !isMissing;
  };

  const fetchPatients = async () => {
    if (!checkConfig()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('last_visit', { ascending: false });

      if (error) {
        if (error.message.includes('not find the table') || error.code === '42P01') {
          console.warn('Patients table not found, falling back to local storage');
          const localPatients = localStorage.getItem('local_patients');
          if (localPatients) {
            setPatients(JSON.parse(localPatients));
          }
          return;
        }
        throw error;
      }

      const formattedPatients: Patient[] = (data || []).map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.date_of_birth,
        gender: p.gender as any,
        mrn: p.mrn,
        lastVisit: p.last_visit,
        nextAppointment: p.next_appointment,
        contact: p.contact,
        history: p.history,
        alerts: p.alerts || [],
        medications: [], // Will be fetched separately if needed or joined
        clinicalScales: [],
        imagingStudies: []
      }));

      setPatients(formattedPatients);
    } catch (e) {
      console.error('Error fetching patients from Supabase', e);
      const localPatients = localStorage.getItem('local_patients');
      if (localPatients) {
        setPatients(JSON.parse(localPatients));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfig();
    fetchPatients();
  }, []);

  const addPatient = async (patient: Patient): Promise<Patient | null> => {
    if (!checkConfig()) {
      throw new Error('Configuración de base de datos (Supabase) faltante o incorrecta.');
    }
    try {
      console.log('Attempting to add patient:', patient);
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          mrn: patient.mrn,
          first_name: patient.firstName,
          last_name: patient.lastName,
          date_of_birth: patient.dateOfBirth,
          gender: patient.gender,
          contact: patient.contact,
          history: patient.history,
          last_visit: patient.lastVisit,
          next_appointment: patient.nextAppointment,
          alerts: patient.alerts
        }])
        .select();

      if (error) {
        if (error.message.includes('not find the table') || error.code === '42P01') {
          const newLocalPatient: Patient = {
            ...patient,
            id: `local-p-${Date.now()}`
          };
          const localPatients = JSON.parse(localStorage.getItem('local_patients') || '[]');
          const updatedLocal = [...localPatients, newLocalPatient];
          localStorage.setItem('local_patients', JSON.stringify(updatedLocal));
          
          setPatients(prev => [newLocalPatient, ...prev]);
          
          const customError = new Error('El paciente se guardó LOCALMENTE porque la tabla "patients" no existe. Por favor, cree la tabla para sincronizar.');
          (customError as any).isLocalSave = true;
          throw customError;
        }
        throw error;
      }
      if (data && data[0]) {
        await fetchPatients();
        const p = data[0];
        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          gender: p.gender as any,
          mrn: p.mrn,
          lastVisit: p.last_visit,
          nextAppointment: p.next_appointment,
          contact: p.contact,
          history: p.history,
          alerts: p.alerts || [],
          medications: [],
          clinicalScales: [],
          imagingStudies: []
        };
      }
      return null;
    } catch (e) {
      console.error('Error adding patient to Supabase', e);
      throw e;
    }
  };

  const updatePatient = async (id: string, updatedFields: Partial<Patient>) => {
    try {
      const updateData: any = {};
      if (updatedFields.firstName) updateData.first_name = updatedFields.firstName;
      if (updatedFields.lastName) updateData.last_name = updatedFields.lastName;
      if (updatedFields.dateOfBirth) updateData.date_of_birth = updatedFields.dateOfBirth;
      if (updatedFields.gender) updateData.gender = updatedFields.gender;
      if (updatedFields.mrn) updateData.mrn = updatedFields.mrn;
      if (updatedFields.lastVisit) updateData.last_visit = updatedFields.lastVisit;
      if (updatedFields.nextAppointment) updateData.next_appointment = updatedFields.nextAppointment;
      if (updatedFields.contact) updateData.contact = updatedFields.contact;
      if (updatedFields.history) updateData.history = updatedFields.history;
      if (updatedFields.alerts) updateData.alerts = updatedFields.alerts;

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchPatients();
    } catch (e) {
      console.error('Error updating patient in Supabase', e);
      throw e;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Error deleting patient from Supabase', e);
      throw e;
    }
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  const saveDictationResult = async (patientId: string, data: any) => {
    try {
      const patient = getPatientById(patientId);
      if (!patient) throw new Error('Patient not found');

      // 1. Update History and Alerts
      const updatedHistory = {
        ...patient.history,
        chiefComplaint: data.chiefComplaint || patient.history.chiefComplaint,
        historyOfPresentIllness: data.historyOfPresentIllness || patient.history.historyOfPresentIllness
      };

      const existingAlerts = patient.alerts || [];
      const newAlerts = [...new Set([...existingAlerts, ...(data.suggestedAlerts || [])])];

      const { error: patientError } = await supabase
        .from('patients')
        .update({
          history: updatedHistory,
          alerts: newAlerts
        })
        .eq('id', patientId);

      if (patientError) throw patientError;

      // 2. Add Medications
      if (data.medications && Array.isArray(data.medications)) {
        const medsToInsert = data.medications.map((m: any) => ({
          patient_id: patientId,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency || 'Daily',
          start_date: new Date().toISOString().split('T')[0],
          active: true
        }));

        const { error: medsError } = await supabase
          .from('medications')
          .insert(medsToInsert);

        if (medsError) throw medsError;
      }

      // 3. Add Clinical Scales
      if (data.clinicalScales && Array.isArray(data.clinicalScales)) {
        const scalesToInsert = data.clinicalScales.map((s: any) => ({
          patient_id: patientId,
          name: s.name,
          score: s.score,
          notes: s.notes,
          date: new Date().toISOString()
        }));

        const { error: scalesError } = await supabase
          .from('clinical_scales')
          .insert(scalesToInsert);

        if (scalesError) throw scalesError;
      }

      await fetchPatients();
    } catch (e) {
      console.error('Error saving dictation result to Supabase', e);
      throw e;
    }
  };

  const addClinicalScale = async (patientId: string, scaleData: any) => {
    try {
      const { error } = await supabase
        .from('clinical_scales')
        .insert([{
          patient_id: patientId,
          name: scaleData.name,
          score: scaleData.score,
          date: scaleData.date,
          notes: scaleData.notes,
          details: scaleData.details
        }]);

      if (error) throw error;
      await fetchPatients();
    } catch (e) {
      console.error('Error adding clinical scale to Supabase', e);
      throw e;
    }
  };

  const fetchPatientDetails = async (id: string): Promise<Patient | null> => {
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;

      const { data: medsData, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', id);

      if (medsError) throw medsError;

      const { data: scalesData, error: scalesError } = await supabase
        .from('clinical_scales')
        .select('*')
        .eq('patient_id', id);

      if (scalesError) throw scalesError;

      return {
        id: patientData.id,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        dateOfBirth: patientData.date_of_birth,
        gender: patientData.gender,
        mrn: patientData.mrn,
        lastVisit: patientData.last_visit,
        nextAppointment: patientData.next_appointment,
        contact: patientData.contact,
        history: patientData.history,
        alerts: patientData.alerts || [],
        medications: (medsData || []).map(m => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          startDate: m.start_date,
          endDate: m.end_date,
          active: m.active
        })),
        clinicalScales: (scalesData || []).map(s => ({
          id: s.id,
          name: s.name,
          score: s.score,
          date: s.date,
          notes: s.notes,
          details: s.details
        })),
        imagingStudies: []
      };
    } catch (e) {
      console.error('Error fetching patient details from Supabase', e);
      return null;
    }
  };

  const fetchRecentScalesCount = async (days: number = 7): Promise<number> => {
    try {
      const dateLimit = subDays(new Date(), days).toISOString();
      const { count, error } = await supabase
        .from('clinical_scales')
        .select('*', { count: 'exact', head: true })
        .gte('date', dateLimit);

      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.error('Error fetching recent scales count from Supabase', e);
      return 0;
    }
  };

  return (
    <PatientContext.Provider value={{ 
      patients, 
      loading, 
      isConfigured,
      addPatient, 
      updatePatient, 
      deletePatient, 
      getPatientById,
      refreshPatients: fetchPatients,
      saveDictationResult,
      addClinicalScale,
      fetchPatientDetails,
      fetchRecentScalesCount
    }}>
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
