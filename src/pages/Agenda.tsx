import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { Calendar, Clock, User, Plus, Check, X, MoreVertical, DollarSign } from 'lucide-react';
import { format, addDays, startOfWeek, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
  type: string;
  cost: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export function Agenda() {
  const { role } = useRole();
  const { addNotification } = useNotification();
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'Maria Garcia', date: addHours(new Date(), 2), type: 'Consulta Inicial', cost: 800, status: 'scheduled' },
    { id: '2', patientName: 'Jose Rodriguez', date: addDays(new Date(), 1), type: 'Seguimiento', cost: 500, status: 'confirmed' },
  ]);

  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    date: '',
    time: '',
    type: 'Consulta General',
    cost: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientName || !newAppointment.date || !newAppointment.time) return;

    const date = new Date(`${newAppointment.date}T${newAppointment.time}`);
    const appointment: Appointment = {
      id: Date.now().toString(),
      patientName: newAppointment.patientName,
      date: date,
      type: newAppointment.type,
      cost: Number(newAppointment.cost) || 0,
      status: 'scheduled'
    };

    setAppointments([...appointments, appointment]);
    addNotification('Nueva Cita Agendada', `Cita para ${appointment.patientName} el ${format(date, 'dd/MM/yyyy HH:mm')}`);
    
    setNewAppointment({ patientName: '', date: '', time: '', type: 'Consulta General', cost: '' });
    setIsModalOpen(false);
  };

  const updateStatus = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status } : apt));
    const statusText = status === 'confirmed' ? 'Confirmada' : status === 'cancelled' ? 'Cancelada' : 'Completada';
    addNotification('Estado Actualizado', `La cita ha sido marcada como ${statusText}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return 'Programada';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Citas</h1>
          <p className="text-sm text-slate-500">Gestión de citas y horarios.</p>
        </div>
        <div className="flex items-center gap-3">
          {role === 'assistant' && (
            <div className="bg-[#215732]/10 text-[#215732] px-3 py-1 rounded-full text-sm font-medium">
              Modo Asistente Activo
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Calendar View (Simplified) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-[#215732]" />
            Próximas Citas
          </h2>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors ${apt.status === 'cancelled' ? 'bg-slate-50 opacity-75' : 'bg-white hover:border-[#215732]/50'} border-slate-200`}>
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className={`p-2 rounded-full ${apt.status === 'cancelled' ? 'bg-slate-200 text-slate-500' : 'bg-[#215732]/10 text-[#215732]'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${apt.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{apt.patientName}</p>
                    <p className="text-sm text-slate-500">{apt.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right mr-4 flex flex-col items-end">
                    <p className="font-medium text-slate-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-slate-400" />
                      ${apt.cost}
                    </p>
                    <p className="font-medium text-slate-900 flex items-center justify-end">
                      <Clock className="h-4 w-4 mr-1 text-slate-400" />
                      {format(apt.date, 'HH:mm')}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">
                      {format(apt.date, 'EEEE d MMM', { locale: es })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                    
                    {apt.status === 'scheduled' && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Confirmar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-slate-500 text-center py-8">No hay citas programadas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Nueva Cita
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleAddAppointment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Paciente</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
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
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                        value={newAppointment.date}
                        onChange={e => setNewAppointment({...newAppointment, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Hora</label>
                      <input
                        type="time"
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                        value={newAppointment.time}
                        onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Tipo</label>
                      <select
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                        value={newAppointment.type}
                        onChange={e => setNewAppointment({...newAppointment, type: e.target.value})}
                      >
                        <option>Consulta General</option>
                        <option>Seguimiento</option>
                        <option>Urgencia</option>
                        <option>Cirugía</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Costo (MXN)</label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          className="block w-full rounded-md border-slate-300 pl-7 focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                          placeholder="0.00"
                          value={newAppointment.cost}
                          onChange={e => setNewAppointment({...newAppointment, cost: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Agendar Cita
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
