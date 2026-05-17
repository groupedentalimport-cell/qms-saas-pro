
import React from 'react';
import type { ActiveSection } from '@/qms/types/qms';
import { DashboardView } from './DashboardView';
import { DocumentControlView } from '@/qms/domains/documents/components/DocumentControlView';
import { PlaceholderView } from './PlaceholderView';
import { CapaView } from '@/qms/domains/capa/components/CapaView';
import { ChangeControlView } from '@/qms/domains/change-control/components/ChangeControlView';
import { DeviationView } from '@/qms/domains/deviation/components/DeviationView';
import { OosOotView } from '@/qms/domains/ncr/components/OosOotView';
import { NcrView } from '@/qms/domains/ncr/components/NcrView';
import { AuditView } from '@/qms/domains/audit/components/AuditView';
import { TrainingView } from '@/qms/domains/training/components/TrainingView';
import { RiskView } from '@/qms/domains/risk/components/RiskView';
import { BatchRecordView } from '@/qms/domains/batch/components/BatchRecordView';
import { SupplierView } from '@/qms/domains/suppliers/components/SupplierView';
import { FormView } from '@/qms/domains/forms/components/FormView';
import { DocumentHierarchyView } from '@/qms/domains/documents/components/DocumentHierarchyView';
import { ComplianceView } from '@/qms/components/modules/ComplianceView';
import { ReportsView } from '@/qms/components/modules/ReportsView';
import { UserManagementView } from '@/qms/components/modules/UserManagementView';

interface DashboardContentProps {
  activeSection: ActiveSection;
}

export function DashboardContent({ activeSection }: DashboardContentProps) {
  switch (activeSection) {
    case 'dashboard':
      return <DashboardView />;
    case 'documents':
      return <DocumentControlView />;
    case 'document-hierarchy':
      return <DocumentHierarchyView />;
    case 'ncr':
      return <NcrView />;
    case 'capa':
      return <CapaView />;
    case 'audits':
      return <AuditView />;
    case 'risks':
      return <RiskView />;
    case 'training':
      return <TrainingView />;
    case 'change-control':
      return <ChangeControlView />;
    case 'deviations':
      return <DeviationView />;
    case 'batch-records':
      return <BatchRecordView />;
    case 'suppliers':
      return <SupplierView />;
    case 'oos-oot':
      return <OosOotView />;
    case 'forms':
      return <FormView />;
    case 'reports':
      return <ReportsView />;
    case 'compliance':
      return <ComplianceView />;
    case 'user-management':
      return <UserManagementView />;
    default:
      return <DashboardView />;
  }
}
