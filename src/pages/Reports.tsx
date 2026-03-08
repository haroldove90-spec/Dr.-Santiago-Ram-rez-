import React from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';

const reports = [
  { id: 1, name: 'Resumen Mensual de Pacientes', date: '2025-10-01', type: 'PDF', size: '2.4 MB' },
  { id: 2, name: 'Estadísticas de Ictus Q3', date: '2025-09-30', type: 'Excel', size: '1.1 MB' },
  { id: 3, name: 'Auditoría de Medicamentos', date: '2025-09-15', type: 'PDF', size: '3.5 MB' },
  { id: 4, name: 'Reporte de Productividad', date: '2025-09-01', type: 'PDF', size: '1.8 MB' },
  { id: 5, name: 'Análisis de Demografía', date: '2025-08-15', type: 'Excel', size: '4.2 MB' },
];

export function Reports() {
  const handleDownload = (name: string) => {
    alert(`Descargando reporte: ${name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">Acceda y descargue análisis clínicos y administrativos.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <Filter className="-ml-1 mr-2 h-4 w-4 text-slate-500" />
          Filtrar
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">Documentos Recientes</h3>
          <span className="text-xs text-slate-500">5 documentos encontrados</span>
        </div>
        <ul className="divide-y divide-slate-200">
          {reports.map((report) => (
            <li key={report.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{report.name}</p>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {report.date}
                    <span className="mx-2">•</span>
                    {report.type}
                    <span className="mx-2">•</span>
                    {report.size}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(report.name)}
                className="p-2 text-slate-400 hover:text-green-600 transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
