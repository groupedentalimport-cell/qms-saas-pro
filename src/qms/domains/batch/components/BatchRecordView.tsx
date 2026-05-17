
import React, { useState } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import { createBatchRecord, updateBatchRecord } from '@/qms/services/batchService';
import { useAuth } from '@/qms/contexts/AuthContext';
import { ElectronicSignatureModal } from '@/qms/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/qms/lib/utils';
import { useToast } from '@/qms/hooks/use-toast';
import type { BatchRecord, BatchStep, BatchStatus, BatchStepStatus, SignatureType } from '@/qms/types/qms';
import {
  Package, Plus, Search, ArrowRight, CheckCircle2, Lock, AlertTriangle,
  ShieldCheck, Play, Clock, User, FileCheck, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/qms/components/ui/card';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Badge } from '@/qms/components/ui/badge';
import { Label } from '@/qms/components/ui/label';
import { Progress } from '@/qms/components/ui/progress';
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

const statusColors: Record<BatchStatus, string> = {
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Pending QA Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Released': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Quarantine': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const stepStatusColors: Record<BatchStepStatus, string> = {
  'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const batchStatusFlow: BatchStatus[] = ['In Progress', 'Pending QA Review', 'Released'];

const batchSizeUnits = ['vials', 'units', 'tablets', 'kg', 'liters'];

function getNextBatchStatus(current: BatchStatus): BatchStatus | null {
  const idx = batchStatusFlow.indexOf(current);
  return idx < batchStatusFlow.length - 1 ? batchStatusFlow[idx + 1] : null;
}

function getStepNextStatus(current: BatchStepStatus): BatchStepStatus | null {
  const flow: BatchStepStatus[] = ['Pending', 'In Progress', 'Completed'];
  const idx = flow.indexOf(current);
  return idx < flow.length - 1 ? flow[idx + 1] : null;
}

export function BatchRecordView() {
  const { currentUser, hasPermission } = useAuth();
  const { toast } = useToast();
  const batchRecords = useQMSStore(state => state.batchRecords);
  const profiles = useQMSStore(state => state.profiles);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Electronic signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingReleaseBatch, setPendingReleaseBatch] = useState<BatchRecord | null>(null);

  // Create form state
  const [formAutoLot, setFormAutoLot] = useState(true);
  const [formLotNumber, setFormLotNumber] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formProductCode, setFormProductCode] = useState('');
  const [formBatchSize, setFormBatchSize] = useState('');
  const [formBatchSizeUnit, setFormBatchSizeUnit] = useState('vials');
  const [formMfgDate, setFormMfgDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');

  // Step editing
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editActualValue, setEditActualValue] = useState('');

  // Filtered batches
  const filteredBatches = batchRecords.filter(b => {
    const matchesSearch = searchTerm === '' ||
      b.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(b.manufacturingDate) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(b.manufacturingDate) <= new Date(dateTo + 'T23:59:59');
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const summaryCounts = {
    inProgress: batchRecords.filter(b => b.status === 'In Progress').length,
    pendingQA: batchRecords.filter(b => b.status === 'Pending QA Review').length,
    released: batchRecords.filter(b => b.status === 'Released').length,
    quarantineRejected: batchRecords.filter(b => b.status === 'Quarantine' || b.status === 'Rejected').length,
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const getStepProgress = (batch: BatchRecord) => {
    const steps = batch.steps || [];
    if (steps.length === 0) return 0;
    return Math.round((steps.filter(s => s.status === 'Completed').length / steps.length) * 100);
  };

  const generateLotNumber = () => {
    const count = batchRecords.length + 1;
    return `BN-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setFormAutoLot(true);
    setFormLotNumber('');
    setFormProductName('');
    setFormProductCode('');
    setFormBatchSize('');
    setFormBatchSizeUnit('vials');
    setFormMfgDate('');
    setFormExpiryDate('');
  };

  const handleCreate = () => {
    const lotNumber = formAutoLot ? generateLotNumber() : formLotNumber;
    createBatchRecord({
      lotNumber,
      productName: formProductName,
      productCode: formProductCode || undefined,
      batchSize: formBatchSize ? parseInt(formBatchSize) : undefined,
      batchSizeUnit: formBatchSizeUnit,
      manufacturingDate: formMfgDate ? new Date(formMfgDate).toISOString() : new Date().toISOString(),
      expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
      status: 'In Progress',
      isLocked: false,
      organizationId: 'org-001',
      createdById: currentUser?.id,
      steps: [],
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const canCompleteStep = (batch: BatchRecord, step: BatchStep): boolean => {
    if (batch.isLocked) return false;
    const steps = batch.steps || [];
    const previousSteps = steps.filter(s => s.stepOrder < step.stepOrder);
    return previousSteps.every(s => s.status === 'Completed');
  };

  const handleAdvanceStepStatus = (batch: BatchRecord, step: BatchStep) => {
    if (batch.isLocked) return;
    const nextStatus = getStepNextStatus(step.status);
    if (!nextStatus) return;

    // When advancing from Pending → In Progress, enforce sequencing
    if (nextStatus === 'In Progress' || nextStatus === 'Completed') {
      const steps = batch.steps || [];
      const previousSteps = steps.filter(s => s.stepOrder < step.stepOrder);
      const incompletePrevious = previousSteps.find(s => s.status !== 'Completed');
      if (incompletePrevious) {
        toast({
          title: 'Step sequence error',
          description: `Step ${incompletePrevious.stepOrder} (${incompletePrevious.stepName}) must be completed first.`,
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedSteps = (batch.steps || []).map(s =>
      s.id === step.id
        ? {
            ...s,
            status: nextStatus,
            performedAt: nextStatus === 'Completed' ? new Date().toISOString() : s.performedAt,
            operatorId: currentUser?.id || s.operatorId,
          }
        : s
    );
    updateBatchRecord(batch.id, { steps: updatedSteps });
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch({ ...batch, steps: updatedSteps });
    }
  };

  const handleSaveActualValue = (batch: BatchRecord, step: BatchStep) => {
    if (batch.isLocked) return;
    const updatedSteps = (batch.steps || []).map(s =>
      s.id === step.id ? { ...s, actualValue: editActualValue } : s
    );
    updateBatchRecord(batch.id, { steps: updatedSteps });
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch({ ...batch, steps: updatedSteps });
    }
    setEditingStepId(null);
    setEditActualValue('');
  };

  const handleAdvanceBatchStatus = (batch: BatchRecord) => {
    if (batch.isLocked) return;
    const next = getNextBatchStatus(batch.status);
    if (!next) return;

    if (next === 'Pending QA Review') {
      updateBatchRecord(batch.id, { status: next });
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch({ ...batch, status: next });
      }
    }
  };

  const handleQARelease = (batch: BatchRecord) => {
    setPendingReleaseBatch(batch);
    setShowSignatureModal(true);
  };

  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingReleaseBatch) return;

    updateBatchRecord(pendingReleaseBatch.id, {
      status: 'Released',
      isLocked: true,
      qaReleaseDate: new Date().toISOString(),
      qaReleasedById: currentUser?.id,
    });

    if (selectedBatch?.id === pendingReleaseBatch.id) {
      setSelectedBatch({
        ...pendingReleaseBatch,
        status: 'Released',
        isLocked: true,
        qaReleaseDate: new Date().toISOString(),
        qaReleasedById: currentUser?.id,
      });
    }

    setPendingReleaseBatch(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingReleaseBatch(null);
    setShowSignatureModal(false);
  };

  const handleRejectBatch = (batch: BatchRecord) => {
    updateBatchRecord(batch.id, {
      status: 'Rejected',
      isLocked: true,
    });
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch({ ...batch, status: 'Rejected', isLocked: true });
    }
  };

  const handleQuarantineBatch = (batch: BatchRecord) => {
    updateBatchRecord(batch.id, {
      status: 'Quarantine',
      isLocked: true,
    });
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch({ ...batch, status: 'Quarantine', isLocked: true });
    }
  };

  const openDetail = (batch: BatchRecord) => {
    setSelectedBatch(batch);
    setEditingStepId(null);
    setEditActualValue('');
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Batch Records
          </h1>
          <p className="text-muted-foreground mt-1">Batch record management and QA release</p>
        </div>
        {hasPermission('batch.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Batch Record
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.inProgress}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Pending QA Review</span>
            </div>
            <span className="text-2xl font-bold text-purple-600">{summaryCounts.pendingQA}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Released</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.released}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Quarantine/Rejected</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{summaryCounts.quarantineRejected}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by lot number or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending QA Review">Pending QA Review</SelectItem>
            <SelectItem value="Released">Released</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Quarantine">Quarantine</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[150px]"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[150px]"
          placeholder="To"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Lot #</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-[100px]">Batch Size</TableHead>
                  <TableHead className="w-[110px]">Mfg Date</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[100px]">Progress</TableHead>
                  <TableHead className="w-[100px]">Lock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map(batch => {
                  const progress = getStepProgress(batch);
                  return (
                    <TableRow key={batch.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(batch)}>
                      <TableCell className="font-mono text-xs">{batch.lotNumber}</TableCell>
                      <TableCell>
                        <p className="font-medium">{batch.productName}</p>
                        {batch.productCode && <p className="text-xs text-muted-foreground">{batch.productCode}</p>}
                      </TableCell>
                      <TableCell className="text-sm">{batch.batchSize ? `${batch.batchSize} ${batch.batchSizeUnit}` : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(batch.manufacturingDate, true)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', statusColors[batch.status])} variant="secondary">{batch.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {batch.isLocked ? (
                          <Badge variant="outline" className="text-xs"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                        ) : <span className="text-muted-foreground text-xs">Unlocked</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No batch records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Batch Record Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Batch Record</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="autoLot" className="text-sm">Auto-generate lot number</Label>
              <input
                id="autoLot"
                type="checkbox"
                checked={formAutoLot}
                onChange={(e) => setFormAutoLot(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
            {!formAutoLot && (
              <div className="grid gap-2">
                <Label>Lot Number *</Label>
                <Input value={formLotNumber} onChange={(e) => setFormLotNumber(e.target.value)} placeholder="BN-2024-XXX" />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Product Name *</Label>
              <Input value={formProductName} onChange={(e) => setFormProductName(e.target.value)} placeholder="Product name" />
            </div>
            <div className="grid gap-2">
              <Label>Product Code</Label>
              <Input value={formProductCode} onChange={(e) => setFormProductCode(e.target.value)} placeholder="PROD-XXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Batch Size</Label>
                <Input type="number" value={formBatchSize} onChange={(e) => setFormBatchSize(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Select value={formBatchSizeUnit} onValueChange={setFormBatchSizeUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {batchSizeUnits.map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Manufacturing Date *</Label>
                <Input type="date" value={formMfgDate} onChange={(e) => setFormMfgDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!formProductName || (!formAutoLot && !formLotNumber)}
            >
              Create Batch Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
          {selectedBatch && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedBatch.lotNumber}</span>
                  {selectedBatch.productName}
                  {selectedBatch.isLocked && (
                    <Badge variant="outline" className="text-xs ml-2">
                      <Lock className="h-3 w-3 mr-1" />Locked
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedBatch.status])} variant="secondary">
                    {selectedBatch.status}
                  </Badge>
                  {selectedBatch.productCode && <Badge variant="outline">{selectedBatch.productCode}</Badge>}
                  {selectedBatch.isLocked && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      <Lock className="h-3 w-3 mr-1" />Record Locked
                    </Badge>
                  )}
                </div>

                {/* Status Flow Visualization */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {batchStatusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedBatch.status ? 'bg-primary text-primary-foreground' :
                        batchStatusFlow.indexOf(s) < batchStatusFlow.indexOf(selectedBatch.status) ?
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < batchStatusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                  {/* Branch indicators for Rejected/Quarantine */}
                  {(selectedBatch.status === 'Rejected' || selectedBatch.status === 'Quarantine') && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        statusColors[selectedBatch.status]
                      )}>
                        {selectedBatch.status}
                      </div>
                    </>
                  )}
                </div>

                {/* Batch Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lot Number:</span>{' '}
                    <span className="font-mono font-medium">{selectedBatch.lotNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product:</span>{' '}
                    <span className="font-medium">{selectedBatch.productName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Batch Size:</span>{' '}
                    <span className="font-medium">{selectedBatch.batchSize ? `${selectedBatch.batchSize} ${selectedBatch.batchSizeUnit}` : '-'}</span>
                  </div>
                  {selectedBatch.productCode && (
                    <div>
                      <span className="text-muted-foreground">Product Code:</span>{' '}
                      <span className="font-mono font-medium">{selectedBatch.productCode}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Mfg Date:</span>{' '}
                    <span className="font-medium">{formatDate(selectedBatch.manufacturingDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiry Date:</span>{' '}
                    <span className="font-medium">{formatDate(selectedBatch.expiryDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedBatch.createdAt)}</span>
                  </div>
                  {selectedBatch.qaReleaseDate && (
                    <div>
                      <span className="text-muted-foreground">QA Released:</span>{' '}
                      <span className="font-medium text-green-600">{formatDate(selectedBatch.qaReleaseDate)}</span>
                    </div>
                  )}
                  {selectedBatch.qaReleasedById && (
                    <div>
                      <span className="text-muted-foreground">Released By:</span>{' '}
                      <span className="font-medium">{getUserName(selectedBatch.qaReleasedById)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Steps Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Batch Steps
                    </h4>
                    {selectedBatch.steps && selectedBatch.steps.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getStepProgress(selectedBatch)}% complete
                      </span>
                    )}
                  </div>

                  {selectedBatch.steps && selectedBatch.steps.length > 0 ? (
                    <>
                      <Progress value={getStepProgress(selectedBatch)} className="h-2 mb-3" />

                      {/* Step indicator circles */}
                      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                        {selectedBatch.steps.map((step, i) => (
                          <React.Fragment key={step.id}>
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                              step.status === 'Completed' ? 'bg-green-500 text-white' :
                              step.status === 'In Progress' ? 'bg-amber-500 text-white' :
                              step.status === 'Failed' ? 'bg-red-500 text-white' :
                              'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            )}>
                              {step.stepOrder}
                            </div>
                            {i < selectedBatch.steps!.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Steps Table */}
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]">#</TableHead>
                              <TableHead>Step Name</TableHead>
                              <TableHead className="w-[140px]">Instructions</TableHead>
                              <TableHead className="w-[110px]">Expected</TableHead>
                              <TableHead className="w-[130px]">Actual</TableHead>
                              <TableHead className="w-[100px]">Status</TableHead>
                              <TableHead className="w-[110px]">Operator</TableHead>
                              <TableHead className="w-[110px]">Performed</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedBatch.steps.map(step => (
                              <TableRow key={step.id}>
                                <TableCell className="font-mono text-xs">{step.stepOrder}</TableCell>
                                <TableCell className="font-medium text-sm">{step.stepName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                                  {step.instructions || '-'}
                                </TableCell>
                                <TableCell className="text-xs">{step.expectedValue || '-'}</TableCell>
                                <TableCell>
                                  {/* Editable actualValue for In Progress or Pending steps */}
                                  {editingStepId === step.id ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        className="h-7 text-xs w-[80px]"
                                        value={editActualValue}
                                        onChange={(e) => setEditActualValue(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveActualValue(selectedBatch, step);
                                          if (e.key === 'Escape') { setEditingStepId(null); setEditActualValue(''); }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleSaveActualValue(selectedBatch, step)}
                                      >
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className={cn(
                                        'text-xs cursor-pointer',
                                        (step.status === 'Pending' || step.status === 'In Progress') && !selectedBatch.isLocked && hasPermission('batch.update')
                                          ? 'hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 border border-dashed border-transparent hover:border-muted-foreground/30'
                                          : ''
                                      )}
                                      onClick={() => {
                                        if ((step.status === 'Pending' || step.status === 'In Progress') && !selectedBatch.isLocked && hasPermission('batch.update')) {
                                          setEditingStepId(step.id);
                                          setEditActualValue(step.actualValue || '');
                                        }
                                      }}
                                    >
                                      {step.actualValue || '-'}
                                      {(step.status === 'Pending' || step.status === 'In Progress') && !selectedBatch.isLocked && hasPermission('batch.update') && !step.actualValue && (
                                        <span className="text-muted-foreground ml-1">click to edit</span>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn('text-xs', stepStatusColors[step.status])} variant="secondary">
                                    {step.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {step.operatorId ? (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      {getUserName(step.operatorId)}
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {step.performedAt ? formatDate(step.performedAt, true) : '-'}
                                </TableCell>
                                <TableCell>
                                  {hasPermission('batch.update') && !selectedBatch.isLocked && step.status !== 'Completed' && step.status !== 'Failed' && (() => {
                                    const nextStepStatus = getStepNextStatus(step.status);
                                    if (!nextStepStatus) return null;
                                    return (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => handleAdvanceStepStatus(selectedBatch, step)}
                                        disabled={!canCompleteStep(selectedBatch, step)}
                                      >
                                        {nextStepStatus === 'In Progress' ? (
                                          <><Play className="h-3 w-3 mr-1" />Start</>
                                        ) : (
                                          <><CheckCircle2 className="h-3 w-3 mr-1" />Complete</>
                                        )}
                                      </Button>
                                    );
                                  })()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Step signature tracking */}
                      {selectedBatch.steps.some(s => s.signatureHash) && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Step Signatures
                          </h5>
                          <div className="space-y-1">
                            {selectedBatch.steps.filter(s => s.signatureHash).map(step => (
                              <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                <span className="font-mono">Step {step.stepOrder}:</span>
                                <span>{getUserName(step.operatorId)}</span>
                                <span className="font-mono text-[10px]">{step.signatureHash}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/20">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No batch steps defined for this record
                    </div>
                  )}
                </div>

                <Separator />

                {/* QA Release Section */}
                {selectedBatch.status === 'Pending QA Review' && hasPermission('batch.release') && !selectedBatch.isLocked && (
                  <div className="border border-purple-200 dark:border-purple-800 rounded-md p-4 space-y-3 bg-purple-50/50 dark:bg-purple-900/10">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-500" />
                      QA Release Decision
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      This batch is ready for QA review. Release requires an electronic signature per 21 CFR Part 11.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => handleQARelease(selectedBatch)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Release Batch
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectBatch(selectedBatch)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleQuarantineBatch(selectedBatch)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Quarantine
                      </Button>
                    </div>
                  </div>
                )}

                {/* Advance Batch Status */}
                {hasPermission('batch.update') && !selectedBatch.isLocked && selectedBatch.status === 'In Progress' && (() => {
                  const next = getNextBatchStatus(selectedBatch.status);
                  if (!next) return null;
                  return (
                    <Button className="w-full" onClick={() => handleAdvanceBatchStatus(selectedBatch)}>
                      Advance to {next}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  );
                })()}

                {/* Lock Indicator */}
                {selectedBatch.isLocked && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <Lock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      This batch record is locked. {selectedBatch.status === 'Released' ? 'Released batches cannot be modified.' :
                        selectedBatch.status === 'Rejected' ? 'Rejected batches cannot be modified.' :
                        'Quarantined batches cannot be modified.'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal for QA Release */}
      <ElectronicSignatureModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onSign={handleSignatureConfirm}
        recordTitle={pendingReleaseBatch ? `${pendingReleaseBatch.lotNumber} — ${pendingReleaseBatch.productName}` : ''}
        recordId={pendingReleaseBatch?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
