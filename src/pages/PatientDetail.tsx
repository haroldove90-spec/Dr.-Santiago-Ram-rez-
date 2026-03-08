import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, Calendar, Phone, Mail, AlertTriangle, Activity, 
  Pill, FileText, ArrowLeft, Clock, Brain 
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'medications' | 'scales'>('overview');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${id}`);
        if (!response.ok) throw new Error('Failed to fetch patient');
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        setError('Error loading patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPatient();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading patient record...</div>;
  if (error || !patient) return <div className="p-8 text-center text-red-500">{error || 'Patient not found'}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/patients" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{patient.lastName}, {patient.firstName}</h1>
          <div className="flex items-center text-sm text-slate-500 space-x-4 mt-1">
            <span className="flex items-center"><User className="w-4 h-4 mr-1" /> MRN: {patient.mrn}</span>
            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> DOB: {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}</span>
            <span className="capitalize">{patient.gender}</span>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex space-x-2">
           {patient.alerts?.map((alert, idx) => (
             <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
               <AlertTriangle className="w-4 h-4 mr-1" />
               {alert}
             </span>
           ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'history', 'medications', 'scales'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab}
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
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-emerald-600" />
                  Current Status
                </h3>
                <div className="prose prose-sm max-w-none text-slate-600">
                  <p><span className="font-medium text-slate-900">Chief Complaint:</span> {patient.history.chiefComplaint}</p>
                  <p className="mt-2"><span className="font-medium text-slate-900">HPI:</span> {patient.history.historyOfPresentIllness}</p>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Clinical Scales
                </h3>
                {patient.clinicalScales && patient.clinicalScales.length > 0 ? (
                  <div className="space-y-4">
                    {patient.clinicalScales.map((scale) => (
                      <div key={scale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{scale.name}</p>
                          <p className="text-xs text-slate-500">{format(new Date(scale.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{scale.score}</span>
                          <p className="text-xs text-slate-500">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No clinical scales recorded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
             <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
               <h3 className="text-lg font-semibold text-slate-900 mb-4">Medical History</h3>
               <div className="space-y-4">
                 <div>
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Past Medical History</h4>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {patient.history.pastMedicalHistory.map((item, i) => <li key={i}>{item}</li>)}
                   </ul>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Family History</h4>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {patient.history.familyHistory.map((item, i) => <li key={i}>{item}</li>)}
                   </ul>
                 </div>
                 <div className="border-t border-slate-100 pt-4">
                   <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Social History</h4>
                   <p className="text-sm text-slate-600">{patient.history.socialHistory}</p>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'medications' && (
            <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                Active Medications
              </h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {patient.medications?.map((med) => (
                      <tr key={med.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{med.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(new Date(med.startDate), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                    {(!patient.medications || patient.medications.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500 italic">No active medications</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-4">Contact Information</h3>
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
                <p className="text-xs text-slate-500 mb-1">Emergency Contact</p>
                <p className="text-sm font-medium text-slate-900">{patient.contact.emergencyContact}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-4">Upcoming Appointments</h3>
            {patient.nextAppointment ? (
              <div className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">Follow-up Visit</p>
                  <p className="text-xs text-emerald-700">{format(new Date(patient.nextAppointment), 'MMM d, yyyy - h:mm a')}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No upcoming appointments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
