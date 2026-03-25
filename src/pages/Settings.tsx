import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Globe, Save, Clock, Calendar, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { usePatients } from '@/context/PatientContext';
import { useTheme } from '@/context/ThemeContext';

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();
  const { addNotification } = useNotification();
  const { isConfigured, refreshPatients, seedExampleData } = usePatients();
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSeedData = async () => {
    try {
      await seedExampleData();
      addNotification('Datos de Ejemplo Cargados', 'Se han cargado registros de prueba exitosamente.');
    } catch (error) {
      addNotification('Error', 'No se pudieron cargar los datos de ejemplo.');
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      await refreshPatients();
      addNotification('Conexión Exitosa', 'Se ha establecido conexión con la base de datos correctamente.');
    } catch (err) {
      addNotification('Error de Conexión', 'No se pudo conectar con Supabase. Verifique sus credenciales.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Reminder Settings State
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTimeValue, setReminderTimeValue] = useState(24);
  const [reminderTimeUnit, setReminderTimeUnit] = useState('hours'); // 'minutes', 'hours', 'days'

  const handleSave = () => {
    // In a real app, this would save to backend or local storage
    // For now, we simulate saving and show a notification
    addNotification('Configuración Guardada', 'Sus preferencias han sido actualizadas exitosamente.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Administre sus preferencias y configuración de cuenta.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {/* Database Status Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/30">
          <h2 className="text-lg font-medium text-slate-900 flex items-center mb-4">
            <Database className="h-5 w-5 mr-2 text-[#215732]" />
            Estado de la Base de Datos
          </h2>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
            <div className="flex items-center">
              {isConfigured ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-500 mr-4" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {isConfigured ? 'Conectado a Supabase' : 'Configuración Pendiente'}
                </p>
                <p className="text-xs text-slate-500">
                  {isConfigured 
                    ? 'La base de datos está configurada correctamente y lista para usar.' 
                    : 'Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.'}
                </p>
              </div>
            </div>
            {!isConfigured && (
              <div className="text-right">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Acción Requerida</p>
                <p className="text-xs text-amber-600 font-medium">Configurar en Vercel/Entorno</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleSeedData}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Database className="-ml-1 mr-2 h-3 w-3" />
              Cargar Datos de Ejemplo
            </button>
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {testingConnection ? (
                <>
                  <Clock className="animate-spin -ml-1 mr-2 h-3 w-3" />
                  Probando...
                </>
              ) : (
                <>
                  <Database className="-ml-1 mr-2 h-3 w-3" />
                  Probar Conexión
                </>
              )}
            </button>
          </div>
          {!isConfigured && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Nota:</strong> Si estás viendo este mensaje, asegúrate de haber configurado las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. 
                Para que la sincronización funcione, también debes ejecutar el script SQL en <strong>/supabase_schema.sql</strong> en tu panel de Supabase.
              </p>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-green-600" />
            Perfil del Médico
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-slate-700">Nombre</label>
              <input type="text" name="first-name" id="first-name" defaultValue="Juan" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-slate-700">Apellido</label>
              <input type="text" name="last-name" id="last-name" defaultValue="Pérez" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">Especialidad</label>
              <input type="text" name="specialty" id="specialty" defaultValue="Neurología Clínica" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
          </div>
        </div>

        {/* Appointment Reminders Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-medium text-slate-900 flex items-center mb-4">
            <Clock className="h-5 w-5 mr-2 text-purple-600" />
            Recordatorios de Citas
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Activar Recordatorios Automáticos</p>
                  <p className="text-xs text-slate-500">Enviar alertas antes de cada cita programada.</p>
                </div>
              </div>
              <button
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${reminderEnabled ? 'bg-green-600' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {reminderEnabled && (
              <div className="ml-8 p-4 bg-white border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-slate-700 mb-2">Anticipación del Recordatorio</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">Enviar recordatorio</span>
                  <input
                    type="number"
                    min="1"
                    value={reminderTimeValue}
                    onChange={(e) => setReminderTimeValue(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                  />
                  <select
                    value={reminderTimeUnit}
                    onChange={(e) => setReminderTimeUnit(e.target.value)}
                    className="rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                  >
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                    <option value="days">Días</option>
                  </select>
                  <span className="text-sm text-slate-500">antes de la cita.</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Ejemplo: Se enviará una notificación {reminderTimeValue} {reminderTimeUnit === 'minutes' ? 'minutos' : reminderTimeUnit === 'hours' ? 'horas' : 'días'} antes de la hora programada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* General Preferences */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900 flex items-center mb-4">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            Preferencias Generales
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Notificaciones del Sistema</p>
                  <p className="text-xs text-slate-500">Recibir alertas de pacientes críticos y actualizaciones.</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${notifications ? 'bg-green-600' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Moon className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Modo Oscuro</p>
                  <p className="text-xs text-slate-500">Interfaz de alto contraste para turnos nocturnos.</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${darkMode ? 'bg-green-600' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex justify-end">
          <button 
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Save className="-ml-1 mr-2 h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
