import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfDay, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Mock Data for Reports
const patients = [
  { id: 1, name: 'Maria Garcia', age: 45, gender: 'Femenino', phone: '555-0101', email: 'maria@email.com', registered: '2025-10-01' },
  { id: 2, name: 'Jose Rodriguez', age: 52, gender: 'Masculino', phone: '555-0102', email: 'jose@email.com', registered: '2025-10-02' },
  { id: 3, name: 'Ana Martinez', age: 34, gender: 'Femenino', phone: '555-0103', email: 'ana@email.com', registered: '2025-10-03' },
  { id: 4, name: 'Carlos Lopez', age: 28, gender: 'Masculino', phone: '555-0104', email: 'carlos@email.com', registered: '2025-10-04' },
  { id: 5, name: 'Lucia Fernandez', age: 61, gender: 'Femenino', phone: '555-0105', email: 'lucia@email.com', registered: '2025-10-05' },
];

const incomeRecords = [
  { id: 1, patient: 'Maria Garcia', date: new Date(), amount: 800, type: 'Consulta Inicial', status: 'Pagado' },
  { id: 2, patient: 'Jose Rodriguez', date: new Date(), amount: 500, type: 'Seguimiento', status: 'Pagado' },
  { id: 3, patient: 'Ana Martinez', date: new Date(new Date().setDate(new Date().getDate() - 1)), amount: 1200, type: 'Cirugía Menor', status: 'Pagado' },
  { id: 4, patient: 'Carlos Lopez', date: new Date(new Date().setDate(new Date().getDate() - 3)), amount: 800, type: 'Consulta Inicial', status: 'Pagado' },
  { id: 5, patient: 'Lucia Fernandez', date: new Date(new Date().setDate(new Date().getDate() - 10)), amount: 500, type: 'Seguimiento', status: 'Pagado' },
];

export function Reports() {
  const [filterDate, setFilterDate] = useState(new Date());

  // Calculate Metrics
  const calculateIncome = (period: 'day' | 'week' | 'month') => {
    const now = new Date();
    return incomeRecords.filter(record => {
      const recordDate = new Date(record.date);
      if (period === 'day') return isSameDay(recordDate, now);
      if (period === 'week') return isSameWeek(recordDate, now);
      if (period === 'month') return isSameMonth(recordDate, now);
      return false;
    }).reduce((sum, record) => sum + record.amount, 0);
  };

  const dailyIncome = calculateIncome('day');
  const weeklyIncome = calculateIncome('week');
  const monthlyIncome = calculateIncome('month');

  // Export Functions
  const exportPatientsPDF = () => {
    const doc = new jsPDF();
    doc.text('Registro de Pacientes', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Nombre', 'Edad', 'Género', 'Teléfono', 'Email', 'Fecha Registro']],
      body: patients.map(p => [p.id, p.name, p.age, p.gender, p.phone, p.email, p.registered]),
      headStyles: { fillColor: [33, 87, 50] }, // #215732
    });

    doc.save('registro_pacientes.pdf');
  };

  const exportIncomePDF = () => {
    const doc = new jsPDF();
    doc.text('Registro de Ingresos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Paciente', 'Tipo', 'Monto (MXN)', 'Estado']],
      body: incomeRecords.map(r => [
        format(r.date, 'dd/MM/yyyy'),
        r.patient,
        r.type,
        `$${r.amount}`,
        r.status
      ]),
      headStyles: { fillColor: [33, 87, 50] }, // #215732
      foot: [['', '', 'Total', `$${incomeRecords.reduce((sum, r) => sum + r.amount, 0)}`, '']],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save('registro_ingresos.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes y Métricas</h1>
          <p className="text-sm text-slate-500">Análisis financiero y registros clínicos.</p>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
            <Calendar className="-ml-1 mr-2 h-4 w-4 text-slate-500" />
            {format(new Date(), 'MMMM yyyy', { locale: es })}
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-[#215732] mt-1">${dailyIncome}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <DollarSign className="h-6 w-6 text-[#215732]" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">+12%</span>
            <span className="text-slate-500 ml-1">vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Semana</p>
              <p className="text-2xl font-bold text-[#215732] mt-1">${weeklyIncome}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">+5%</span>
            <span className="text-slate-500 ml-1">vs semana anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Mes</p>
              <p className="text-2xl font-bold text-[#215732] mt-1">${monthlyIncome}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">+8%</span>
            <span className="text-slate-500 ml-1">vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Income Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-medium text-slate-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-[#215732]" />
            Registro de Ingresos
          </h3>
          <button 
            onClick={exportIncomePDF}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#215732] hover:bg-[#1a4528]"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {incomeRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {format(record.date, 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {record.patient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {record.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#215732]">
                    ${record.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-medium text-slate-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-[#215732]" />
            Registro de Pacientes
          </h3>
          <button 
            onClick={exportPatientsPDF}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#215732] hover:bg-[#1a4528]"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Edad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Género</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{patient.phone}</div>
                    <div className="text-xs text-slate-400">{patient.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.registered}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
