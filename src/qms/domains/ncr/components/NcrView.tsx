
import React, { useState } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import { useAuth } from '@/qms/contexts/AuthContext';
import { createNCR, updateNCR } from '@/qms/services/ncrService';
import { ElectronicSignatureModal } from '@/qms/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/qms/lib/utils';
import type { NonConformance, NcrStatus, NcrType, NcrSeverity, NcrDisposition, SignatureType } from '@/qms/types/qms';
import {
  AlertTriangle, Plus, Search, ArrowRight, AlertCircle,
  CheckCircle2, Clock, ShieldCheck, Link2, Beaker,
} from 'lucide-react';
import { Card, CardContent } from '@/qms/components/ui/card';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Badge } from '@/qms/components/ui/badge';
import { Label } from '@/qms/components/ui/label';
import { Textarea } from '@/qms/components/ui/textarea';
import { Separator } from '@/qms/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/qms/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/qms/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/qms/components/ui/dialog';

const statusColors: Record<NcrStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Pending Disposition': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const severityColors: Record<NcrSeverity, string> = {
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Major': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Minor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const dispositionColors: Record<NcrDisposition, string> = {
  'Use As Is': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rework': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Scrap': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Return to Supplier': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Concession': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ncrStatusFlow: NcrStatus[] = ['Open', 'Under Investigation', 'Pending Disposition', 'Closed'];

const ncrTypes: NcrType[] = ['Product', 'Process', 'System', 'Supplier', 'OOS', 'OOT'];
const ncrSeverities: NcrSeverity[] = ['Critical', 'Major', 'Minor'];
const ncrDispositions: NcrDisposition[] = ['Use As Is', 'Rework', 'Scrap', 'Return to Supplier', 'Concession'];

function getNextNcrStatus(current: NcrStatus): NcrStatus | null {
  const idx = ncrStatusFlow.indexOf(current);
  return idx < ncrStatusFlow.length - 1 ? ncrStatusFlow[idx + 1] : null;
}

