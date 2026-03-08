import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Globe, Save } from 'lucide-react';

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');

  const handleSave = () => {
    // In a real app, this would save to backend or local storage
    alert('Configuración guardada exitosamente.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Administre sus preferencias y configuración de cuenta.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
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
                  <p className="text-sm font-medium text-slate-900">Notificaciones</p>
                  <p className="text-xs text-slate-500">Recibir alertas de pacientes críticos.</p>
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
                onClick={() => setDarkMode(!darkMode)}
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
