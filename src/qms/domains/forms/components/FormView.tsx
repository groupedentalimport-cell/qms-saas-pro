
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import { createFormTemplate, createFormInstance, updateFormInstanceValues } from '@/qms/services/formService';
import { useAuth } from '@/qms/contexts/AuthContext';
import { ElectronicSignatureModal } from '@/qms/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/qms/lib/utils';
import type { FormTemplate, FormInstance, FormFieldDefinition, FormInstanceStatus, SignatureType } from '@/qms/types/qms';
import {
  FileSpreadsheet, Plus, Search, Eye, Lock, ChevronUp, ChevronDown,
  Trash2, GripVertical, ShieldCheck, CheckCircle2, XCircle,
  FileText, LayoutTemplate, ClipboardList, PenLine,
} from 'lucide-react';
import { Card, CardContent } from '@/qms/components/ui/card';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Badge } from '@/qms/components/ui/badge';
import { Label } from '@/qms/components/ui/label';
import { Textarea } from '@/qms/components/ui/textarea';
import { Checkbox } from '@/qms/components/ui/checkbox';
import { Separator } from '@/qms/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/qms/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/qms/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/qms/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/qms/components/ui/dialog';

const instanceStatusColors: Record<FormInstanceStatus, string> = {
  'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'Submitted': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const fieldTypeIcons: Record<string, string> = {
  text: 'Aa',
  number: '#',
  date: '📅',
  select: '☰',
  checkbox: '☑',
  textarea: '¶',
  signature: '✍',
  table: '▦',
};

