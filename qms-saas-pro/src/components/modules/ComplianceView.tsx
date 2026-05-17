import React, { useState, useMemo, useCallback } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn, formatDate } from '@/lib/utils';
import {
  Shield,
  AlertTriangle,
  Clock,
  Download,
  Search,
  FileText,
  PenLine,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  INDUSTRY_CONFIG, isIndustryType,
} from '@/types/qms';
import type { AuditAction } from '@/types/qms';
import {
  buildComplianceData,
} from '@/lib/compliance-checklists';
import {
  queryAuditTrail,
  exportAuditTrailCSV,
  getAuditTrailStats,
  TABLE_LABELS,
  ACTION_LABELS,
  ACTION_COLORS,
} from '@/services/auditService';
import type { AuditTrailFilter } from '@/services/auditService';

// ---------------------------------------------------------------------------
// Circular Gauge Component
// ---------------------------------------------------------------------------

function ComplianceGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  let color = 'hsl(142, 76%, 36%)'; // green
  if (score < 60) color = 'hsl(0, 84%, 60%)'; // red
  else if (score < 80) color = 'hsl(38, 92%, 50%)'; // amber

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Overall compliance score: ${score}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-muted-foreground">Overall Compliance</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-metric bar
// ---------------------------------------------------------------------------

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ComplianceView() {
  const store = useQMSStore();
  const { hasPermission } = useAuth();
  const { currentOrg, orgSettings } = useOrganization();

  const documents = store.documents;
  const capas = store.capas;
  const ncrs = store.ncrs;
  const audits = store.audits;
  const trainingItems = store.training;
  const risks = store.risks;
  const changeControls = store.changeControls;
  const deviations = store.deviations;
  const batchRecords = store.batchRecords;
  const suppliers = store.suppliers;

  // -------------------------------------------------------------------------
  // Industry config
  // -------------------------------------------------------------------------

  const industryType = orgSettings?.industry_type || 'medical_device';
  const industryConfig = INDUSTRY_CONFIG[isIndustryType(industryType) ? industryType : 'medical_device'] || INDUSTRY_CONFIG.medical_device;

  // -------------------------------------------------------------------------
  // Build ComplianceData from store (for score calculation)
  // -------------------------------------------------------------------------

  const complianceData = useMemo(() => buildComplianceData({
    documents: documents.map(d => ({ status: d.status, type: d.type })),
    capas: capas.map(c => ({ status: c.status, rootCauseAnalysis: c.rootCauseAnalysis })),
    trainingItems: trainingItems.map(t => ({ status: t.status })),
    audits: audits.map(a => ({ status: a.status })),
    ncrs: ncrs.map(n => ({ status: n.status })),
    risks: risks.map(r => ({ status: r.status })),
    batchRecords: batchRecords.map(b => ({ status: b.status, productCode: b.productCode })),
    suppliers: suppliers.map(s => ({ status: s.status })),
    changeControls: changeControls.map(cc => ({ status: cc.status })),
    deviations: deviations.map(d => ({ status: d.status })),
  }), [documents, capas, trainingItems, audits, ncrs, risks, batchRecords, suppliers, changeControls, deviations]);

  // -------------------------------------------------------------------------
  // Compliance calculations — use industry-specific weights
  // -------------------------------------------------------------------------

  const docCompliance = documents.length > 0
    ? (documents.filter(d => d.status === 'Approved').length / documents.length) * 100
    : 0;

  const capaCompliance = capas.length > 0
    ? (capas.filter(c => c.status === 'Closed').length / capas.length) * 100
    : 100;

  const trainingCompliance = trainingItems.length > 0
    ? (trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100
    : 100;

  const auditCompliance = audits.length > 0
    ? (audits.filter(a => a.status === 'Completed').length / audits.length) * 100
    : 100;

  const ncrResolutionRate = ncrs.length > 0
    ? (ncrs.filter(n => n.status === 'Closed').length / ncrs.length) * 100
    : 100;

  const riskCompliance = risks.length > 0
    ? (risks.filter(r => r.status !== 'Open').length / risks.length) * 100
    : 100;

  const batchCompliance = batchRecords.length > 0
    ? (batchRecords.filter(b => b.status === 'Released').length / batchRecords.length) * 100
    : 100;

  const supplierCompliance = suppliers.length > 0
    ? (suppliers.filter(s => s.status === 'Qualified').length / suppliers.length) * 100
    : 100;

  const w = industryConfig.complianceWeights;
  const overallScore = Math.round(
    docCompliance * w.documents +
    capaCompliance * w.capas +
    trainingCompliance * w.training +
    auditCompliance * w.audits +
    ncrResolutionRate * w.ncrs +
    riskCompliance * w.risks +
    batchCompliance * w.batchRecords +
    supplierCompliance * w.suppliers
  );

  // -------------------------------------------------------------------------
  // KPIs for Tab 1: Pending signatures, Open CAPAs
  // -------------------------------------------------------------------------

  const pendingSignaturesCount = useMemo(() => {
    // Documents in "In Review" status need approval signatures
    return documents.filter(d => d.status === 'In Review').length;
  }, [documents]);

  const openCapasCount = useMemo(() => {
    return capas.filter(c => c.status !== 'Closed').length;
  }, [capas]);

  // -------------------------------------------------------------------------
  // Sub-metrics for the weighted score display
  // -------------------------------------------------------------------------

  const subMetrics = useMemo(() => [
    { label: `Document Compliance (${Math.round(w.documents * 100)}%)`, value: docCompliance, color: 'hsl(142, 76%, 36%)' },
    { label: `CAPA Compliance (${Math.round(w.capas * 100)}%)`, value: capaCompliance, color: 'hsl(0, 84%, 60%)' },
    { label: `Training (${Math.round(w.training * 100)}%)`, value: trainingCompliance, color: 'hsl(217, 91%, 60%)' },
    { label: `Audits (${Math.round(w.audits * 100)}%)`, value: auditCompliance, color: 'hsl(280, 67%, 58%)' },
    { label: `NCR Resolution (${Math.round(w.ncrs * 100)}%)`, value: ncrResolutionRate, color: 'hsl(38, 92%, 50%)' },
    { label: `Risk Management (${Math.round(w.risks * 100)}%)`, value: riskCompliance, color: 'hsl(200, 80%, 50%)' },
  ], [w, docCompliance, capaCompliance, trainingCompliance, auditCompliance, ncrResolutionRate, riskCompliance]);

  // -------------------------------------------------------------------------
  // Recent audit activity for Tab 1
  // -------------------------------------------------------------------------

  const auditTrailStats = useMemo(() => getAuditTrailStats(currentOrg?.id || ''), [store.auditTrails, currentOrg?.id]);

  const recentAuditActivity = useMemo(() => {
    return auditTrailStats.recentActivity.slice(0, 8);
  }, [auditTrailStats]);

  // -------------------------------------------------------------------------
  // Audit Trail Tab 2: Filters & data
  // -------------------------------------------------------------------------

  const [auditFilterAction, setAuditFilterAction] = useState<string>('all');
  const [auditFilterTable, setAuditFilterTable] = useState<string>('all');
  const [auditFilterSearch, setAuditFilterSearch] = useState<string>('');
  const [auditFilterDateFrom, setAuditFilterDateFrom] = useState<string>('');
  const [auditFilterDateTo, setAuditFilterDateTo] = useState<string>('');

  const auditTrailFilter: AuditTrailFilter = useMemo(() => ({
    action: auditFilterAction !== 'all' ? auditFilterAction as AuditAction : undefined,
    tableName: auditFilterTable !== 'all' ? auditFilterTable : undefined,
    searchQuery: auditFilterSearch || undefined,
    dateFrom: auditFilterDateFrom || undefined,
    dateTo: auditFilterDateTo || undefined,
    organizationId: currentOrg?.id || '',
  }), [auditFilterAction, auditFilterTable, auditFilterSearch, auditFilterDateFrom, auditFilterDateTo, currentOrg?.id]);

  const auditTrailResult = useMemo(() => queryAuditTrail(auditTrailFilter, 1, 100), [auditTrailFilter, store.auditTrails]);

  // Get unique table names from audit trail for filter dropdown
  const uniqueTableNames = useMemo(() => {
    const tables = new Set(store.auditTrails.map(e => e.tableName));
    return Array.from(tables).sort();
  }, [store.auditTrails]);

  const auditActions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SIGN', 'LOGIN', 'EXPORT'];

  // -------------------------------------------------------------------------
  // CSV Export handler
  // -------------------------------------------------------------------------

  const handleExportCSV = useCallback(() => {
    const csvContent = exportAuditTrailCSV(auditTrailFilter);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [auditTrailFilter]);

  // -------------------------------------------------------------------------
  // Permission check
  // -------------------------------------------------------------------------

  if (!hasPermission('compliance.view')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">Access Restricted</h3>
            <p className="text-muted-foreground text-sm mt-1">You do not have permission to view compliance data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" aria-hidden="true" />Compliance
        </h1>
        <p className="text-muted-foreground mt-1">
          Regulatory compliance tracking for {industryConfig.label} — {industryConfig.primaryStandard}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">
            <Shield className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="audit-trail">
            <FileText className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* TAB 1: Dashboard                                                */}
        {/* =============================================================== */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Gauge + Sub-metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Compliance Score</CardTitle>
                <CardDescription>Weighted composite — {industryConfig.label} weights</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-full max-w-[200px]">
                  <ComplianceGauge score={overallScore} />
                </div>
                <div className="w-full mt-4 space-y-2.5" aria-live="polite" aria-label="Compliance score details">
                  {subMetrics.map(m => (
                    <MetricBar key={m.label} label={m.label} value={m.value} color={m.color} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="space-y-4">
              {/* Pending Signatures */}
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-3 rounded-lg',
                      pendingSignaturesCount > 0
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    )}>
                      <PenLine className={cn(
                        'h-5 w-5',
                        pendingSignaturesCount > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{pendingSignaturesCount}</p>
                      <p className="text-sm text-muted-foreground">Pending Signatures</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Documents awaiting approval</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open CAPAs */}
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-3 rounded-lg',
                      openCapasCount > 0
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    )}>
                      <AlertTriangle className={cn(
                        'h-5 w-5',
                        openCapasCount > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{openCapasCount}</p>
                      <p className="text-sm text-muted-foreground">Open CAPAs</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Active corrective & preventive actions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Activity Summary */}
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{auditTrailStats.entriesLast7Days}</p>
                      <p className="text-sm text-muted-foreground">Audit Entries (7d)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{auditTrailStats.totalEntries} total entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Audit Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Recent Audit Activity
                </CardTitle>
                <CardDescription>Latest system actions recorded in the audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentAuditActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No recent audit activity.</p>
                  )}
                  {recentAuditActivity.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <Badge
                        className={cn('text-[10px] px-1.5 py-0 shrink-0', ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-800')}
                        variant="secondary"
                      >
                        {ACTION_LABELS[entry.action] || entry.action}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{TABLE_LABELS[entry.tableName] || entry.tableName}</span>
                          {entry.recordId && (
                            <span className="text-[10px] font-mono text-muted-foreground truncate">{entry.recordId}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{entry.userEmail || 'System'}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt, true)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============================================================== */}
        {/* TAB 2: Audit Trail                                              */}
        {/* =============================================================== */}
        <TabsContent value="audit-trail" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audit trail..."
                    value={auditFilterSearch}
                    onChange={(e) => setAuditFilterSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search audit trail"
                  />
                </div>
                <Select value={auditFilterAction} onValueChange={setAuditFilterAction}>
                  <SelectTrigger className="w-[160px]" aria-label="Filter by action">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {auditActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {ACTION_LABELS[action] || action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditFilterTable} onValueChange={setAuditFilterTable}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter by table">
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {uniqueTableNames.map(table => (
                      <SelectItem key={table} value={table}>
                        {TABLE_LABELS[table] || table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={auditFilterDateFrom}
                  onChange={(e) => setAuditFilterDateFrom(e.target.value)}
                  className="w-[150px]"
                  aria-label="From date"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={auditFilterDateTo}
                  onChange={(e) => setAuditFilterDateTo(e.target.value)}
                  className="w-[150px]"
                  aria-label="To date"
                  placeholder="To"
                />
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>
              Showing {auditTrailResult.entries.length} of {auditTrailResult.filteredCount} entries
              {auditTrailResult.filteredCount !== auditTrailResult.totalCount && (
                <> (filtered from {auditTrailResult.totalCount} total)</>
              )}
            </span>
          </div>

          {/* Audit Trail Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Date/Time</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="w-[150px]">Table</TableHead>
                      <TableHead className="w-[140px]">Record ID</TableHead>
                      <TableHead className="w-[180px]">User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditTrailResult.entries.map(entry => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.createdAt, true)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn('text-[10px]', ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-800')}
                            variant="secondary"
                          >
                            {ACTION_LABELS[entry.action] || entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {TABLE_LABELS[entry.tableName] || entry.tableName}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                          {entry.recordId || '—'}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[180px]">
                          {entry.userEmail || 'System'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[300px]">
                          {entry.newValues
                            ? Object.entries(entry.newValues).slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(', ')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {auditTrailResult.entries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No audit trail entries found matching filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
