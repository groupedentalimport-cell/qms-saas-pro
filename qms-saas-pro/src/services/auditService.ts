// auditService.ts — Service Audit Trail (ISO 13485 §4.2.5)
// Gère l'enregistrement immuable de toutes les opérations QMS
// Toute opération CREATE/UPDATE/DELETE/SIGN est loggée. Ne jamais supprimer les entrées.

import { useQMSStore } from '@/lib/demo-store';
import type { AuditTrail, AuditAction } from '@/types/qms';

// ============================================================================
// Audit Trail Logging
// ============================================================================

/**
 * Enregistre une entrée dans l'audit trail.
 * L'audit trail est immuable — les entrées ne peuvent jamais être supprimées.
 */
export function logAuditEntry(entry: {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  userId?: string;
  userEmail?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}): AuditTrail {
  const store = useQMSStore.getState();

  // Utiliser l'utilisateur courant si pas spécifié
  const currentUser = store.profiles[0]; // Démo: premier utilisateur
  const userId = entry.userId || currentUser?.id || 'system';
  const userEmail = entry.userEmail || currentUser?.email || 'system@qms-demo.com';

  const auditEntry: AuditTrail = {
    id: `at-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: entry.action,
    tableName: entry.tableName,
    recordId: entry.recordId,
    userId,
    userEmail,
    oldValues: entry.oldValues,
    newValues: entry.newValues,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'server'),
    organizationId: entry.organizationId || 'org-001',
    createdAt: new Date().toISOString(),
  };

  store.logAudit(
    entry.action,
    entry.tableName,
    entry.recordId,
    entry.oldValues,
    entry.newValues
  );

  return auditEntry;
}

// ============================================================================
// Audit Trail Query
// ============================================================================

export interface AuditTrailFilter {
  action?: AuditAction;
  tableName?: string;
  userId?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  searchQuery?: string;
}

export interface AuditTrailQueryResult {
  entries: AuditTrail[];
  totalCount: number;
  filteredCount: number;
}

/**
 * Requête l'audit trail avec filtres et pagination.
 */
export function queryAuditTrail(
  filter: AuditTrailFilter = {},
  page: number = 1,
  pageSize: number = 50
): AuditTrailQueryResult {
  const store = useQMSStore.getState();
  let entries = [...store.auditTrails];

  // Appliquer les filtres
  if (filter.action) {
    entries = entries.filter(e => e.action === filter.action);
  }

  if (filter.tableName) {
    entries = entries.filter(e => e.tableName === filter.tableName);
  }

  if (filter.userId) {
    entries = entries.filter(e => e.userId === filter.userId);
  }

  if (filter.recordId) {
    entries = entries.filter(e => e.recordId === filter.recordId);
  }

  if (filter.organizationId) {
    entries = entries.filter(e => e.organizationId === filter.organizationId);
  }

  if (filter.dateFrom) {
    const fromDate = new Date(filter.dateFrom);
    entries = entries.filter(e => new Date(e.createdAt) >= fromDate);
  }

  if (filter.dateTo) {
    const toDate = new Date(filter.dateTo);
    toDate.setHours(23, 59, 59, 999);
    entries = entries.filter(e => new Date(e.createdAt) <= toDate);
  }

  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    entries = entries.filter(e =>
      (e.userEmail?.toLowerCase().includes(query)) ||
      (e.tableName?.toLowerCase().includes(query)) ||
      (e.recordId?.toLowerCase().includes(query)) ||
      (JSON.stringify(e.oldValues)?.toLowerCase().includes(query)) ||
      (JSON.stringify(e.newValues)?.toLowerCase().includes(query))
    );
  }

  // Trier par date décroissante
  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalCount = store.auditTrails.length;
  const filteredCount = entries.length;

  // Pagination
  const start = (page - 1) * pageSize;
  const paginatedEntries = entries.slice(start, start + pageSize);

  return {
    entries: paginatedEntries,
    totalCount,
    filteredCount,
  };
}

// ============================================================================
// Audit Trail Export
// ============================================================================

/**
 * Exporte l'audit trail en format CSV.
 * (Spec §6.5 — Journal d'Audit avec export CSV)
 */
export function exportAuditTrailCSV(filter: AuditTrailFilter = {}): string {
  const result = queryAuditTrail(filter, 1, 10000);

  const headers = [
    'Date/Heure',
    'Action',
    'Table',
    'ID Enregistrement',
    'Utilisateur',
    'Email',
    'Anciennes Valeurs',
    'Nouvelles Valeurs',
    'IP',
  ];

  const rows = result.entries.map(entry => [
    new Date(entry.createdAt).toISOString(),
    entry.action,
    entry.tableName,
    entry.recordId || '',
    entry.userId || '',
    entry.userEmail || '',
    entry.oldValues ? JSON.stringify(entry.oldValues) : '',
    entry.newValues ? JSON.stringify(entry.newValues) : '',
    entry.ipAddress || '',
  ]);

  // Échapper les valeurs CSV
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];

  return csvLines.join('\n');
}

// ============================================================================
// Audit Trail Statistics
// ============================================================================

export interface AuditTrailStats {
  totalEntries: number;
  entriesLast7Days: number;
  entriesLast30Days: number;
  byAction: Record<string, number>;
  byTable: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: AuditTrail[];
}

/**
 * Calcule les statistiques de l'audit trail.
 */
export function getAuditTrailStats(organizationId?: string): AuditTrailStats {
  const store = useQMSStore.getState();
  let entries = [...store.auditTrails];

  if (organizationId) {
    entries = entries.filter(e => e.organizationId === organizationId);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const byAction: Record<string, number> = {};
  const byTable: Record<string, number> = {};
  const byUser: Record<string, number> = {};

  for (const entry of entries) {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;
    byTable[entry.tableName] = (byTable[entry.tableName] || 0) + 1;
    if (entry.userEmail) {
      byUser[entry.userEmail] = (byUser[entry.userEmail] || 0) + 1;
    }
  }

  const entriesLast7Days = entries.filter(e => new Date(e.createdAt) >= sevenDaysAgo).length;
  const entriesLast30Days = entries.filter(e => new Date(e.createdAt) >= thirtyDaysAgo).length;

  // Trier par date pour l'activité récente
  const sorted = entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentActivity = sorted.slice(0, 20);

  return {
    totalEntries: entries.length,
    entriesLast7Days,
    entriesLast30Days,
    byAction,
    byTable,
    byUser,
    recentActivity,
  };
}

// ============================================================================
// Table name mappings (for display)
// ============================================================================

export const TABLE_LABELS: Record<string, string> = {
  Document: 'Documents',
  Capa: 'CAPA',
  NonConformance: 'Non-conformités',
  BatchRecord: 'Dossiers de Lot',
  BatchStep: 'Étapes de Lot',
  Supplier: 'Fournisseurs',
  FormTemplate: 'Templates Formulaire',
  FormInstance: 'Instances Formulaire',
  Audit: 'Audits',
  Training: 'Formation',
  Risk: 'Risques',
  ChangeControl: 'Change Control',
  Deviation: 'Déviations',
  Profile: 'Profils',
  Organization: 'Organisation',
};

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  APPROVE: 'Approbation',
  REJECT: 'Rejet',
  SIGN: 'Signature',
  LOGIN: 'Connexion',
  EXPORT: 'Export',
};

export const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
  SIGN: 'bg-purple-100 text-purple-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-cyan-100 text-cyan-800',
};
