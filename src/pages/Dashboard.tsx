import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Activity, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  const statCards = [
    { name: 'Total Patients', value: stats?.totalPatients || 0, change: 'Active', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'High Risk Alerts', value: stats?.criticalAlerts || 0, change: 'Urgent', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Recent Scales', value: stats?.recentScales || 0, change: 'Last 7 days', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Appointments', value: '8', change: 'Today', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your practice and critical updates.</p>
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
            <h3 className="text-base font-semibold leading-6 text-slate-900">Recent Patients</h3>
            <Link to="/patients" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="flow-root">
            <ul role="list" className="divide-y divide-slate-100">
              {stats?.recentPatients?.map((patient: any) => (
                <li key={patient.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <Link to={`/patients/${patient.id}`} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{patient.lastName}, {patient.firstName}</p>
                      <p className="truncate text-sm text-slate-500">MRN: {patient.mrn}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {patient.alerts && patient.alerts.length > 0 ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                          {patient.alerts[0]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          Stable
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {format(new Date(patient.lastVisit), 'MMM d')}
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
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link to="/dictation" className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-slate-900">Start New Dictation</h4>
                <p className="text-xs text-slate-500">Record notes and auto-structure data</p>
              </div>
            </Link>
            
            <Link to="/scales" className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-slate-900">NIHSS Calculator</h4>
                <p className="text-xs text-slate-500">Perform stroke scale assessment</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
