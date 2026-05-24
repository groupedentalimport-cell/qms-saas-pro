
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createAudit, updateAudit } from '@/services/auditEntityService';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { RichFormRenderer } from '@/components/shared/RichFormRenderer';
import { AUDIT_FORM_TEMPLATE } from '@/lib/templates/audit-form-template';
import { cn, formatDate } from '@/lib/utils';
import type { Audit, AuditStatus, AuditType, AuditFinding, SignatureType } from '@/types/qms';
import {
  ClipboardCheck, Plus, Search, ArrowRight, AlertCircle,
  CheckCircle2, ShieldCheck, Link2, PlusCircle, Flag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const statusColors: Record<AuditStatus, string> = {
  'Planned': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const findingSeverityColors: Record<string, string> = {
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Major': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Minor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Observation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const auditStatusFlow: AuditStatus[] = ['Planned', 'In Progress', 'Completed'];
const auditTypes: AuditType[] = ['Internal', 'External', 'Supplier'];
const findingSeverities: AuditFinding['severity'][] = ['Critical', 'Major', 'Minor', 'Observation'];

function getNextAuditStatus(current: AuditStatus): AuditStatus | null {
  const idx = auditStatusFlow.indexOf(current);
  return idx < auditStatusFlow.length - 1 ? auditStatusFlow[idx + 1] : null;
}

export function AuditView() {
  const { currentUser, hasPermission } = useAuth();
  const audits = useQMSStore(state => state.audits);
  const profiles = useQMSStore(state => state.profiles);
  const capas = useQMSStore(state => state.capas);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Electronic signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingCompleteAudit, setPendingCompleteAudit] = useState<Audit | null>(null);

  // Rich form state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  // Add finding form state
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [findingSeverity, setFindingSeverity] = useState<AuditFinding['severity']>('Minor');
  const [findingDescription, setFindingDescription] = useState('');
  const [findingReferenceClause, setFindingReferenceClause] = useState('');
  const [findingCar, setFindingCar] = useState(false);

  const filteredAudits = audits.filter(a => {
    const matchesSearch = searchTerm === '' ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.scope && a.scope.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const summaryCounts = {
    planned: audits.filter(a => a.status === 'Planned').length,
    inProgress: audits.filter(a => a.status === 'In Progress').length,
    completed: audits.filter(a => a.status === 'Completed').length,
  };

  const getUserName = (name: string) => {
    const profile = profiles.find(p => p.fullName === name || p.id === name);
    return profile?.fullName || name;
  };

  const getLinkedCapa = (capaId?: string) => {
    if (!capaId) return null;
    return capas.find(c => c.id === capaId) || null;
  };

  const resetForm = () => {
    setFormValues({});
  };

  const resetFindingForm = () => {
    setFindingSeverity('Minor'); setFindingDescription('');
    setFindingReferenceClause(''); setFindingCar(false);
    setShowAddFinding(false);
  };

  // ── Rich form submission handler ──
  const handleRichFormSubmit = (values: Record<string, unknown>, signatureHash?: string) => {
    const title = String(values.audit_title || values.title || 'New Audit');
    const type = String(values.audit_type || values.type || 'Internal') as AuditType;
    const scope = String(values.audit_scope || values.scope || '') || undefined;
    const scheduledDate = values.scheduled_date || values.scheduledDate;
    const leadAuditor = String(values.lead_auditor || values.leadAuditor || '');
    const auditees = values.auditees
      ? (Array.isArray(values.auditees)
          ? values.auditees.map((r: any) => r.au_name || r).filter(Boolean)
          : String(values.auditees).split(',').map(s => s.trim()).filter(Boolean))
      : undefined;

    // Resolve leadAuditor ID to name if needed
    const leadAuditorName = (() => {
      const profile = profiles.find(p => p.id === leadAuditor);
      return profile?.fullName || leadAuditor;
    })();

    createAudit({
      auditNumber: `AUD-2024-${String(audits.length + 1).padStart(3, '0')}`,
      title,
      type,
      status: 'Planned',
      scope,
      scheduledDate: scheduledDate
        ? (typeof scheduledDate === 'object' && (scheduledDate as any).start
            ? new Date(String((scheduledDate as any).start)).toISOString()
            : new Date(String(scheduledDate)).toISOString())
        : new Date().toISOString(),
      leadAuditor: leadAuditorName,
      auditees,
      findings: [],
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const handleRichFormSaveDraft = (values: Record<string, unknown>) => {
    setFormValues(values);
  };

  const handleAdvanceStatus = (audit: Audit) => {
    const next = getNextAuditStatus(audit.status);
    if (!next) return;

    // When marking as Completed, require electronic signature
    if (next === 'Completed') {
      setPendingCompleteAudit(audit);
      setShowSignatureModal(true);
      return;
    }

    updateAudit(audit.id, {
      status: next,
    });
    if (selectedAudit?.id === audit.id) {
      setSelectedAudit({ ...audit, status: next });
    }
  };

  // Electronic signature callback for completing audit
  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingCompleteAudit) return;

    updateAudit(pendingCompleteAudit.id, {
      status: 'Completed',
      completedDate: new Date().toISOString(),
    });

    if (selectedAudit?.id === pendingCompleteAudit.id) {
      setSelectedAudit({ ...pendingCompleteAudit, status: 'Completed', completedDate: new Date().toISOString() });
    }

    setPendingCompleteAudit(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingCompleteAudit(null);
    setShowSignatureModal(false);
  };

  const openDetail = (audit: Audit) => {
    setSelectedAudit(audit);
    resetFindingForm();
    setShowDetailDialog(true);
  };

  const handleAddFinding = () => {
    if (!selectedAudit || !findingDescription.trim()) return;

    const newFinding: AuditFinding = {
      id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: findingDescription.trim(),
      severity: findingSeverity,
      referenceClause: findingReferenceClause.trim() || undefined,
      correctiveActionRequired: findingCar,
      capaId: undefined,
    };

    const existingFindings = selectedAudit.findings || [];
    const updatedFindings = [...existingFindings, newFinding];

    updateAudit(selectedAudit.id, { findings: updatedFindings });
    setSelectedAudit({ ...selectedAudit, findings: updatedFindings });
    resetFindingForm();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Audits
          </h1>
          <p className="text-muted-foreground mt-1">Plan, conduct and track quality audits (ISO 13485 8.2.4)</p>
        </div>
        {hasPermission('audit.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Audit
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Planned</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.planned}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.inProgress}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.completed}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search audits..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {auditStatusFlow.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {auditTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Audit #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[140px]">Lead Auditor</TableHead>
                  <TableHead className="w-[120px]">Scheduled</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px]">Findings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map(audit => (
                  <TableRow key={audit.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(audit)}>
                    <TableCell className="font-mono text-xs">{audit.auditNumber}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-xs">{audit.title}</p>
                        {audit.scope && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{audit.scope}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{audit.type}</Badge></TableCell>
                    <TableCell className="text-sm">{audit.leadAuditor}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(audit.scheduledDate, true)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[audit.status])} variant="secondary">{audit.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {audit.findings && audit.findings.length > 0 ? (
                        <Badge variant="outline" className="text-xs">{audit.findings.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAudits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No audits found matching filters</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create Audit Dialog — Rich Form ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Audit</DialogTitle>
          </DialogHeader>
          <RichFormRenderer
            template={AUDIT_FORM_TEMPLATE}
            values={formValues}
            onChange={setFormValues}
            mode="edit"
            onSubmit={handleRichFormSubmit}
            onSaveDraft={handleRichFormSaveDraft}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          {selectedAudit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedAudit.auditNumber}</span>
                  {selectedAudit.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedAudit.status])} variant="secondary">{selectedAudit.status}</Badge>
                  <Badge variant="outline">{selectedAudit.type}</Badge>
                </div>

                {/* Status Flow */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {auditStatusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedAudit.status ? 'bg-primary text-primary-foreground' :
                        auditStatusFlow.indexOf(s) < auditStatusFlow.indexOf(selectedAudit.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>{s}</div>
                      {i < auditStatusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Audit Metadata */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Audit Number:</span>{' '}
                    <span className="font-mono font-medium">{selectedAudit.auditNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span className="font-medium">{selectedAudit.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lead Auditor:</span>{' '}
                    <span className="font-medium">{selectedAudit.leadAuditor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduled Date:</span>{' '}
                    <span className="font-medium">{formatDate(selectedAudit.scheduledDate)}</span>
                  </div>
                  {selectedAudit.completedDate && (
                    <div>
                      <span className="text-muted-foreground">Completed Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedAudit.completedDate)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedAudit.createdAt)}</span>
                  </div>
                  {selectedAudit.auditees && selectedAudit.auditees.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Auditees:</span>{' '}
                      <span className="font-medium">{selectedAudit.auditees.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Scope */}
                {selectedAudit.scope && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Scope</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedAudit.scope}</p>
                  </div>
                )}

                <Separator />

                {/* Findings Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <Flag className="h-4 w-4" />
                      Findings ({selectedAudit.findings?.length || 0})
                    </h4>
                    {hasPermission('audit.update') && selectedAudit.status !== 'Completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddFinding(!showAddFinding)}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Finding
                      </Button>
                    )}
                  </div>

                  {/* Add Finding Form */}
                  {showAddFinding && (
                    <div className="border rounded-md p-4 space-y-3 mb-3 bg-muted/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Severity *</Label>
                          <Select value={findingSeverity} onValueChange={(v) => setFindingSeverity(v as AuditFinding['severity'])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {findingSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Reference Clause</Label>
                          <Input
                            value={findingReferenceClause}
                            onChange={(e) => setFindingReferenceClause(e.target.value)}
                            placeholder="e.g., ISO 13485 8.2.4"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={findingDescription}
                          onChange={(e) => setFindingDescription(e.target.value)}
                          placeholder="Describe the finding..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={findingCar}
                            onChange={(e) => setFindingCar(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Corrective Action Required (CAR)
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddFinding} disabled={!findingDescription.trim()}>
                          Add Finding
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetFindingForm}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Findings List */}
                  {selectedAudit.findings && selectedAudit.findings.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAudit.findings.map(f => {
                        const linkedCapa = getLinkedCapa(f.capaId);
                        return (
                          <div key={f.id} className="border rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={cn('text-xs', findingSeverityColors[f.severity])} variant="secondary">{f.severity}</Badge>
                              {f.correctiveActionRequired && (
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:border-red-700 dark:text-red-400">
                                  CAR Required
                                </Badge>
                              )}
                              {f.referenceClause && (
                                <span className="text-xs text-muted-foreground font-mono">{f.referenceClause}</span>
                              )}
                            </div>
                            <p className="text-sm mt-1">{f.description}</p>
                            {f.capaId && (
                              <div className="flex items-center gap-2 mt-2">
                                <Link2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Linked CAPA:</span>
                                {linkedCapa ? (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {linkedCapa.capaNumber}
                                  </Badge>
                                ) : (
                                  <span className="text-xs font-mono text-muted-foreground">{f.capaId}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">
                      No findings recorded yet
                    </p>
                  )}
                </div>

                {/* Advance Status Button */}
                {hasPermission('audit.update') && selectedAudit.status !== 'Completed' && (() => {
                  const nextStatus = getNextAuditStatus(selectedAudit.status);
                  if (!nextStatus) return null;
                  const isComplete = nextStatus === 'Completed';
                  return (
                    <Button className="w-full" onClick={() => handleAdvanceStatus(selectedAudit)}>
                      {isComplete ? (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Complete with Electronic Signature
                        </>
                      ) : (
                        <>
                          Advance to {nextStatus}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal */}
      <ElectronicSignatureModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onSign={handleSignatureConfirm}
        recordTitle={pendingCompleteAudit ? `${pendingCompleteAudit.auditNumber} — ${pendingCompleteAudit.title}` : ''}
        recordId={pendingCompleteAudit?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
