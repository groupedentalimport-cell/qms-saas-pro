
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createChangeControl, updateChangeControl } from '@/services/changeControlService';
import { checkPrerequisites } from '@/services/prerequisiteService';
import type {
  ChangeControl, ChangeControlStatus, ChangeControlType,
  ChangeControlPriority, ChangeControlCategory, SignatureType, ElectronicSignature,
} from '@/types/qms';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/lib/utils';
import {
  ArrowLeftRight, Plus, Search, Eye, ArrowRight, CheckCircle2,
  AlertTriangle, Clock, XCircle, ShieldCheck, FileText, Link2,
  ClipboardList, AlertOctagon, BarChart3, Wrench, User,
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

const statusColors: Record<ChangeControlStatus, string> = {
  'Requested': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Approved': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'In Implementation': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityColors: Record<ChangeControlPriority, string> = {
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Low': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const statusFlow: ChangeControlStatus[] = [
  'Requested', 'Under Review', 'Approved', 'In Implementation', 'Completed',
];

function getNextStatus(current: ChangeControlStatus): ChangeControlStatus | null {
  if (current === 'Rejected') return null;
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

const allCategories: ChangeControlCategory[] = [
  'Process', 'Equipment', 'Facility', 'Document', 'Material', 'Computer System', 'Organizational',
];

export function ChangeControlView() {
  const { currentUser, hasPermission } = useAuth();
  const changeControls = useQMSStore(state => state.changeControls);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);
  const capas = useQMSStore(state => state.capas);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCC, setSelectedCC] = useState<ChangeControl | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingStatusAdvance, setPendingStatusAdvance] = useState<ChangeControl | null>(null);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ChangeControlType>('Planned');
  const [formPriority, setFormPriority] = useState<ChangeControlPriority>('Medium');
  const [formCategory, setFormCategory] = useState<ChangeControlCategory>('Process');
  const [formDescription, setFormDescription] = useState('');
  const [formJustification, setFormJustification] = useState('');
  const [formProposedChange, setFormProposedChange] = useState('');
  const [formRiskAssessment, setFormRiskAssessment] = useState('');
  const [formImpactAnalysis, setFormImpactAnalysis] = useState('');
  const [formImplementationPlan, setFormImplementationPlan] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formLinkedDocId, setFormLinkedDocId] = useState('');
  const [formLinkedCapaId, setFormLinkedCapaId] = useState('');

  const filteredCCs = changeControls.filter(cc => {
    const matchesSearch = searchTerm === '' ||
      cc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cc.ccNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cc.status === statusFilter;
    const matchesType = typeFilter === 'all' || cc.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || cc.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || cc.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesCategory;
  });

  const summaryCounts = {
    requested: changeControls.filter(c => c.status === 'Requested').length,
    underReview: changeControls.filter(c => c.status === 'Under Review').length,
    approved: changeControls.filter(c => c.status === 'Approved').length,
    inImplementation: changeControls.filter(c => c.status === 'In Implementation').length,
    completed: changeControls.filter(c => c.status === 'Completed').length,
    rejected: changeControls.filter(c => c.status === 'Rejected').length,
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
    setFormType('Planned');
    setFormPriority('Medium');
    setFormCategory('Process');
    setFormDescription('');
    setFormJustification('');
    setFormProposedChange('');
    setFormRiskAssessment('');
    setFormImpactAnalysis('');
    setFormImplementationPlan('');
    setFormAssignedTo('');
    setFormDueDate('');
    setFormLinkedDocId('');
    setFormLinkedCapaId('');
    setPrereqError(null);
  };

  const handleCreate = () => {
    const prereqResult = checkPrerequisites('CHANGE_CONTROL', 'org-001');
    if (!prereqResult.met) {
      setPrereqError(`Prerequisite not met: ${prereqResult.missing.map(p => p.description).join(', ')}`);
      return;
    }
    setPrereqError(null);

    createChangeControl({
      ccNumber: `CC-2024-${String(changeControls.length + 1).padStart(3, '0')}`,
      title: formTitle,
      type: formType,
      status: 'Requested',
      priority: formPriority,
      category: formCategory,
      description: formDescription,
      justification: formJustification,
      proposedChange: formProposedChange,
      riskAssessment: formRiskAssessment || undefined,
      impactAnalysis: formImpactAnalysis || undefined,
      implementationPlan: formImplementationPlan || undefined,
      assignedTo: formAssignedTo,
      requestedBy: currentUser?.id || '',
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      linkedDocumentId: formLinkedDocId && formLinkedDocId !== 'none' ? formLinkedDocId : undefined,
      linkedCapaId: formLinkedCapaId && formLinkedCapaId !== 'none' ? formLinkedCapaId : undefined,
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const openDetail = (cc: ChangeControl) => {
    setSelectedCC(cc);
    setShowDetailDialog(true);
  };

  // Status advancement — approval step requires e-signature
  const handleAdvanceStatus = (cc: ChangeControl) => {
    const next = getNextStatus(cc.status);
    if (!next) return;

    if (next === 'Approved') {
      setPendingStatusAdvance(cc);
      setShowSignatureModal(true);
      return;
    }

    const updates: Partial<ChangeControl> = { status: next };
    if (next === 'In Implementation') {
      updates.implementationDate = new Date().toISOString();
    }
    if (next === 'Completed') {
      updates.completionDate = new Date().toISOString();
    }
    updateChangeControl(cc.id, updates);
    if (selectedCC?.id === cc.id) {
      setSelectedCC({ ...cc, ...updates });
    }
  };

  // E-signature callback for approval
  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingStatusAdvance) return;
    const cc = pendingStatusAdvance;
    updateChangeControl(cc.id, {
      status: 'Approved',
      approvedBy: currentUser?.id,
    });
    if (selectedCC?.id === cc.id) {
      setSelectedCC({ ...cc, status: 'Approved', approvedBy: currentUser?.id });
    }
    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  // Rejection only at Under Review stage
  const handleReject = (cc: ChangeControl) => {
    updateChangeControl(cc.id, { status: 'Rejected' });
    if (selectedCC?.id === cc.id) {
      setSelectedCC({ ...cc, status: 'Rejected' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            Change Control
          </h1>
          <p className="text-muted-foreground mt-1">Change management and approval workflow</p>
        </div>
        {hasPermission('ncr.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Change Control
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Requested</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.requested}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Under Review</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.underReview}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.approved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">In Implementation</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.inImplementation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.completed}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.rejected}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Change Controls..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(['Requested', 'Under Review', 'Approved', 'In Implementation', 'Completed', 'Rejected'] as ChangeControlStatus[]).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(['Planned', 'Unplanned', 'Emergency'] as ChangeControlType[]).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {(['Critical', 'High', 'Medium', 'Low'] as ChangeControlPriority[]).map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
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
                  <TableHead className="w-[130px]">CC #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[110px]">Type</TableHead>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[140px]">Assigned To</TableHead>
                  <TableHead className="w-[110px]">Due Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCCs.map(cc => (
                  <TableRow key={cc.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(cc)}>
                    <TableCell className="font-mono text-xs">{cc.ccNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-xs">{cc.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        cc.type === 'Emergency' ? 'border-red-300 text-red-700' :
                        cc.type === 'Unplanned' ? 'border-amber-300 text-amber-700' :
                        'border-green-300 text-green-700'
                      )}>
                        {cc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', priorityColors[cc.priority])} variant="secondary">{cc.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{cc.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[cc.status])} variant="secondary">{cc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getUserName(cc.assignedTo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(cc.dueDate, true)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(cc); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCCs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No Change Controls found matching filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Change Control Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Change Control</DialogTitle>
          </DialogHeader>
          {prereqError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{prereqError}</p>
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Change Control title" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ChangeControlType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Unplanned">Unplanned</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority *</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as ChangeControlPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ChangeControlCategory)}>
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
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe the change..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Justification *</Label>
              <Textarea value={formJustification} onChange={(e) => setFormJustification(e.target.value)} placeholder="Why is this change needed?" rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Proposed Change *</Label>
              <Textarea value={formProposedChange} onChange={(e) => setFormProposedChange(e.target.value)} placeholder="What is the proposed change?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Risk Assessment</Label>
                <Textarea value={formRiskAssessment} onChange={(e) => setFormRiskAssessment(e.target.value)} placeholder="Risk assessment..." rows={2} />
              </div>
              <div className="grid gap-2">
                <Label>Impact Analysis</Label>
                <Textarea value={formImpactAnalysis} onChange={(e) => setFormImpactAnalysis(e.target.value)} placeholder="Impact analysis..." rows={2} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Implementation Plan</Label>
              <Textarea value={formImplementationPlan} onChange={(e) => setFormImplementationPlan(e.target.value)} placeholder="Implementation plan..." rows={2} />
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
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!formTitle || !formDescription || !formJustification || !formProposedChange || !formAssignedTo}>
              Create Change Control
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          {selectedCC && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedCC.ccNumber}</span>
                  {selectedCC.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Priority Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedCC.status])} variant="secondary">{selectedCC.status}</Badge>
                  <Badge variant="outline" className={cn(
                    selectedCC.type === 'Emergency' ? 'border-red-300 text-red-700' :
                    selectedCC.type === 'Unplanned' ? 'border-amber-300 text-amber-700' :
                    'border-green-300 text-green-700'
                  )}>{selectedCC.type}</Badge>
                  <Badge className={cn(priorityColors[selectedCC.priority])} variant="secondary">{selectedCC.priority}</Badge>
                  <Badge variant="outline">{selectedCC.category}</Badge>
                </div>

                {/* Status Flow Visualization */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {statusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedCC.status ? 'bg-primary text-primary-foreground' :
                        statusFlow.indexOf(s) < statusFlow.indexOf(selectedCC.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < statusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                  {/* Rejected branch */}
                  {selectedCC.status === 'Rejected' && (
                    <>
                      <ArrowRight className="h-3 w-3 text-red-400 flex-shrink-0" />
                      <div className="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Rejected
                      </div>
                    </>
                  )}
                  {/* Show rejection branch indicator from Under Review */}
                  {selectedCC.status === 'Under Review' && (
                    <>
                      <span className="text-muted-foreground text-xs mx-1">or</span>
                      <div className="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-red-50 text-red-400 border border-dashed border-red-300 dark:bg-red-900/10 dark:text-red-400">
                        Rejected
                      </div>
                    </>
                  )}
                </div>

                {/* Full Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>{' '}
                    <span className="font-medium">{getUserName(selectedCC.assignedTo)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested By:</span>{' '}
                    <span className="font-medium">{getUserName(selectedCC.requestedBy)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>{' '}
                    <span className="font-medium">{formatDate(selectedCC.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedCC.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    <span className="font-medium">{formatDate(selectedCC.updatedAt)}</span>
                  </div>
                  {selectedCC.approvedBy && (
                    <div>
                      <span className="text-muted-foreground">Approved By:</span>{' '}
                      <span className="font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                        {getUserName(selectedCC.approvedBy)}
                      </span>
                    </div>
                  )}
                  {selectedCC.implementationDate && (
                    <div>
                      <span className="text-muted-foreground">Implementation Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedCC.implementationDate)}</span>
                    </div>
                  )}
                  {selectedCC.completionDate && (
                    <div>
                      <span className="text-muted-foreground">Completion Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedCC.completionDate)}</span>
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
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCC.description}</p>
                </div>

                {/* Justification */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <AlertOctagon className="h-4 w-4 text-muted-foreground" />
                    Justification
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCC.justification}</p>
                </div>

                <Separator />

                {/* Proposed Change */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                    Proposed Change
                  </h4>
                  <p className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 p-3 rounded-md">{selectedCC.proposedChange}</p>
                </div>

                {/* Risk Assessment */}
                {selectedCC.riskAssessment && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Risk Assessment
                    </h4>
                    <p className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-200 dark:border-amber-800">{selectedCC.riskAssessment}</p>
                  </div>
                )}

                {/* Impact Analysis */}
                {selectedCC.impactAnalysis && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Impact Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-200 dark:border-blue-800">{selectedCC.impactAnalysis}</p>
                  </div>
                )}

                {/* Implementation Plan */}
                {selectedCC.implementationPlan && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <Wrench className="h-4 w-4 text-cyan-500" />
                      Implementation Plan
                    </h4>
                    <p className="text-sm text-muted-foreground bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-md border border-cyan-200 dark:border-cyan-800">{selectedCC.implementationPlan}</p>
                  </div>
                )}

                <Separator />

                {/* Linked Document */}
                {(() => {
                  const linkedDoc = getLinkedDocument(selectedCC.linkedDocumentId);
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
                        <Badge className={cn('text-xs ml-auto', (statusColors as Record<string, string>)[linkedDoc.status] || 'bg-gray-100 text-gray-700')} variant="secondary">
                          {linkedDoc.status}
                        </Badge>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Linked CAPA */}
                {(() => {
                  const linkedCapa = getLinkedCapa(selectedCC.linkedCapaId);
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

                {/* Action Buttons */}
                {hasPermission('ncr.update') && selectedCC.status !== 'Completed' && selectedCC.status !== 'Rejected' && (
                  <div className="flex gap-3">
                    {getNextStatus(selectedCC.status) && (
                      <Button className="flex-1" onClick={() => handleAdvanceStatus(selectedCC)}>
                        {getNextStatus(selectedCC.status) === 'Approved' ? (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Approve with Electronic Signature
                          </>
                        ) : (
                          <>
                            Advance to {getNextStatus(selectedCC.status)}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                    {selectedCC.status === 'Under Review' && (
                      <Button variant="destructive" onClick={() => handleReject(selectedCC)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
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
        recordTitle={pendingStatusAdvance ? `${pendingStatusAdvance.ccNumber} — ${pendingStatusAdvance.title}` : ''}
        recordId={pendingStatusAdvance?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
