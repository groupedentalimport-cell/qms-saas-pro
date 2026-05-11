
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createNCR, updateNCR } from '@/services/ncrService';
import { useAuth } from '@/contexts/AuthContext';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/lib/utils';
import type { NonConformance, NcrStatus, NcrDisposition, SignatureType } from '@/types/qms';
import {
  FlaskConical, Search, Eye, ArrowRight, CheckCircle2,
  AlertTriangle, XCircle, AlertCircle, ChevronRight, Plus,
  ShieldCheck, ClipboardCheck, Beaker, Ban, Gavel,
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

const phase1ConclusionColors: Record<string, string> = {
  'Error Found': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'No Error Found': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const phase2ConclusionColors: Record<string, string> = {
  'Confirmed OOS': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Invalidated': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ncrStatusColors: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Pending Disposition': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const dispositionColors: Record<string, string> = {
  'Use As Is': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rework': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Scrap': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Return to Supplier': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

type OosOotType = 'OOS' | 'OOT';

export function OosOotView() {
  const { currentUser, hasPermission } = useAuth();
  const ncrs = useQMSStore(state => state.ncrs);
  const profiles = useQMSStore(state => state.profiles);

  // Filter to only OOS/OOT NCRs
  const oosOotNcrs = useMemo(() => ncrs.filter(n => n.isOosOot), [ncrs]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [conclusionFilter, setConclusionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NonConformance | null>(null);

  // Phase advancement state
  const [phase1Conclusion, setPhase1Conclusion] = useState<string>('');
  const [phase2Conclusion, setPhase2Conclusion] = useState<string>('');
  const [rejectLotDecision, setRejectLotDecision] = useState<boolean>(false);

  // Lab investigation checklist
  const [labChecklist, setLabChecklist] = useState({
    analystError: false,
    calculationError: false,
    instrumentMalfunction: false,
    samplePrepError: false,
  });

  // Disposition decision
  const [disposition, setDisposition] = useState<NcrDisposition>('Pending');

  // E-signature
  const [showEsigModal, setShowEsigModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<OosOotType>('OOS');
  const [createLotNumber, setCreateLotNumber] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createAnalyticalMethod, setCreateAnalyticalMethod] = useState('');
  const [createMeasuredValue, setCreateMeasuredValue] = useState('');
  const [createMeasuredUnit, setCreateMeasuredUnit] = useState('');
  const [createSpecLimit, setCreateSpecLimit] = useState('');
  const [createAssignedTo, setCreateAssignedTo] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');

  // Filtered NCRs
  const filteredNcrs = useMemo(() => {
    return oosOotNcrs.filter(ncr => {
      const matchesSearch = searchTerm === '' ||
        ncr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ncr.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ncr.lotNumber && ncr.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || ncr.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || ncr.status === statusFilter;

      // Phase filter
      let matchesPhase = true;
      if (phaseFilter === 'phase1_pending') {
        matchesPhase = !ncr.phase1Conclusion || ncr.phase1Conclusion === 'Pending';
      } else if (phaseFilter === 'phase2_required') {
        matchesPhase = ncr.phase2Required;
      } else if (phaseFilter === 'phase2_pending') {
        matchesPhase = ncr.phase2Required && (!ncr.phase2Conclusion || ncr.phase2Conclusion === 'Pending');
      }

      // Conclusion filter
      let matchesConclusion = true;
      if (conclusionFilter === 'confirmed_oos') {
        matchesConclusion = ncr.phase2Conclusion === 'Confirmed OOS';
      } else if (conclusionFilter === 'invalidated') {
        matchesConclusion = ncr.phase2Conclusion === 'Invalidated' || (ncr.phase1Conclusion === 'No Error Found' && !ncr.phase2Required);
      } else if (conclusionFilter === 'error_found') {
        matchesConclusion = ncr.phase1Conclusion === 'Error Found';
      } else if (conclusionFilter === 'no_error') {
        matchesConclusion = ncr.phase1Conclusion === 'No Error Found';
      }

      return matchesSearch && matchesType && matchesStatus && matchesPhase && matchesConclusion;
    });
  }, [oosOotNcrs, searchTerm, typeFilter, statusFilter, phaseFilter, conclusionFilter]);

  // Summary counts
  const summaryCounts = useMemo(() => ({
    oosCount: oosOotNcrs.filter(n => n.type === 'OOS').length,
    ootCount: oosOotNcrs.filter(n => n.type === 'OOT').length,
    phase1Pending: oosOotNcrs.filter(n => !n.phase1Conclusion || n.phase1Conclusion === 'Pending').length,
    phase2Confirmed: oosOotNcrs.filter(n => n.phase2Conclusion === 'Confirmed OOS').length,
  }), [oosOotNcrs]);

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const openDetail = (ncr: NonConformance) => {
    setSelectedNcr(ncr);
    setPhase1Conclusion(ncr.phase1Conclusion || '');
    setPhase2Conclusion(ncr.phase2Conclusion || '');
    setRejectLotDecision(ncr.rejectLot);
    setDisposition(ncr.disposition || 'Pending');
    setLabChecklist({
      analystError: false,
      calculationError: false,
      instrumentMalfunction: false,
      samplePrepError: false,
    });
    setShowDetailDialog(true);
  };

  const resetCreateForm = () => {
    setCreateTitle('');
    setCreateType('OOS');
    setCreateLotNumber('');
    setCreateDescription('');
    setCreateAnalyticalMethod('');
    setCreateMeasuredValue('');
    setCreateMeasuredUnit('');
    setCreateSpecLimit('');
    setCreateAssignedTo('');
    setCreateDueDate('');
  };

  const handleCreateOosOot = () => {
    if (!createTitle) return;
    const ncrCount = ncrs.length;
    createNCR({
      ncrNumber: `NCR-2024-${String(ncrCount + 1).padStart(3, '0')}`,
      title: createTitle,
      type: createType,
      status: 'Open',
      severity: 'Major',
      source: 'Quality Control Testing',
      description: createDescription,
      lotNumber: createLotNumber || undefined,
      disposition: 'Pending',
      isOosOot: true,
      analyticalMethod: createAnalyticalMethod || undefined,
      measuredValue: createMeasuredValue ? parseFloat(createMeasuredValue) : undefined,
      measuredUnit: createMeasuredUnit || undefined,
      specLimit: createSpecLimit || undefined,
      phase1Conclusion: 'Pending',
      phase2Required: false,
      phase2Conclusion: 'Pending',
      rejectLot: false,
      assignedTo: createAssignedTo || undefined,
      createdDate: new Date().toISOString(),
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });
    resetCreateForm();
    setShowCreateDialog(false);
  };

  const handleAdvancePhase1 = () => {
    if (!selectedNcr || !phase1Conclusion) return;
    const updates: Partial<NonConformance> = {
      phase1Conclusion: phase1Conclusion as NonConformance['phase1Conclusion'],
      status: 'Under Investigation' as NcrStatus,
    };
    if (phase1Conclusion === 'Error Found') {
      // Error found → can invalidate, but also might proceed to Phase 2 for thoroughness
      updates.phase2Required = true;
    } else if (phase1Conclusion === 'No Error Found') {
      // No error found → must proceed to Phase 2
      updates.phase2Required = true;
    }
    updateNCR(selectedNcr.id, updates);
    setSelectedNcr({ ...selectedNcr, ...updates });
  };

  const handleAdvancePhase2 = () => {
    if (!selectedNcr || !phase2Conclusion) return;
    const updates: Partial<NonConformance> = {
      phase2Conclusion: phase2Conclusion as NonConformance['phase2Conclusion'],
      rejectLot: rejectLotDecision,
      status: 'Pending Disposition' as NcrStatus,
    };
    updateNCR(selectedNcr.id, updates);
    setSelectedNcr({ ...selectedNcr, ...updates });
  };

  const handleSetDisposition = () => {
    if (!selectedNcr || disposition === 'Pending') return;
    // Require e-signature for disposition
    setPendingAction('disposition');
    setShowEsigModal(true);
  };

  const handleEsigSign = (data: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!selectedNcr) return;
    if (pendingAction === 'disposition') {
      const updates: Partial<NonConformance> = {
        disposition,
        status: 'Closed' as NcrStatus,
      };
      updateNCR(selectedNcr.id, updates);
      setSelectedNcr({ ...selectedNcr, ...updates });
    }
    setShowEsigModal(false);
    setPendingAction('');
  };

  const isMeasuredValueOutOfSpec = (ncr: NonConformance) => {
    if (ncr.measuredValue === undefined || !ncr.specLimit) return false;
    // Parse spec like "95.0-105.0%"
    const specMatch = ncr.specLimit.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (specMatch) {
      const min = parseFloat(specMatch[1]);
      const max = parseFloat(specMatch[2]);
      return ncr.measuredValue < min || ncr.measuredValue > max;
    }
    return true; // Can't parse, assume out of spec
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            OOS / OOT Investigations
          </h1>
          <p className="text-muted-foreground mt-1">Out of Specification / Out of Trend — FDA &amp; ICH Q2(R1) Guidance</p>
        </div>
        {hasPermission('ncr.create') && (
          <Button onClick={() => { resetCreateForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />Create OOS/OOT
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">OOS Count</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.oosCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">OOT Count</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.ootCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Phase 1 Pending</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.phase1Pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Phase 2 Confirmed</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.phase2Confirmed}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search OOS/OOT (title, NCR#, lot#)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="OOS">OOS</SelectItem>
            <SelectItem value="OOT">OOT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="phase1_pending">Phase 1 Pending</SelectItem>
            <SelectItem value="phase2_required">Phase 2 Required</SelectItem>
            <SelectItem value="phase2_pending">Phase 2 Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={conclusionFilter} onValueChange={setConclusionFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Conclusion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conclusions</SelectItem>
            <SelectItem value="confirmed_oos">Confirmed OOS</SelectItem>
            <SelectItem value="invalidated">Invalidated</SelectItem>
            <SelectItem value="error_found">Error Found</SelectItem>
            <SelectItem value="no_error">No Error Found</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(['Open', 'Under Investigation', 'Pending Disposition', 'Closed'] as NcrStatus[]).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  <TableHead className="w-[130px]">NCR #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[70px]">Type</TableHead>
                  <TableHead className="w-[110px]">Lot #</TableHead>
                  <TableHead className="w-[180px]">Analytical Method</TableHead>
                  <TableHead className="w-[120px]">Measured vs Spec</TableHead>
                  <TableHead className="w-[120px]">Phase 1</TableHead>
                  <TableHead className="w-[120px]">Phase 2</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNcrs.map(ncr => (
                  <TableRow key={ncr.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(ncr)}>
                    <TableCell className="font-mono text-xs">{ncr.ncrNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-xs">{ncr.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'text-xs',
                        ncr.type === 'OOS'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      )} variant="secondary">{ncr.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ncr.lotNumber || '-'}</TableCell>
                    <TableCell className="text-xs">{ncr.analyticalMethod || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn(
                          'text-sm font-medium',
                          isMeasuredValueOutOfSpec(ncr) && 'text-red-600 dark:text-red-400'
                        )}>
                          {ncr.measuredValue !== undefined ? `${ncr.measuredValue} ${ncr.measuredUnit || ''}` : '-'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">vs {ncr.specLimit || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ncr.phase1Conclusion && ncr.phase1Conclusion !== 'Pending' ? (
                        <Badge className={cn('text-xs', phase1ConclusionColors[ncr.phase1Conclusion] || '')} variant="secondary">
                          {ncr.phase1Conclusion}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ncr.phase2Required ? (
                        ncr.phase2Conclusion && ncr.phase2Conclusion !== 'Pending' ? (
                          <Badge className={cn('text-xs', phase2ConclusionColors[ncr.phase2Conclusion] || '')} variant="secondary">
                            {ncr.phase2Conclusion}
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" variant="secondary">
                            Required
                          </Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', ncrStatusColors[ncr.status] || '')} variant="secondary">{ncr.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(ncr); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNcrs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No OOS/OOT records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create OOS/OOT Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Create OOS/OOT Investigation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>NCR Number</Label>
                <Input value={`NCR-2024-${String(ncrs.length + 1).padStart(3, '0')}`} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={createType} onValueChange={(v) => setCreateType(v as OosOotType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OOS">OOS - Out of Specification</SelectItem>
                    <SelectItem value="OOT">OOT - Out of Trend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., Out of Specification Result - API Assay" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lot Number</Label>
                <Input value={createLotNumber} onChange={(e) => setCreateLotNumber(e.target.value)} placeholder="BN-2024-XXX" />
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select value={createAssignedTo} onValueChange={setCreateAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Describe the OOS/OOT finding..." rows={3} />
            </div>

            <Separator />
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Beaker className="h-4 w-4 text-primary" />
              Specification Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Analytical Method</Label>
                <Input value={createAnalyticalMethod} onChange={(e) => setCreateAnalyticalMethod(e.target.value)} placeholder="e.g., HPLC Method QC-M-001" />
              </div>
              <div className="grid gap-2">
                <Label>Specification Limit</Label>
                <Input value={createSpecLimit} onChange={(e) => setCreateSpecLimit(e.target.value)} placeholder="e.g., 95.0-105.0%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Measured Value</Label>
                <Input type="number" value={createMeasuredValue} onChange={(e) => setCreateMeasuredValue(e.target.value)} placeholder="e.g., 92.3" />
              </div>
              <div className="grid gap-2">
                <Label>Measured Unit</Label>
                <Input value={createMeasuredUnit} onChange={(e) => setCreateMeasuredUnit(e.target.value)} placeholder="e.g., %, mg/L, ppm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} />
              </div>
            </div>

            <Button className="w-full" onClick={handleCreateOosOot} disabled={!createTitle}>
              <Plus className="h-4 w-4 mr-2" />Create Investigation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
          {selectedNcr && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <span className="font-mono text-sm text-muted-foreground">{selectedNcr.ncrNumber}</span>
                  {selectedNcr.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Status & Type Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(ncrStatusColors[selectedNcr.status] || '')} variant="secondary">{selectedNcr.status}</Badge>
                  <Badge className={cn(
                    selectedNcr.type === 'OOS'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )} variant="secondary">{selectedNcr.type}</Badge>
                  {selectedNcr.severity && <Badge variant="outline">{selectedNcr.severity}</Badge>}
                  {selectedNcr.rejectLot && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" variant="secondary">
                      <Ban className="h-3 w-3 mr-1" />Reject Lot
                    </Badge>
                  )}
                </div>

                {/* Basic NCR Info */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">NCR Number:</span> <span className="font-medium ml-1 font-mono text-xs">{selectedNcr.ncrNumber}</span></div>
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium ml-1">{selectedNcr.type}</span></div>
                    <div><span className="text-muted-foreground">Lot Number:</span> <span className="font-medium ml-1 font-mono text-xs">{selectedNcr.lotNumber || '-'}</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <Badge className={cn('text-xs ml-1', ncrStatusColors[selectedNcr.status])} variant="secondary">{selectedNcr.status}</Badge></div>
                    <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium ml-1">{getUserName(selectedNcr.assignedTo)}</span></div>
                    <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{formatDate(selectedNcr.createdDate)}</span></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm mb-1">Description</h5>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedNcr.description}</p>
                  </div>
                </div>

                {/* Specification Info Section */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-primary" />
                    Specification Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-md p-3">
                      <span className="text-xs text-muted-foreground block mb-1">Analytical Method</span>
                      <span className="font-medium text-sm">{selectedNcr.analyticalMethod || '-'}</span>
                    </div>
                    <div className="bg-muted/30 rounded-md p-3">
                      <span className="text-xs text-muted-foreground block mb-1">Specification Limit</span>
                      <span className="font-mono text-sm font-medium">{selectedNcr.specLimit || '-'}</span>
                    </div>
                  </div>
                  <div className={cn(
                    'rounded-md p-4 border-2',
                    isMeasuredValueOutOfSpec(selectedNcr)
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800'
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Measured Value</span>
                        <span className={cn(
                          'text-2xl font-bold',
                          isMeasuredValueOutOfSpec(selectedNcr) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        )}>
                          {selectedNcr.measuredValue !== undefined ? `${selectedNcr.measuredValue} ${selectedNcr.measuredUnit || ''}` : '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block mb-1">Specification</span>
                        <span className="text-sm font-mono font-medium">{selectedNcr.specLimit || '-'}</span>
                      </div>
                      {isMeasuredValueOutOfSpec(selectedNcr) && (
                        <div className="flex items-center gap-1 ml-4">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">OUT OF SPEC</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Investigation Workflow Progress */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  <div className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                    selectedNcr.status === 'Open' ? 'bg-primary text-primary-foreground' :
                    selectedNcr.phase1Conclusion && selectedNcr.phase1Conclusion !== 'Pending'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-primary text-primary-foreground'
                  )}>
                    Open
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <div className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                    selectedNcr.status === 'Under Investigation' ? 'bg-primary text-primary-foreground' :
                    selectedNcr.phase1Conclusion && selectedNcr.phase1Conclusion !== 'Pending'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    Phase 1: {selectedNcr.phase1Conclusion && selectedNcr.phase1Conclusion !== 'Pending' ? selectedNcr.phase1Conclusion : 'Pending'}
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <div className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                    !selectedNcr.phase2Required ? 'bg-muted text-muted-foreground' :
                    selectedNcr.status === 'Pending Disposition' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    selectedNcr.phase2Conclusion && selectedNcr.phase2Conclusion !== 'Pending'
                      ? selectedNcr.phase2Conclusion === 'Confirmed OOS'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    Phase 2: {!selectedNcr.phase2Required ? 'N/A' :
                      selectedNcr.phase2Conclusion && selectedNcr.phase2Conclusion !== 'Pending'
                        ? selectedNcr.phase2Conclusion : 'Pending'}
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <div className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                    selectedNcr.status === 'Pending Disposition' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    selectedNcr.status === 'Closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-muted text-muted-foreground'
                  )}>
                    Disposition
                  </div>
                </div>

                {/* Phase 1 Investigation */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">Phase 1</span>
                    Laboratory Investigation
                  </h4>

                  {/* Laboratory Investigation Checklist */}
                  <div className="bg-muted/30 rounded-md p-3 space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Laboratory Investigation Checklist</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'analystError' as const, label: 'Analyst Error?' },
                        { key: 'calculationError' as const, label: 'Calculation Error?' },
                        { key: 'instrumentMalfunction' as const, label: 'Instrument Malfunction?' },
                        { key: 'samplePrepError' as const, label: 'Sample Preparation Error?' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={labChecklist[item.key]}
                            onChange={(e) => setLabChecklist({ ...labChecklist, [item.key]: e.target.checked })}
                            className="rounded border-gray-300"
                            disabled={!!(selectedNcr.phase1Conclusion && selectedNcr.phase1Conclusion !== 'Pending')}
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Phase 1 Conclusion:</span>
                      {selectedNcr.phase1Conclusion && selectedNcr.phase1Conclusion !== 'Pending' ? (
                        <Badge className={cn(phase1ConclusionColors[selectedNcr.phase1Conclusion] || '')} variant="secondary">
                          {selectedNcr.phase1Conclusion}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                      )}
                    </div>
                    {hasPermission('ncr.update') && (!selectedNcr.phase1Conclusion || selectedNcr.phase1Conclusion === 'Pending') && (
                      <div className="flex items-center gap-2">
                        <Select value={phase1Conclusion} onValueChange={setPhase1Conclusion}>
                          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Select conclusion" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Error Found">Error Found</SelectItem>
                            <SelectItem value="No Error Found">No Error Found</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleAdvancePhase1} disabled={!phase1Conclusion}>
                          Advance <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {selectedNcr.phase1Conclusion === 'Error Found' && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md p-2 text-xs text-amber-700 dark:text-amber-400">
                      An error was found during laboratory investigation. The result may be invalidated. Phase 2 investigation is required to confirm root cause.
                    </div>
                  )}
                  {selectedNcr.phase1Conclusion === 'No Error Found' && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-xs text-blue-700 dark:text-blue-400">
                      No error found in laboratory investigation. The OOS result cannot be invalidated — Phase 2 full-scale investigation is required.
                    </div>
                  )}
                </div>

                {/* Phase 2 Investigation (if required) */}
                {selectedNcr.phase2Required && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded text-xs font-medium">Phase 2</span>
                      Full-Scale Investigation
                    </h4>
                    {(!selectedNcr.phase1Conclusion || selectedNcr.phase1Conclusion === 'Pending') ? (
                      <div className="bg-muted/30 rounded-md p-3 text-sm text-muted-foreground">
                        Phase 2 investigation requires Phase 1 to be concluded first. Complete the Phase 1 laboratory investigation before proceeding.
                      </div>
                    ) : (
                      <>
                        <div className="bg-muted/30 rounded-md p-3 space-y-1 text-sm">
                          <p>Phase 2 is required because <strong>{selectedNcr.phase1Conclusion === 'No Error Found' ? 'no assignable error was found in Phase 1' : 'an error was found but the result must be confirmed through expanded investigation'}</strong>.</p>
                          <p className="text-muted-foreground">This investigation must cover manufacturing process review, environmental conditions, equipment, materials, and personnel.</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Phase 2 Conclusion:</span>
                            {selectedNcr.phase2Conclusion && selectedNcr.phase2Conclusion !== 'Pending' ? (
                              <Badge className={cn(phase2ConclusionColors[selectedNcr.phase2Conclusion] || '')} variant="secondary">
                                {selectedNcr.phase2Conclusion}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                            )}
                          </div>
                          {hasPermission('ncr.update') && (!selectedNcr.phase2Conclusion || selectedNcr.phase2Conclusion === 'Pending') && (
                            <div className="flex items-center gap-2">
                              <Select value={phase2Conclusion} onValueChange={setPhase2Conclusion}>
                                <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Select conclusion" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Confirmed OOS">Confirmed OOS</SelectItem>
                                  <SelectItem value="Invalidated">Invalidated</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={handleAdvancePhase2} disabled={!phase2Conclusion}>
                                Conclude <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Confirmed OOS → rejection decision */}
                        {selectedNcr.phase2Conclusion === 'Confirmed OOS' && (
                          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-700 dark:text-red-400">OOS Confirmed — Lot Disposition Required</span>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400">The OOS result has been confirmed. A lot disposition decision must be made.</p>
                          </div>
                        )}

                        {/* Reject Lot Decision */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Reject Lot Decision:</span>
                            {selectedNcr.phase2Conclusion && selectedNcr.phase2Conclusion !== 'Pending' ? (
                              selectedNcr.rejectLot ? (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" variant="secondary">
                                  <Ban className="h-3 w-3 mr-1" />Yes — Reject Lot
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />No — Do Not Reject
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                            )}
                          </div>
                          {hasPermission('ncr.update') && (!selectedNcr.phase2Conclusion || selectedNcr.phase2Conclusion === 'Pending') && (
                            <Button
                              size="sm"
                              variant={rejectLotDecision ? 'destructive' : 'outline'}
                              onClick={() => setRejectLotDecision(!rejectLotDecision)}
                            >
                              {rejectLotDecision ? 'Reject Lot' : 'Do Not Reject Lot'}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Disposition Decision */}
                {(selectedNcr.status === 'Pending Disposition' || selectedNcr.disposition && selectedNcr.disposition !== 'Pending') && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      Disposition Decision
                    </h4>
                    {selectedNcr.disposition && selectedNcr.disposition !== 'Pending' ? (
                      <div className="flex items-center gap-3">
                        <Badge className={cn('text-sm', dispositionColors[selectedNcr.disposition] || '')} variant="secondary">
                          {selectedNcr.disposition}
                        </Badge>
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">E-signature verified</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(['Use As Is', 'Rework', 'Scrap', 'Return to Supplier'] as NcrDisposition[]).map(d => (
                            <Button
                              key={d}
                              variant={disposition === d ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => setDisposition(d)}
                            >
                              {d}
                            </Button>
                          ))}
                        </div>
                        {hasPermission('ncr.approve') && (
                          <Button
                            onClick={handleSetDisposition}
                            disabled={disposition === 'Pending'}
                            className="w-full"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Apply Disposition with Electronic Signature
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Lot Disposition */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Lot Disposition
                  </h4>
                  <div className={cn(
                    'rounded-md p-4 flex items-center gap-3',
                    selectedNcr.rejectLot
                      ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                  )}>
                    {selectedNcr.rejectLot ? (
                      <>
                        <Ban className="h-6 w-6 text-red-500" />
                        <div>
                          <span className="font-medium text-red-700 dark:text-red-400">LOT REJECTED</span>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">This lot must be rejected based on the confirmed OOS result.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <div>
                          <span className="font-medium text-green-700 dark:text-green-400">LOT NOT REJECTED</span>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">The lot disposition decision is to not reject this lot.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Linked References */}
                {selectedNcr.linkedCapaId && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      Linked CAPA
                    </h4>
                    <div className="text-sm">
                      <span className="font-mono text-xs">{selectedNcr.linkedCapaId}</span>
                      {(() => {
                        const capa = useQMSStore.getState().capas.find(c => c.id === selectedNcr.linkedCapaId);
                        return capa ? (
                          <span className="ml-2 text-muted-foreground">— {capa.title}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal */}
      <ElectronicSignatureModal
        open={showEsigModal}
        onClose={() => { setShowEsigModal(false); setPendingAction(''); }}
        onSign={handleEsigSign}
        recordTitle={selectedNcr?.title || 'OOS/OOT Investigation'}
        recordId={selectedNcr?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