export function NcrView() {
  const { currentUser, hasPermission } = useAuth();
  const ncrs = useQMSStore(state => state.ncrs);
  const profiles = useQMSStore(state => state.profiles);
  const capas = useQMSStore(state => state.capas);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NonConformance | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Electronic signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingCloseNcr, setPendingCloseNcr] = useState<NonConformance | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<NcrType>('Process');
  const [formSeverity, setFormSeverity] = useState<NcrSeverity>('Major');
  const [formSource, setFormSource] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLotNumber, setFormLotNumber] = useState('');
  const [formQtyAffected, setFormQtyAffected] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  // OOS/OOT fields
  const [formAnalyticalMethod, setFormAnalyticalMethod] = useState('');
  const [formMeasuredValue, setFormMeasuredValue] = useState('');
  const [formMeasuredUnit, setFormMeasuredUnit] = useState('');
  const [formSpecLimit, setFormSpecLimit] = useState('');
  const [formIsOosOot, setFormIsOosOot] = useState(false);

  // Detail dialog disposition edit
  const [detailDisposition, setDetailDisposition] = useState<string>('');

  const filteredNcrs = ncrs.filter(n => {
    const matchesSearch = searchTerm === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || n.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  const summaryCounts = {
    open: ncrs.filter(n => n.status === 'Open').length,
    investigation: ncrs.filter(n => n.status === 'Under Investigation').length,
    pending: ncrs.filter(n => n.status === 'Pending Disposition').length,
    closed: ncrs.filter(n => n.status === 'Closed').length,
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const getLinkedCapa = (capaId?: string) => {
    if (!capaId) return null;
    return capas.find(c => c.id === capaId) || null;
  };

  const resetForm = () => {
    setFormTitle(''); setFormType('Process'); setFormSeverity('Major');
    setFormSource(''); setFormDescription(''); setFormLotNumber('');
    setFormQtyAffected(''); setFormAssignedTo(''); setFormDueDate('');
    setFormAnalyticalMethod(''); setFormMeasuredValue('');
    setFormMeasuredUnit(''); setFormSpecLimit(''); setFormIsOosOot(false);
  };

  const handleCreate = () => {
    createNCR({
      ncrNumber: `NCR-2024-${String(ncrs.length + 1).padStart(3, '0')}`,
      title: formTitle,
      type: formType,
      status: 'Open',
      severity: formSeverity,
      source: formSource || undefined,
      description: formDescription,
      lotNumber: formLotNumber || undefined,
      quantityAffected: formQtyAffected ? parseInt(formQtyAffected) : undefined,
      assignedTo: formAssignedTo || undefined,
      disposition: 'Pending',
      isOosOot: formIsOosOot,
      analyticalMethod: formIsOosOot ? formAnalyticalMethod || undefined : undefined,
      measuredValue: formIsOosOot && formMeasuredValue ? parseFloat(formMeasuredValue) : undefined,
      measuredUnit: formIsOosOot ? formMeasuredUnit || undefined : undefined,
      specLimit: formIsOosOot ? formSpecLimit || undefined : undefined,
      phase2Required: formIsOosOot,
      rejectLot: false,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      createdDate: new Date().toISOString(),
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const handleAdvanceStatus = (ncr: NonConformance) => {
    const next = getNextNcrStatus(ncr.status);
    if (!next) return;

    // When advancing to Closed, require electronic signature
    if (next === 'Closed') {
      setPendingCloseNcr(ncr);
      setShowSignatureModal(true);
      return;
    }

    updateNCR(ncr.id, { status: next });
    if (selectedNcr?.id === ncr.id) {
      setSelectedNcr({ ...ncr, status: next });
    }
  };

  // Electronic signature callback for closing NCR
  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingCloseNcr) return;

    updateNCR(pendingCloseNcr.id, {
      status: 'Closed',
    });

    if (selectedNcr?.id === pendingCloseNcr.id) {
      setSelectedNcr({ ...pendingCloseNcr, status: 'Closed' });
    }

    setPendingCloseNcr(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingCloseNcr(null);
    setShowSignatureModal(false);
  };

  const openDetail = (ncr: NonConformance) => {
    setSelectedNcr(ncr);
    setDetailDisposition(ncr.disposition || '');
    setShowDetailDialog(true);
  };

  const handleSetDisposition = () => {
    if (!selectedNcr || !detailDisposition) return;
    updateNCR(selectedNcr.id, { disposition: detailDisposition as NcrDisposition });
    setSelectedNcr({ ...selectedNcr, disposition: detailDisposition as NcrDisposition });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Non-Conformances
          </h1>
          <p className="text-muted-foreground mt-1">Manage non-conformance reports and investigations</p>
        </div>
        {hasPermission('ncr.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New NCR
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.open}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Under Investigation</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.investigation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Pending Disposition</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Closed</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.closed}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search NCRs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ncrStatusFlow.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ncrTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {ncrSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <TableHead className="w-[130px]">NCR #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[120px]">Disposition</TableHead>
                  <TableHead className="w-[130px]">Assigned To</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNcrs.map(ncr => (
                  <TableRow key={ncr.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(ncr)}>
                    <TableCell className="font-mono text-xs">{ncr.ncrNumber}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-xs">{ncr.title}</p>
                        {ncr.isOosOot && (
                          <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
                            <Beaker className="h-3 w-3" />OOS/OOT
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(ncr.isOosOot ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400' : '')}>{ncr.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {ncr.severity && <Badge className={cn('text-xs', severityColors[ncr.severity])} variant="secondary">{ncr.severity}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[ncr.status])} variant="secondary">{ncr.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {ncr.disposition && ncr.disposition !== 'Pending' ? (
                        <Badge className={cn('text-xs', dispositionColors[ncr.disposition])} variant="secondary">{ncr.disposition}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{getUserName(ncr.assignedTo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ncr.createdDate, true)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNcrs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No NCRs found matching filters</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create NCR Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New NCR</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="NCR title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => {
                  setFormType(v as NcrType);
                  setFormIsOosOot(v === 'OOS' || v === 'OOT');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ncrTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity *</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as NcrSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ncrSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Input value={formSource} onChange={(e) => setFormSource(e.target.value)} placeholder="e.g., Customer Complaint, Internal Audit..." />
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe the non-conformance..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lot Number</Label>
                <Input value={formLotNumber} onChange={(e) => setFormLotNumber(e.target.value)} placeholder="BN-2024-XXX" />
              </div>
              <div className="grid gap-2">
                <Label>Quantity Affected</Label>
                <Input type="number" value={formQtyAffected} onChange={(e) => setFormQtyAffected(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>

            {/* OOS/OOT Fields */}
            {formIsOosOot && (
              <div className="border border-red-200 dark:border-red-800 rounded-md p-4 space-y-3 bg-red-50/50 dark:bg-red-900/10">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Beaker className="h-4 w-4 text-red-500" /> OOS/OOT Investigation Fields
                </h4>
                <div className="grid gap-2">
                  <Label>Analytical Method</Label>
                  <Input value={formAnalyticalMethod} onChange={(e) => setFormAnalyticalMethod(e.target.value)} placeholder="HPLC Method QC-M-XXX" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Measured Value</Label>
                    <Input type="number" value={formMeasuredValue} onChange={(e) => setFormMeasuredValue(e.target.value)} placeholder="0.0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Input value={formMeasuredUnit} onChange={(e) => setFormMeasuredUnit(e.target.value)} placeholder="%" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Spec Limit</Label>
                    <Input value={formSpecLimit} onChange={(e) => setFormSpecLimit(e.target.value)} placeholder="95.0-105.0%" />
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleCreate} disabled={!formTitle || !formDescription}>
              Create NCR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          {selectedNcr && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedNcr.ncrNumber}</span>
                  {selectedNcr.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedNcr.status])} variant="secondary">{selectedNcr.status}</Badge>
                  <Badge variant="outline" className={cn(selectedNcr.isOosOot ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400' : '')}>{selectedNcr.type}</Badge>
                  {selectedNcr.severity && <Badge className={cn(severityColors[selectedNcr.severity])} variant="secondary">{selectedNcr.severity}</Badge>}
                  {selectedNcr.disposition && selectedNcr.disposition !== 'Pending' && (
                    <Badge className={cn(dispositionColors[selectedNcr.disposition])} variant="secondary">Disposition: {selectedNcr.disposition}</Badge>
                  )}
                </div>

                {/* Status Flow */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {ncrStatusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedNcr.status ? 'bg-primary text-primary-foreground' :
                        ncrStatusFlow.indexOf(s) < ncrStatusFlow.indexOf(selectedNcr.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>{s}</div>
                      {i < ncrStatusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">NCR Number:</span>{' '}
                    <span className="font-mono font-medium">{selectedNcr.ncrNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span className="font-medium">{selectedNcr.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Severity:</span>{' '}
                    <span className="font-medium">{selectedNcr.severity || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source:</span>{' '}
                    <span className="font-medium">{selectedNcr.source || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>{' '}
                    <span className="font-medium">{getUserName(selectedNcr.assignedTo)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedNcr.createdDate)}</span>
                  </div>
                  {selectedNcr.lotNumber && (
                    <div>
                      <span className="text-muted-foreground">Lot Number:</span>{' '}
                      <span className="font-mono font-medium">{selectedNcr.lotNumber}</span>
                    </div>
                  )}
                  {selectedNcr.quantityAffected !== undefined && selectedNcr.quantityAffected !== null && (
                    <div>
                      <span className="text-muted-foreground">Qty Affected:</span>{' '}
                      <span className="font-medium">{selectedNcr.quantityAffected}</span>
                    </div>
                  )}
                  {selectedNcr.dueDate && (
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedNcr.dueDate)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    <span className="font-medium">{formatDate(selectedNcr.updatedAt)}</span>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="font-medium text-sm mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedNcr.description}</p>
                </div>

                {/* Linked CAPA */}
                {selectedNcr.linkedCapaId && (() => {
                  const linkedCapa = getLinkedCapa(selectedNcr.linkedCapaId);
                  return (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Link2 className="h-4 w-4" />
                        Linked CAPA
                      </h4>
                      <div className="bg-muted/30 p-3 rounded-md flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {linkedCapa?.capaNumber || selectedNcr.linkedCapaId}
                        </Badge>
                        {linkedCapa && (
                          <>
                            <span className="text-sm">{linkedCapa.title}</span>
                            <Badge className={cn('text-xs', linkedCapa.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')} variant="secondary">
                              {linkedCapa.status}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* OOS/OOT Section */}
                {selectedNcr.isOosOot && (
                  <div className="border border-red-200 dark:border-red-800 rounded-md p-4 space-y-3 bg-red-50/50 dark:bg-red-900/10">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-red-500" /> OOS/OOT Investigation
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {selectedNcr.analyticalMethod && (
                        <div>
                          <span className="text-muted-foreground">Analytical Method:</span>{' '}
                          <span className="font-medium">{selectedNcr.analyticalMethod}</span>
                        </div>
                      )}
                      {selectedNcr.measuredValue !== undefined && selectedNcr.measuredValue !== null && (
                        <div>
                          <span className="text-muted-foreground">Measured Value:</span>{' '}
                          <span className="font-medium">{selectedNcr.measuredValue} {selectedNcr.measuredUnit || ''}</span>
                        </div>
                      )}
                      {selectedNcr.specLimit && (
                        <div>
                          <span className="text-muted-foreground">Spec Limit:</span>{' '}
                          <span className="font-medium">{selectedNcr.specLimit}</span>
                        </div>
                      )}
                    </div>
                    <Separator className="bg-red-200 dark:bg-red-800" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Phase 1 Conclusion:</span>{' '}
                        <Badge variant="outline" className={cn('text-xs ml-1',
                          selectedNcr.phase1Conclusion === 'No Error Found' ? 'border-green-300 text-green-700' :
                          selectedNcr.phase1Conclusion === 'Error Found' ? 'border-red-300 text-red-700' : ''
                        )}>
                          {selectedNcr.phase1Conclusion || 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phase 2 Required:</span>{' '}
                        <span className="font-medium">{selectedNcr.phase2Required ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedNcr.phase2Required && (
                        <div>
                          <span className="text-muted-foreground">Phase 2 Conclusion:</span>{' '}
                          <Badge variant="outline" className={cn('text-xs ml-1',
                            selectedNcr.phase2Conclusion === 'Invalidated' ? 'border-green-300 text-green-700' :
                            selectedNcr.phase2Conclusion === 'Confirmed OOS' ? 'border-red-300 text-red-700' : ''
                          )}>
                            {selectedNcr.phase2Conclusion || 'Pending'}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Reject Lot:</span>{' '}
                        <Badge variant="outline" className={cn('text-xs ml-1',
                          selectedNcr.rejectLot ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'
                        )}>
                          {selectedNcr.rejectLot ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disposition - visible when Pending Disposition or Closed */}
                {(selectedNcr.status === 'Pending Disposition' || selectedNcr.status === 'Closed') && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Disposition</h4>
                    {selectedNcr.status === 'Pending Disposition' && hasPermission('ncr.update') ? (
                      <div className="flex items-center gap-3">
                        <Select value={detailDisposition} onValueChange={setDetailDisposition}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select disposition" />
                          </SelectTrigger>
                          <SelectContent>
                            {ncrDispositions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={handleSetDisposition}
                          disabled={!detailDisposition || detailDisposition === selectedNcr.disposition}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {selectedNcr.disposition && selectedNcr.disposition !== 'Pending' ? (
                          <Badge className={cn(dispositionColors[selectedNcr.disposition])} variant="secondary">{selectedNcr.disposition}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not set</Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Advance Status Button */}
                {hasPermission('ncr.update') && selectedNcr.status !== 'Closed' && (() => {
                  const nextStatus = getNextNcrStatus(selectedNcr.status);
                  if (!nextStatus) return null;
                  const isClose = nextStatus === 'Closed';
                  return (
                    <Button className="w-full" onClick={() => handleAdvanceStatus(selectedNcr)}>
                      {isClose ? (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Close with Electronic Signature
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
        recordTitle={pendingCloseNcr ? `${pendingCloseNcr.ncrNumber} — ${pendingCloseNcr.title}` : ''}
        recordId={pendingCloseNcr?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
