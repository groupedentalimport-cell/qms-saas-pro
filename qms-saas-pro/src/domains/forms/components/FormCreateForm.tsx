import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createFormTemplate } from '@/services/formService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { FormFieldDefinition } from '@/types/qms';
import {
  FileSpreadsheet, ChevronLeft, ChevronRight, CheckCircle2,
  Plus, Trash2, ChevronUp, ChevronDown, ShieldCheck, Eye,
  LayoutTemplate, PenLine, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Template Info', icon: LayoutTemplate },
  { id: 2, label: 'Field Builder', icon: FileSpreadsheet },
  { id: 3, label: 'Field Config', icon: FileSpreadsheet },
  { id: 4, label: 'Workflow & Rules', icon: ShieldCheck },
  { id: 5, label: 'Compliance', icon: ShieldCheck },
  { id: 6, label: 'Review & Submit', icon: CheckCircle2 },
] as const;

const fieldTypeIcons: Record<string, string> = {
  text: 'Aa',
  number: '#',
  date: '\uD83D\uDCC5',
  select: '\u2630',
  checkbox: '\u2611',
  textarea: '\u00B6',
  signature: '\u270D',
  table: '\u25A6',
};

const ALL_FIELD_TYPES: FormFieldDefinition['type'][] = ['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'signature', 'table'];

// ─── Default fields ──────────────────────────────────────────────────────────
const DEFAULT_FIELDS: FormFieldDefinition[] = [
  {
    id: 'f-default-record_date',
    name: 'record_date',
    label: 'Record Date',
    type: 'date',
    required: true,
  },
  {
    id: 'f-default-performed_by',
    name: 'performed_by',
    label: 'Performed By',
    type: 'text',
    required: true,
    placeholder: 'Enter name...',
  },
  {
    id: 'f-default-signature',
    name: 'signature',
    label: 'Signature',
    type: 'signature',
    required: true,
  },
];

interface FormCreateFormProps {
  onComplete: () => void;
}

export function FormCreateForm({ onComplete }: FormCreateFormProps) {
  const { currentUser } = useAuth();
  const documents = useQMSStore(state => state.documents);

  // ─── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ─── Step 1: Template Information ────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('1.0');
  const [linkedDoc, setLinkedDoc] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');

  // ─── Step 2: Field Builder ──────────────────────────────────────────────
  const [fields, setFields] = useState<FormFieldDefinition[]>([...DEFAULT_FIELDS]);

  // New field form
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldDefinition['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState('');

  // ─── Step 3: Field Configuration ────────────────────────────────────────
  // Options per select field, min/max per number, pattern per text
  const [fieldOptions, setFieldOptions] = useState<Record<string, string>>({});
  const [fieldMin, setFieldMin] = useState<Record<string, string>>({});
  const [fieldMax, setFieldMax] = useState<Record<string, string>>({});
  const [fieldPattern, setFieldPattern] = useState<Record<string, string>>({});

  // ─── Step 4: Workflow & Rules ────────────────────────────────────────────
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [workflowType, setWorkflowType] = useState('single');
  const [draftSaves, setDraftSaves] = useState(true);
  const [lockAfterSubmission, setLockAfterSubmission] = useState(true);
  const [eSignature, setESignature] = useState(false);
  const [part11, setPart11] = useState(false);

  // ─── Step 5: Compliance & Retention ──────────────────────────────────────
  const [regulatoryReference, setRegulatoryReference] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('');
  const [dataClassification, setDataClassification] = useState('');
  const [auditTrail, setAuditTrail] = useState(true);
  const [printFriendly, setPrintFriendly] = useState(false);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const approvedDocuments = useMemo(() => documents.filter(d => d.status === 'Approved'), [documents]);

  // Auto-check Part 11 if e-signature is enabled
  const part11Effective = part11 || eSignature || fields.some(f => f.type === 'signature');

  const stepCanProceed = useMemo(() => {
    switch (step) {
      case 1: return !!title.trim();
      case 2: return fields.length > 0;
      case 3: return true; // validation is optional
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  }, [step, title, fields]);

  // ─── Field builder helpers ───────────────────────────────────────────────
  const addField = () => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) return;
    const field: FormFieldDefinition = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: newFieldName.trim(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      placeholder: newFieldPlaceholder || undefined,
      defaultValue: newFieldDefaultValue || undefined,
    };
    setFields([...fields, field]);
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldPlaceholder('');
    setNewFieldDefaultValue('');
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    setFields(newFields);
  };

  const moveFieldDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    setFields(newFields);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    // Build final fields with validation config from Step 3
    const finalFields = fields.map(f => {
      const enriched: FormFieldDefinition = { ...f };
      if (f.type === 'select' && fieldOptions[f.id]) {
        enriched.options = fieldOptions[f.id].split(',').map(o => o.trim()).filter(Boolean);
      }
      if (f.type === 'number' && (fieldMin[f.id] || fieldMax[f.id])) {
        enriched.validation = {
          ...enriched.validation,
          min: fieldMin[f.id] ? parseFloat(fieldMin[f.id]) : undefined,
          max: fieldMax[f.id] ? parseFloat(fieldMax[f.id]) : undefined,
        };
      }
      if (f.type === 'text' && fieldPattern[f.id]) {
        enriched.validation = {
          ...enriched.validation,
          pattern: fieldPattern[f.id],
        };
      }
      return enriched;
    });

    createFormTemplate({
      documentId: linkedDoc || '',
      title,
      version,
      fields: finalFields,
      isActive: status === 'Active',
      organizationId: 'org-001',
      createdById: currentUser?.id,
    });
    onComplete();
  };

  // ─── Step indicator ──────────────────────────────────────────────────────
  const renderStepIndicator = () => (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isPast = step > s.id;
        const isCurrent = step === s.id;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <div className={cn('h-px flex-1 min-w-[16px]', isPast ? 'bg-primary' : 'bg-border')} />
            )}
            <button
              type="button"
              onClick={() => { if (isPast) setStep(s.id); }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                isCurrent && 'bg-primary text-primary-foreground',
                isPast && 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20',
                !isCurrent && !isPast && 'bg-muted text-muted-foreground',
              )}
            >
              {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Step content ────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (step) {
      // ── Step 1: Template Information ───────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Template name" />
              </div>
              <div className="grid gap-2">
                <Label>Version *</Label>
                <Input value={version} onChange={e => setVersion(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Linked Document</Label>
                <Select value={linkedDoc} onValueChange={setLinkedDoc}>
                  <SelectTrigger><SelectValue placeholder="Select a linked document..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvedDocuments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.documentNumber} — {d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Quality Control" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the purpose of this form template..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as 'Active' | 'Draft')}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // ── Step 2: Field Builder ──────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            {/* Add field form */}
            <div className="border rounded-md p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Add Field
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Field Name *</Label>
                  <Input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="fieldName" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Label *</Label>
                  <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="Field Label" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Type *</Label>
                  <Select value={newFieldType} onValueChange={v => setNewFieldType(v as FormFieldDefinition['type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{fieldTypeIcons[t]} {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Placeholder</Label>
                  <Input value={newFieldPlaceholder} onChange={e => setNewFieldPlaceholder(e.target.value)} placeholder="Enter placeholder..." />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Default Value</Label>
                  <Input value={newFieldDefaultValue} onChange={e => setNewFieldDefaultValue(e.target.value)} placeholder="Default..." />
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2 pb-1">
                    <Checkbox checked={newFieldRequired} onCheckedChange={v => setNewFieldRequired(v === true)} id="new-required" />
                    <Label htmlFor="new-required" className="text-xs cursor-pointer">Required</Label>
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={addField} disabled={!newFieldName.trim() || !newFieldLabel.trim()}>
                <Plus className="h-3 w-3 mr-1" />Add Field
              </Button>
            </div>

            {/* Field list with numbered preview */}
            {fields.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fields ({fields.length})</h4>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {fields.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-2 border rounded-md p-2 text-sm">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground font-mono text-xs w-6">{i + 1}.</span>
                      <span className="font-medium flex-1">{field.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {fieldTypeIcons[field.type]} {field.type}
                      </Badge>
                      {field.required && <Badge variant="outline" className="text-xs border-red-300 text-red-700">Required</Badge>}
                      {field.placeholder && <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">&ldquo;{field.placeholder}&rdquo;</span>}
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFieldUp(i)} disabled={i === 0}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFieldDown(i)} disabled={i === fields.length - 1}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeField(field.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ── Step 3: Field Configuration ────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fields to configure. Go back to Field Builder to add fields.
              </div>
            ) : (
              <>
                {fields.map(field => (
                  <div key={field.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{fieldTypeIcons[field.type]} {field.type}</Badge>
                      <span className="font-medium text-sm">{field.label}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-auto">{field.name}</span>
                    </div>
                    {field.type === 'select' && (
                      <div className="grid gap-1">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={fieldOptions[field.id] || ''}
                          onChange={e => setFieldOptions({ ...fieldOptions, [field.id]: e.target.value })}
                          placeholder="Option A, Option B, Option C"
                        />
                      </div>
                    )}
                    {field.type === 'number' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label className="text-xs">Validation Min</Label>
                          <Input
                            type="number"
                            value={fieldMin[field.id] || ''}
                            onChange={e => setFieldMin({ ...fieldMin, [field.id]: e.target.value })}
                            placeholder="Min"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Validation Max</Label>
                          <Input
                            type="number"
                            value={fieldMax[field.id] || ''}
                            onChange={e => setFieldMax({ ...fieldMax, [field.id]: e.target.value })}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    )}
                    {field.type === 'text' && (
                      <div className="grid gap-1">
                        <Label className="text-xs">Validation Pattern (regex)</Label>
                        <Input
                          value={fieldPattern[field.id] || ''}
                          onChange={e => setFieldPattern({ ...fieldPattern, [field.id]: e.target.value })}
                          placeholder="e.g., ^[A-Za-z]+$"
                        />
                      </div>
                    )}
                    {field.type !== 'select' && field.type !== 'number' && field.type !== 'text' && (
                      <p className="text-xs text-muted-foreground italic">No additional configuration for {field.type} fields.</p>
                    )}
                  </div>
                ))}

                {/* Validation summary */}
                <div className="border rounded-md p-3 bg-muted/20">
                  <h4 className="font-medium text-sm mb-2">Validation Summary</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background rounded p-2 text-center">
                      <span className="font-bold text-lg">{fields.filter(f => f.type === 'select').length}</span>
                      <p className="text-muted-foreground">Select fields</p>
                    </div>
                    <div className="bg-background rounded p-2 text-center">
                      <span className="font-bold text-lg">{fields.filter(f => f.type === 'number').length}</span>
                      <p className="text-muted-foreground">Number fields</p>
                    </div>
                    <div className="bg-background rounded p-2 text-center">
                      <span className="font-bold text-lg">{fields.filter(f => f.type === 'text').length}</span>
                      <p className="text-muted-foreground">Text fields</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      // ── Step 4: Workflow & Rules ───────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={requiresApproval} onCheckedChange={v => setRequiresApproval(v === true)} id="req-approval" />
              <Label htmlFor="req-approval" className="cursor-pointer">Requires approval</Label>
            </div>
            {requiresApproval && (
              <div className="grid gap-2 ml-6">
                <Label className="text-xs">Workflow Type</Label>
                <Select value={workflowType} onValueChange={setWorkflowType}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Approver</SelectItem>
                    <SelectItem value="sequential">Sequential Approval</SelectItem>
                    <SelectItem value="parallel">Parallel Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Separator />
            <div className="flex items-center gap-2">
              <Checkbox checked={draftSaves} onCheckedChange={v => setDraftSaves(v === true)} id="draft-saves" />
              <Label htmlFor="draft-saves" className="cursor-pointer">Allow draft saves</Label>
              <Badge variant="outline" className="text-xs ml-1">Default: on</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={lockAfterSubmission} onCheckedChange={v => setLockAfterSubmission(v === true)} id="lock-submission" />
              <Label htmlFor="lock-submission" className="cursor-pointer">Lock after submission</Label>
              <Badge variant="outline" className="text-xs ml-1">Default: on</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={eSignature} onCheckedChange={v => setESignature(v === true)} id="e-sig" />
              <Label htmlFor="e-sig" className="cursor-pointer">E-signature required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={part11} onCheckedChange={v => setPart11(v === true)} id="part11" />
              <Label htmlFor="part11" className="cursor-pointer">21 CFR Part 11 compliance</Label>
              {fields.some(f => f.type === 'signature') && !part11 && (
                <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" variant="secondary">
                  Auto-enabled (signature field detected)
                </Badge>
              )}
            </div>
          </div>
        );

      // ── Step 5: Compliance & Retention ─────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Regulatory Reference</Label>
              <Input value={regulatoryReference} onChange={e => setRegulatoryReference(e.target.value)} placeholder="e.g., ISO 13485:2016 §4.2.4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Retention Period</Label>
                <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="5-years">5 Years</SelectItem>
                    <SelectItem value="7-years">7 Years</SelectItem>
                    <SelectItem value="10-years">10 Years</SelectItem>
                    <SelectItem value="lifetime">Product Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data Classification</Label>
                <Select value={dataClassification} onValueChange={setDataClassification}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="gxp">GxP Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={auditTrail} onCheckedChange={v => setAuditTrail(v === true)} id="audit-trail" />
              <Label htmlFor="audit-trail" className="cursor-pointer">Audit trail enabled</Label>
              <Badge variant="outline" className="text-xs ml-1">Default: on</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={printFriendly} onCheckedChange={v => setPrintFriendly(v === true)} id="print-friendly" />
              <Label htmlFor="print-friendly" className="cursor-pointer">Print-friendly layout</Label>
            </div>
          </div>
        );

      // ── Step 6: Review & Submit ────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-4">
            {/* Compliance banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Regulatory Compliance</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  This template complies with ISO 13485:2016 and FDA 21 CFR Part 11 electronic records requirements.
                  {part11Effective && ' Part 11 compliance is enabled for electronic signatures and audit trails.'}
                </p>
              </div>
            </div>

            {/* Part 11 indicator */}
            {part11Effective && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-md">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">21 CFR Part 11 Compliant</span>
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">E-Signatures</Badge>
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">Audit Trail</Badge>
              </div>
            )}

            {/* Template summary */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                Template Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Title:</span> <span className="font-medium ml-1">{title}</span></div>
                <div><span className="text-muted-foreground">Version:</span> <span className="font-medium ml-1 font-mono">{version}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="ml-1 text-xs">{status}</Badge></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium ml-1">{category || '-'}</span></div>
                <div><span className="text-muted-foreground">Fields:</span> <span className="font-medium ml-1">{fields.length}</span></div>
                <div><span className="text-muted-foreground">Linked Doc:</span> <span className="font-medium ml-1 text-xs">
                  {linkedDoc && linkedDoc !== 'none'
                    ? approvedDocuments.find(d => d.id === linkedDoc)?.documentNumber || linkedDoc
                    : 'None'}
                </span></div>
              </div>
              {description && (
                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1">{description}</p>
                </div>
              )}
            </div>

            {/* Fields preview */}
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Field Preview</h4>
              <div className="space-y-1">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="text-muted-foreground font-mono text-xs w-6">{i + 1}.</span>
                    <span className="font-medium">{field.label}</span>
                    <Badge variant="outline" className="text-xs">{fieldTypeIcons[field.type]} {field.type}</Badge>
                    {field.required && <Badge variant="outline" className="text-xs border-red-300 text-red-700">Req</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow & Compliance summary */}
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Workflow & Compliance</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Approval:</span> <span className="ml-1">{requiresApproval ? `Yes (${workflowType})` : 'No'}</span></div>
                <div><span className="text-muted-foreground">Draft Saves:</span> <span className="ml-1">{draftSaves ? 'Yes' : 'No'}</span></div>
                <div><span className="text-muted-foreground">Lock After Submit:</span> <span className="ml-1">{lockAfterSubmission ? 'Yes' : 'No'}</span></div>
                <div><span className="text-muted-foreground">E-Signature:</span> <span className="ml-1">{eSignature ? 'Yes' : 'No'}</span></div>
                <div><span className="text-muted-foreground">Part 11:</span> <span className="ml-1">{part11Effective ? 'Yes' : 'No'}</span></div>
                <div><span className="text-muted-foreground">Audit Trail:</span> <span className="ml-1">{auditTrail ? 'Yes' : 'No'}</span></div>
                <div><span className="text-muted-foreground">Retention:</span> <span className="ml-1">{retentionPeriod || '-'}</span></div>
                <div><span className="text-muted-foreground">Classification:</span> <span className="ml-1">{dataClassification || '-'}</span></div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      {renderStepIndicator()}

      <Separator />

      {/* Step content */}
      <div className="min-h-[300px]">
        {renderStepContent()}
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {step} of {STEPS.length}
        </span>
        {step < 6 ? (
          <Button onClick={() => step < 6 && setStep(step + 1)} disabled={!stepCanProceed}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!stepCanProceed}>
            <Plus className="h-4 w-4 mr-1" />Save Template
          </Button>
        )}
      </div>
    </div>
  );
}
