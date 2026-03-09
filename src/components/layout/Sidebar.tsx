import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Activity, Mic, X, Calendar, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Recetas', href: '/prescriptions', icon: FileText },
  { name: 'Escalas Clínicas', href: '/scales', icon: Activity },
  { name: 'Dictado de Voz', href: '/dictation', icon: Mic },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { role, logout } = useRole();

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-30 w-64 transform bg-[#215732] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center">
          <Activity className="h-8 w-8 text-white mr-2 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-tight">Dr. Noe Santiago Ramírez</span>
            <span className="text-xs text-white/80">Neurocirujano</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-white/80 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.filter(item => {
          if (role === 'assistant') {
            return ['Inicio', 'Agenda', 'Pacientes', 'Reportes', 'Configuración'].includes(item.name);
          }
          return true;
        }).map((item) => {
          let displayName = item.name;
          if (role === 'doctor' && item.name === 'Pacientes') {
            displayName = 'Historial Clínico';
          }
          return (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-black/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0 text-white/60 group-hover:text-white transition-colors"
              aria-hidden="true"
            />
            {displayName}
          </NavLink>
        )})}
      </nav>
      
      {/* Logout Button */}
      <div className="px-4 py-2">
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center px-4 py-2 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-red-600/20 hover:bg-red-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold">
            {role === 'doctor' ? 'DR' : 'AS'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {role === 'doctor' ? 'Dr. Santiago' : 'Asistente'}
            </p>
            <p className="text-xs text-white/60">
              {role === 'doctor' ? 'Neurocirujano' : 'Gestión de Citas'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
