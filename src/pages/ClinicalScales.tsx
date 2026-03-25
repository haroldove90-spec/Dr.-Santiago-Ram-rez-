import React, { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { usePatients } from '@/context/PatientContext';
import { useNotification } from '@/context/NotificationContext';

const nihssQuestions = [
  { 
    id: '1a', 
    label: '1a. Nivel de Conciencia', 
    description: 'Respuesta a estímulos externos.',
    options: [
      { val: 0, text: 'Alerta (Respuesta normal)' }, 
      { val: 1, text: 'Somnoliento (Despierta con estímulo mínimo)' }, 
      { val: 2, text: 'Obnubilado (Requiere estímulo repetido o doloroso)' }, 
      { val: 3, text: 'Coma (Solo respuestas reflejas o sin respuesta)' }
    ] 
  },
  { 
    id: '1b', 
    label: '1b. Preguntas LOC (Mes y Edad)', 
    description: '¿En qué mes estamos? ¿Qué edad tiene?',
    options: [
      { val: 0, text: 'Ambas correctas' }, 
      { val: 1, text: 'Una correcta' }, 
      { val: 2, text: 'Ninguna correcta' }
    ] 
  },
  { 
    id: '1c', 
    label: '1c. Órdenes LOC (Abrir/Cerrar ojos, Cerrar/Abrir mano)', 
    description: 'Realizar órdenes sencillas.',
    options: [
      { val: 0, text: 'Ambas correctas' }, 
      { val: 1, text: 'Una correcta' }, 
      { val: 2, text: 'Ninguna correcta' }
    ] 
  },
  { 
    id: '2', 
    label: '2. Mejor Mirada (Movimientos oculares horizontales)', 
    description: 'Seguimiento horizontal.',
    options: [
      { val: 0, text: 'Normal' }, 
      { val: 1, text: 'Parálisis parcial de la mirada' }, 
      { val: 2, text: 'Desviación forzada o parálisis total' }
    ] 
  },
  { 
    id: '3', 
    label: '3. Campos Visuales', 
    description: 'Confrontación de campos visuales.',
    options: [
      { val: 0, text: 'Sin pérdida visual' }, 
      { val: 1, text: 'Hemianopsia parcial (Cuadrantanopsia)' }, 
      { val: 2, text: 'Hemianopsia completa' }, 
      { val: 3, text: 'Hemianopsia bilateral / Ceguera' }
    ] 
  },
  { 
    id: '4', 
    label: '4. Parálisis Facial', 
    description: 'Mostrar dientes, levantar cejas, cerrar ojos.',
    options: [
      { val: 0, text: 'Movimiento normal y simétrico' }, 
      { val: 1, text: 'Parálisis menor (Asimetría leve)' }, 
      { val: 2, text: 'Parálisis parcial (Parálisis parte inferior)' }, 
      { val: 3, text: 'Parálisis completa (Unilateral o bilateral)' }
    ] 
  },
  { 
    id: '5a', 
    label: '5a. Motor Brazo Izquierdo', 
    description: 'Extender brazo a 90° (sentado) o 45° (supino) por 10 seg.',
    options: [
      { val: 0, text: 'Sin caída (Mantiene 10 seg)' }, 
      { val: 1, text: 'Caída (Cae antes de 10 seg, no toca cama)' }, 
      { val: 2, text: 'Algún esfuerzo contra gravedad (Cae a la cama)' }, 
      { val: 3, text: 'Sin esfuerzo contra gravedad (Mov. lateral)' }, 
      { val: 4, text: 'Sin movimiento' },
      { val: 0, text: 'No valorable (Amputación, fusión articular)', isUntestable: true }
    ] 
  },
  { 
    id: '5b', 
    label: '5b. Motor Brazo Derecho', 
    description: 'Extender brazo a 90° (sentado) o 45° (supino) por 10 seg.',
    options: [
      { val: 0, text: 'Sin caída (Mantiene 10 seg)' }, 
      { val: 1, text: 'Caída (Cae antes de 10 seg, no toca cama)' }, 
      { val: 2, text: 'Algún esfuerzo contra gravedad (Cae a la cama)' }, 
      { val: 3, text: 'Sin esfuerzo contra gravedad (Mov. lateral)' }, 
      { val: 4, text: 'Sin movimiento' },
      { val: 0, text: 'No valorable', isUntestable: true }
    ] 
  },
  { 
    id: '6a', 
    label: '6a. Motor Pierna Izquierda', 
    description: 'Elevar pierna a 30° (supino) por 5 segundos.',
    options: [
      { val: 0, text: 'Sin caída (Mantiene 5 seg)' }, 
      { val: 1, text: 'Caída (Cae antes de 5 seg, no toca cama)' }, 
      { val: 2, text: 'Algún esfuerzo contra gravedad (Cae a la cama)' }, 
      { val: 3, text: 'Sin esfuerzo contra gravedad (Mov. lateral)' }, 
      { val: 4, text: 'Sin movimiento' },
      { val: 0, text: 'No valorable', isUntestable: true }
    ] 
  },
  { 
    id: '6b', 
    label: '6b. Motor Pierna Derecha', 
    description: 'Elevar pierna a 30° (supino) por 5 segundos.',
    options: [
      { val: 0, text: 'Sin caída (Mantiene 5 seg)' }, 
      { val: 1, text: 'Caída (Cae antes de 5 seg, no toca cama)' }, 
      { val: 2, text: 'Algún esfuerzo contra gravedad (Cae a la cama)' }, 
      { val: 3, text: 'Sin esfuerzo contra gravedad (Mov. lateral)' }, 
      { val: 4, text: 'Sin movimiento' },
      { val: 0, text: 'No valorable', isUntestable: true }
    ] 
  },
  { 
    id: '7', 
    label: '7. Ataxia de Miembros', 
    description: 'Prueba dedo-nariz y talón-rodilla.',
    options: [
      { val: 0, text: 'Ausente' }, 
      { val: 1, text: 'Presente en un miembro' }, 
      { val: 2, text: 'Presente en dos miembros' }
    ] 
  },
  { 
    id: '8', 
    label: '8. Sensibilidad', 
    description: 'Respuesta al pinchazo.',
    options: [
      { val: 0, text: 'Normal' }, 
      { val: 1, text: 'Pérdida leve a moderada' }, 
      { val: 2, text: 'Pérdida severa a total' }
    ] 
  },
  { 
    id: '9', 
    label: '9. Mejor Lenguaje', 
    description: 'Describir dibujo, nombrar objetos, leer frases.',
    options: [
      { val: 0, text: 'Normal (Sin afasia)' }, 
      { val: 1, text: 'Afasia leve a moderada' }, 
      { val: 2, text: 'Afasia severa' }, 
      { val: 3, text: 'Mudo / Afasia global' }
    ] 
  },
  { 
    id: '10', 
    label: '10. Disartria', 
    description: 'Articulación de las palabras.',
    options: [
      { val: 0, text: 'Normal' }, 
      { val: 1, text: 'Leve a moderada (Arrastra palabras)' }, 
      { val: 2, text: 'Severa (Ininteligible o mudo)' },
      { val: 0, text: 'No valorable (Intubado)', isUntestable: true }
    ] 
  },
  { 
    id: '11', 
    label: '11. Extinción e Inatención (Negligencia)', 
    description: 'Estimulación doble simultánea.',
    options: [
      { val: 0, text: 'Normal' }, 
      { val: 1, text: 'Inatención visual, táctil, auditiva o espacial' }, 
      { val: 2, text: 'Hemi-inatención profunda o extinción a más de una modalidad' }
    ] 
  },
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
            <h3 className="text-sm font-bold text-slate-900 mb-1">{q.label}</h3>
            <p className="text-xs text-slate-500 mb-3">{q.description}</p>
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
