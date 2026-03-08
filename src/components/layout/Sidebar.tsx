import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Activity, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Clinical Scales', href: '/scales', icon: Activity },
  { name: 'Dictation', href: '/dictation', icon: Mic },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Activity className="h-8 w-8 text-emerald-400 mr-2" />
        <span className="text-xl font-bold tracking-tight">NeuroFlow</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-white transition-colors"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
            DR
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Dr. Smith</p>
            <p className="text-xs text-slate-400">Neurologist</p>
          </div>
        </div>
      </div>
    </div>
  );
}
