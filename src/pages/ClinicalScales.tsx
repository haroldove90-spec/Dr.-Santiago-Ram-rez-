import React, { useState, useEffect } from 'react';
import { Save, Calculator, CheckCircle } from 'lucide-react';
import { Patient } from '@/types/patient';

const nihssQuestions = [
  { id: '1a', label: '1a. Level of Consciousness', options: [{ val: 0, text: 'Alert' }, { val: 1, text: 'Drowsy' }, { val: 2, text: 'Obtunded' }, { val: 3, text: 'Coma' }] },
  { id: '1b', label: '1b. LOC Questions', options: [{ val: 0, text: 'Both correct' }, { val: 1, text: 'One correct' }, { val: 2, text: 'Neither correct' }] },
  { id: '1c', label: '1c. LOC Commands', options: [{ val: 0, text: 'Both correct' }, { val: 1, text: 'One correct' }, { val: 2, text: 'Neither correct' }] },
  { id: '2', label: '2. Best Gaze', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Partial gaze palsy' }, { val: 2, text: 'Forced deviation' }] },
  { id: '3', label: '3. Visual', options: [{ val: 0, text: 'No visual loss' }, { val: 1, text: 'Partial hemianopia' }, { val: 2, text: 'Complete hemianopia' }, { val: 3, text: 'Bilateral hemianopia' }] },
  { id: '4', label: '4. Facial Palsy', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Minor paralysis' }, { val: 2, text: 'Partial paralysis' }, { val: 3, text: 'Complete paralysis' }] },
  { id: '5a', label: '5a. Motor Left Arm', options: [{ val: 0, text: 'No drift' }, { val: 1, text: 'Drift' }, { val: 2, text: 'Some effort against gravity' }, { val: 3, text: 'No effort against gravity' }, { val: 4, text: 'No movement' }] },
  { id: '5b', label: '5b. Motor Right Arm', options: [{ val: 0, text: 'No drift' }, { val: 1, text: 'Drift' }, { val: 2, text: 'Some effort against gravity' }, { val: 3, text: 'No effort against gravity' }, { val: 4, text: 'No movement' }] },
  { id: '6a', label: '6a. Motor Left Leg', options: [{ val: 0, text: 'No drift' }, { val: 1, text: 'Drift' }, { val: 2, text: 'Some effort against gravity' }, { val: 3, text: 'No effort against gravity' }, { val: 4, text: 'No movement' }] },
  { id: '6b', label: '6b. Motor Right Leg', options: [{ val: 0, text: 'No drift' }, { val: 1, text: 'Drift' }, { val: 2, text: 'Some effort against gravity' }, { val: 3, text: 'No effort against gravity' }, { val: 4, text: 'No movement' }] },
  { id: '7', label: '7. Limb Ataxia', options: [{ val: 0, text: 'Absent' }, { val: 1, text: 'Present in one limb' }, { val: 2, text: 'Present in two limbs' }] },
  { id: '8', label: '8. Sensory', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Mild-to-moderate loss' }, { val: 2, text: 'Severe-to-total loss' }] },
  { id: '9', label: '9. Best Language', options: [{ val: 0, text: 'No aphasia' }, { val: 1, text: 'Mild-to-moderate aphasia' }, { val: 2, text: 'Severe aphasia' }, { val: 3, text: 'Mute/Global aphasia' }] },
  { id: '10', label: '10. Dysarthria', options: [{ val: 0, text: 'Normal' }, { val: 1, text: 'Mild-to-moderate' }, { val: 2, text: 'Severe' }] },
  { id: '11', label: '11. Extinction and Inattention', options: [{ val: 0, text: 'No abnormality' }, { val: 1, text: 'Visual/tactile/auditory/spatial inattention' }, { val: 2, text: 'Profound hemi-inattention' }] },
];

export function ClinicalScales() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data))
      .catch(err => console.error(err));
  }, []);

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const saveScale = async () => {
    if (!selectedPatientId) return alert('Please select a patient');
    setSaving(true);
    try {
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          name: 'NIHSS',
          score: totalScore,
          date: new Date().toISOString(),
          notes: 'Routine assessment',
          details: scores
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setScores({});
        setSelectedPatientId('');
      }
    } catch (error) {
      console.error('Error saving scale:', error);
      alert('Failed to save scale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">NIH Stroke Scale (NIHSS) Calculator</h1>
        <div className="text-right">
          <span className="text-sm text-slate-500">Total Score</span>
          <div className="text-3xl font-bold text-emerald-600">{totalScore}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
        <select
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- Select a patient --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} (MRN: {p.mrn})</option>
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
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium'
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
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Saving...' : saved ? <><CheckCircle className="mr-2 h-5 w-5" /> Saved!</> : <><Save className="mr-2 h-5 w-5" /> Save to Patient Record</>}
        </button>
      </div>
    </div>
  );
}
