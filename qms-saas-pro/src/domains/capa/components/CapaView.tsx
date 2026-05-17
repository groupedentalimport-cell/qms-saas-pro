
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createCapa, updateCapa } from '@/services/capaService';
import { checkPrerequisites } from '@/services/compliance/prerequisiteEngine';
import type { Capa, CapaStatus, CapaType, CapaPriority, CapaSource, RootCauseCategory } from '@/types/qms';
import {
  Shield, Plus, Search, Eye, ArrowRight, CheckCircle2, AlertTriangle,
  Clock, XCircle, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const statusColors: Record<CapaStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Implementation': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Effectiveness Check': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const priorityColors: Record<CapaPriority, string> = {
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Low': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const statusFlow: CapaStatus[] = ['Open', 'Investigation', 'Implementation', 'Effectiveness Check', 'Closed'];

function getNextStatus(current: CapaStatus): CapaStatus | null {
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CapaView() {
  const { currentUser, hasPermission } = useAuth();
  const capas = useQMSStore(state => state.capas);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<Capa | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<CapaType>('Corrective');
  const [formPriority, setFormPriority] = useState<CapaPriority>('Medium');
  const [formSource, setFormSource] = useState<CapaSource>('Non-Conformance');
  const [formDescription, setFormDescription] = useState('');
  const [formProblemStatement, setFormProblemStatement] = useState('');
  const [formRootCauseCategory, setFormRootCauseCategory] = useState<RootCauseCategory>('Method');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formLinkedDocId, setFormLinkedDocId] = useState('');

  const filteredCapas = capas.filter(c => {
    const matchesSearch = searchTerm === '' ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.capaNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const summaryCounts = {
    open: capas.filter(c => c.status === 'Open').length,
    investigation: capas.filter(c => c.status === 'Investigation').length,
    implementation: capas.filter(c => c.status === 'Implementation').length,
    effectiveness: capas.filter(c => c.status === 'Effectiveness Check').length,
    closed: capas.filter(c => c.status === 'Closed').length,
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const approvedSops = documents.filter(d => d.type === 'SOP' && d.status === 'Approved');

  const handleCreate = () => {
    // Prerequisite check: verify an Approved SOP exists
    const prereqResult = checkPrerequisites('CAPA', 'org-001');
    if (!prereqResult.met) {
      setPrereqError(`Prerequisite not met: ${prereqResult.missing.map(p => p.description).join(', ')}`);
      return;
    }
    setPrereqError(null);

    createCapa({
      capaNumber: `CAPA-2024-${String(capas.length + 1).padStart(3, '0')}`,
      title: formTitle,
      type: formType,
      status: 'Open',
      priority: formPriority,
      source: formSource,
      description: formDescription,
      problemStatement: formProblemStatement,
      rootCauseCategory: formRootCauseCategory,
      assignedTo: formAssignedTo,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      createdDate: new Date().toISOString(),
      linkedDocumentId: formLinkedDocId || undefined,
      createdById: currentUser?.id,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormType('Corrective');
    setFormPriority('Medium');
    setFormSource('Non-Conformance');
    setFormDescription('');
    setFormProblemStatement('');
    setFormRootCauseCategory('Method');
    setFormAssignedTo('');
    setFormDueDate('');
    setFormLinkedDocId('');
    setPrereqError(null);
  };

  const handleAdvanceStatus = (capa: Capa) => {
    const next = getNextStatus(capa.status);
    if (!next) return;
    updateCapa(capa.id, {
      status: next,
      closedDate: next === 'Closed' ? new Date().toISOString() : undefined,
    });
    if (selectedCapa?.id === capa.id) {
      setSelectedCapa({ ...capa, status: next });
    }
  };

  const openDetail = (capa: Capa) => {
    setSelectedCapa(capa);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            CAPA Management
          </h1>
          <p className="text-muted-foreground mt-1">Corrective and Preventive Actions</p>
        </div>
        {hasPermission('capa.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New CAPA
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
              <span className="text-sm text-muted-foreground">Investigation</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.investigation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Implementation</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.implementation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">Effectiveness</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.effectiveness}</span>
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search CAPAs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
            <SelectItem value="Corrective">Corrective</SelectItem>
            <SelectItem value="Preventive">Preventive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
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
                  <TableHead className="w-[140px]">CAPA #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[110px]">Type</TableHead>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[140px]">Assigned To</TableHead>
                  <TableHead className="w-[110px]">Due Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapas.map(capa => (
                  <TableRow key={capa.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(capa)}>
                    <TableCell className="font-mono text-xs">{capa.capaNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-xs">{capa.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(capa.type === 'Corrective' ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700')}>
                        {capa.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {capa.priority && <Badge className={cn('text-xs', priorityColors[capa.priority])} variant="secondary">{capa.priority}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[capa.status])} variant="secondary">{capa.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getUserName(capa.assignedTo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(capa.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(capa); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCapas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No CAPAs found matching filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create CAPA Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New CAPA</DialogTitle>
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
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="CAPA title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as CapaType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority *</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as CapaPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v as CapaSource)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-Conformance">Non-Conformance</SelectItem>
                    <SelectItem value="Audit Finding">Audit Finding</SelectItem>
                    <SelectItem value="Customer Complaint">Customer Complaint</SelectItem>
                    <SelectItem value="Management Review">Management Review</SelectItem>
                    <SelectItem value="Process Monitoring">Process Monitoring</SelectItem>
                    <SelectItem value="Supplier Issue">Supplier Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Root Cause Category</Label>
                <Select value={formRootCauseCategory} onValueChange={(v) => setFormRootCauseCategory(v as RootCauseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Man', 'Machine', 'Method', 'Material', 'Measurement', 'Environment', 'Management'] as RootCauseCategory[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe the CAPA..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Problem Statement</Label>
              <Textarea value={formProblemStatement} onChange={(e) => setFormProblemStatement(e.target.value)} placeholder="What is the problem?" rows={2} />
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
            <div className="grid gap-2">
              <Label>Linked Document (Approved SOP)</Label>
              <Select value={formLinkedDocId} onValueChange={setFormLinkedDocId}>
                <SelectTrigger><SelectValue placeholder="Select linked SOP" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {approvedSops.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.documentNumber} - {d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!formTitle || !formDescription || !formAssignedTo}>
              Create CAPA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedCapa && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedCapa.capaNumber}</span>
                  {selectedCapa.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Priority Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedCapa.status])} variant="secondary">{selectedCapa.status}</Badge>
                  <Badge variant="outline" className={selectedCapa.type === 'Corrective' ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'}>{selectedCapa.type}</Badge>
                  {selectedCapa.priority && <Badge className={cn(priorityColors[selectedCapa.priority])} variant="secondary">{selectedCapa.priority}</Badge>}
                  {selectedCapa.source && <Badge variant="outline">{selectedCapa.source}</Badge>}
                </div>

                {/* Status Flow */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {statusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedCapa.status ? 'bg-primary text-primary-foreground' :
                        statusFlow.indexOf(s) < statusFlow.indexOf(selectedCapa.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < statusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium ml-1">{getUserName(selectedCapa.assignedTo)}</span></div>
                  <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium ml-1">{new Date(selectedCapa.dueDate).toLocaleDateString()}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{new Date(selectedCapa.createdDate).toLocaleDateString()}</span></div>
                  {selectedCapa.closedDate && <div><span className="text-muted-foreground">Closed:</span> <span className="font-medium ml-1">{new Date(selectedCapa.closedDate).toLocaleDateString()}</span></div>}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.description}</p>
                  </div>
                  {selectedCapa.problemStatement && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Problem Statement</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.problemStatement}</p>
                    </div>
                  )}
                  {selectedCapa.investigationDetails && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Investigation Details</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.investigationDetails}</p>
                    </div>
                  )}
                  {selectedCapa.rootCauseAnalysis && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Root Cause Analysis</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.rootCauseAnalysis}</p>
                      {selectedCapa.rootCauseCategory && (
                        <Badge variant="outline" className="mt-2 text-xs">Category: {selectedCapa.rootCauseCategory}</Badge>
                      )}
                    </div>
                  )}
                  {selectedCapa.fiveWhys && selectedCapa.fiveWhys.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">5 Whys Analysis</h4>
                      <div className="space-y-1">
                        {selectedCapa.fiveWhys.map((why, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded">
                            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">Why {i + 1}:</span>
                            <span>{why}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCapa.correctiveAction && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Corrective Action</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.correctiveAction}</p>
                    </div>
                  )}
                  {selectedCapa.effectivenessVerificationMethod && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Effectiveness Verification</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedCapa.effectivenessVerificationMethod}</p>
                      {selectedCapa.effectivenessCriteria && (
                        <p className="text-sm text-muted-foreground mt-1"><span className="font-medium">Criteria:</span> {selectedCapa.effectivenessCriteria}</p>
                      )}
                      {selectedCapa.effectivenessResult && (
                        <Badge variant="outline" className="mt-2 text-xs">Result: {selectedCapa.effectivenessResult}</Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {hasPermission('capa.update') && selectedCapa.status !== 'Closed' && (
                  <Button className="w-full" onClick={() => handleAdvanceStatus(selectedCapa)}>
                    Advance to {getNextStatus(selectedCapa.status)}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
