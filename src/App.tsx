/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { ClinicalScales } from './pages/ClinicalScales';
import { Dictation } from './pages/Dictation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Agenda } from './pages/Agenda';
import { Prescriptions } from './pages/Prescriptions';
import { PatientDetail } from './pages/PatientDetail';
import { Login } from './pages/Login';
import { RoleProvider, useRole } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';
import { PatientProvider } from './context/PatientContext';
import { AppointmentProvider } from './context/AppointmentContext';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useRole();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <RoleProvider>
      <NotificationProvider>
        <PatientProvider>
          <AppointmentProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="prescriptions" element={<Prescriptions />} />
                  <Route path="scales" element={<ClinicalScales />} />
                  <Route path="dictation" element={<Dictation />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Router>
          </AppointmentProvider>
        </PatientProvider>
      </NotificationProvider>
    </RoleProvider>
  );
}
