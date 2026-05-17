
import React from 'react';
import type { ActiveSection } from '@/types/qms';
import { DashboardView } from './DashboardView';
import { DocumentControlView } from '@/domains/documents/components/DocumentControlView';
import { PlaceholderView } from './PlaceholderView';
import { CapaView } from '@/domains/capa/components/CapaView';
import { ChangeControlView } from '@/domains/change-control/components/ChangeControlView';
import { DeviationView } from '@/domains/deviation/components/DeviationView';
import { OosOotView } from '@/domains/ncr/components/OosOotView';
import { NcrView } from '@/domains/ncr/components/NcrView';
import { AuditView } from '@/domains/audit/components/AuditView';
import { TrainingView } from '@/domains/training/components/TrainingView';
import { RiskView } from '@/domains/risk/components/RiskView';
import { BatchRecordView } from '@/domains/batch/components/BatchRecordView';
import { SupplierView } from '@/domains/suppliers/components/SupplierView';
import { FormView } from '@/domains/forms/components/FormView';
import { DocumentHierarchyView } from '@/domains/documents/components/DocumentHierarchyView';
import { ComplianceView } from '@/components/modules/ComplianceView';
import { ReportsView } from '@/components/modules/ReportsView';
import { UserManagementView } from '@/components/modules/UserManagementView';

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
