
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createSupplier, updateSupplier } from '@/services/supplierService';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatDate } from '@/lib/utils';
import type { Supplier, SupplierCategory, SupplierStatus } from '@/types/qms';
import {
  Truck, Plus, Search, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Award, FileText, Edit3, Save, Star, CalendarClock, TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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

const statusColors: Record<SupplierStatus, string> = {
  'Qualified': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Conditional': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Disqualified': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Under Evaluation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const supplierStatusFlow: SupplierStatus[] = ['Under Evaluation', 'Conditional', 'Qualified'];

const supplierCategories: SupplierCategory[] = [
  'Raw Material', 'Packaging', 'Equipment', 'Service',
  'Contract Manufacturer', 'Laboratory', 'Other',
];

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Acceptable';
  return 'Needs Improvement';
}

function isReviewApproaching(nextReviewDate?: string): boolean {
  if (!nextReviewDate) return false;
  const reviewDate = new Date(nextReviewDate);
  const now = new Date();
  const daysUntilReview = (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilReview <= 30 && daysUntilReview >= 0;
}

function isReviewOverdue(nextReviewDate?: string): boolean {
  if (!nextReviewDate) return false;
  const reviewDate = new Date(nextReviewDate);
  return reviewDate < new Date();
}

export function SupplierView() {
  const { currentUser, hasPermission } = useAuth();
  // Read from store via selectors
  const suppliers = useQMSStore(state => state.suppliers);
  const documents = useQMSStore(state => state.documents);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Create form state
  const [formAutoCode, setFormAutoCode] = useState(true);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SupplierCategory>('Raw Material');
  const [formQualDate, setFormQualDate] = useState('');
  const [formNextReviewDate, setFormNextReviewDate] = useState('');
  const [formCertifications, setFormCertifications] = useState('');

  // Inline performance score editing
  const [editingScore, setEditingScore] = useState(false);
  const [editScoreValue, setEditScoreValue] = useState('');

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = searchTerm === '' ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const summaryCounts = {
    qualified: suppliers.filter(s => s.status === 'Qualified').length,
    conditional: suppliers.filter(s => s.status === 'Conditional').length,
    disqualified: suppliers.filter(s => s.status === 'Disqualified').length,
    evaluation: suppliers.filter(s => s.status === 'Under Evaluation').length,
  };

  const avgScore = suppliers.length > 0
    ? Math.round(
        suppliers
          .filter(s => s.performanceScore !== undefined && s.performanceScore > 0)
          .reduce((sum, s) => sum + (s.performanceScore || 0), 0) /
        Math.max(suppliers.filter(s => s.performanceScore !== undefined && s.performanceScore > 0).length, 1)
      )
    : 0;

  const generateSupplierCode = () => {
    const count = suppliers.length + 1;
    return `SUP-${String(count).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setFormAutoCode(true);
    setFormCode('');
    setFormName('');
    setFormCategory('Raw Material');
    setFormQualDate('');
    setFormNextReviewDate('');
    setFormCertifications('');
  };

  const handleCreate = () => {
    const code = formAutoCode ? generateSupplierCode() : formCode;
    createSupplier({
      supplierCode: code,
      name: formName,
      category: formCategory,
      status: 'Under Evaluation',
      qualificationDate: formQualDate ? new Date(formQualDate).toISOString() : undefined,
      nextReviewDate: formNextReviewDate ? new Date(formNextReviewDate).toISOString() : undefined,
      certifications: formCertifications ? formCertifications.split(',').map(c => c.trim()).filter(Boolean) : [],
      performanceScore: 0,
      organizationId: 'org-001',
      createdById: currentUser?.id,
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const handleStatusAdvancement = (supplier: Supplier, newStatus: SupplierStatus) => {
    const updates: Partial<Supplier> = { status: newStatus };
    if (newStatus === 'Qualified') {
      updates.qualificationDate = new Date().toISOString();
      if (supplier.performanceScore === undefined || supplier.performanceScore === 0) {
        updates.performanceScore = 80;
      }
    }
    updateSupplier(supplier.id, updates);
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier({ ...supplier, ...updates });
    }
  };

  const handleDisqualify = (supplier: Supplier) => {
    updateSupplier(supplier.id, { status: 'Disqualified' });
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier({ ...supplier, status: 'Disqualified' });
    }
  };

  const handleSaveScore = () => {
    if (!selectedSupplier) return;
    const score = parseInt(editScoreValue);
    if (isNaN(score) || score < 0 || score > 100) return;
    updateSupplier(selectedSupplier.id, { performanceScore: score });
    setSelectedSupplier({ ...selectedSupplier, performanceScore: score });
    setEditingScore(false);
    setEditScoreValue('');
  };

  const getQualificationDocument = (docId?: string) => {
    if (!docId) return null;
    return documents.find(d => d.id === docId) || null;
  };

  const openDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditingScore(false);
    setEditScoreValue('');
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Suppliers
          </h1>
          <p className="text-muted-foreground mt-1">Supplier qualification and management</p>
        </div>
        {hasPermission('supplier.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Supplier
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Qualified</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.qualified}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Conditional</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{summaryCounts.conditional}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Disqualified</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{summaryCounts.disqualified}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Under Evaluation</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{summaryCounts.evaluation}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Avg. Performance</span>
            </div>
            <span className={cn('text-2xl font-bold', avgScore > 0 ? getScoreColorClass(avgScore) : 'text-muted-foreground')}>
              {avgScore > 0 ? avgScore : 'N/A'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Conditional">Conditional</SelectItem>
            <SelectItem value="Disqualified">Disqualified</SelectItem>
            <SelectItem value="Under Evaluation">Under Evaluation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {supplierCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[130px]">Category</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[140px]">Performance</TableHead>
                  <TableHead className="w-[110px]">Next Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map(supplier => (
                  <TableRow key={supplier.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(supplier)}>
                    <TableCell className="font-mono text-xs">{supplier.supplierCode}</TableCell>
                    <TableCell><p className="font-medium">{supplier.name}</p></TableCell>
                    <TableCell><Badge variant="outline">{supplier.category}</Badge></TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[supplier.status])} variant="secondary">
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.performanceScore !== undefined && supplier.performanceScore > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', getScoreBarColor(supplier.performanceScore))}
                              style={{ width: `${supplier.performanceScore}%` }}
                            />
                          </div>
                          <span className={cn('text-sm font-medium', getScoreColorClass(supplier.performanceScore))}>
                            {supplier.performanceScore}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">N/A</span>}
                    </TableCell>
                    <TableCell>
                      {supplier.nextReviewDate ? (
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            'text-sm',
                            isReviewOverdue(supplier.nextReviewDate) ? 'text-red-600 font-medium' :
                            isReviewApproaching(supplier.nextReviewDate) ? 'text-amber-600' :
                            'text-muted-foreground'
                          )}>
                            {formatDate(supplier.nextReviewDate, true)}
                          </span>
                          {(isReviewOverdue(supplier.nextReviewDate) || isReviewApproaching(supplier.nextReviewDate)) && (
                            <CalendarClock className={cn(
                              'h-3 w-3',
                              isReviewOverdue(supplier.nextReviewDate) ? 'text-red-500' : 'text-amber-500'
                            )} />
                          )}
                        </div>
                      ) : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSuppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No suppliers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Supplier Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Supplier</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="autoCode" className="text-sm">Auto-generate supplier code</Label>
              <input
                id="autoCode"
                type="checkbox"
                checked={formAutoCode}
                onChange={(e) => setFormAutoCode(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
            {!formAutoCode && (
              <div className="grid gap-2">
                <Label>Supplier Code *</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="SUP-XXX" />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Supplier name" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as SupplierCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {supplierCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Qualification Date</Label>
                <Input type="date" value={formQualDate} onChange={(e) => setFormQualDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Next Review Date</Label>
                <Input type="date" value={formNextReviewDate} onChange={(e) => setFormNextReviewDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Certifications (comma separated)</Label>
              <Input value={formCertifications} onChange={(e) => setFormCertifications(e.target.value)} placeholder="ISO 9001, ISO 13485, ..." />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!formName || (!formAutoCode && !formCode)}
            >
              Create Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedSupplier.supplierCode}</span>
                  {selectedSupplier.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedSupplier.status])} variant="secondary">
                    {selectedSupplier.status}
                  </Badge>
                  {selectedSupplier.category && <Badge variant="outline">{selectedSupplier.category}</Badge>}
                </div>

                {/* Status Flow Visualization */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {supplierStatusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedSupplier.status ? 'bg-primary text-primary-foreground' :
                        supplierStatusFlow.indexOf(s) < supplierStatusFlow.indexOf(selectedSupplier.status) ?
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < supplierStatusFlow.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                  {/* Branch for Disqualified */}
                  {selectedSupplier.status === 'Disqualified' && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className={cn('px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap', statusColors['Disqualified'])}>
                        Disqualified
                      </div>
                    </>
                  )}
                </div>

                {/* Supplier Metadata */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Code:</span>{' '}
                    <span className="font-mono font-medium">{selectedSupplier.supplierCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  {selectedSupplier.category && (
                    <div>
                      <span className="text-muted-foreground">Category:</span>{' '}
                      <span className="font-medium">{selectedSupplier.category}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge className={cn('text-xs ml-1', statusColors[selectedSupplier.status])} variant="secondary">
                      {selectedSupplier.status}
                    </Badge>
                  </div>
                  {selectedSupplier.qualificationDate && (
                    <div>
                      <span className="text-muted-foreground">Qualified Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedSupplier.qualificationDate)}</span>
                    </div>
                  )}
                  {selectedSupplier.nextReviewDate && (
                    <div>
                      <span className="text-muted-foreground">Next Review:</span>{' '}
                      <span className={cn(
                        'font-medium',
                        isReviewOverdue(selectedSupplier.nextReviewDate) ? 'text-red-600' :
                        isReviewApproaching(selectedSupplier.nextReviewDate) ? 'text-amber-600' : ''
                      )}>
                        {formatDate(selectedSupplier.nextReviewDate)}
                      </span>
                      {isReviewOverdue(selectedSupplier.nextReviewDate) && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">Overdue</Badge>
                      )}
                      {isReviewApproaching(selectedSupplier.nextReviewDate) && !isReviewOverdue(selectedSupplier.nextReviewDate) && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 text-amber-700">Due Soon</Badge>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedSupplier.createdAt)}</span>
                  </div>
                </div>

                <Separator />

                {/* Certifications */}
                {selectedSupplier.certifications && selectedSupplier.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Award className="h-4 w-4" /> Certifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplier.certifications.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />{cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Score */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Star className="h-4 w-4" /> Performance Score
                  </h4>
                  {editingScore ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editScoreValue}
                        onChange={(e) => setEditScoreValue(e.target.value)}
                        className="w-[80px] h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveScore();
                          if (e.key === 'Escape') { setEditingScore(false); setEditScoreValue(''); }
                        }}
                      />
                      <span className="text-sm text-muted-foreground">/ 100</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveScore}>
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingScore(false); setEditScoreValue(''); }}>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-4">
                          {/* Score bar */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                'text-2xl font-bold',
                                selectedSupplier.performanceScore !== undefined && selectedSupplier.performanceScore > 0
                                  ? getScoreColorClass(selectedSupplier.performanceScore)
                                  : 'text-muted-foreground'
                              )}>
                                {selectedSupplier.performanceScore !== undefined && selectedSupplier.performanceScore > 0
                                  ? selectedSupplier.performanceScore
                                  : 'N/A'}
                              </span>
                              {hasPermission('supplier.update') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setEditingScore(true);
                                    setEditScoreValue(String(selectedSupplier.performanceScore || ''));
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />Edit
                                </Button>
                              )}
                            </div>
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  selectedSupplier.performanceScore !== undefined && selectedSupplier.performanceScore > 0
                                    ? getScoreBarColor(selectedSupplier.performanceScore)
                                    : 'bg-muted'
                                )}
                                style={{ width: `${selectedSupplier.performanceScore || 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                              <span>0</span>
                              <span className={cn(
                                selectedSupplier.performanceScore !== undefined && selectedSupplier.performanceScore > 0
                                  ? getScoreColorClass(selectedSupplier.performanceScore)
                                  : ''
                              )}>
                                {selectedSupplier.performanceScore !== undefined && selectedSupplier.performanceScore > 0
                                  ? getScoreLabel(selectedSupplier.performanceScore)
                                  : 'Not rated'}
                              </span>
                              <span>100</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Qualification Document Link */}
                {selectedSupplier.qualificationDocId && (() => {
                  const qualDoc = getQualificationDocument(selectedSupplier.qualificationDocId);
                  return (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Qualification Document
                      </h4>
                      <div className="bg-muted/30 p-3 rounded-md flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        {qualDoc ? (
                          <div>
                            <p className="text-sm font-medium">{qualDoc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {qualDoc.documentNumber} · v{qualDoc.version} · <Badge className={cn('text-[10px]', qualDoc.status === 'Approved' ? 'bg-green-100 text-green-700' : '')} variant="secondary">{qualDoc.status}</Badge>
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Document ref: {selectedSupplier.qualificationDocId}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <Separator />

                {/* Re-qualification Warning */}
                {selectedSupplier.nextReviewDate && (isReviewApproaching(selectedSupplier.nextReviewDate) || isReviewOverdue(selectedSupplier.nextReviewDate)) && selectedSupplier.status === 'Qualified' && (
                  <div className={cn(
                    'border rounded-md p-3 flex items-start gap-2',
                    isReviewOverdue(selectedSupplier.nextReviewDate)
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  )}>
                    <CalendarClock className={cn(
                      'h-4 w-4 mt-0.5 flex-shrink-0',
                      isReviewOverdue(selectedSupplier.nextReviewDate) ? 'text-red-500' : 'text-amber-500'
                    )} />
                    <div className={cn(
                      'text-sm',
                      isReviewOverdue(selectedSupplier.nextReviewDate)
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                    )}>
                      <p className="font-medium">
                        {isReviewOverdue(selectedSupplier.nextReviewDate)
                          ? 'Re-qualification Overdue'
                          : 'Re-qualification Due Soon'}
                      </p>
                      <p>Next review date: {formatDate(selectedSupplier.nextReviewDate)}</p>
                    </div>
                  </div>
                )}

                {/* Status Advancement Actions */}
                {hasPermission('supplier.update') && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSupplier.status === 'Under Evaluation' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusAdvancement(selectedSupplier, 'Conditional')}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />Set Conditional
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusAdvancement(selectedSupplier, 'Qualified')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />Qualify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisqualify(selectedSupplier)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />Disqualify
                        </Button>
                      </>
                    )}
                    {selectedSupplier.status === 'Conditional' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusAdvancement(selectedSupplier, 'Qualified')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />Qualify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisqualify(selectedSupplier)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />Disqualify
                        </Button>
                      </>
                    )}
                    {selectedSupplier.status === 'Qualified' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusAdvancement(selectedSupplier, 'Conditional')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />Set Conditional
                      </Button>
                    )}
                    {selectedSupplier.status === 'Disqualified' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusAdvancement(selectedSupplier, 'Qualified')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />Re-qualify
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
