import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, Calendar, ChevronRight, X, Save } from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotification } from '@/context/NotificationContext';

// Mock data for fallback
const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: '1985-04-12',
    gender: 'female',
    mrn: 'HC-2024-001',
    lastVisit: '2024-03-01',
    status: 'active'
  },
  {
    id: '2',
    firstName: 'Jose',
    lastName: 'Rodriguez',
    dateOfBirth: '1978-09-23',
    gender: 'male',
    mrn: 'HC-2024-002',
    lastVisit: '2024-02-15',
    status: 'active'
  }
];

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotification();

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    mrn: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Try to fetch from API, fallback to mock
        const response = await fetch('/api/patients');
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.log('Using mock data for patients');
        setPatients(MOCK_PATIENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patient: Patient = {
      id: Date.now().toString(),
      firstName: newPatient.firstName,
      lastName: newPatient.lastName,
      dateOfBirth: newPatient.dateOfBirth,
      gender: newPatient.gender as 'male' | 'female' | 'other',
      mrn: newPatient.mrn || `HC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      lastVisit: new Date().toISOString(),
      status: 'active'
    };

    setPatients([patient, ...patients]);
    addNotification('Paciente Registrado', `${patient.firstName} ${patient.lastName} ha sido registrado exitosamente.`);
    setIsModalOpen(false);
    setNewPatient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      mrn: '',
      email: '',
      phone: ''
    });
  };

  const filteredPatients = patients.filter(patient => 
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Pacientes</h1>
          <p className="text-sm text-slate-500">Ver y administrar expedientes de pacientes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Agregar Paciente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#215732] focus:border-[#215732] sm:text-sm transition duration-150 ease-in-out"
          placeholder="Buscar por nombre o HC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patient List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando pacientes...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No se encontraron pacientes.</div>
        ) : (
          <ul role="list" className="divide-y divide-slate-200">
            {filteredPatients.map((patient) => (
              <li key={patient.id} className="hover:bg-slate-50 transition-colors">
                <Link to={`/patients/${patient.id}`} className="block px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {patient.lastName}, {patient.firstName}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center mt-0.5">
                          <span className="font-mono mr-2">{patient.mrn}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                          <span>{format(new Date(patient.dateOfBirth), 'd MMM, yyyy', { locale: es })}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                          <span className="capitalize">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs text-slate-500 mb-1">Última Visita</p>
                        <div className="flex items-center text-sm text-slate-700">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {format(new Date(patient.lastVisit), 'd MMM, yyyy', { locale: es })}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Registrar Nuevo Paciente
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Nombre</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                        value={newPatient.firstName}
                        onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Apellido</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                        value={newPatient.lastName}
                        onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                        value={newPatient.dateOfBirth}
                        onChange={e => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Género</label>
                      <select
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                        value={newPatient.gender}
                        onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Historia Clínica (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Generado automáticamente si se deja vacío"
                      className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                      value={newPatient.mrn}
                      onChange={e => setNewPatient({...newPatient, mrn: e.target.value})}
                    />
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#215732] text-base font-medium text-white hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Paciente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