export function FormView() {
  const { currentUser, hasPermission } = useAuth();
  // Read from store via selectors
  const templates = useQMSStore(state => state.formTemplates);
  const instances = useQMSStore(state => state.formInstances);
  const documents = useQMSStore(state => state.documents);

  // ===== TEMPLATES TAB STATE =====
  const [templateSearch, setTemplateSearch] = useState('');
  const [showBuilderDialog, setShowBuilderDialog] = useState(false);
  const [showTemplateDetailDialog, setShowTemplateDetailDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  // Builder state
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderVersion, setBuilderVersion] = useState('1.0');
  const [builderLinkedDoc, setBuilderLinkedDoc] = useState('');
  const [builderFields, setBuilderFields] = useState<FormFieldDefinition[]>([]);

  // New field state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldDefinition['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState('');
  const [newFieldValidationMin, setNewFieldValidationMin] = useState('');
  const [newFieldValidationMax, setNewFieldValidationMax] = useState('');
  const [newFieldValidationPattern, setNewFieldValidationPattern] = useState('');

  // ===== INSTANCES TAB STATE =====
  const [instanceSearch, setInstanceSearch] = useState('');
  const [instanceTemplateFilter, setInstanceTemplateFilter] = useState<string>('all');
  const [instanceStatusFilter, setInstanceStatusFilter] = useState<string>('all');
  const [showFillerDialog, setShowFillerDialog] = useState(false);
  const [showInstanceDetailDialog, setShowInstanceDetailDialog] = useState(false);
  const [fillingTemplate, setFillingTemplate] = useState<FormTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);

  // Filler state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  // E-signature
  const [showEsigModal, setShowEsigModal] = useState(false);
  const [pendingInstanceAction, setPendingInstanceAction] = useState<{ instanceId: string; action: 'approve' | 'reject' } | null>(null);

  // ===== COMPUTED =====
  const approvedDocuments = useMemo(() => documents.filter(d => d.status === 'Approved'), [documents]);

  const filteredTemplates = useMemo(() =>
    templates.filter(t => templateSearch === '' || t.title.toLowerCase().includes(templateSearch.toLowerCase())),
    [templates, templateSearch]
  );

  const filteredInstances = useMemo(() =>
    instances.filter(i => {
      const matchesSearch = instanceSearch === '' || i.referenceNumber.toLowerCase().includes(instanceSearch.toLowerCase());
      const matchesTemplate = instanceTemplateFilter === 'all' || i.templateId === instanceTemplateFilter;
      const matchesStatus = instanceStatusFilter === 'all' || i.status === instanceStatusFilter;
      return matchesSearch && matchesTemplate && matchesStatus;
    }),
    [instances, instanceSearch, instanceTemplateFilter, instanceStatusFilter]
  );

  // Template instance counts
  const getInstanceCount = (templateId: string) => instances.filter(i => i.templateId === templateId).length;
  const getInstanceCountByStatus = (templateId: string, status: FormInstanceStatus) =>
    instances.filter(i => i.templateId === templateId && i.status === status).length;

  // Summary cards
  const templateSummary = useMemo(() => ({
    activeTemplates: templates.filter(t => t.isActive).length,
    totalInstances: instances.length,
    draftInstances: instances.filter(i => i.status === 'Draft').length,
    approvedInstances: instances.filter(i => i.status === 'Approved').length,
  }), [templates, instances]);

  const getTemplateName = (templateId: string) =>
    templates.find(t => t.id === templateId)?.title || templateId;

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const profile = useQMSStore.getState().profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  // ===== BUILDER HELPERS =====
  const resetBuilder = () => {
    setBuilderTitle(''); setBuilderVersion('1.0'); setBuilderLinkedDoc('');
    setBuilderFields([]);
    setNewFieldName(''); setNewFieldLabel(''); setNewFieldType('text');
    setNewFieldRequired(false); setNewFieldOptions('');
    setNewFieldPlaceholder(''); setNewFieldDefaultValue('');
    setNewFieldValidationMin(''); setNewFieldValidationMax(''); setNewFieldValidationPattern('');
  };

  const addField = () => {
    if (!newFieldName || !newFieldLabel) return;
    const field: FormFieldDefinition = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: newFieldName,
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      placeholder: newFieldPlaceholder || undefined,
      defaultValue: newFieldDefaultValue || undefined,
      validation: (newFieldValidationMin || newFieldValidationMax || newFieldValidationPattern) ? {
        min: newFieldValidationMin ? parseFloat(newFieldValidationMin) : undefined,
        max: newFieldValidationMax ? parseFloat(newFieldValidationMax) : undefined,
        pattern: newFieldValidationPattern || undefined,
      } : undefined,
    };
    setBuilderFields([...builderFields, field]);
    setNewFieldName(''); setNewFieldLabel(''); setNewFieldType('text');
    setNewFieldRequired(false); setNewFieldOptions('');
    setNewFieldPlaceholder(''); setNewFieldDefaultValue('');
    setNewFieldValidationMin(''); setNewFieldValidationMax(''); setNewFieldValidationPattern('');
  };

  const removeField = (id: string) => {
    setBuilderFields(builderFields.filter(f => f.id !== id));
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...builderFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    setBuilderFields(newFields);
  };

  const moveFieldDown = (index: number) => {
    if (index === builderFields.length - 1) return;
    const newFields = [...builderFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    setBuilderFields(newFields);
  };

  const handleSaveTemplate = () => {
    if (!builderTitle || builderFields.length === 0) return;
    createFormTemplate({
      documentId: builderLinkedDoc || '',
      title: builderTitle,
      version: builderVersion,
      fields: builderFields,
      isActive: true,
      organizationId: 'org-001',
      createdById: currentUser?.id,
    });
    resetBuilder();
    setShowBuilderDialog(false);
  };

  const openTemplateDetail = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDetailDialog(true);
  };

  // ===== FILLER HELPERS =====
  const openFiller = (template: FormTemplate) => {
    setFillingTemplate(template);
    const initialValues: Record<string, unknown> = {};
    template.fields.forEach(f => {
      initialValues[f.name] = f.type === 'checkbox' ? (f.defaultValue === 'true' ? true : false) : (f.defaultValue || '');
    });
    setFormValues(initialValues);
    setShowFillerDialog(true);
  };

  const handleSubmitInstance = () => {
    if (!fillingTemplate) return;
    createFormInstance(
      fillingTemplate.id,
      currentUser?.id || '',
      'org-001'
    );
    setShowFillerDialog(false);
    setFillingTemplate(null);
  };

  const openInstanceDetail = (instance: FormInstance) => {
    setSelectedInstance(instance);
    setShowInstanceDetailDialog(true);
  };

  const handleApproveReject = (instanceId: string, action: 'approve' | 'reject') => {
    setPendingInstanceAction({ instanceId, action });
    setShowEsigModal(true);
  };

  const handleEsigSign = (data: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingInstanceAction) return;
    const { instanceId, action } = pendingInstanceAction;
    const updates: Partial<FormInstance> = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      isLocked: action === 'approve',
      signatureHash: data.signatureHash,
    };
    updateFormInstanceValues(instanceId, updates);
    // Update the selected instance if it's currently shown
    if (selectedInstance && selectedInstance.id === instanceId) {
      setSelectedInstance({ ...selectedInstance, ...updates });
    }
    setShowEsigModal(false);
    setPendingInstanceAction(null);
  };

  const allFieldTypes: FormFieldDefinition['type'][] = ['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'signature', 'table'];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />Dynamic Forms
          </h1>
          <p className="text-muted-foreground mt-1">Form templates and electronic records management</p>
        </div>
        {hasPermission('documents.create') && (
          <Button onClick={() => { resetBuilder(); setShowBuilderDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Template
          </Button>
        )}
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            <LayoutTemplate className="h-4 w-4 mr-1" />Templates
          </TabsTrigger>
          <TabsTrigger value="instances">
            <ClipboardList className="h-4 w-4 mr-1" />Instances
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TEMPLATES TAB                                                 */}
        {/* ============================================================ */}
        <TabsContent value="templates" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Templates</span>
                </div>
                <span className="text-2xl font-bold">{templateSummary.activeTemplates}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Instances</span>
                </div>
                <span className="text-2xl font-bold">{templateSummary.totalInstances}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Draft Instances</span>
                </div>
                <span className="text-2xl font-bold">{templateSummary.draftInstances}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Approved Instances</span>
                </div>
                <span className="text-2xl font-bold">{templateSummary.approvedInstances}</span>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {/* Templates Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[80px]">Version</TableHead>
                      <TableHead className="w-[100px]">Fields</TableHead>
                      <TableHead className="w-[150px]">Linked Document</TableHead>
                      <TableHead className="w-[80px]">Active</TableHead>
                      <TableHead className="w-[110px]">Instances</TableHead>
                      <TableHead className="w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map(template => {
                      const linkedDoc = documents.find(d => d.id === template.documentId);
                      const instanceCount = getInstanceCount(template.id);
                      return (
                        <TableRow key={template.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openTemplateDetail(template)}>
                          <TableCell className="font-medium">{template.title}</TableCell>
                          <TableCell className="font-mono text-sm">{template.version}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{template.fields.length} fields</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {linkedDoc ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-mono">{linkedDoc.documentNumber}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[140px]">{linkedDoc.title}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={template.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} variant="secondary">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{instanceCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); openTemplateDetail(template); }}>
                                <Eye className="h-3 w-3 mr-1" />View
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); openFiller(template); }}>
                                <Plus className="h-3 w-3 mr-1" />Fill
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No templates found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* INSTANCES TAB                                                 */}
        {/* ============================================================ */}
        <TabsContent value="instances" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search instances by reference #..." value={instanceSearch} onChange={(e) => setInstanceSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={instanceTemplateFilter} onValueChange={setInstanceTemplateFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={instanceStatusFilter} onValueChange={setInstanceStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(['Draft', 'Submitted', 'Approved', 'Rejected'] as FormInstanceStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instances Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Reference #</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[150px]">Submitted By</TableHead>
                      <TableHead className="w-[120px]">Submitted Date</TableHead>
                      <TableHead className="w-[80px]">Locked</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstances.map(instance => (
                      <TableRow key={instance.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openInstanceDetail(instance)}>
                        <TableCell className="font-mono text-xs">{instance.referenceNumber}</TableCell>
                        <TableCell className="font-medium">{getTemplateName(instance.templateId)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', instanceStatusColors[instance.status])} variant="secondary">{instance.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getUserName(instance.submittedById)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(instance.submittedAt)}</TableCell>
                        <TableCell>
                          {instance.isLocked ? (
                            <Lock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openInstanceDetail(instance); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInstances.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No instances found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* TEMPLATE BUILDER DIALOG                                      */}
      {/* ============================================================ */}
      <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Template Builder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Template Title *</Label>
                <Input value={builderTitle} onChange={(e) => setBuilderTitle(e.target.value)} placeholder="Template name" />
              </div>
              <div className="grid gap-2">
                <Label>Version</Label>
                <Input value={builderVersion} onChange={(e) => setBuilderVersion(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Linked Document</Label>
              <Select value={builderLinkedDoc} onValueChange={setBuilderLinkedDoc}>
                <SelectTrigger><SelectValue placeholder="Select a linked document..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {approvedDocuments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.documentNumber} — {d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Add Field Section */}
            <div className="border rounded-md p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Add Field
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Field Name *</Label>
                  <Input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="fieldName" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Label *</Label>
                  <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Field Label" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FormFieldDefinition['type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allFieldTypes.map(t => <SelectItem key={t} value={t}>{fieldTypeIcons[t]} {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Placeholder</Label>
                  <Input value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} placeholder="Enter placeholder..." />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Default Value</Label>
                  <Input value={newFieldDefaultValue} onChange={(e) => setNewFieldDefaultValue(e.target.value)} placeholder="Default..." />
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={newFieldRequired} onCheckedChange={(v) => setNewFieldRequired(v === true)} />
                    <Label className="text-xs">Required</Label>
                  </div>
                </div>
              </div>
              {newFieldType === 'select' && (
                <div className="grid gap-1">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="Option A, Option B, Option C" />
                </div>
              )}
              {(newFieldType === 'number') && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Validation Min</Label>
                    <Input type="number" value={newFieldValidationMin} onChange={(e) => setNewFieldValidationMin(e.target.value)} placeholder="Min" />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Validation Max</Label>
                    <Input type="number" value={newFieldValidationMax} onChange={(e) => setNewFieldValidationMax(e.target.value)} placeholder="Max" />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Pattern (regex)</Label>
                    <Input value={newFieldValidationPattern} onChange={(e) => setNewFieldValidationPattern(e.target.value)} placeholder="^[A-Z]+$" />
                  </div>
                </div>
              )}
              {newFieldType === 'text' && (
                <div className="grid gap-1">
                  <Label className="text-xs">Validation Pattern (regex)</Label>
                  <Input value={newFieldValidationPattern} onChange={(e) => setNewFieldValidationPattern(e.target.value)} placeholder="e.g., ^[A-Za-z]+$" />
                </div>
              )}
              <Button size="sm" onClick={addField} disabled={!newFieldName || !newFieldLabel}>
                <Plus className="h-3 w-3 mr-1" />Add Field
              </Button>
            </div>

            {/* Field List with reorder */}
            {builderFields.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fields ({builderFields.length})</h4>
                {builderFields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2 border rounded-md p-2 text-sm">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground font-mono text-xs w-6">{i + 1}.</span>
                    <span className="font-medium flex-1">{field.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {fieldTypeIcons[field.type]} {field.type}
                    </Badge>
                    {field.required && <Badge variant="outline" className="text-xs border-red-300 text-red-700">Required</Badge>}
                    {field.placeholder && <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">"{field.placeholder}"</span>}
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFieldUp(i)} disabled={i === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFieldDown(i)} disabled={i === builderFields.length - 1}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeField(field.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Live Preview */}
            {builderFields.length > 0 && (
              <div className="border rounded-md p-4 space-y-3 bg-muted/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Live Preview
                </h4>
                <div className="space-y-3">
                  {builderFields.map(field => (
                    <div key={field.id} className="grid gap-1.5">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'text' && (
                        <Input placeholder={field.placeholder} disabled className="bg-white dark:bg-gray-950" />
                      )}
                      {field.type === 'number' && (
                        <Input type="number" placeholder={field.placeholder} disabled className="bg-white dark:bg-gray-950" />
                      )}
                      {field.type === 'date' && (
                        <Input type="date" disabled className="bg-white dark:bg-gray-950" />
                      )}
                      {field.type === 'select' && field.options && (
                        <Select disabled>
                          <SelectTrigger className="bg-white dark:bg-gray-950"><SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} /></SelectTrigger>
                        </Select>
                      )}
                      {field.type === 'checkbox' && (
                        <div className="flex items-center gap-2">
                          <Checkbox disabled />
                          <span className="text-sm text-muted-foreground">{field.label}</span>
                        </div>
                      )}
                      {field.type === 'textarea' && (
                        <Textarea placeholder={field.placeholder} disabled className="bg-white dark:bg-gray-950" rows={2} />
                      )}
                      {field.type === 'signature' && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md h-20 flex items-center justify-center text-muted-foreground text-xs">
                          <PenLine className="h-5 w-5 mr-2" />Signature Area
                        </div>
                      )}
                      {field.type === 'table' && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md h-16 flex items-center justify-center text-muted-foreground text-xs">
                          ▦ Table Field
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleSaveTemplate} disabled={!builderTitle || builderFields.length === 0}>
              <LayoutTemplate className="h-4 w-4 mr-2" />Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* TEMPLATE DETAIL DIALOG                                       */}
      {/* ============================================================ */}
      <Dialog open={showTemplateDetailDialog} onOpenChange={setShowTemplateDetailDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  {selectedTemplate.title}
                  <Badge variant="outline" className="font-mono text-xs">v{selectedTemplate.version}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Template Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Version:</span> <span className="font-medium ml-1">{selectedTemplate.version}</span></div>
                  <div>
                    <span className="text-muted-foreground">Active:</span>{' '}
                    <Badge className={selectedTemplate.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'} variant="secondary">
                      {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div><span className="text-muted-foreground">Fields:</span> <span className="font-medium ml-1">{selectedTemplate.fields.length}</span></div>
                  <div><span className="text-muted-foreground">Instances:</span> <span className="font-medium ml-1">{getInstanceCount(selectedTemplate.id)}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{formatDate(selectedTemplate.createdAt)}</span></div>
                  {selectedTemplate.documentId && (() => {
                    const doc = documents.find(d => d.id === selectedTemplate.documentId);
                    return doc ? (
                      <div><span className="text-muted-foreground">Linked Doc:</span> <span className="font-medium ml-1 font-mono text-xs">{doc.documentNumber}</span></div>
                    ) : null;
                  })()}
                </div>

                <Separator />

                {/* Field Configurations */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Field Configurations</h4>
                  {selectedTemplate.fields.map((field, i) => (
                    <div key={field.id} className="border rounded-md p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-xs">{i + 1}.</span>
                          <span className="font-medium text-sm">{field.label}</span>
                          <Badge variant="outline" className="text-xs">{fieldTypeIcons[field.type]} {field.type}</Badge>
                          {field.required && <Badge variant="outline" className="text-xs border-red-300 text-red-700">Required</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{field.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {field.placeholder && <span className="bg-muted/50 px-1.5 py-0.5 rounded">Placeholder: &quot;{field.placeholder}&quot;</span>}
                        {field.defaultValue && <span className="bg-muted/50 px-1.5 py-0.5 rounded">Default: {field.defaultValue}</span>}
                        {field.options && field.options.length > 0 && (
                          <span className="bg-muted/50 px-1.5 py-0.5 rounded">Options: {field.options.join(', ')}</span>
                        )}
                        {field.validation && (
                          <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                            Validation: {field.validation.min !== undefined && `min=${field.validation.min}`} {field.validation.max !== undefined && `max=${field.validation.max}`} {field.validation.pattern && `pattern=/${field.validation.pattern}/`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* FILL FORM DIALOG                                             */}
      {/* ============================================================ */}
      <Dialog open={showFillerDialog} onOpenChange={setShowFillerDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          {fillingTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-primary" />
                  Fill: {fillingTemplate.title}
                  <Badge variant="outline" className="font-mono text-xs">v{fillingTemplate.version}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {fillingTemplate.fields.map(field => (
                  <div key={field.id} className="grid gap-2">
                    <Label className="text-sm">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'text' && (
                      <Input
                        value={(formValues[field.name] as string) || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={(formValues[field.name] as string) || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={(formValues[field.name] as string) || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea
                        value={(formValues[field.name] as string) || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    )}
                    {field.type === 'select' && field.options && (
                      <Select
                        value={(formValues[field.name] as string) || ''}
                        onValueChange={(v) => setFormValues({ ...formValues, [field.name]: v })}
                      >
                        <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} /></SelectTrigger>
                        <SelectContent>
                          {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formValues[field.name] as boolean || false}
                          onCheckedChange={(v) => setFormValues({ ...formValues, [field.name]: v === true })}
                        />
                        <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
                      </div>
                    )}
                    {field.type === 'signature' && (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md h-24 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                        <PenLine className="h-6 w-6 mb-1" />
                        <span className="text-xs">Click to sign (signature placeholder)</span>
                      </div>
                    )}
                    {field.type === 'table' && (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md h-20 flex items-center justify-center text-muted-foreground bg-muted/10">
                        <span className="text-xs">▦ Table entry area</span>
                      </div>
                    )}
                  </div>
                ))}
                <Button className="w-full" onClick={handleSubmitInstance}>
                  <FileText className="h-4 w-4 mr-2" />Submit Form
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* INSTANCE DETAIL DIALOG                                       */}
      {/* ============================================================ */}
      <Dialog open={showInstanceDetailDialog} onOpenChange={setShowInstanceDetailDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedInstance && (() => {
            const template = templates.find(t => t.id === selectedInstance.templateId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{selectedInstance.referenceNumber}</span>
                    {getTemplateName(selectedInstance.templateId)}
                    {selectedInstance.isLocked && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                        <Lock className="h-3 w-3 mr-1" />Locked
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Status & Meta */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn(instanceStatusColors[selectedInstance.status])} variant="secondary">{selectedInstance.status}</Badge>
                    <Badge variant="outline">v{selectedInstance.templateVersion}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Submitted By:</span> <span className="font-medium ml-1">{getUserName(selectedInstance.submittedById)}</span></div>
                    <div><span className="text-muted-foreground">Submitted Date:</span> <span className="font-medium ml-1">{formatDate(selectedInstance.submittedAt)}</span></div>
                    <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{formatDate(selectedInstance.createdAt)}</span></div>
                    <div><span className="text-muted-foreground">Locked:</span> <span className="font-medium ml-1">{selectedInstance.isLocked ? 'Yes' : 'No'}</span></div>
                  </div>

                  <Separator />

                  {/* Filled Values */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Form Values</h4>
                    {template ? template.fields.map(field => {
                      const value = selectedInstance.values[field.name];
                      return (
                        <div key={field.id} className="border-b pb-2">
                          <span className="text-sm text-muted-foreground block">{field.label}:</span>
                          <p className="font-medium text-sm mt-0.5">
                            {field.type === 'checkbox' ? (
                              value === true ? (
                                <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">✗ No</span>
                              )
                            ) : field.type === 'signature' ? (
                              value ? (
                                <span className="flex items-center gap-1"><PenLine className="h-3 w-3" />Signed</span>
                              ) : (
                                <span className="text-muted-foreground">Not signed</span>
                              )
                            ) : (
                              String(value || '-')
                            )}
                          </p>
                        </div>
                      );
                    }) : (
                      Object.entries(selectedInstance.values).map(([key, value]) => (
                        <div key={key} className="border-b pb-2">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <p className="font-medium text-sm">
                            {value === true ? '✓ Yes' : value === false ? '✗ No' : String(value || '-')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Approval/Rejection buttons */}
                  {(selectedInstance.status === 'Submitted' || selectedInstance.status === 'Draft') && hasPermission('documents.approve') && (
                    <>
                      <Separator />
                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          onClick={() => handleApproveReject(selectedInstance.id, 'approve')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve with E-Signature
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleApproveReject(selectedInstance.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject with E-Signature
                        </Button>
                      </div>
                    </>
                  )}

                  {selectedInstance.status === 'Approved' && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-md p-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-400">This form instance has been approved and is locked.</span>
                    </div>
                  )}

                  {selectedInstance.status === 'Rejected' && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">This form instance has been rejected.</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal */}
      <ElectronicSignatureModal
        open={showEsigModal}
        onClose={() => { setShowEsigModal(false); setPendingInstanceAction(null); }}
        onSign={handleEsigSign}
        recordTitle={pendingInstanceAction ? `Form Instance - ${getTemplateName(instances.find(i => i.id === pendingInstanceAction?.instanceId)?.templateId || '')}` : 'Form Instance'}
        recordId={pendingInstanceAction?.instanceId || ''}
        signatureType={pendingInstanceAction?.action === 'approve' ? 'approval' : 'rejection'}
      />
    </div>
  );
}
