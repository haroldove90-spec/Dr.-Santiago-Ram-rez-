import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, FileText } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useRole } from '../../context/RoleContext';
import { usePatients } from '../../context/PatientContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { notifications, requestPermission, permission } = useNotification();
  const { role } = useRole();
  const { patients } = usePatients();
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close search results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search Logic
  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.mrn.toLowerCase().includes(term)
    );
  });

  const handleSearchSelect = (patientId: string) => {
    navigate(`/patients/${patientId}`);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-700"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#215732] focus:border-[#215732] sm:text-sm transition duration-150 ease-in-out"
            placeholder="Buscar pacientes (Nombre, Historia Clínica)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />

          {/* Search Results Dropdown */}
          {showResults && searchTerm && (
            <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 py-1 z-50 max-h-96 overflow-y-auto">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => handleSearchSelect(patient.id)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start space-x-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="bg-[#215732]/10 p-2 rounded-full text-[#215732]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          HC: {patient.mrn}
                        </span>
                        <span>•</span>
                        <span>{patient.dateOfBirth}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No se encontraron pacientes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {role === 'assistant' && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#215732]/10 text-[#215732]">
            Modo Asistente
          </span>
        )}
        
        <button 
          onClick={requestPermission}
          className="p-2 text-slate-400 hover:text-slate-500 relative"
          title={permission === 'granted' ? 'Notificaciones Activas' : 'Activar Notificaciones'}
        >
          <Bell className={`h-6 w-6 ${permission === 'granted' ? 'text-slate-600' : 'text-slate-400'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
