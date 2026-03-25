import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { usePatients } from '../context/PatientContext';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { Calendar as CalendarIcon, Clock, User, Plus, Check, X, MoreVertical, DollarSign, AlertCircle, Search, List, CheckCircle2 } from 'lucide-react';
import { format, addDays, startOfWeek, addHours, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Calendar from 'react-calendar';

export function Agenda() {
  const { role } = useRole();
  const { addNotification } = useNotification();
  const { patients, getPatientById, addPatient, isConfigured } = usePatients();
  const { appointments, addAppointment, updateAppointmentStatus, loading } = useAppointments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewPatient, setIsNewPatient] = useState(false);

  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    mrn: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other'
  });

  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'Consulta General',
    cost: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyModal, setHistoryModal] = useState<{isOpen: boolean, patientId: string, patientName: string}>({ isOpen: false, patientId: '', patientName: '' });

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.date || !newAppointment.time) return;
    
    setIsSubmitting(true);
    try {
      let patientId = newAppointment.patientId;
      let patientName = '';

      if (isNewPatient) {
        if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.mrn) {
          addNotification('Error', 'Por favor complete los datos del nuevo paciente.');
          setIsSubmitting(false);
          return;
        }

        // Check if MRN already exists in local state to provide a better error message
        const existingByMrn = patients.find(p => p.mrn === newPatientData.mrn);
        if (existingByMrn) {
          addNotification('Error', `Ya existe un paciente registrado con el MRN ${newPatientData.mrn} (${existingByMrn.lastName}, ${existingByMrn.firstName}). Por favor, use la opción "Seleccionar existente".`);
          setIsSubmitting(false);
          return;
        }

        const createdPatient = await addPatient({
          id: '',
          firstName: newPatientData.firstName,
          lastName: newPatientData.lastName,
          mrn: newPatientData.mrn,
          dateOfBirth: newPatientData.dateOfBirth || new Date().toISOString().split('T')[0],
          gender: newPatientData.gender,
          contact: { phone: '', email: '', emergencyContact: '' },
          history: {
            chiefComplaint: '',
            pastMedicalHistory: [],
            familyHistory: [],
            socialHistory: ''
          },
          medications: [],
          clinicalScales: [],
          imagingStudies: [],
          lastVisit: new Date().toISOString(),
          alerts: []
        });

        if (createdPatient) {
          patientId = createdPatient.id;
          patientName = `${createdPatient.lastName}, ${createdPatient.firstName}`;
        } else {
          throw new Error('Error al crear el paciente');
        }
      } else {
        if (!patientId) {
          setIsSubmitting(false);
          return;
        }
        const patient = getPatientById(patientId);
        if (!patient) {
          setIsSubmitting(false);
          return;
        }
        patientName = `${patient.lastName}, ${patient.firstName}`;
      }

      const date = new Date(`${newAppointment.date}T${newAppointment.time}`);
      
      await addAppointment({
        patientId: patientId,
        patientName: patientName,
        date: date,
        type: newAppointment.type,
        cost: Number(newAppointment.cost) || 0,
        status: 'scheduled'
      });

      addNotification('Nueva Cita Agendada', `Cita para ${patientName} el ${format(date, 'dd/MM/yyyy HH:mm')}`);
      
      // Notify Specialist if current user is Assistant
      if (role === 'assistant') {
        addNotification('Aviso al Especialista', `La asistente ha agendado una nueva cita para ${patientName} el ${format(date, 'dd/MM/yyyy HH:mm')}`, 'info');
      }

      setNewAppointment({ patientId: '', date: '', time: '', type: 'Consulta General', cost: '' });
      setNewPatientData({ firstName: '', lastName: '', mrn: '', dateOfBirth: '', gender: 'male' });
      setIsNewPatient(false);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error registering appointment:', error);
      
      if (error.isLocalSave) {
        addNotification('Guardado Local', error.message);
        setNewAppointment({ patientId: '', date: '', time: '', type: 'Consulta General', cost: '' });
        setNewPatientData({ firstName: '', lastName: '', mrn: '', dateOfBirth: '', gender: 'male' });
        setIsNewPatient(false);
        setIsModalOpen(false);
        return;
      }

      let errorMessage = error.message || 'Error desconocido';
      
      if (errorMessage.includes('patients_mrn_key')) {
        errorMessage = 'Ya existe un paciente con este número de Historia Clínica (MRN).';
      }
      
      if (errorMessage.includes('not find the table')) {
        errorMessage = 'La tabla de citas no existe en la base de datos. Contacte al administrador.';
      }
      
      addNotification('Error', `No se pudo registrar la cita: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateAppointmentStatus(id, status);
      const statusText = status === 'confirmed' ? 'Confirmada' : status === 'cancelled' ? 'Cancelada' : 'Completada';
      addNotification('Estado Actualizado', `La cita ha sido marcada como ${statusText}`);
    } catch (error) {
      addNotification('Error', 'No se pudo actualizar el estado de la cita');
    }
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

  const filteredAppointments = Array.isArray(appointments) ? appointments.filter(apt => 
    (apt.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (apt.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Citas</h1>
          <p className="text-sm text-slate-500">Gestión de citas y horarios.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Base de datos no configurada</span>
            </div>
          )}
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

      {/* View Toggle and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#215732] focus:border-[#215732] sm:text-sm transition duration-150 ease-in-out"
            placeholder="Buscar cita por paciente o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-[#215732] dark:text-green-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-[#215732] dark:text-green-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <Calendar
                  onChange={(val) => setSelectedDate(val as Date)}
                  value={selectedDate}
                  locale="es-ES"
                  className="border-none shadow-none"
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const hasApt = appointments.some(apt => isSameDay(new Date(apt.date), date));
                      return hasApt ? <div className="dot-indicator" /> : null;
                    }
                    return null;
                  }}
                />
              </div>
              
              <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-[#215732]" />
                  Citas para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                <div className="space-y-3">
                  {appointments
                    .filter(apt => isSameDay(new Date(apt.date), selectedDate))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(apt => (
                      <div key={apt.id} className="flex items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex-shrink-0 w-12 text-center">
                          <p className="text-xs font-bold text-[#215732] dark:text-green-400">{format(new Date(apt.date), 'HH:mm')}</p>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{apt.patientName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{apt.type}</p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-green-500' : 
                          apt.status === 'cancelled' ? 'bg-red-500' : 
                          apt.status === 'completed' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                      </div>
                    ))}
                  {appointments.filter(apt => isSameDay(new Date(apt.date), selectedDate)).length === 0 && (
                    <p className="text-xs text-center text-slate-500 py-4 italic">No hay citas para este día.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalle de Citas</h2>
                  <span className="text-sm text-slate-500">{appointments.filter(apt => isSameDay(new Date(apt.date), selectedDate)).length} citas hoy</span>
                </div>
                
                <div className="space-y-4">
                  {appointments
                    .filter(apt => isSameDay(new Date(apt.date), selectedDate))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(apt => (
                      <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-[#215732]/10 flex items-center justify-center text-[#215732] font-bold">
                            {apt.patientName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{apt.patientName}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(apt.date), 'HH:mm')}
                              </span>
                              <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {apt.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                          </span>
                          <div className="flex items-center gap-1">
                            {apt.status === 'scheduled' && (
                              <button 
                                onClick={() => updateStatus(apt.id, 'confirmed')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Confirmar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                              <>
                                <button 
                                  onClick={() => updateStatus(apt.id, 'completed')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Completar"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => updateStatus(apt.id, 'cancelled')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handlePatientClick(apt.patientId, apt.patientName)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Ver Paciente"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {appointments.filter(apt => isSameDay(new Date(apt.date), selectedDate)).length === 0 && (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No hay citas programadas para este día.</p>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 text-[#215732] font-medium hover:underline"
                      >
                        Agendar una nueva cita
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#215732]/10 flex items-center justify-center text-[#215732] text-xs font-bold">
                            {apt.patientName.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{apt.patientName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-white">{format(new Date(apt.date), 'dd/MM/yyyy')}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(apt.date), 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 dark:text-white">{apt.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {apt.status === 'scheduled' && (
                            <button onClick={() => updateStatus(apt.id, 'confirmed')} className="text-green-600 hover:text-green-900">Confirmar</button>
                          )}
                          <button onClick={() => handlePatientClick(apt.patientId, apt.patientName)} className="text-[#215732] hover:text-[#1a4528]">Ver</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        No se encontraron citas que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Paciente</label>
                    <button
                      type="button"
                      onClick={() => setIsNewPatient(!isNewPatient)}
                      className="text-xs font-semibold text-[#215732] hover:underline"
                    >
                      {isNewPatient ? 'Seleccionar existente' : 'Registrar nuevo paciente'}
                    </button>
                  </div>

                  {isNewPatient ? (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500">Nombre(s)</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                            value={newPatientData.firstName}
                            onChange={e => setNewPatientData({...newPatientData, firstName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500">Apellido(s)</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                            value={newPatientData.lastName}
                            onChange={e => setNewPatientData({...newPatientData, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500">Historia Clínica (MRN)</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                            value={newPatientData.mrn}
                            onChange={e => setNewPatientData({...newPatientData, mrn: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500">Género</label>
                          <select
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border bg-white"
                            value={newPatientData.gender}
                            onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})}
                          >
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                            <option value="other">Otro</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-[#215732] focus:ring-[#215732] sm:text-sm p-2 border"
                          value={newPatientData.dateOfBirth}
                          onChange={e => setNewPatientData({...newPatientData, dateOfBirth: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}
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
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Agendar Cita
                      </>
                    )}
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
