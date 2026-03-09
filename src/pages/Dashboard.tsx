import React, { useMemo, useEffect, useState } from 'react';
import { Users, AlertTriangle, Activity, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePatients } from '@/context/PatientContext';

export function Dashboard() {
  const { patients, loading, fetchRecentScalesCount } = usePatients();
  const [recentScalesCount, setRecentScalesCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const count = await fetchRecentScalesCount(7);
      setRecentScalesCount(count);
    };
    loadStats();
  }, [fetchRecentScalesCount]);

  const stats = useMemo(() => {
    if (!patients || !Array.isArray(patients)) return { totalPatients: 0, criticalAlerts: 0, recentPatients: [] };

    const totalPatients = patients.length;
    const criticalAlerts = patients.filter(p => 
      p.alerts && Array.isArray(p.alerts) && p.alerts.some(a => typeof a === 'string' && (a.toLowerCase().includes('high stroke risk') || a.toLowerCase().includes('crítico')))
    ).length;
    
    const recentPatients = [...patients]
      .filter(p => p.lastVisit)
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
      .slice(0, 5);

    return {
      totalPatients,
      criticalAlerts,
      recentPatients
    };
  }, [patients]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando tablero...</div>;
  }

  const statCards = [
    { name: 'Total de Pacientes', value: stats?.totalPatients || 0, change: 'Activos', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Alertas Críticas', value: stats?.criticalAlerts || 0, change: 'Urgente', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Escalas Recientes', value: recentScalesCount, change: 'Últimos 7 días', icon: Activity, color: 'text-[#215732]', bg: 'bg-[#215732]/10' },
    { name: 'Citas Hoy', value: '8', change: 'En curso', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tablero Principal</h1>
        <p className="mt-1 text-sm text-slate-500">Resumen de su práctica y actualizaciones críticas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <dt>
              <div className={`absolute rounded-md p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
              <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-slate-600">
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Patients */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold leading-6 text-slate-900">Pacientes Recientes</h3>
            <Link to="/patients" className="text-sm font-medium text-[#215732] hover:text-[#215732]/80 flex items-center">
              Ver todos <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="flow-root">
            <ul role="list" className="divide-y divide-slate-100">
              {stats?.recentPatients?.map((patient: any) => (
                <li key={patient.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <Link to={`/patients/${patient.id}`} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{patient.lastName}, {patient.firstName}</p>
                      <p className="truncate text-sm text-slate-500">HC: {patient.mrn}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {patient.alerts && patient.alerts.length > 0 ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                          {patient.alerts[0]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#215732]/10 text-[#215732]">
                          Estable
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {format(new Date(patient.lastVisit), 'd MMM', { locale: es })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link to="/dictation" className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-[#215732] hover:bg-[#215732]/5 transition-all cursor-pointer group">
              <div className="p-3 rounded-full bg-[#215732]/10 text-[#215732] group-hover:bg-[#215732]/20">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-slate-900">Iniciar Nuevo Dictado</h4>
                <p className="text-xs text-slate-500">Grabar notas y estructurar datos automáticamente</p>
              </div>
            </Link>
            
            <Link to="/scales" className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-slate-900">Calculadora NIHSS</h4>
                <p className="text-xs text-slate-500">Realizar evaluación de escala de ictus</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
