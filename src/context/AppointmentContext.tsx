import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { usePatients } from './PatientContext';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  type: string;
  cost: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  usingLocalStorage: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  const { isConfigured } = usePatients();

  const fetchAppointments = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        // If table doesn't exist, fallback to local storage
        if (error.message.includes('not find the table') || error.code === '42P01') {
          console.warn('Appointments table not found in Supabase, falling back to local storage');
          setUsingLocalStorage(true);
          const localApts = localStorage.getItem('local_appointments');
          if (localApts) {
            const parsed = JSON.parse(localApts).map((a: any) => ({
              ...a,
              date: new Date(a.date)
            }));
            setAppointments(parsed);
          }
          return;
        }
        throw error;
      }

      const formatted: Appointment[] = (data || []).map(a => ({
        id: a.id,
        patientId: a.patient_id,
        patientName: a.patient_name,
        date: new Date(a.date),
        type: a.type,
        cost: a.cost,
        status: a.status as any
      }));

      // Merge with local appointments if any (optional, but let's keep it simple)
      setAppointments(formatted);
      setUsingLocalStorage(false);
    } catch (e) {
      console.error('Error fetching appointments:', e);
      // Fallback on any error
      setUsingLocalStorage(true);
      const localApts = localStorage.getItem('local_appointments');
      if (localApts) {
        setAppointments(JSON.parse(localApts).map((a: any) => ({ ...a, date: new Date(a.date) })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isConfigured]);

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: apt.patientId,
          patient_name: apt.patientName,
          date: apt.date.toISOString(),
          type: apt.type,
          cost: apt.cost,
          status: apt.status
        }])
        .select();

      if (error) {
        // If table doesn't exist, save locally but still notify the user about the DB issue
        if (error.message.includes('not find the table') || error.code === '42P01') {
          const newLocalApt: Appointment = {
            ...apt,
            id: `local-${Date.now()}`
          };
          const localApts = JSON.parse(localStorage.getItem('local_appointments') || '[]');
          const updatedLocal = [...localApts, newLocalApt];
          localStorage.setItem('local_appointments', JSON.stringify(updatedLocal));
          
          setAppointments(prev => [...prev, newLocalApt].sort((a, b) => a.date.getTime() - b.date.getTime()));
          
          // We still throw a specific error so the UI can show a warning, 
          // but we've saved it locally.
          const customError = new Error('La cita se guardó LOCALMENTE porque la tabla "appointments" no existe en su base de datos Supabase. Por favor, cree la tabla para sincronizar.');
          (customError as any).isLocalSave = true;
          throw customError;
        }
        throw error;
      }
      
      await fetchAppointments();
    } catch (e) {
      console.error('Error adding appointment:', e);
      throw e;
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) {
        // If table doesn't exist, update locally
        if (error.message.includes('not find the table') || error.code === '42P01' || id.startsWith('local-')) {
          const localApts = JSON.parse(localStorage.getItem('local_appointments') || '[]');
          const updatedLocal = localApts.map((a: any) => a.id === id ? { ...a, status } : a);
          localStorage.setItem('local_appointments', JSON.stringify(updatedLocal));
          
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
          return;
        }
        throw error;
      }
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error('Error updating appointment status:', e);
      throw e;
    }
  };

  return (
    <AppointmentContext.Provider value={{ 
      appointments, 
      loading, 
      usingLocalStorage,
      addAppointment, 
      updateAppointmentStatus,
      refreshAppointments: fetchAppointments 
    }}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}
