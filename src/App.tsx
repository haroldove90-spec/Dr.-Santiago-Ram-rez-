/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { ClinicalScales } from './pages/ClinicalScales';
import { Dictation } from './pages/Dictation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Agenda } from './pages/Agenda';
import { PatientDetail } from './pages/PatientDetail';
import { RoleProvider } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';

export default function App() {
  return (
    <RoleProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="scales" element={<ClinicalScales />} />
              <Route path="dictation" element={<Dictation />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </RoleProvider>
  );
}
