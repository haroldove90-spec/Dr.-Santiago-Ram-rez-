import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { FileText, Plus, Printer, Search, User, Pill, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Prescription {
  id: string;
  patientName: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  notes: string;
}

export function Prescriptions() {
  const { role } = useRole();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Mock data
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: '1',
      patientName: 'Harold Anguiano',
      date: new Date().toISOString(),
      medications: [
        { name: 'Aspirina', dosage: '100mg', frequency: 'Cada 24 horas', duration: '30 días' },
        { name: 'Atorvastatina', dosage: '40mg', frequency: 'Cada 24 horas', duration: '30 días' }
      ],
      notes: 'Tomar después de la cena.'
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      date: new Date().toISOString(),
      medications: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Cada 8 horas', duration: '3 días' },
        { name: 'Ibuprofeno', dosage: '400mg', frequency: 'Cada 12 horas', duration: '5 días' }
      ],
      notes: 'Tomar con alimentos.'
    },
    {
      id: '3',
      patientName: 'Jose Rodriguez',
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      medications: [
        { name: 'Amoxicilina', dosage: '875mg', frequency: 'Cada 12 horas', duration: '7 días' }
      ],
      notes: 'Completar el tratamiento antibiótico.'
    }
  ]);

  const [newPrescription, setNewPrescription] = useState({
    patientName: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: ''
  });

  const handleAddMedication = () => {
    setNewPrescription({
      ...newPrescription,
      medications: [...newPrescription.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updatedMedications = [...newPrescription.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setNewPrescription({ ...newPrescription, medications: updatedMedications });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prescription: Prescription = {
      id: Date.now().toString(),
      patientName: newPrescription.patientName,
      date: new Date().toISOString(),
      medications: newPrescription.medications,
      notes: newPrescription.notes
    };

    setPrescriptions([prescription, ...prescriptions]);
    addNotification('Receta Creada', `Receta generada para ${prescription.patientName}`);
    setIsCreating(false);
    setNewPrescription({
      patientName: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      notes: ''
    });
  };

  const handlePrint = (prescription: Prescription) => {
    addNotification('Generando PDF', `Preparando receta de ${prescription.patientName}...`);
    
    const doc = new jsPDF('p', 'pt', 'letter');
    const margin = 40;
    let yPos = margin;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 87, 50); // #215732
    doc.setFont('helvetica', 'bold');
    doc.text('Dr. Noe Santiago', margin, yPos);
    yPos += 25;
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Neurocirujano', margin, yPos);
    yPos += 15;
    doc.text('Cédula Profesional: 12345678', margin, yPos);
    yPos += 30;

    // Line separator
    doc.setDrawColor(33, 87, 50);
    doc.setLineWidth(2);
    doc.line(margin, yPos, 612 - margin, yPos);
    yPos += 40;

    // Prescription Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('RECETA MÉDICA', 612 / 2, yPos, { align: 'center' });
    yPos += 40;

    doc.setFontSize(12);
    doc.text(`Paciente: ${prescription.patientName}`, margin, yPos);
    doc.text(`Fecha: ${format(new Date(prescription.date), 'dd/MM/yyyy')}`, 612 - margin, yPos, { align: 'right' });
    yPos += 40;

    // Medications Table
    const tableData = prescription.medications.map(m => [
      m.name,
      m.dosage,
      m.frequency,
      m.duration
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['Medicamento', 'Dosis', 'Frecuencia', 'Duración']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [33, 87, 50] },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 40;

    // Notes
    if (prescription.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Indicaciones:', margin, yPos);
      yPos += 20;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(prescription.notes, 612 - 2 * margin);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 15 + 60;
    }

    // Footer / Signature
    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(612 / 2 - 100, yPos, 612 / 2 + 100, yPos);
    yPos += 15;
    doc.setFontSize(10);
    doc.text('Firma del Médico', 612 / 2, yPos, { align: 'center' });

    // Save and open for printing
    const fileName = `Receta_${prescription.patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
    
    // Use a hidden iframe to trigger the print dialog
    try {
      doc.autoPrint();
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        }, 500);
      };
    } catch (e) {
      console.error('Error triggering print:', e);
      addNotification('Error', 'No se pudo activar la impresora automáticamente. Por favor, imprima el archivo descargado.', 'error');
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recetas Médicas</h1>
          <p className="text-sm text-slate-500">Generar y gestionar prescripciones.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Nueva Receta
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Nueva Receta</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-500">
              Cancelar
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Paciente</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                placeholder="Nombre del paciente"
                value={newPrescription.patientName}
                onChange={e => setNewPrescription({...newPrescription, patientName: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Medicamentos</label>
                <button type="button" onClick={handleAddMedication} className="text-sm text-[#215732] hover:text-[#1a4528] font-medium">
                  + Agregar otro medicamento
                </button>
              </div>
              
              {newPrescription.medications.map((med, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="md:col-span-1">
                    <input
                      type="text"
                      placeholder="Medicamento"
                      required
                      className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                      value={med.name}
                      onChange={e => handleMedicationChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Dosis (ej. 500mg)"
                      required
                      className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                      value={med.dosage}
                      onChange={e => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Frecuencia (ej. c/8h)"
                      required
                      className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                      value={med.frequency}
                      onChange={e => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Duración (ej. 5 días)"
                      required
                      className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                      value={med.duration}
                      onChange={e => handleMedicationChange(index, 'duration', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Notas / Indicaciones Adicionales</label>
              <textarea
                rows={3}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#215732] focus:border-[#215732] sm:text-sm"
                value={newPrescription.notes}
                onChange={e => setNewPrescription({...newPrescription, notes: e.target.value})}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#215732] hover:bg-[#1a4528] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Receta
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#215732] focus:border-[#215732] sm:text-sm transition duration-150 ease-in-out"
              placeholder="Buscar receta por paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Prescriptions List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-[#215732]/50 transition-colors">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#215732]/10 p-2 rounded-full text-[#215732]">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-900">{prescription.patientName}</h3>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(prescription.date), 'd MMM, yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                    <Pill className="h-3 w-3 mr-1" /> Medicamentos
                  </h4>
                  <ul className="space-y-3 mb-4">
                    {prescription.medications.map((med, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="font-medium text-slate-900">{med.name} <span className="text-slate-500 font-normal">{med.dosage}</span></div>
                        <div className="text-xs text-slate-500">{med.frequency} • {med.duration}</div>
                      </li>
                    ))}
                  </ul>
                  
                  {prescription.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 italic">"{prescription.notes}"</p>
                    </div>
                  )}
                  
                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => handlePrint(prescription)}
                      className="inline-flex items-center text-sm text-[#215732] hover:text-[#1a4528] font-medium"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredPrescriptions.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                No se encontraron recetas.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
