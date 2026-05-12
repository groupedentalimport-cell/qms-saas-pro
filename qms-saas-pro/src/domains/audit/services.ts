// domains/audit/services.ts — Audit domain service re-exports
// Re-exports from the existing auditEntityService module

export {
  createAudit,
  updateAudit,
  completeAudit,
  addAuditFinding,
  updateAuditFinding,
} from '@/services/auditEntityService';
