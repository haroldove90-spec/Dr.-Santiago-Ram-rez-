import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { Calendar, Clock, User, Plus, Check } from 'lucide-react';
import { format, addDays, startOfWeek, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export function Agenda() {
  const { role } = useRole();
  const { addNotification } = useNotification();
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'Maria Garcia', date: addHours(new Date(), 2), type: 'Consulta Inicial', status: 'scheduled' },
    { id: '2', patientName: 'Jose Rodriguez', date: addDays(new Date(), 1), type: 'Seguimiento', status: 'scheduled' },
  ]);

  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    date: '',
    time: '',
    type: 'Consulta General'
  });

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientName || !newAppointment.date || !newAppointment.time) return;

    const date = new Date(`${newAppointment.date}T${newAppointment.time}`);
    const appointment: Appointment = {
      id: Date.now().toString(),
      patientName: newAppointment.patientName,
      date: date,
      type: newAppointment.type,
      status: 'scheduled'
    };

    setAppointments([...appointments, appointment]);
    addNotification('Nueva Cita Agendada', `Cita para ${appointment.patientName} el ${format(date, 'dd/MM/yyyy HH:mm')}`);
    
    setNewAppointment({ patientName: '', date: '', time: '', type: 'Consulta General' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Citas</h1>
          <p className="text-sm text-slate-500">Gestión de citas y horarios.</p>
        </div>
        {role === 'assistant' && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Modo Asistente Activo
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View (Simplified) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Próximas Citas
          </h2>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-green-200 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{apt.patientName}</p>
                    <p className="text-sm text-slate-500">{apt.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900 flex items-center justify-end">
                    <Clock className="h-4 w-4 mr-1 text-slate-400" />
                    {format(apt.date, 'HH:mm')}
                  </p>
                  <p className="text-sm text-slate-500 capitalize">
                    {format(apt.date, 'EEEE d MMM', { locale: es })}
                  </p>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-slate-500 text-center py-8">No hay citas programadas.</p>
            )}
          </div>
        </div>

        {/* Add Appointment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-green-600" />
            Nueva Cita
          </h2>
          <form onSubmit={handleAddAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Paciente</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={newAppointment.patientName}
                onChange={e => setNewAppointment({...newAppointment, patientName: e.target.value})}
                placeholder="Nombre del paciente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Fecha</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                  value={newAppointment.date}
                  onChange={e => setNewAppointment({...newAppointment, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Hora</label>
                <input
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                  value={newAppointment.time}
                  onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo</label>
              <select
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={newAppointment.type}
                onChange={e => setNewAppointment({...newAppointment, type: e.target.value})}
              >
                <option>Consulta General</option>
                <option>Seguimiento</option>
                <option>Urgencia</option>
                <option>Cirugía</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Check className="h-4 w-4 mr-2" />
              Agendar Cita
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
