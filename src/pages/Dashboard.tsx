import React, { useMemo, useEffect, useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Clock,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Cloud,
  CloudOff,
  Plus,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  format, 
  isToday, 
  subDays, 
  startOfDay, 
  isAfter, 
  isSameDay,
  parseISO,
  eachDayOfInterval,
  startOfToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePatients } from '../context/PatientContext';
import { useAppointments } from '../context/AppointmentContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { patients, loading: patientsLoading, fetchRecentScalesCount, usingLocalStorage: patientsLocal } = usePatients();
  const { appointments, loading: appointmentsLoading, usingLocalStorage: appointmentsLocal } = useAppointments();
  const [recentScalesCount, setRecentScalesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const isSyncingLocal = patientsLocal || appointmentsLocal;
  const COLORS = ['#215732', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  useEffect(() => {
    const loadStats = async () => {
      const count = await fetchRecentScalesCount(7);
      setRecentScalesCount(count);
    };
    loadStats();
  }, [fetchRecentScalesCount]);

  const dashboardData = useMemo(() => {
    if (!patients || !appointments) return null;

    // 1. Basic Stats
    const totalPatients = patients.length;
    const criticalAlerts = patients.filter(p => 
      p.alerts?.some(a => a.toLowerCase().includes('high stroke risk') || a.toLowerCase().includes('crítico'))
    ).length;
    
    const todayApts = appointments.filter(apt => {
      try {
        const date = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return isToday(date) && apt.status !== 'cancelled';
      } catch (e) {
        return false;
      }
    });
    const todayRevenue = todayApts.reduce((sum, apt) => sum + (apt.cost || 0), 0);

    // 2. Revenue Trend (Last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const revenueTrend = last7Days.map(day => {
      const dayTotal = appointments
        .filter(apt => {
          try {
            const date = apt.date instanceof Date ? apt.date : new Date(apt.date);
            return isSameDay(date, day) && apt.status !== 'cancelled';
          } catch (e) {
            return false;
          }
        })
        .reduce((sum, apt) => sum + (apt.cost || 0), 0);
      
      return {
        name: format(day, 'EEE', { locale: es }),
        total: dayTotal
      };
    });

    // 3. Appointment Type Distribution
    const typeCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      typeCounts[apt.type] = (typeCounts[apt.type] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // 4. Upcoming Schedule (Next 3 for today)
    const upcomingToday = [...todayApts]
      .filter(apt => {
        try {
          const date = apt.date instanceof Date ? apt.date : new Date(apt.date);
          return isAfter(date, new Date());
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);

    // 5. Patient Growth (Last 4 weeks)
    const recentPatients = [...patients]
      .filter(p => p.lastVisit)
      .sort((a, b) => {
        try {
          const dateA = new Date(a.lastVisit || 0).getTime();
          const dateB = new Date(b.lastVisit || 0).getTime();
          return dateB - dateA;
        } catch (e) {
          return 0;
        }
      })
      .slice(0, 5);

    // 6. Search Results
    const searchResults = searchQuery.length > 1 
      ? patients.filter(p => 
          `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.mrn && p.mrn.includes(searchQuery))
        ).slice(0, 5)
      : [];

    return {
      totalPatients,
      criticalAlerts,
      todayAptsCount: todayApts.length,
      todayRevenue,
      revenueTrend,
      typeData,
      upcomingToday,
      recentPatients,
      searchResults
    };
  }, [patients, appointments, searchQuery]);

  if (patientsLoading || appointmentsLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#215732]"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Pacientes Totales', value: dashboardData.totalPatients, label: 'Expedientes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Alertas Críticas', value: dashboardData.criticalAlerts, label: 'Seguimiento', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Ingresos Hoy', value: `$${dashboardData.todayRevenue}`, label: 'MXN', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Citas Hoy', value: dashboardData.todayAptsCount, label: 'Programadas', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Search and Sync Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500">Bienvenido, Dr. Santiago.</p>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isSyncingLocal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isSyncingLocal ? (
                  <><CloudOff className="w-3 h-3" /> Local</>
                ) : (
                  <><Cloud className="w-3 h-3" /> Sincronizado</>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Global Search */}
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#215732] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#215732]/20 focus:border-[#215732] sm:text-sm transition-all shadow-sm"
              placeholder="Buscar paciente por nombre o HC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search Results Dropdown */}
            {searchQuery.length > 1 && (
              <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultados</span>
                </div>
                {dashboardData.searchResults.length > 0 ? (
                  dashboardData.searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearchQuery('');
                        navigate(`/patients/${p.id}`);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-500">HC: {p.mrn}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-slate-400">No se encontraron pacientes</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{item.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tendencia de Ingresos</h3>
              <p className="text-sm text-slate-500">Últimos 7 días de actividad</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.revenueTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#215732" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#215732" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#215732" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Próximas Citas</h3>
            <Link to="/agenda" className="text-xs font-bold text-[#215732] hover:underline">VER TODAS</Link>
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingToday.length > 0 ? (
              dashboardData.upcomingToday.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-[#215732]">{format(new Date(apt.date), 'HH:mm')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{apt.patientName}</p>
                    <p className="text-xs text-slate-500 truncate">{apt.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay más citas para hoy</p>
              </div>
            )}
            
            <Link 
              to="/agenda" 
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#215732] hover:text-[#215732] transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agendar Nueva
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Distribución</h3>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Patients List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Pacientes Recientes</h3>
            <Link to="/patients" className="text-sm font-bold text-[#215732] hover:underline">VER TODOS</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {dashboardData.recentPatients.map((patient) => (
              <Link 
                key={patient.id} 
                to={`/patients/${patient.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{patient.lastName}, {patient.firstName}</p>
                    <p className="text-xs text-slate-500">HC: {patient.mrn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.alerts?.length > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {patient.alerts?.length > 0 ? 'Alerta' : 'Estable'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(patient.lastVisit), 'd MMM', { locale: es })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/dictation" className="group p-6 bg-gradient-to-br from-[#215732] to-[#2d7a44] rounded-2xl shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <Zap className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </div>
          <h4 className="text-lg font-bold text-white">Dictado Clínico</h4>
          <p className="text-white/70 text-sm mt-1">Grabar nota y estructurar datos con IA</p>
        </Link>

        <Link to="/scales" className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Escalas Clínicas</h4>
          <p className="text-slate-500 text-sm mt-1">NIHSS, Rankin y evaluaciones rápidas</p>
        </Link>

        <Link to="/patients" className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Nuevo Paciente</h4>
          <p className="text-slate-500 text-sm mt-1">Registrar expediente y antecedentes</p>
        </Link>
      </div>
    </div>
  );
}

