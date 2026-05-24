
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createDeviation, updateDeviation } from '@/services/deviationService';
import type {
  Deviation, DeviationStatus, DeviationType,
  DeviationSeverity, DeviationCategory, SignatureType,
} from '@/types/qms';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { RichFormRenderer } from '@/components/shared/RichFormRenderer';
import { DEVIATION_FORM_TEMPLATE } from '@/lib/templates/deviation-form-template';
import { cn, formatDate } from '@/lib/utils';
import {
  AlertTriangle, Plus, Search, Eye, ArrowRight, CheckCircle2,
  Clock, XCircle, ShieldCheck, FileText, Link2,
  ClipboardList, BarChart3, Wrench, Shield, UserCheck,
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

  // Rich form state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

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
    setFormValues({});
  };

  const handleRichFormSubmit = (values: Record<string, unknown>, signatureHash?: string) => {
    const title = String(values.title || '');
    const type = String(values.type || 'Unplanned') as DeviationType;
    const severity = String(values.severity || 'Minor') as DeviationSeverity;
    const category = String(values.category || 'Process') as DeviationCategory;
    const assignedTo = String(values.assigned_to || values.assignedTo || '');
    const dueDate = String(values.target_closure_date || values.targetClosureDate || '');

    createDeviation({
      devNumber: `DEV-2024-${String(deviations.length + 1).padStart(3, '0')}`,
      title,
      type,
      status: 'Open',
      severity,
      category,
      description: String(values.description || ''),
      deviationDetails: String(values.detailed_description || values.detailedDescription || ''),
      justification: String(values.justification || '') || undefined,
      riskAssessment: String(values.risk_assessment || values.riskAssessment || '') || undefined,
      correctiveAction: String(values.corrective_action || values.correctiveAction || '') || undefined,
      preventiveAction: String(values.preventive_action || values.preventiveAction || '') || undefined,
      lotNumber: String(values.lot_number || values.lotNumber || '') || undefined,
      productCode: String(values.product_code || values.productCode || '') || undefined,
      quantityAffected: values.quantity_affected ? parseInt(String(values.quantity_affected)) : undefined,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });

    setFormValues({});
    setShowCreateDialog(false);
  };

  const handleRichFormSaveDraft = (values: Record<string, unknown>) => {
    setFormValues(values);
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Deviation</DialogTitle>
          </DialogHeader>
          <RichFormRenderer
            template={DEVIATION_FORM_TEMPLATE}
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
