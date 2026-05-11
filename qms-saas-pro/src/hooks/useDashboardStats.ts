
import { useQuery } from '@tanstack/react-query';
import { useQMSStore } from '@/lib/demo-store';

export interface DashboardStats {
  totalDocuments: number;
  approvedDocuments: number;
  draftDocuments: number;
  openCapas: number;
  closedCapas: number;
  overdueCapas: number;
  openNcrs: number;
  closedNcrs: number;
  plannedAudits: number;
  completedAudits: number;
  overdueTraining: number;
  completedTraining: number;
  highRisks: number;
  mitigatedRisks: number;
  totalBatchRecords: number;
  releasedBatches: number;
  qualifiedSuppliers: number;
  complianceScore: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: (): DashboardStats => {
      // For demo mode, compute from Zustand store directly
      const store = useQMSStore.getState();

      const totalDocuments = store.documents.length;
      const approvedDocuments = store.documents.filter(d => d.status === 'Approved').length;
      const draftDocuments = store.documents.filter(d => d.status === 'Draft' || d.status === 'In Review').length;

      const openCapas = store.capas.filter(c => c.status !== 'Closed').length;
      const closedCapas = store.capas.filter(c => c.status === 'Closed').length;
      const overdueCapas = store.capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()).length;

      const openNcrs = store.ncrs.filter(n => n.status !== 'Closed').length;
      const closedNcrs = store.ncrs.filter(n => n.status === 'Closed').length;

      const plannedAudits = store.audits.filter(a => a.status === 'Planned').length;
      const completedAudits = store.audits.filter(a => a.status === 'Completed').length;

      const overdueTraining = store.training.filter(t => t.status === 'Overdue').length;
      const completedTraining = store.training.filter(t => t.status === 'Completed').length;

      const highRisks = store.risks.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical').length;
      const mitigatedRisks = store.risks.filter(r => r.status === 'Mitigated').length;

      const totalBatchRecords = store.batchRecords.length;
      const releasedBatches = store.batchRecords.filter(b => b.status === 'Released').length;

      const qualifiedSuppliers = store.suppliers.filter(s => s.status === 'Qualified').length;

      // Simple compliance score
      const complianceScore = Math.round(
        ((approvedDocuments / Math.max(totalDocuments, 1)) * 25 +
        (closedCapas / Math.max(store.capas.length, 1)) * 20 +
        (completedTraining / Math.max(store.training.length, 1)) * 15 +
        (completedAudits / Math.max(store.audits.length, 1)) * 15 +
        (closedNcrs / Math.max(store.ncrs.length, 1)) * 10 +
        (mitigatedRisks / Math.max(store.risks.length, 1)) * 10 +
        (1 - overdueCapas / Math.max(store.capas.length, 1)) * 5)
      );

      return {
        totalDocuments,
        approvedDocuments,
        draftDocuments,
        openCapas,
        closedCapas,
        overdueCapas,
        openNcrs,
        closedNcrs,
        plannedAudits,
        completedAudits,
        overdueTraining,
        completedTraining,
        highRisks,
        mitigatedRisks,
        totalBatchRecords,
        releasedBatches,
        qualifiedSuppliers,
        complianceScore: Math.min(Math.max(complianceScore, 0), 100),
      };
    },
    staleTime: 30_000, // 30 seconds
  });
}
