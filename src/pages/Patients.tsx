import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, Calendar, ChevronRight } from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500">View and manage patient records.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
          placeholder="Search by name or MRN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patient List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No patients found.</div>
        ) : (
          <ul role="list" className="divide-y divide-slate-200">
            {filteredPatients.map((patient) => (
              <li key={patient.id} className="hover:bg-slate-50 transition-colors">
                <Link to={`/patients/${patient.id}`} className="block px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {patient.lastName}, {patient.firstName}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center mt-0.5">
                          <span className="font-mono mr-2">{patient.mrn}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                          <span>{format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                          <span className="capitalize">{patient.gender}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs text-slate-500 mb-1">Last Visit</p>
                        <div className="flex items-center text-sm text-slate-700">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
