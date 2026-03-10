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
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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

      if (error) throw error;

      const formatted: Appointment[] = (data || []).map(a => ({
        id: a.id,
        patientId: a.patient_id,
        patientName: a.patient_name,
        date: new Date(a.date),
        type: a.type,
        cost: a.cost,
        status: a.status as any
      }));

      setAppointments(formatted);
    } catch (e) {
      console.error('Error fetching appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isConfigured]);

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: apt.patientId,
          patient_name: apt.patientName,
          date: apt.date.toISOString(),
          type: apt.type,
          cost: apt.cost,
          status: apt.status
        }]);

      if (error) throw error;
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

      if (error) throw error;
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
