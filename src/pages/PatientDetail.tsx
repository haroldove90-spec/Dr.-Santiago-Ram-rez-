import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, Calendar, Phone, Mail, AlertTriangle, Activity, 
  Pill, FileText, ArrowLeft, Clock, Brain, Edit2, Save, X 
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotification } from '@/context/NotificationContext';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'medications' | 'scales'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const { addNotification } = useNotification();

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    emergencyContact: '',
    chiefComplaint: '',
    historyOfPresentIllness: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${id}`);
        if (!response.ok) throw new Error('Failed to fetch patient');
        const data = await response.json();
        setPatient(data);
        setEditForm({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          phone: data.contact.phone,
          email: data.contact.email,
          emergencyContact: data.contact.emergencyContact,
          chiefComplaint: data.history.chiefComplaint,
          historyOfPresentIllness: data.history.historyOfPresentIllness
        });
      } catch (err) {
        setError('Error loading patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPatient();
  }, [id]);

  const handleSave = () => {
    if (!patient) return;
    
    const updatedPatient = {
      ...patient,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      dateOfBirth: editForm.dateOfBirth,
      gender: editForm.gender as any,
      contact: {
        ...patient.contact,
        phone: editForm.phone,
        email: editForm.email,
        emergencyContact: editForm.emergencyContact
      },
      history: {
        ...patient.history,
        chiefComplaint: editForm.chiefComplaint,
        historyOfPresentIllness: editForm.historyOfPresentIllness
      }
    };

    setPatient(updatedPatient);
    setIsEditing(false);
    addNotification('Información Actualizada', 'Los datos del paciente han sido guardados correctamente.');
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando expediente...</div>;
  if (error || !patient) return <div className="p-8 text-center text-red-500">{error || 'Paciente no encontrado'}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/patients" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className="border border-slate-300 rounded px-2 py-1 text-lg font-bold"
                />
                <input 
                  type="text" 
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className="border border-slate-300 rounded px-2 py-1 text-lg font-bold"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">{patient.lastName}, {patient.firstName}</h1>
            )}
            <div className="flex items-center text-sm text-slate-500 space-x-4 mt-1">
              <span className="flex items-center"><User className="w-4 h-4 mr-1" /> HC: {patient.mrn}</span>
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Nac: {format(new Date(patient.dateOfBirth), 'd MMM, yyyy', { locale: es })}</span>
              <span className="capitalize">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex space-x-2 mr-4">
             {patient.alerts?.map((alert, idx) => (
               <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                 <AlertTriangle className="w-4 h-4 mr-1" />
                 {alert}
               </span>
             ))}
          </div>
          
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
              >
                <X className="w-4 h-4 mr-2" /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
            >
              <Edit2 className="w-4 h-4 mr-2" /> Editar Información
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'history', label: 'Historial' },
            { id: 'medications', label: 'Medicación' },
            { id: 'scales', label: 'Escalas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#215732] text-[#215732]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-[#215732]" />
                    Estado Actual
                  </h3>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Motivo de Consulta</label>
                      <textarea 
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                        rows={2}
                        value={editForm.chiefComplaint}
                        onChange={(e) => setEditForm({...editForm, chiefComplaint: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Enfermedad Actual</label>
                      <textarea 
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                        rows={4}
                        value={editForm.historyOfPresentIllness}
                        onChange={(e) => setEditForm({...editForm, historyOfPresentIllness: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-slate-600">
                    <p><span className="font-medium text-slate-900">Motivo de Consulta:</span> {patient.history.chiefComplaint}</p>
                    <p className="mt-2"><span className="font-medium text-slate-900">Enfermedad Actual:</span> {patient.history.historyOfPresentIllness}</p>
                  </div>
                )}
              </div>

              <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  Escalas Clínicas Recientes
                </h3>
                {patient.clinicalScales && patient.clinicalScales.length > 0 ? (
                  <div className="space-y-4">
                    {patient.clinicalScales.map((scale) => (
                      <div key={scale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{scale.name}</p>
                          <p className="text-xs text-slate-500">{format(new Date(scale.date), 'd MMM, yyyy', { locale: es })}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{scale.score}</span>
                          <p className="text-xs text-slate-500">Puntuación</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No hay escalas registradas.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
             <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
               <h3 className="text-lg font-semibold text-slate-900 mb-4">Historial Médico</h3>
               <div className="space-y-4">
                 <div>
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Patológicos</h4>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {patient.history.pastMedicalHistory.map((item, i) => <li key={i}>{item}</li>)}
                   </ul>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Familiares</h4>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {patient.history.familyHistory.map((item, i) => <li key={i}>{item}</li>)}
                   </ul>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Sociales</h4>
                   <p className="text-sm text-slate-600">{patient.history.socialHistory}</p>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'medications' && (
            <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                Medicación Activa
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Frecuencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inicio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {patient.medications?.map((med) => (
                      <tr key={med.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{med.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(new Date(med.startDate), 'd MMM, yyyy', { locale: es })}</td>
                      </tr>
                    ))}
                    {(!patient.medications || patient.medications.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500 italic">Sin medicación activa</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scales' && (
            <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Historial de Escalas
              </h3>
              {patient.clinicalScales && patient.clinicalScales.length > 0 ? (
                <div className="space-y-4">
                  {patient.clinicalScales.map((scale) => (
                    <div key={scale.id} className="border border-slate-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-slate-900">{scale.name}</p>
                        <span className="text-sm text-slate-500">{format(new Date(scale.date), 'd MMM, yyyy h:mm a', { locale: es })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">{scale.notes || 'Sin notas'}</p>
                        <div className="bg-slate-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-bold text-slate-900">Puntuación: {scale.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No hay escalas registradas.</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-4">Información de Contacto</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Teléfono</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Email</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-xs text-slate-500">Contacto de Emergencia</label>
                  <input 
                    type="text" 
                    value={editForm.emergencyContact}
                    onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                  {patient.contact.phone}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {patient.contact.email}
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Contacto de Emergencia</p>
                  <p className="text-sm font-medium text-slate-900">{patient.contact.emergencyContact}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-4">Próximas Citas</h3>
            {patient.nextAppointment ? (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Visita de Seguimiento</p>
                  <p className="text-xs text-green-700">{format(new Date(patient.nextAppointment), 'd MMM, yyyy - h:mm a', { locale: es })}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No hay citas programadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
