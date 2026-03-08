import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { usePatients } from '../context/PatientContext';
import { Calendar, Clock, User, Plus, Check, X, MoreVertical, DollarSign, AlertCircle, Search } from 'lucide-react';
import { format, addDays, startOfWeek, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  type: string;
  cost: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export function Agenda() {
  const { role } = useRole();
  const { addNotification } = useNotification();
  const { patients, getPatientById } = usePatients();
  const navigate = useNavigate();
  
  // Initialize with some mock appointments linked to the first mock patient if available
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (patients.length > 0 && appointments.length === 0) {
      setAppointments([
        { id: '1', patientId: patients[0].id, patientName: `${patients[0].firstName} ${patients[0].lastName}`, date: addHours(new Date(), 2), type: 'Consulta Inicial', cost: 800, status: 'scheduled' },
        { id: '2', patientId: patients[1]?.id || patients[0].id, patientName: patients[1] ? `${patients[1].firstName} ${patients[1].lastName}` : `${patients[0].firstName} ${patients[0].lastName}`, date: addDays(new Date(), 1), type: 'Seguimiento', cost: 500, status: 'confirmed' },
      ]);
    }
  }, [patients]);

  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'Consulta General',
    cost: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState<{isOpen: boolean, patientId: string, patientName: string}>({ isOpen: false, patientId: '', patientName: '' });

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) return;

    const patient = getPatientById(newAppointment.patientId);
    if (!patient) return;

    const date = new Date(`${newAppointment.date}T${newAppointment.time}`);
    const appointment: Appointment = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      date: date,
      type: newAppointment.type,
      cost: Number(newAppointment.cost) || 0,
      status: 'scheduled'
    };

    setAppointments([...appointments, appointment]);
    addNotification('Nueva Cita Agendada', `Cita para ${appointment.patientName} el ${format(date, 'dd/MM/yyyy HH:mm')}`);
    
    setNewAppointment({ patientId: '', date: '', time: '', type: 'Consulta General', cost: '' });
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

  const handlePatientClick = (patientId: string, patientName: string) => {
    const patient = getPatientById(patientId);
    if (!patient) return;

    // Check if patient has history
    const hasHistory = patient.history.chiefComplaint || patient.history.historyOfPresentIllness || patient.history.pastMedicalHistory.length > 0;

    if (!hasHistory) {
      setHistoryModal({ isOpen: true, patientId, patientName });
    } else {
      navigate(`/patients/${patientId}`);
    }
  };

  const handleCreateHistory = () => {
    navigate(`/patients/${historyModal.patientId}`, { state: { editMode: true, tab: 'overview' } });
    setHistoryModal({ isOpen: false, patientId: '', patientName: '' });
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#215732] focus:border-[#215732] sm:text-sm transition duration-150 ease-in-out"
          placeholder="Buscar cita por paciente o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Calendar View (Simplified) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-[#215732]" />
            Próximas Citas
          </h2>
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors ${apt.status === 'cancelled' ? 'bg-slate-50 opacity-75' : 'bg-white hover:border-[#215732]/50'} border-slate-200`}>
                <div 
                  className="flex items-center space-x-4 mb-4 sm:mb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-lg -ml-2"
                  onClick={() => handlePatientClick(apt.patientId, apt.patientName)}
                >
                  <div className={`p-2 rounded-full ${apt.status === 'cancelled' ? 'bg-slate-200 text-slate-500' : 'bg-[#215732]/10 text-[#215732]'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium hover:text-[#215732] hover:underline ${apt.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{apt.patientName}</p>
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
            {filteredAppointments.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                {searchTerm ? 'No se encontraron citas que coincidan con la búsqueda.' : 'No hay citas programadas.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
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
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border bg-white"
                      value={newAppointment.patientId}
                      onChange={e => setNewAppointment({...newAppointment, patientId: e.target.value})}
                    >
                      <option value="">Seleccione un paciente</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} (HC: {p.mrn})</option>
                      ))}
                    </select>
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

      {/* No History Notification Modal */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" onClick={() => setHistoryModal({ isOpen: false, patientId: '', patientName: '' })}></div>

            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                      Paciente sin Historial Clínico
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">
                        El paciente <strong>{historyModal.patientName}</strong> es nuevo y aún no tiene un historial clínico registrado. ¿Desea agregar su nuevo historial clínico ahora?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#215732] text-base font-medium text-white hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#215732] sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCreateHistory}
                >
                  Agregar Historial
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#215732] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setHistoryModal({ isOpen: false, patientId: '', patientName: '' })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
