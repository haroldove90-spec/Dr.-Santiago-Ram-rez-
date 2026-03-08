import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Download } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useRole } from '@/context/RoleContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { notifications, requestPermission, permission } = useNotification();
  const { role } = useRole();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
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
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Buscar pacientes (Nombre, Historia Clínica)..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {role === 'assistant' && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Modo Asistente
          </span>
        )}
        
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="p-2 text-green-600 hover:text-green-700 bg-green-50 rounded-full transition-colors"
            title="Instalar Aplicación"
          >
            <Download className="h-6 w-6" />
          </button>
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
