
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createTraining, updateTraining, getTrainingOrgSettings } from '@/services/trainingService';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/lib/utils';
import type { Training, TrainingType, TrainingStatus, SignatureType } from '@/types/qms';
import {
  GraduationCap, Plus, Search, CheckCircle2, Clock, AlertTriangle,
  Eye, ArrowRight, FileText, BookOpen, Play, AlertCircle,
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusColors: Record<TrainingStatus, string> = {
  'Planned': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Overdue': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const trainingTypes: TrainingType[] = ['Onboarding', 'SOP', 'Regulatory', 'Skill', 'Certification'];
const trainingStatuses: TrainingStatus[] = ['Planned', 'In Progress', 'Completed', 'Overdue'];

/** Compute effective status: if dueDate is past and not Completed → Overdue */
function getEffectiveStatus(training: Training): TrainingStatus {
  if (training.status === 'Completed') return 'Completed';
  if (training.dueDate && new Date(training.dueDate) < new Date()) {
    return 'Overdue';
  }
  return training.status;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrainingView() {
  const { currentUser, hasPermission } = useAuth();
  const trainings = useQMSStore(state => state.training);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingCompleteTraining, setPendingCompleteTraining] = useState<Training | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<TrainingType>('SOP');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDocumentId, setFormDocumentId] = useState('');

  // Helpers
  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  // Compute effective statuses for all trainings
  const trainingsWithEffectiveStatus = useMemo(() =>
    trainings.map(t => ({ ...t, effectiveStatus: getEffectiveStatus(t) })),
    [trainings]
  );

  // Summary counts (based on effective status)
  const summaryCounts = useMemo(() => ({
    planned: trainingsWithEffectiveStatus.filter(t => t.effectiveStatus === 'Planned').length,
    inProgress: trainingsWithEffectiveStatus.filter(t => t.effectiveStatus === 'In Progress').length,
    completed: trainingsWithEffectiveStatus.filter(t => t.effectiveStatus === 'Completed').length,
    overdue: trainingsWithEffectiveStatus.filter(t => t.effectiveStatus === 'Overdue').length,
  }), [trainingsWithEffectiveStatus]);

  // Compliance percentage
  const compliancePercent = trainingsWithEffectiveStatus.length > 0
    ? Math.round((summaryCounts.completed / trainingsWithEffectiveStatus.length) * 100)
    : 0;

  // Filtered trainings
  const filteredTrainings = trainingsWithEffectiveStatus.filter(t => {
    const matchesSearch = searchTerm === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.effectiveStatus === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesAssignedTo = assignedToFilter === 'all' || t.assignedTo === assignedToFilter;
    return matchesSearch && matchesStatus && matchesType && matchesAssignedTo;
  });

  // Form helpers
  const resetForm = () => {
    setFormTitle('');
    setFormType('SOP');
    setFormDescription('');
    setFormAssignedTo('');
    setFormDueDate('');
    setFormDocumentId('');
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formAssignedTo) return;
    createTraining({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      status: 'Planned',
      assignedTo: formAssignedTo,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      documentId: formDocumentId && formDocumentId !== 'none' ? formDocumentId : undefined,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const openDetail = (training: Training) => {
    setSelectedTraining(training);
    setShowDetailDialog(true);
  };

  const handleAdvanceToInProgress = (training: Training) => {
    updateTraining(training.id, { status: 'In Progress' });
    if (selectedTraining?.id === training.id) {
      setSelectedTraining({ ...training, status: 'In Progress' });
    }
  };

  const handleCompleteTraining = (training: Training) => {
    // Check if e-signature is required (org setting)
    const orgSettings = getTrainingOrgSettings('org-001');
    if (orgSettings?.require_electronic_signatures) {
      setPendingCompleteTraining(training);
      setShowSignatureModal(true);
      return;
    }
    // No e-signature required, complete directly
    updateTraining(training.id, {
      status: 'Completed',
      completedDate: new Date().toISOString(),
    });
    if (selectedTraining?.id === training.id) {
      setSelectedTraining({ ...training, status: 'Completed', completedDate: new Date().toISOString() });
    }
  };

  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingCompleteTraining) return;
    updateTraining(pendingCompleteTraining.id, {
      status: 'Completed',
      completedDate: new Date().toISOString(),
    });
    if (selectedTraining?.id === pendingCompleteTraining.id) {
      setSelectedTraining({ ...pendingCompleteTraining, status: 'Completed', completedDate: new Date().toISOString() });
    }
    setPendingCompleteTraining(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingCompleteTraining(null);
    setShowSignatureModal(false);
  };

  // Linked document lookup
  const getLinkedDocument = (docId?: string) => {
    if (!docId) return null;
    return documents.find(d => d.id === docId) || null;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Training
          </h1>
          <p className="text-muted-foreground mt-1">Training management and compliance tracking</p>
        </div>
        {hasPermission('training.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Training
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Planned</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.planned}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{summaryCounts.inProgress}</span>
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
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{summaryCounts.overdue}</span>
          </CardContent>
        </Card>
      </div>

      {/* Training Compliance Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Training Compliance</span>
            </div>
            <span className="text-sm font-bold">{compliancePercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                'h-3 rounded-full transition-all duration-500',
                compliancePercent >= 80 ? 'bg-green-500' :
                compliancePercent >= 50 ? 'bg-amber-500' :
                'bg-red-500'
              )}
              style={{ width: `${compliancePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summaryCounts.completed} of {trainingsWithEffectiveStatus.length} training records completed
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search training..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {trainingStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {trainingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
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
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[140px]">Assigned To</TableHead>
                  <TableHead className="w-[110px]">Due Date</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[110px]">Completed</TableHead>
                  <TableHead className="w-[100px]">Document</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainings.map(training => {
                  const effectiveStatus = training.effectiveStatus;
                  const linkedDoc = getLinkedDocument(training.documentId);
                  return (
                    <TableRow
                      key={training.id}
                      className={cn(
                        'hover:bg-muted/50 cursor-pointer',
                        effectiveStatus === 'Overdue' ? 'bg-red-50/50 dark:bg-red-900/5' : ''
                      )}
                      onClick={() => openDetail(training)}
                    >
                      <TableCell>
                        <p className="font-medium">{training.title}</p>
                        {training.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{training.description}</p>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{training.type}</Badge></TableCell>
                      <TableCell className="text-sm">{getUserName(training.assignedTo)}</TableCell>
                      <TableCell className={cn(
                        'text-sm',
                        effectiveStatus === 'Overdue' ? 'text-red-600 font-medium' : 'text-muted-foreground'
                      )}>
                        {formatDate(training.dueDate, true)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', statusColors[effectiveStatus])} variant="secondary">
                          {effectiveStatus === 'Overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {effectiveStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {training.completedDate ? formatDate(training.completedDate, true) : '-'}
                      </TableCell>
                      <TableCell>
                        {linkedDoc ? (
                          <Badge variant="outline" className="text-xs font-mono">{linkedDoc.documentNumber}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(training); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTrainings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No training records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create Training Dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Training</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Training title" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as TrainingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Due Date *</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Training description..." rows={3} />
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
                <Label>Linked Document</Label>
                <Select value={formDocumentId || 'none'} onValueChange={setFormDocumentId}>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvedDocuments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.documentNumber} — {d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={!formTitle.trim() || !formAssignedTo}>
              Create Training
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          {selectedTraining && (() => {
            const effectiveStatus = getEffectiveStatus(selectedTraining);
            const linkedDoc = getLinkedDocument(selectedTraining.documentId);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedTraining.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn(statusColors[effectiveStatus])} variant="secondary">
                      {effectiveStatus === 'Overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {effectiveStatus}
                    </Badge>
                    <Badge variant="outline">{selectedTraining.type}</Badge>
                  </div>

                  {/* Status flow */}
                  <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                    {(['Planned', 'In Progress', 'Completed'] as TrainingStatus[]).map((s, i) => {
                      const isActive = s === effectiveStatus || (s === 'Completed' && effectiveStatus === 'Completed');
                      const isPast =
                        (s === 'Planned' && (effectiveStatus === 'In Progress' || effectiveStatus === 'Completed' || effectiveStatus === 'Overdue')) ||
                        (s === 'In Progress' && effectiveStatus === 'Completed');
                      return (
                        <React.Fragment key={s}>
                          <div className={cn(
                            'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                            isActive ? 'bg-primary text-primary-foreground' :
                            isPast ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {s}
                          </div>
                          {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                    {effectiveStatus === 'Overdue' && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mx-1" />
                        <div className="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Overdue
                        </div>
                      </>
                    )}
                  </div>

                  {/* Training metadata */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assigned To:</span>{' '}
                      <span className="font-medium">{getUserName(selectedTraining.assignedTo)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <span className="font-medium">{selectedTraining.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      <span className={cn('font-medium', effectiveStatus === 'Overdue' && 'text-red-600')}>
                        {formatDate(selectedTraining.dueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      <span className="font-medium">{formatDate(selectedTraining.createdAt)}</span>
                    </div>
                    {selectedTraining.completedDate && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span>{' '}
                        <span className="font-medium text-green-600">{formatDate(selectedTraining.completedDate)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Updated:</span>{' '}
                      <span className="font-medium">{formatDate(selectedTraining.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedTraining.description && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedTraining.description}</p>
                    </div>
                  )}

                  {/* Linked Document */}
                  {linkedDoc && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Linked Document
                      </h4>
                      <div className="bg-muted/30 p-3 rounded-md flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">{linkedDoc.documentNumber}</Badge>
                        <span className="text-sm">{linkedDoc.title}</span>
                        <Badge className={cn(
                          'text-xs ml-auto',
                          linkedDoc.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
                        )} variant="secondary">{linkedDoc.status}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Overdue warning */}
                  {effectiveStatus === 'Overdue' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700 dark:text-red-400">
                        <p className="font-medium">Training Overdue</p>
                        <p className="mt-0.5">This training was due on {formatDate(selectedTraining.dueDate)} and has not been completed.</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Action buttons */}
                  {hasPermission('training.update') && effectiveStatus !== 'Completed' && (
                    <div className="flex gap-2">
                      {effectiveStatus === 'Planned' && (
                        <Button className="flex-1" onClick={() => handleAdvanceToInProgress(selectedTraining)}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Training
                        </Button>
                      )}
                      {(effectiveStatus === 'In Progress' || effectiveStatus === 'Overdue') && (
                        <Button className="flex-1" onClick={() => handleCompleteTraining(selectedTraining)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Electronic Signature Modal ─── */}
      <ElectronicSignatureModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onSign={handleSignatureConfirm}
        recordTitle={pendingCompleteTraining ? pendingCompleteTraining.title : ''}
        recordId={pendingCompleteTraining?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
