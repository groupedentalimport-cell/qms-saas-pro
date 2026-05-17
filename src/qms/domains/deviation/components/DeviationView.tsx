
import React, { useState } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import { useAuth } from '@/qms/contexts/AuthContext';
import { createDeviation, updateDeviation } from '@/qms/services/deviationService';
import type {
  Deviation, DeviationStatus, DeviationType,
  DeviationSeverity, DeviationCategory, SignatureType,
} from '@/qms/types/qms';
import { ElectronicSignatureModal } from '@/qms/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/qms/lib/utils';
import {
  AlertTriangle, Plus, Search, Eye, ArrowRight, CheckCircle2,
  Clock, XCircle, ShieldCheck, FileText, Link2,
  ClipboardList, BarChart3, Wrench, Shield, UserCheck,
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

const statusColors: Record<DeviationStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Pending QA Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Approved': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const severityColors: Record<DeviationSeverity, string> = {
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Major': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Minor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const statusFlow: DeviationStatus[] = [
  'Open', 'Under Investigation', 'Pending QA Review', 'Approved', 'Closed',
];

function getNextStatus(current: DeviationStatus): DeviationStatus | null {
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

const allCategories: DeviationCategory[] = [
  'Process', 'Equipment', 'Material', 'Environment', 'Personnel', 'Documentation',
];

export function DeviationView() {
  const { currentUser, hasPermission } = useAuth();
  const deviations = useQMSStore(state => state.deviations);
  const profiles = useQMSStore(state => state.profiles);
  const capas = useQMSStore(state => state.capas);
  const documents = useQMSStore(state => state.documents);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDev, setSelectedDev] = useState<Deviation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingStatusAdvance, setPendingStatusAdvance] = useState<Deviation | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<DeviationType>('Unplanned');
  const [formSeverity, setFormSeverity] = useState<DeviationSeverity>('Minor');
  const [formCategory, setFormCategory] = useState<DeviationCategory>('Process');
  const [formDescription, setFormDescription] = useState('');
  const [formDeviationDetails, setFormDeviationDetails] = useState('');
  const [formJustification, setFormJustification] = useState('');
  const [formRiskAssessment, setFormRiskAssessment] = useState('');
  const [formCorrectiveAction, setFormCorrectiveAction] = useState('');
  const [formPreventiveAction, setFormPreventiveAction] = useState('');
  const [formLotNumber, setFormLotNumber] = useState('');
  const [formProductCode, setFormProductCode] = useState('');
  const [formQuantityAffected, setFormQuantityAffected] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formLinkedCapaId, setFormLinkedCapaId] = useState('');
  const [formLinkedDocId, setFormLinkedDocId] = useState('');

  const filteredDeviations = deviations.filter(dev => {
    const matchesSearch = searchTerm === '' ||
      dev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.devNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    const matchesType = typeFilter === 'all' || dev.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || dev.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || dev.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesType && matchesSeverity && matchesCategory;
  });

  const summaryCounts = {
    open: deviations.filter(d => d.status === 'Open').length,
    underInvestigation: deviations.filter(d => d.status === 'Under Investigation').length,
    pendingQA: deviations.filter(d => d.status === 'Pending QA Review').length,
    approved: deviations.filter(d => d.status === 'Approved').length,
    closed: deviations.filter(d => d.status === 'Closed').length,
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const getLinkedDocument = (docId?: string) => {
    if (!docId) return null;
    return documents.find(d => d.id === docId) || null;
  };

  const getLinkedCapa = (capaId?: string) => {
    if (!capaId) return null;
    return capas.find(c => c.id === capaId) || null;
  };

  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  const resetForm = () => {
    setFormTitle('');
    setFormType('Unplanned');
    setFormSeverity('Minor');
    setFormCategory('Process');
    setFormDescription('');
    setFormDeviationDetails('');
    setFormJustification('');
    setFormRiskAssessment('');
    setFormCorrectiveAction('');
    setFormPreventiveAction('');
    setFormLotNumber('');
    setFormProductCode('');
    setFormQuantityAffected('');
    setFormAssignedTo('');
    setFormDueDate('');
    setFormLinkedCapaId('');
    setFormLinkedDocId('');
  };

  const handleCreate = () => {
    createDeviation({
      devNumber: `DEV-2024-${String(deviations.length + 1).padStart(3, '0')}`,
      title: formTitle,
      type: formType,
      status: 'Open',
      severity: formSeverity,
      category: formCategory,
      description: formDescription,
      deviationDetails: formDeviationDetails,
      justification: formJustification || undefined,
      riskAssessment: formRiskAssessment || undefined,
      correctiveAction: formCorrectiveAction || undefined,
      preventiveAction: formPreventiveAction || undefined,
      lotNumber: formLotNumber || undefined,
      productCode: formProductCode || undefined,
      quantityAffected: formQuantityAffected ? parseInt(formQuantityAffected) : undefined,
      linkedCapaId: formLinkedCapaId && formLinkedCapaId !== 'none' ? formLinkedCapaId : undefined,
      linkedDocumentId: formLinkedDocId && formLinkedDocId !== 'none' ? formLinkedDocId : undefined,
      assignedTo: formAssignedTo,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const openDetail = (dev: Deviation) => {
    setSelectedDev(dev);
    setShowDetailDialog(true);
  };

  // Status advancement — QA approval (Pending QA Review → Approved) requires e-signature
  const handleAdvanceStatus = (dev: Deviation) => {
    const next = getNextStatus(dev.status);
    if (!next) return;

    if (next === 'Approved') {
      setPendingStatusAdvance(dev);
      setShowSignatureModal(true);
      return;
    }

    const updates: Partial<Deviation> = { status: next };
    if (next === 'Closed') {
      updates.closedDate = new Date().toISOString();
    }
    updateDeviation(dev.id, updates);
    if (selectedDev?.id === dev.id) {
      setSelectedDev({ ...dev, ...updates });
    }
  };

  // E-signature callback for QA approval
  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingStatusAdvance) return;
    const dev = pendingStatusAdvance;
    updateDeviation(dev.id, { status: 'Approved' });
    if (selectedDev?.id === dev.id) {
      setSelectedDev({ ...dev, status: 'Approved' });
    }
    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Deviations
          </h1>
          <p className="text-muted-foreground mt-1">Deviation recording, investigation, and management</p>
        </div>
        {hasPermission('ncr.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Deviation
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
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
            <span className="text-2xl font-bold">{summaryCounts.underInvestigation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Pending QA Review</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.pendingQA}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.approved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Closed</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.closed}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search deviations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusFlow.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(['Planned', 'Unplanned'] as DeviationType[]).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {(['Critical', 'Major', 'Minor'] as DeviationSeverity[]).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
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
                  <TableHead className="w-[130px]">DEV #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[110px]">Type</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[140px]">Assigned To</TableHead>
                  <TableHead className="w-[110px]">Due Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeviations.map(dev => (
                  <TableRow key={dev.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(dev)}>
                    <TableCell className="font-mono text-xs">{dev.devNumber}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-xs">{dev.title}</p>
                        {(dev.lotNumber || dev.productCode) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {dev.lotNumber && <span className="text-xs text-muted-foreground font-mono">Lot: {dev.lotNumber}</span>}
                            {dev.productCode && <span className="text-xs text-muted-foreground font-mono">Prod: {dev.productCode}</span>}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        dev.type === 'Unplanned' ? 'border-amber-300 text-amber-700' : 'border-green-300 text-green-700'
                      )}>
                        {dev.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', severityColors[dev.severity])} variant="secondary">{dev.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{dev.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[dev.status])} variant="secondary">{dev.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getUserName(dev.assignedTo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(dev.dueDate, true)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(dev); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDeviations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No deviations found matching filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Deviation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Deviation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Deviation title" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as DeviationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Unplanned">Unplanned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity *</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as DeviationSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as DeviationCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe the deviation..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Deviation Details *</Label>
              <Textarea value={formDeviationDetails} onChange={(e) => setFormDeviationDetails(e.target.value)} placeholder="Detailed description of the deviation..." rows={3} />
            </div>
            {formType === 'Planned' && (
              <div className="grid gap-2">
                <Label>Justification (required for Planned deviations) *</Label>
                <Textarea value={formJustification} onChange={(e) => setFormJustification(e.target.value)} placeholder="Justification for this planned deviation..." rows={2} />
              </div>
            )}
            {formType !== 'Planned' && (
              <div className="grid gap-2">
                <Label>Justification</Label>
                <Textarea value={formJustification} onChange={(e) => setFormJustification(e.target.value)} placeholder="Justification..." rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Risk Assessment</Label>
                <Textarea value={formRiskAssessment} onChange={(e) => setFormRiskAssessment(e.target.value)} placeholder="Risk assessment..." rows={2} />
              </div>
              <div className="grid gap-2">
                <Label>Corrective Action</Label>
                <Textarea value={formCorrectiveAction} onChange={(e) => setFormCorrectiveAction(e.target.value)} placeholder="Corrective action..." rows={2} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Preventive Action</Label>
              <Textarea value={formPreventiveAction} onChange={(e) => setFormPreventiveAction(e.target.value)} placeholder="Preventive action..." rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Lot Number</Label>
                <Input value={formLotNumber} onChange={(e) => setFormLotNumber(e.target.value)} placeholder="BN-XXXX" />
              </div>
              <div className="grid gap-2">
                <Label>Product Code</Label>
                <Input value={formProductCode} onChange={(e) => setFormProductCode(e.target.value)} placeholder="PROD-XXX" />
              </div>
              <div className="grid gap-2">
                <Label>Quantity Affected</Label>
                <Input type="number" value={formQuantityAffected} onChange={(e) => setFormQuantityAffected(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assigned To *</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Due Date *</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Linked CAPA</Label>
                <Select value={formLinkedCapaId} onValueChange={setFormLinkedCapaId}>
                  <SelectTrigger><SelectValue placeholder="Select CAPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {capas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.capaNumber} - {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Linked Document</Label>
                <Select value={formLinkedDocId} onValueChange={setFormLinkedDocId}>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvedDocuments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.documentNumber} - {d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!formTitle || !formDescription || !formDeviationDetails || !formAssignedTo || (formType === 'Planned' && !formJustification)}>
              Create Deviation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          {selectedDev && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedDev.devNumber}</span>
                  {selectedDev.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Severity Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedDev.status])} variant="secondary">{selectedDev.status}</Badge>
                  <Badge variant="outline" className={cn(
                    selectedDev.type === 'Unplanned' ? 'border-amber-300 text-amber-700' : 'border-green-300 text-green-700'
                  )}>{selectedDev.type}</Badge>
                  <Badge className={cn(severityColors[selectedDev.severity])} variant="secondary">{selectedDev.severity}</Badge>
                  <Badge variant="outline">{selectedDev.category}</Badge>
                </div>

                {/* Status Flow Visualization */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {statusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedDev.status ? 'bg-primary text-primary-foreground' :
                        statusFlow.indexOf(s) < statusFlow.indexOf(selectedDev.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < statusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Full Metadata Grid including lot and product info */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>{' '}
                    <span className="font-medium">{getUserName(selectedDev.assignedTo)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>{' '}
                    <span className="font-medium">{formatDate(selectedDev.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedDev.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    <span className="font-medium">{formatDate(selectedDev.updatedAt)}</span>
                  </div>
                  {selectedDev.lotNumber && (
                    <div>
                      <span className="text-muted-foreground">Lot Number:</span>{' '}
                      <span className="font-medium font-mono">{selectedDev.lotNumber}</span>
                    </div>
                  )}
                  {selectedDev.productCode && (
                    <div>
                      <span className="text-muted-foreground">Product Code:</span>{' '}
                      <span className="font-medium font-mono">{selectedDev.productCode}</span>
                    </div>
                  )}
                  {selectedDev.quantityAffected !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Qty Affected:</span>{' '}
                      <span className="font-medium">{selectedDev.quantityAffected}</span>
                    </div>
                  )}
                  {selectedDev.closedDate && (
                    <div>
                      <span className="text-muted-foreground">Closed Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedDev.closedDate)}</span>
                    </div>
                  )}
                  {selectedDev.createdById && (
                    <div>
                      <span className="text-muted-foreground">Created By:</span>{' '}
                      <span className="font-medium">{getUserName(selectedDev.createdById)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedDev.description}</p>
                </div>

                {/* Deviation Details */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Deviation Details
                  </h4>
                  <p className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-200 dark:border-amber-800">{selectedDev.deviationDetails}</p>
                </div>

                {/* Justification — especially for planned deviations */}
                {selectedDev.justification && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Justification
                      {selectedDev.type === 'Planned' && (
                        <Badge variant="outline" className="ml-2 text-xs border-blue-300 text-blue-700">Required for Planned</Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-200 dark:border-blue-800">{selectedDev.justification}</p>
                  </div>
                )}

                <Separator />

                {/* Risk Assessment */}
                {selectedDev.riskAssessment && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-orange-500" />
                      Risk Assessment
                    </h4>
                    <p className="text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/10 p-3 rounded-md border border-orange-200 dark:border-orange-800">{selectedDev.riskAssessment}</p>
                  </div>
                )}

                {/* Corrective Action */}
                {selectedDev.correctiveAction && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <Wrench className="h-4 w-4 text-red-500" />
                      Corrective Action
                    </h4>
                    <p className="text-sm text-muted-foreground bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">{selectedDev.correctiveAction}</p>
                  </div>
                )}

                {/* Preventive Action */}
                {selectedDev.preventiveAction && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <Shield className="h-4 w-4 text-green-500" />
                      Preventive Action
                    </h4>
                    <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-200 dark:border-green-800">{selectedDev.preventiveAction}</p>
                  </div>
                )}

                <Separator />

                {/* Linked CAPA */}
                {(() => {
                  const linkedCapa = getLinkedCapa(selectedDev.linkedCapaId);
                  return linkedCapa ? (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        Linked CAPA
                      </h4>
                      <div className="bg-muted/30 p-3 rounded-md flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium font-mono">{linkedCapa.capaNumber}</p>
                          <p className="text-xs text-muted-foreground">{linkedCapa.title}</p>
                        </div>
                        <Badge className={cn('text-xs ml-auto',
                          linkedCapa.status === 'Closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          linkedCapa.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )} variant="secondary">
                          {linkedCapa.status}
                        </Badge>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Linked Document */}
                {(() => {
                  const linkedDoc = getLinkedDocument(selectedDev.linkedDocumentId);
                  return linkedDoc ? (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Linked Document
                      </h4>
                      <div className="bg-muted/30 p-3 rounded-md flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium font-mono">{linkedDoc.documentNumber}</p>
                          <p className="text-xs text-muted-foreground">{linkedDoc.title}</p>
                        </div>
                        <Badge className={cn('text-xs ml-auto',
                          linkedDoc.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          linkedDoc.status === 'Draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )} variant="secondary">
                          {linkedDoc.status}
                        </Badge>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Action Buttons */}
                {hasPermission('ncr.update') && selectedDev.status !== 'Closed' && (
                  <Button className="w-full" onClick={() => handleAdvanceStatus(selectedDev)}>
                    {getNextStatus(selectedDev.status) === 'Approved' ? (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Approve with Electronic Signature
                      </>
                    ) : (
                      <>
                        Advance to {getNextStatus(selectedDev.status)}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
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
        recordTitle={pendingStatusAdvance ? `${pendingStatusAdvance.devNumber} — ${pendingStatusAdvance.title}` : ''}
        recordId={pendingStatusAdvance?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
