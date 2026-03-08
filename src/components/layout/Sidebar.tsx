import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Activity, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/patients', icon: Users },
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
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-30 w-64 transform bg-green-600 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-green-500">
        <div className="flex items-center">
          <Activity className="h-8 w-8 text-white mr-2 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-tight">Dr. Noe Santiago Ramírez</span>
            <span className="text-xs text-green-100">Neurocirujano</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-green-100 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-100 hover:bg-green-500 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0 text-green-200 group-hover:text-white transition-colors"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-green-500 p-4">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold">
            DR
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Dr. Santiago</p>
            <p className="text-xs text-green-100">Neurocirujano</p>
          </div>
        </div>
      </div>
    </div>
  );
}
