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
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getPatientById, fetchPatientDetails, updatePatient } = usePatients();
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
    advanceDirectives: '',
    chiefComplaint: '',
    symptomOnset: '',
    evolution: '',
    currentDeficit: '',
    pastMedicalHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    allergies: '',
    socialHistory: '',
    generalExam: '',
    gcsOcular: 4,
    gcsVerbal: '5',
    gcsMotor: 6,
    cranialNerves: '',
    motorSystem: '',
    reflexes: '',
    sensorySystem: '',
    coordinationAndGait: '',
    meningealSigns: '',
    imagingType: [] as string[],
    imagingDate: '',
    imagingFindings: '',
    imagingComparison: '',
    dicomUrl: '',
    therapeuticDecision: '',
    proposedProcedure: '',
    surgicalRisk: '',
    outcomeScale: '',
    evolutionNotes: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;
      setLoading(true);
      
      const foundPatient = await fetchPatientDetails(id);
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
          advanceDirectives: foundPatient.history.advanceDirectives || '',
          chiefComplaint: foundPatient.history.chiefComplaint,
          symptomOnset: foundPatient.history.symptomOnset || '',
          evolution: foundPatient.history.evolution || '',
          currentDeficit: foundPatient.history.currentDeficit || '',
          pastMedicalHistory: Array.isArray(foundPatient.history.pastMedicalHistory) ? foundPatient.history.pastMedicalHistory.join('\n') : foundPatient.history.pastMedicalHistory || '',
          familyHistory: Array.isArray(foundPatient.history.familyHistory) ? foundPatient.history.familyHistory.join('\n') : foundPatient.history.familyHistory || '',
          socialHistory: foundPatient.history.socialHistory,
          surgicalHistory: foundPatient.history.surgicalHistory || '',
          allergies: foundPatient.history.allergies || '',
          generalExam: foundPatient.history.generalExam || '',
          gcsOcular: foundPatient.history.neurologicalExam?.gcs?.ocular || 4,
          gcsVerbal: foundPatient.history.neurologicalExam?.gcs?.verbal || '5',
          gcsMotor: foundPatient.history.neurologicalExam?.gcs?.motor || 6,
          cranialNerves: foundPatient.history.neurologicalExam?.cranialNerves || '',
          motorSystem: foundPatient.history.neurologicalExam?.motorSystem || '',
          reflexes: foundPatient.history.neurologicalExam?.reflexes || '',
          sensorySystem: foundPatient.history.neurologicalExam?.sensorySystem || '',
          coordinationAndGait: foundPatient.history.neurologicalExam?.coordinationAndGait || '',
          meningealSigns: foundPatient.history.neurologicalExam?.meningealSigns || '',
          imagingType: foundPatient.history.imagingType || [],
          imagingDate: foundPatient.history.imagingDate || '',
          imagingFindings: foundPatient.history.imagingFindings || '',
          imagingComparison: foundPatient.history.imagingComparison || '',
          dicomUrl: foundPatient.history.dicomUrl || '',
          therapeuticDecision: foundPatient.history.therapeuticDecision || '',
          proposedProcedure: foundPatient.history.proposedProcedure || '',
          surgicalRisk: foundPatient.history.surgicalRisk || '',
          outcomeScale: foundPatient.history.outcomeScale || '',
          evolutionNotes: foundPatient.history.evolutionNotes || '',
          assessment: foundPatient.history.assessment || '',
          plan: foundPatient.history.plan || ''
        });

        // Check for edit mode in location state
        if (location.state && (location.state as any).editMode) {
          setIsEditing(true);
          if ((location.state as any).tab) {
            setActiveTab((location.state as any).tab);
          }
        }
      } else {
        setError('Paciente no encontrado');
      }
      setLoading(false);
    };

    loadPatient();
  }, [id, fetchPatientDetails, location.state]);

  const handleSave = async () => {
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
        advanceDirectives: editForm.advanceDirectives,
        chiefComplaint: editForm.chiefComplaint,
        symptomOnset: editForm.symptomOnset,
        evolution: editForm.evolution as any,
        currentDeficit: editForm.currentDeficit,
        pastMedicalHistory: editForm.pastMedicalHistory.split('\n').filter(item => item.trim() !== ''),
        familyHistory: editForm.familyHistory.split('\n').filter(item => item.trim() !== ''),
        socialHistory: editForm.socialHistory,
        surgicalHistory: editForm.surgicalHistory,
        allergies: editForm.allergies,
        generalExam: editForm.generalExam,
        neurologicalExam: {
          gcs: {
            ocular: Number(editForm.gcsOcular),
            verbal: editForm.gcsVerbal,
            motor: Number(editForm.gcsMotor),
            total: (Number(editForm.gcsOcular) + (editForm.gcsVerbal === '1T' ? 1 : Number(editForm.gcsVerbal)) + Number(editForm.gcsMotor)) + (editForm.gcsVerbal === '1T' ? 'T' : '')
          },
          cranialNerves: editForm.cranialNerves,
          motorSystem: editForm.motorSystem,
          reflexes: editForm.reflexes,
          sensorySystem: editForm.sensorySystem,
          coordinationAndGait: editForm.coordinationAndGait,
          meningealSigns: editForm.meningealSigns as any,
        },
        imagingType: editForm.imagingType,
        imagingDate: editForm.imagingDate,
        imagingFindings: editForm.imagingFindings,
        imagingComparison: editForm.imagingComparison,
        dicomUrl: editForm.dicomUrl,
        therapeuticDecision: editForm.therapeuticDecision as any,
        proposedProcedure: editForm.proposedProcedure,
        surgicalRisk: editForm.surgicalRisk as any,
        outcomeScale: editForm.outcomeScale,
        evolutionNotes: editForm.evolutionNotes,
        assessment: editForm.assessment,
        plan: editForm.plan
      }
    };

    try {
      await updatePatient(id, updatedFields);
      setPatient({ ...patient, ...updatedFields });
      setIsEditing(false);
      addNotification('Información Actualizada', 'Los datos del paciente han sido guardados correctamente.');
    } catch (error) {
      addNotification('Error', 'No se pudo actualizar la información del paciente.');
    }
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

    // Enfermedad Actual / Evolución
    checkPageBreak(2);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolución y Déficit Actual:', margin, yPos);
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const evolutionText = `Inicio: ${patient.history.symptomOnset ? format(new Date(patient.history.symptomOnset), 'dd/MM/yyyy') : 'N/A'} | Tipo: ${patient.history.evolution || 'N/A'}\nDéficit: ${patient.history.currentDeficit || 'No registrado'}`;
    const splitIllness = doc.splitTextToSize(evolutionText, 612 - 2 * margin);
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
    const gcsText = neuroExam.gcs ? `Ocular: ${neuroExam.gcs.ocular}, Verbal: ${neuroExam.gcs.verbal}, Motora: ${neuroExam.gcs.motor} (Total: ${neuroExam.gcs.total})` : 'No evaluado';
    
    const neuroFields = [
      { label: 'Escala de Glasgow:', value: gcsText },
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

    // Planificación Quirúrgica
    if (patient.history.therapeuticDecision || patient.history.proposedProcedure) {
      checkPageBreak(3);
      doc.setFont('helvetica', 'bold');
      doc.text('Planificación Quirúrgica:', margin, yPos);
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      const surgPlan = `Decisión: ${patient.history.therapeuticDecision || 'N/A'} | Riesgo ASA: ${patient.history.surgicalRisk || 'N/A'}\nProcedimiento: ${patient.history.proposedProcedure || 'N/A'}`;
      const splitSurgPlan = doc.splitTextToSize(surgPlan, 612 - 2 * margin);
      checkPageBreak(splitSurgPlan.length);
      doc.text(splitSurgPlan, margin, yPos);
      yPos += splitSurgPlan.length * 15 + 10;
    }

    // Save PDF
    doc.save(`Historial_${patient.lastName}_${patient.firstName}.pdf`);
    addNotification('PDF Exportado', 'El historial médico se ha descargado correctamente.');
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando expediente...</div>;
  if (error || !patient) return <div className="p-8 text-center text-red-500">{error || 'Paciente no encontrado'}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start md:items-center space-x-2 sm:space-x-4">
          <Link to="/patients" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 shrink-0 mt-1 md:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className="border border-slate-300 rounded px-2 py-1 text-lg font-bold w-full sm:w-auto"
                  placeholder="Nombre"
                />
                <input 
                  type="text" 
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className="border border-slate-300 rounded px-2 py-1 text-lg font-bold w-full sm:w-auto"
                  placeholder="Apellidos"
                />
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{patient.lastName}, {patient.firstName}</h1>
            )}
            <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-500 gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center whitespace-nowrap"><User className="w-4 h-4 mr-1" /> HC: {patient.mrn}</span>
              <span className="flex items-center whitespace-nowrap"><Calendar className="w-4 h-4 mr-1" /> Nac: {format(new Date(patient.dateOfBirth), 'd MMM, yyyy', { locale: es })}</span>
              <span className="capitalize whitespace-nowrap">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {patient.alerts && patient.alerts.length > 0 && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto md:mr-2">
               {patient.alerts.map((alert, idx) => (
                 <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                   <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                   {alert}
                 </span>
               ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {role === 'doctor' && (
              <button
                onClick={exportToPDF}
                className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none flex-1 md:flex-none"
              >
                <Download className="w-4 h-4 mr-2" /> Exportar PDF
              </button>
            )}

            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none flex-1 md:flex-none"
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none flex-1 md:flex-none"
                >
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setActiveTab('history');
                  setIsEditing(true);
                }}
                className={cn(
                  "inline-flex items-center justify-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none flex-1 md:flex-none",
                  (!patient.history.chiefComplaint && !patient.history.assessment)
                    ? "border-transparent text-white bg-[#215732] hover:bg-[#1a4528]"
                    : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                )}
              >
                <Edit2 className="w-4 h-4 mr-2" /> 
                {(!patient.history.chiefComplaint && !patient.history.assessment) ? 'Registrar Historial' : 'Editar Expediente'}
              </button>
            )}
          </div>
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
               
               {/* 1. Perfil del Paciente */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">1. Perfil del Paciente</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Directivas Anticipadas (Voluntad Anticipada)</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.advanceDirectives}
                         onChange={(e) => setEditForm({...editForm, advanceDirectives: e.target.value})}
                         placeholder="Instrucciones previas, RCP, intubación..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.advanceDirectives || <span className="italic text-slate-400">No registradas</span>}</p>
                     )}
                   </div>
                 </div>
               </div>

               {/* 2. Anamnesis Neurológica */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">2. Anamnesis Neurológica</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Motivo de Consulta</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.chiefComplaint}
                         onChange={(e) => setEditForm({...editForm, chiefComplaint: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.chiefComplaint || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Fecha de Inicio de Síntomas</h4>
                     {isEditing ? (
                       <input
                         type="date"
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.symptomOnset}
                         onChange={(e) => setEditForm({...editForm, symptomOnset: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.symptomOnset ? format(new Date(patient.history.symptomOnset), 'd MMM, yyyy', { locale: es }) : <span className="italic text-slate-400">No registrada</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Evolución del Cuadro</h4>
                     {isEditing ? (
                       <select
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.evolution}
                         onChange={(e) => setEditForm({...editForm, evolution: e.target.value})}
                       >
                         <option value="">Seleccionar...</option>
                         <option value="Aguda">Aguda</option>
                         <option value="Subaguda">Subaguda</option>
                         <option value="Crónica">Crónica</option>
                         <option value="Fluctuante">Fluctuante</option>
                       </select>
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.evolution || <span className="italic text-slate-400">No registrada</span>}</p>
                     )}
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Déficit Neurológico Actual</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.currentDeficit}
                         onChange={(e) => setEditForm({...editForm, currentDeficit: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.currentDeficit || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Patológicos</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={3}
                         value={editForm.pastMedicalHistory}
                         onChange={(e) => setEditForm({...editForm, pastMedicalHistory: e.target.value})}
                         placeholder="Ej. HTA, DM2, Epilepsia..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.pastMedicalHistory || <span className="italic text-slate-400">Sin antecedentes</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Quirúrgicos</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={3}
                         value={editForm.surgicalHistory}
                         onChange={(e) => setEditForm({...editForm, surgicalHistory: e.target.value})}
                         placeholder="Cirugías previas, TCE..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.surgicalHistory || <span className="italic text-slate-400">Sin antecedentes</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Antecedentes Familiares</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.familyHistory}
                         onChange={(e) => setEditForm({...editForm, familyHistory: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.familyHistory || <span className="italic text-slate-400">Sin antecedentes</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Tóxico-Alérgicos / Sociales</h4>
                     {isEditing ? (
                       <div className="space-y-2">
                         <input
                           type="text"
                           className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                           value={editForm.allergies}
                           onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                           placeholder="Alergias..."
                         />
                         <textarea
                           className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                           rows={1}
                           value={editForm.socialHistory}
                           onChange={(e) => setEditForm({...editForm, socialHistory: e.target.value})}
                           placeholder="Tabaquismo, alcohol..."
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

               {/* 3. Examen Físico Neurológico */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">3. Examen Físico Neurológico</h3>
                 <div className="space-y-6">
                   
                   {/* Escala de Glasgow */}
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Escala de Coma de Glasgow (GCS)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                         <label className="block text-xs font-medium text-slate-700 mb-1">Apertura Ocular (O)</label>
                         {isEditing ? (
                           <select 
                             className="w-full border border-slate-300 rounded p-2 text-sm"
                             value={editForm.gcsOcular}
                             onChange={(e) => setEditForm({...editForm, gcsOcular: Number(e.target.value)})}
                           >
                             {[1,2,3,4].map(v => <option key={`o-${v}`} value={v}>{v}</option>)}
                           </select>
                         ) : (
                           <p className="text-sm font-medium">{patient.history.neurologicalExam?.gcs?.ocular || 4}</p>
                         )}
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-slate-700 mb-1">Respuesta Verbal (V)</label>
                         {isEditing ? (
                           <select 
                             className="w-full border border-slate-300 rounded p-2 text-sm"
                             value={editForm.gcsVerbal}
                             onChange={(e) => setEditForm({...editForm, gcsVerbal: e.target.value})}
                           >
                             {[1,2,3,4,5].map(v => <option key={`v-${v}`} value={v}>{v}</option>)}
                             <option value="1T">1T (Intubado)</option>
                           </select>
                         ) : (
                           <p className="text-sm font-medium">{patient.history.neurologicalExam?.gcs?.verbal || 5}</p>
                         )}
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-slate-700 mb-1">Respuesta Motora (M)</label>
                         {isEditing ? (
                           <select 
                             className="w-full border border-slate-300 rounded p-2 text-sm"
                             value={editForm.gcsMotor}
                             onChange={(e) => setEditForm({...editForm, gcsMotor: Number(e.target.value)})}
                           >
                             {[1,2,3,4,5,6].map(v => <option key={`m-${v}`} value={v}>{v}</option>)}
                           </select>
                         ) : (
                           <p className="text-sm font-medium">{patient.history.neurologicalExam?.gcs?.motor || 6}</p>
                         )}
                       </div>
                       <div className="bg-white border border-slate-200 rounded p-2 flex flex-col justify-center items-center">
                         <label className="block text-xs font-medium text-slate-500 mb-1">Puntuación Total</label>
                         <p className="text-xl font-bold text-[#215732]">
                           {isEditing 
                             ? `${Number(editForm.gcsOcular) + (editForm.gcsVerbal === '1T' ? 1 : Number(editForm.gcsVerbal)) + Number(editForm.gcsMotor)}${editForm.gcsVerbal === '1T' ? 'T' : ''}`
                             : patient.history.neurologicalExam?.gcs?.total || 15}
                         </p>
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                       { key: 'cranialNerves', label: 'Pares Craneales (I-XII)' },
                       { key: 'motorSystem', label: 'Fuerza Motora (Escala Daniels)' },
                       { key: 'reflexes', label: 'Reflejos Osteotendinosos' },
                       { key: 'sensorySystem', label: 'Sistema Sensitivo' },
                       { key: 'coordinationAndGait', label: 'Coordinación y Marcha' },
                     ].map((field) => (
                       <div key={field.key}>
                         <label className="block text-xs font-medium text-slate-700 mb-1">{field.label}</label>
                         {isEditing ? (
                           <textarea
                             className="block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                             rows={2}
                             value={(editForm as any)[field.key]}
                             onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})}
                           />
                         ) : (
                           <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 min-h-[2.5rem]">
                             {(patient.history.neurologicalExam as any)?.[field.key] || <span className="italic text-slate-400">Normal / No evaluado</span>}
                           </p>
                         )}
                       </div>
                     ))}
                     <div>
                       <label className="block text-xs font-medium text-slate-700 mb-1">Signos Meníngeos</label>
                       {isEditing ? (
                         <select 
                           className="w-full border border-slate-300 rounded p-2 text-sm"
                           value={editForm.meningealSigns}
                           onChange={(e) => setEditForm({...editForm, meningealSigns: e.target.value})}
                         >
                           <option value="">Seleccionar...</option>
                           <option value="Ausentes">Ausentes</option>
                           <option value="Presentes">Presentes</option>
                           <option value="Dudosos">Dudosos</option>
                         </select>
                       ) : (
                         <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 min-h-[2.5rem]">
                           {patient.history.neurologicalExam?.meningealSigns || <span className="italic text-slate-400">No evaluado</span>}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               </div>

               {/* 4. Módulo de Imagenología */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">4. Módulo de Imagenología</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Tipo de Estudio</h4>
                     {isEditing ? (
                       <input
                         type="text"
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.imagingType.join(', ')}
                         onChange={(e) => setEditForm({...editForm, imagingType: e.target.value.split(',').map(s => s.trim())})}
                         placeholder="TAC Simple, RM Cerebral..."
                       />
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.imagingType?.join(', ') || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Fecha del Estudio</h4>
                     {isEditing ? (
                       <input
                         type="date"
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.imagingDate}
                         onChange={(e) => setEditForm({...editForm, imagingDate: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.imagingDate ? format(new Date(patient.history.imagingDate), 'd MMM, yyyy', { locale: es }) : <span className="italic text-slate-400">No registrada</span>}</p>
                     )}
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Hallazgos Clave</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.imagingFindings}
                         onChange={(e) => setEditForm({...editForm, imagingFindings: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.imagingFindings || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Comparativa con previos</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={2}
                         value={editForm.imagingComparison}
                         onChange={(e) => setEditForm({...editForm, imagingComparison: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.imagingComparison || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                 </div>
               </div>

               {/* 5. Planificación Quirúrgica y Seguimiento */}
               <div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">5. Planificación Quirúrgica y Seguimiento</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Decisión Terapéutica</h4>
                     {isEditing ? (
                       <select
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.therapeuticDecision}
                         onChange={(e) => setEditForm({...editForm, therapeuticDecision: e.target.value})}
                       >
                         <option value="">Seleccionar...</option>
                         <option value="Tratamiento Médico">Tratamiento Médico</option>
                         <option value="Cirugía Electiva">Cirugía Electiva</option>
                         <option value="Cirugía de Urgencia">Cirugía de Urgencia</option>
                         <option value="Paliativo">Paliativo</option>
                       </select>
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.therapeuticDecision || <span className="italic text-slate-400">No registrada</span>}</p>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Riesgo Quirúrgico (ASA)</h4>
                     {isEditing ? (
                       <select
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.surgicalRisk}
                         onChange={(e) => setEditForm({...editForm, surgicalRisk: e.target.value})}
                       >
                         <option value="">Seleccionar...</option>
                         <option value="I">I</option>
                         <option value="II">II</option>
                         <option value="III">III</option>
                         <option value="IV">IV</option>
                         <option value="V">V</option>
                         <option value="VI">VI</option>
                       </select>
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.surgicalRisk || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Procedimiento Quirúrgico Propuesto</h4>
                     {isEditing ? (
                       <input
                         type="text"
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         value={editForm.proposedProcedure}
                         onChange={(e) => setEditForm({...editForm, proposedProcedure: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600">{patient.history.proposedProcedure || <span className="italic text-slate-400">No registrado</span>}</p>
                     )}
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-2">Notas de Evolución Postoperatoria</h4>
                     {isEditing ? (
                       <textarea
                         className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                         rows={4}
                         value={editForm.evolutionNotes}
                         onChange={(e) => setEditForm({...editForm, evolutionNotes: e.target.value})}
                       />
                     ) : (
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.history.evolutionNotes || <span className="italic text-slate-400">No registrado</span>}</p>
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
