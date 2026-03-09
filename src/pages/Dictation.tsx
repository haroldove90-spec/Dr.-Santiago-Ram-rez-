import React, { useState } from 'react';
import { Mic, Square, Save, Loader2, FileJson, AlertCircle } from 'lucide-react';
import { usePatients } from '@/context/PatientContext';
import { processClinicalDictation } from '@/services/geminiService';
import { useNotification } from '@/context/NotificationContext';

export function Dictation() {
  const { patients, saveDictationResult } = usePatients();
  const { addNotification } = useNotification();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const saveToRecord = async () => {
    if (!selectedPatientId || !structuredData) return;
    setSaving(true);
    try {
      await saveDictationResult(selectedPatientId, structuredData);
      addNotification('¡Expediente Actualizado!', 'Los datos del dictado han sido guardados exitosamente.');
      setStructuredData(null);
      setTranscript('');
      setSelectedPatientId('');
    } catch (err) {
      addNotification('Error', 'No se pudo guardar la información en el expediente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setError(null);
    } else {
      if (!transcript) {
        setTranscript("Paciente masculino de 65 años que presenta debilidad súbita en el lado derecho y dificultad para hablar desde hace 2 horas. Antecedentes de hipertensión y fibrilación auricular. Medicación actual incluye Metoprolol 50mg dos veces al día. PA es 160/95. La puntuación NIHSS parece ser alrededor de 12. Se recomienda TC de cabeza inmediata y Angio-TC.");
      }
    }
  };

  const processDictation = async () => {
    setIsProcessing(true);
    setError(null);
    setStructuredData(null);

    try {
      const data = await processClinicalDictation(transcript);
      setStructuredData(data);
    } catch (err) {
      setError('Error al procesar el dictado. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Dictado de Voz con IA</h2>
        <p className="text-sm text-slate-500 mb-6">
          Grabe sus notas clínicas. La IA transcribirá y estructurará los datos automáticamente.
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={toggleRecording}
            className={`relative rounded-full p-8 transition-all duration-200 ${
              isRecording 
                ? 'bg-red-100 text-red-600 ring-4 ring-red-50 animate-pulse' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Transcripción en Vivo (Editable)</label>
          <textarea
            className="w-full h-32 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="La transcripción aparecerá aquí... (o escriba manualmente)"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error de Procesamiento</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={processDictation}
            disabled={!transcript || isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Procesando con Gemini...
              </>
            ) : (
              <>
                <FileJson className="-ml-1 mr-2 h-4 w-4" />
                Procesar y Estructurar Datos
              </>
            )}
          </button>
        </div>
      </div>

      {structuredData && (
        <div className="bg-slate-50 shadow-sm border border-slate-200 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <FileJson className="h-5 w-5 mr-2 text-green-600" />
            Vista Previa de Datos Estructurados
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono">
              {JSON.stringify(structuredData, null, 2)}
            </pre>
          </div>
          <div className="mt-4 flex justify-end items-center space-x-4">
             <select
               className="block rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
               value={selectedPatientId}
               onChange={(e) => setSelectedPatientId(e.target.value)}
             >
               <option value="">-- Seleccionar Paciente para Actualizar --</option>
               {patients.map(p => (
                 <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>
               ))}
             </select>
             <button
              className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              onClick={saveToRecord}
              disabled={!selectedPatientId || saving}
            >
              <Save className="-ml-1 mr-2 h-4 w-4 text-slate-500" />
              {saving ? 'Guardando...' : 'Confirmar y Guardar en Expediente'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
