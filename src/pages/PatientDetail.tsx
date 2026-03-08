import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  User, Calendar, Phone, Mail, AlertTriangle, Activity, 
  Pill, FileText, ArrowLeft, Clock, Brain, Edit2, Save, X, Download 
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotification } from '@/context/NotificationContext';
import { usePatients } from '@/context/PatientContext';
import { useRole } from '@/context/RoleContext';
import jsPDF from 'jspdf';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getPatientById, updatePatient } = usePatients();
  const { role } = useRole();
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
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    familyHistory: '',
    socialHistory: '',
    surgicalHistory: '',
    allergies: '',
    generalExam: '',
    mentalStatus: '',
    cranialNerves: '',
    motorSystem: '',
    reflexes: '',
    sensorySystem: '',
    coordinationAndGait: '',
    meningealSigns: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    if (id) {
      const foundPatient = getPatientById(id);
      if (foundPatient) {
        setPatient(foundPatient);
        setEditForm({
          firstName: foundPatient.firstName,
          lastName: foundPatient.lastName,
          dateOfBirth: foundPatient.dateOfBirth,
          gender: foundPatient.gender,
          phone: foundPatient.contact.phone,
          email: foundPatient.contact.email,
          emergencyContact: foundPatient.contact.emergencyContact,
          chiefComplaint: foundPatient.history.chiefComplaint,
          historyOfPresentIllness: foundPatient.history.historyOfPresentIllness,
          pastMedicalHistory: Array.isArray(foundPatient.history.pastMedicalHistory) ? foundPatient.history.pastMedicalHistory.join('\n') : foundPatient.history.pastMedicalHistory || '',
          familyHistory: Array.isArray(foundPatient.history.familyHistory) ? foundPatient.history.familyHistory.join('\n') : foundPatient.history.familyHistory || '',
          socialHistory: foundPatient.history.socialHistory,
          surgicalHistory: foundPatient.history.surgicalHistory || '',
          allergies: foundPatient.history.allergies || '',
          generalExam: foundPatient.history.generalExam || '',
          mentalStatus: foundPatient.history.neurologicalExam?.mentalStatus || '',
          cranialNerves: foundPatient.history.neurologicalExam?.cranialNerves || '',
          motorSystem: foundPatient.history.neurologicalExam?.motorSystem || '',
          reflexes: foundPatient.history.neurologicalExam?.reflexes || '',
          sensorySystem: foundPatient.history.neurologicalExam?.sensorySystem || '',
          coordinationAndGait: foundPatient.history.neurologicalExam?.coordinationAndGait || '',
          meningealSigns: foundPatient.history.neurologicalExam?.meningealSigns || '',
          assessment: foundPatient.history.assessment || '',
          plan: foundPatient.history.plan || ''
        });

        // Check for edit mode in location state
        if (location.state && (location.state as any).editMode) {
          setIsEditing(true);
          // If specifically asked to edit history, switch to that tab
          if ((location.state as any).tab) {
            setActiveTab((location.state as any).tab);
          }
        }
      } else {
        setError('Paciente no encontrado');
      }
      setLoading(false);
    }
  }, [id, getPatientById, location.state]);

  const handleSave = () => {
    if (!patient || !id) return;
    
    const updatedFields: Partial<Patient> = {
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
        historyOfPresentIllness: editForm.historyOfPresentIllness,
        pastMedicalHistory: editForm.pastMedicalHistory.split('\n').filter(item => item.trim() !== ''),
        familyHistory: editForm.familyHistory.split('\n').filter(item => item.trim() !== ''),
        socialHistory: editForm.socialHistory,
        surgicalHistory: editForm.surgicalHistory,
        allergies: editForm.allergies,
        generalExam: editForm.generalExam,
        neurologicalExam: {
          mentalStatus: editForm.mentalStatus,
          cranialNerves: editForm.cranialNerves,
          motorSystem: editForm.motorSystem,
          reflexes: editForm.reflexes,
          sensorySystem: editForm.sensorySystem,
          coordinationAndGait: editForm.coordinationAndGait,
          meningealSigns: editForm.meningealSigns,
        },
        assessment: editForm.assessment,
        plan: editForm.plan
      }
    };

    updatePatient(id, updatedFields);
    setPatient({ ...patient, ...updatedFields });
    setIsEditing(false);
    addNotification('Información Actualizada', 'Los datos del paciente han sido guardados correctamente.');
  };

  const exportToPDF = () => {
    if (!patient) return;

    const doc = new jsPDF('p', 'pt', 'letter');
    const margin = 40;
    let yPos = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial Médico - Dr. Noe Santiago', margin, yPos);
    yPos += 30;

    // Patient Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paciente: ${patient.lastName}, ${patient.firstName}`, margin, yPos);
    yPos += 20;
    doc.text(`Historia Clínica: ${patient.mrn}`, margin, yPos);
    yPos += 20;
    doc.text(`Fecha de Nacimiento: ${format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')} (${patient.gender})`, margin, yPos);
    yPos += 30;

    // Line separator
    doc.setLineWidth(1);
    doc.line(margin, yPos, 612 - margin, yPos);
    yPos += 20;

    // Motivo de Consulta
    const checkPageBreak = (lines: number) => {
      if (yPos + (lines * 15) > 750) {
        doc.addPage();
        yPos = margin;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.text('Motivo de Consulta:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitComplaint = doc.splitTextToSize(patient.history.chiefComplaint || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitComplaint.length);
    doc.text(splitComplaint, margin, yPos);
    yPos += splitComplaint.length * 15 + 10;

    // Enfermedad Actual
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Enfermedad Actual:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitIllness = doc.splitTextToSize(patient.history.historyOfPresentIllness || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitIllness.length);
    doc.text(splitIllness, margin, yPos);
    yPos += splitIllness.length * 15 + 10;

    // Antecedentes Patológicos
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Antecedentes Patológicos:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const pmh = Array.isArray(patient.history.pastMedicalHistory) ? patient.history.pastMedicalHistory.join(', ') : patient.history.pastMedicalHistory || 'No registrados';
    const splitPmh = doc.splitTextToSize(pmh, 612 - 2 * margin);
    checkPageBreak(splitPmh.length);
    doc.text(splitPmh, margin, yPos);
    yPos += splitPmh.length * 15 + 10;

    // Antecedentes Quirúrgicos
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Antecedentes Quirúrgicos/Traumáticos:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitSurg = doc.splitTextToSize(patient.history.surgicalHistory || 'No registrados', 612 - 2 * margin);
    checkPageBreak(splitSurg.length);
    doc.text(splitSurg, margin, yPos);
    yPos += splitSurg.length * 15 + 10;

    // Antecedentes Familiares
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Antecedentes Familiares:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const fh = Array.isArray(patient.history.familyHistory) ? patient.history.familyHistory.join(', ') : patient.history.familyHistory || 'No registrados';
    const splitFh = doc.splitTextToSize(fh, 612 - 2 * margin);
    checkPageBreak(splitFh.length);
    doc.text(splitFh, margin, yPos);
    yPos += splitFh.length * 15 + 10;

    // Antecedentes Sociales y Alergias
    checkPageBreak(3);
    doc.setFont('helvetica', 'bold');
    doc.text('Alergias:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.history.allergies || 'Ninguna conocida', margin + 60, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Antecedentes Sociales:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitSh = doc.splitTextToSize(patient.history.socialHistory || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitSh.length);
    doc.text(splitSh, margin, yPos);
    yPos += splitSh.length * 15 + 10;

    // Examen Físico General
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Examen Físico General:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitGe = doc.splitTextToSize(patient.history.generalExam || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitGe.length);
    doc.text(splitGe, margin, yPos);
    yPos += splitGe.length * 15 + 10;

    // Examen Neurológico
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Examen Neurológico:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    
    const neuroExam = patient.history.neurologicalExam || {};
    const neuroFields = [
      { label: 'Estado Mental:', value: neuroExam.mentalStatus },
      { label: 'Pares Craneales:', value: neuroExam.cranialNerves },
      { label: 'Sistema Motor:', value: neuroExam.motorSystem },
      { label: 'Reflejos:', value: neuroExam.reflexes },
      { label: 'Sistema Sensitivo:', value: neuroExam.sensorySystem },
      { label: 'Coordinación y Marcha:', value: neuroExam.coordinationAndGait },
      { label: 'Signos Meníngeos:', value: neuroExam.meningealSigns }
    ];

    neuroFields.forEach(field => {
      if (field.value) {
        checkPageBreak(2);
        doc.setFont('helvetica', 'bold');
        doc.text(field.label, margin, yPos);
        yPos += 15;
        doc.setFont('helvetica', 'normal');
        const splitField = doc.splitTextToSize(field.value, 612 - 2 * margin);
        checkPageBreak(splitField.length);
        doc.text(splitField, margin, yPos);
        yPos += splitField.length * 15 + 5;
      }
    });
    yPos += 5;

    // Impresión Diagnóstica
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Impresión Diagnóstica:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitAssessment = doc.splitTextToSize(patient.history.assessment || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitAssessment.length);
    doc.text(splitAssessment, margin, yPos);
    yPos += splitAssessment.length * 15 + 10;

    // Plan de Manejo
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Plan de Manejo:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const splitPlan = doc.splitTextToSize(patient.history.plan || 'No registrado', 612 - 2 * margin);
    checkPageBreak(splitPlan.length);
    doc.text(splitPlan, margin, yPos);

    // Save PDF
    doc.save(`Historial_${patient.lastName}_${patient.firstName}.pdf`);
    addNotification('PDF Exportado', 'El historial médico se ha descargado correctamente.');
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
          
          {role === 'doctor' && (
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar PDF
            </button>
          )}

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
             <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200 space-y-8">
               
               {/* Antecedentes */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Antecedentes</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Patológicos</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={3}
                         value={editForm.pastMedicalHistory}
                         onChange={(e) => setEditForm({...editForm, pastMedicalHistory: e.target.value})}
                         placeholder="Ej. Hipertensión, Diabetes..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.pastMedicalHistory || <span className="italic text-slate-400">Sin antecedentes registrados</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Quirúrgicos / Traumáticos</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={3}
                         value={editForm.surgicalHistory}
                         onChange={(e) => setEditForm({...editForm, surgicalHistory: e.target.value})}
                         placeholder="Cirugías previas, TCE..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.surgicalHistory || <span className="italic text-slate-400">Sin antecedentes registrados</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Familiares</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={3}
                         value={editForm.familyHistory}
                         onChange={(e) => setEditForm({...editForm, familyHistory: e.target.value})}
                         placeholder="Enfermedades hereditarias..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.familyHistory || <span className="italic text-slate-400">Sin antecedentes registrados</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Tóxico-Alérgicos / Sociales</h4>
                     {isEditing ? (
                       <div className="space-y-3">
                         <input
                           type="text"
                           className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                           value={editForm.allergies}
                           onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                           placeholder="Alergias..."
                         />
                         <textarea
                           className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                           rows={2}
                           value={editForm.socialHistory}
                           onChange={(e) => setEditForm({...editForm, socialHistory: e.target.value})}
                           placeholder="Tabaquismo, alcohol, drogas..."
                         />
                       </div>
                     ) : (
                       <div className="text-sm text-slate-600 space-y-1">
                         <p><strong>Alergias:</strong> {patient.history.allergies || 'Ninguna conocida'}</p>
                         <p><strong>Hábitos:</strong> {patient.history.socialHistory || 'No registrados'}</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* Examen Físico y Neurológico */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Examen Físico y Neurológico</h3>
                 <div className="space-y-6">
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Examen General</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.generalExam}
                         onChange={(e) => setEditForm({...editForm, generalExam: e.target.value})}
                         placeholder="Signos vitales, aspecto general..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.generalExam || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <div className="col-span-1 md:col-span-2">
                       <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Examen Neurológico</h4>
                     </div>
                     
                     {[
                       { key: 'mentalStatus', label: 'Estado Mental' },
                       { key: 'cranialNerves', label: 'Pares Craneales' },
                       { key: 'motorSystem', label: 'Sistema Motor' },
                       { key: 'reflexes', label: 'Reflejos' },
                       { key: 'sensorySystem', label: 'Sistema Sensitivo' },
                       { key: 'coordinationAndGait', label: 'Coordinación y Marcha' },
                       { key: 'meningealSigns', label: 'Signos Meníngeos' },
                     ].map((field) => (
                       <div key={field.key} className={field.key === 'mentalStatus' ? 'col-span-1 md:col-span-2' : ''}>
                         <label className="block text-xs font-medium text-slate-700 mb-1">{field.label}</label>
                         {isEditing ? (
                           <textarea
                             className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                             rows={2}
                             value={(editForm as any)[field.key]}
                             onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})}
                           />
                         ) : (
                           <p className="text-sm text-slate-600 bg-white p-2 rounded border border-slate-200 min-h-[2.5rem]">
                             {(patient.history.neurologicalExam as any)?.[field.key] || <span className="italic text-slate-400">Normal / No evaluado</span>}
                           </p>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Diagnóstico y Plan */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Diagnóstico y Plan</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Impresión Diagnóstica</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={4}
                         value={editForm.assessment}
                         onChange={(e) => setEditForm({...editForm, assessment: e.target.value})}
                         placeholder="Diagnósticos sindromáticos, topográficos, etiológicos..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.assessment || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Plan de Manejo</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={4}
                         value={editForm.plan}
                         onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                         placeholder="Estudios solicitados, tratamiento, recomendaciones..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.plan || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
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
