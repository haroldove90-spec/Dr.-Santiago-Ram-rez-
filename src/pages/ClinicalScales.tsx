import React, { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { usePatients } from '@/context/PatientContext';
import { useNotification } from '@/context/NotificationContext';

const nihssQuestions = [
  { id: '1a', label: '1a. Nivel de Conciencia', options: [{ val: 0, text: 'Alerta' }, { val: 1, text: 'Somnoliento' }, { val: 2, text: 'Obnubilado' }, { val: 3, text: 'Coma' }] },
  { id: '1b', label: '1b. Preguntas LOC', options: [{ val: 0, text: 'Ambas correctas' }, { val: 1, text: 'Una correcta' }, { val: 2, text: 'Ninguna correcta' }] },
  { id: '1c', label: '1c. Órdenes LOC', options: [{ val: 0, text: 'Ambas correctas' }, { val: 1, text: 'Una correcta' }, { val: 2, text: 'Ninguna correcta' }] },
  { id: '2', label: '2. Mejor Mirada', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Parálisis parcial' }, { val: 2, text: 'Desviación forzada' }] },
  { id: '3', label: '3. Visual', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Hemianopsia parcial' }, { val: 2, text: 'Hemianopsia completa' }, { val: 3, text: 'Ceguera' }] },
  { id: '4', label: '4. Parálisis Facial', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Parálisis menor' }, { val: 2, text: 'Parálisis parcial' }, { val: 3, text: 'Parálisis completa' }] },
  { id: '5a', label: '5a. Motor Brazo Izq', options: [{ val: 0, text: 'Sin caída' }, { val: 1, text: 'Caída' }, { val: 2, text: 'Algún esfuerzo' }, { val: 3, text: 'Sin esfuerzo' }, { val: 4, text: 'Sin movimiento' }] },
  { id: '5b', label: '5b. Motor Brazo Der', options: [{ val: 0, text: 'Sin caída' }, { val: 1, text: 'Caída' }, { val: 2, text: 'Algún esfuerzo' }, { val: 3, text: 'Sin esfuerzo' }, { val: 4, text: 'Sin movimiento' }] },
  { id: '6a', label: '6a. Motor Pierna Izq', options: [{ val: 0, text: 'Sin caída' }, { val: 1, text: 'Caída' }, { val: 2, text: 'Algún esfuerzo' }, { val: 3, text: 'Sin esfuerzo' }, { val: 4, text: 'Sin movimiento' }] },
  { id: '6b', label: '6b. Motor Pierna Der', options: [{ val: 0, text: 'Sin caída' }, { val: 1, text: 'Caída' }, { val: 2, text: 'Algún esfuerzo' }, { val: 3, text: 'Sin esfuerzo' }, { val: 4, text: 'Sin movimiento' }] },
  { id: '7', label: '7. Ataxia', options: [{ val: 0, text: 'Ausente' }, { val: 1, text: 'En un miembro' }, { val: 2, text: 'En dos miembros' }] },
  { id: '8', label: '8. Sensibilidad', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Pérdida leve' }, { val: 2, text: 'Pérdida severa' }] },
  { id: '9', label: '9. Lenguaje', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Afasia leve' }, { val: 2, text: 'Afasia severa' }, { val: 3, text: 'Mudo/Afasia global' }] },
  { id: '10', label: '10. Disartria', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Leve a moderada' }, { val: 2, text: 'Severa' }] },
  { id: '11', label: '11. Extinción', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Inatención parcial' }, { val: 2, text: 'Hemi-inatención profunda' }] },
];

export function ClinicalScales() {
  const { patients, addClinicalScale } = usePatients();
  const { addNotification } = useNotification();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const totalScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

  const saveScale = async () => {
    if (!selectedPatientId) {
      addNotification('Error', 'Por favor seleccione un paciente');
      return;
    }
    setSaving(true);
    try {
      await addClinicalScale(selectedPatientId, {
        name: 'NIHSS',
        score: totalScore,
        date: new Date().toISOString(),
        notes: 'Evaluación de rutina',
        details: scores
      });

      addNotification('Escala Guardada', 'La evaluación NIHSS ha sido registrada exitosamente.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setScores({});
      setSelectedPatientId('');
    } catch (error) {
      console.error('Error saving scale:', error);
      addNotification('Error', 'Error al guardar la escala');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Calculadora NIHSS</h1>
        <div className="text-right">
          <span className="text-sm text-slate-500">Puntuación Total</span>
          <div className="text-3xl font-bold text-green-600">{totalScore}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Paciente</label>
        <select
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- Seleccionar un paciente --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} (HC: {p.mrn})</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {nihssQuestions.map((q) => (
          <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 mb-3">{q.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleScoreChange(q.id, opt.val)}
                  className={`text-left px-4 py-2 rounded-md text-sm transition-colors ${
                    scores[q.id] === opt.val
                      ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <span className="font-bold mr-2">{opt.val}</span> {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-6 flex justify-end">
        <button
          onClick={saveScale}
          disabled={saving || !selectedPatientId}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Guardando...' : saved ? <><CheckCircle className="mr-2 h-5 w-5" /> Guardado!</> : <><Save className="mr-2 h-5 w-5" /> Guardar en Expediente</>}
        </button>
      </div>
    </div>
  );
}
