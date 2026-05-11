import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import type { ActiveSection } from '@/types/qms';

// Map route path segments to ActiveSection values
export function pathToSection(path: string): ActiveSection {
  const map: Record<string, ActiveSection> = {
    'dashboard': 'dashboard',
    'documents': 'documents',
    'document-hierarchy': 'document-hierarchy',
    'ncr': 'ncr',
    'capa': 'capa',
    'audits': 'audits',
    'risks': 'risks',
    'training': 'training',
    'change-control': 'change-control',
    'deviations': 'deviations',
    'batch-records': 'batch-records',
    'suppliers': 'suppliers',
    'oos-oot': 'oos-oot',
    'forms': 'forms',
    'reports': 'reports',
    'compliance': 'compliance',
    'user-management': 'user-management',
  };
  return map[path] || 'dashboard';
}

export function sectionToPath(section: ActiveSection): string {
  return `/${section}`;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardContent activeSection="dashboard" />} />
        <Route path="dashboard" element={<DashboardContent activeSection="dashboard" />} />
        <Route path="documents" element={<DashboardContent activeSection="documents" />} />
        <Route path="document-hierarchy" element={<DashboardContent activeSection="document-hierarchy" />} />
        <Route path="ncr" element={<DashboardContent activeSection="ncr" />} />
        <Route path="capa" element={<DashboardContent activeSection="capa" />} />
        <Route path="audits" element={<DashboardContent activeSection="audits" />} />
        <Route path="risks" element={<DashboardContent activeSection="risks" />} />
        <Route path="training" element={<DashboardContent activeSection="training" />} />
        <Route path="change-control" element={<DashboardContent activeSection="change-control" />} />
        <Route path="deviations" element={<DashboardContent activeSection="deviations" />} />
        <Route path="batch-records" element={<DashboardContent activeSection="batch-records" />} />
        <Route path="suppliers" element={<DashboardContent activeSection="suppliers" />} />
        <Route path="oos-oot" element={<DashboardContent activeSection="oos-oot" />} />
        <Route path="forms" element={<DashboardContent activeSection="forms" />} />
        <Route path="reports" element={<DashboardContent activeSection="reports" />} />
        <Route path="compliance" element={<DashboardContent activeSection="compliance" />} />
        <Route path="user-management" element={<DashboardContent activeSection="user-management" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
