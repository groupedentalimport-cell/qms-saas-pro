'use client';

/**
 * RichFormRenderer.tsx
 * ────────────────────
 * Dynamic rendering engine for RichFormTemplate.
 * Used in CAPA, NCR, Audit, Training, Risk, Deviation, ChangeControl.
 *
 * Supports: 17 field types - collapsible sections - conditional logic
 * - repeaters - calculated fields - per-section progress - e-signature
 *
 * Usage:
 *   <RichFormRenderer
 *     template={CAPA_FORM_TEMPLATE}
 *     values={formValues}
 *     onChange={setFormValues}
 *     mode="edit" | "view" | "review"
 *     onSubmit={handleSubmit}
 *   />
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Lock,
  AlertCircle, CheckCircle2, Info, FileText, PenLine,
  Calculator,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator }from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ElectronicSignatureModal }   from '@/components/shared/ElectronicSignatureModal';
import { useQMSStore } from '@/lib/demo-store';
import type {
  RichFormTemplate, RichFormSection, RichFieldDefinition,
  FieldCondition, RepeaterColumn,
} from '@/types/rich-form-types';
import type { SignatureType } from '@/types/qms';

// ── Types ────────────────────────────────────────────────────────────────────

type FormMode = 'edit' | 'view' | 'review';

interface RichFormRendererProps {
  template:   RichFormTemplate;
  values:     Record<string, unknown>;
  onChange:   (values: Record<string, unknown>) => void;
  mode?:      FormMode;
  onSubmit?:  (values: Record<string, unknown>, signatureHash?: string) => void;
  onSaveDraft?: (values: Record<string, unknown>) => void;
  isLocked?:  boolean;
  className?: string;
}

// ── Helper — evaluate a condition ────────────────────────────────────────────

function evalCondition(cond: FieldCondition, values: Record<string, unknown>): boolean {
  const val = values[cond.fieldId];
  switch (cond.operator) {
    case 'equals':       return val === cond.value;
    case 'not_equals':   return val !== cond.value;
    case 'contains':
      if (Array.isArray(val)) return val.includes(cond.value);
      if (typeof val === 'string') return val.includes(String(cond.value));
      return false;
    case 'greater_than': return Number(val) > Number(cond.value);
    case 'less_than':    return Number(val) < Number(cond.value);
    case 'is_filled':    return val !== undefined && val !== null && val !== '';
    default:             return true;
  }
}

// ── Helper — section completion ───────────────────────────────────────────────

function getSectionCompletion(
  section: RichFormSection,
  values: Record<string, unknown>,
): { filled: number; total: number } {
  const required = section.fields.filter(f =>
    f.required &&
    f.type !== 'section_header' &&
    (!f.showIf || evalCondition(f.showIf, values))
  );
  const filled = required.filter(f => {
    const v = values[f.id];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  });
  return { filled: filled.length, total: required.length };
}

// ── Helper — missing closure fields ──────────────────────────────────────────

function getMissingClosureFields(
  template: RichFormTemplate,
  values: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!field.requiredForClosure) continue;
      if (field.showIf && !evalCondition(field.showIf, values)) continue;
      const v = values[field.id];
      const isEmpty = v === undefined || v === null || v === '' ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) missing.push(field.label);
    }
  }
  return missing;
}

// ══════════════════════════════════════════════════════════════════════════════
// Individual field renderers
// ══════════════════════════════════════════════════════════════════════════════

function FieldText({ field, value, onChange, disabled }: any) {
  return (
    <Input
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled || field.readOnly}
      minLength={field.validation?.minLength}
      maxLength={field.validation?.maxLength}
    />
  );
}

function FieldNumber({ field, value, onChange, disabled }: any) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.valueAsNumber)}
      placeholder={field.placeholder}
      disabled={disabled || field.readOnly}
      min={field.validation?.min}
      max={field.validation?.max}
    />
  );
}

function FieldTextarea({ field, value, onChange, disabled }: any) {
  return (
    <Textarea
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled || field.readOnly}
      rows={4}
      className="resize-y"
    />
  );
}

function FieldRichText({ field, value, onChange, disabled }: any) {
  return (
    <div className="space-y-1">
      <Textarea
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.readOnly}
        rows={6}
        className="resize-y font-mono text-sm"
      />
      <p className="text-[11px] text-muted-foreground">
        Rich text editor — integrate Tiptap for advanced formatting
      </p>
    </div>
  );
}

function FieldSelect({ field, value, onChange, disabled }: any) {
  return (
    <Select
      value={String(value ?? '')}
      onValueChange={onChange}
      disabled={disabled || field.readOnly}
    >
      <SelectTrigger>
        <SelectValue placeholder={field.placeholder ?? 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((opt: string) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldMultiSelect({ field, value, onChange, disabled }: any) {
  const selected: string[] = Array.isArray(value) ? value : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt: string) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled || field.readOnly}
            onClick={() => toggle(opt)}
            className={`
              text-sm px-3 py-1.5 rounded-full border transition-colors
              ${active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent/40'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FieldDate({ field, value, onChange, disabled }: any) {
  return (
    <Input
      type="date"
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      disabled={disabled || field.readOnly}
    />
  );
}

function FieldDateRange({ field, value, onChange, disabled }: any) {
  const range = (value as any) ?? { start: '', end: '' };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Start</Label>
        <Input type="date" value={range.start} disabled={disabled}
          onChange={e => onChange({ ...range, start: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">End</Label>
        <Input type="date" value={range.end} disabled={disabled}
          onChange={e => onChange({ ...range, end: e.target.value })} />
      </div>
    </div>
  );
}

function FieldCheckbox({ field, value, onChange, disabled }: any) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Checkbox
        id={field.id}
        checked={Boolean(value)}
        onCheckedChange={onChange}
        disabled={disabled || field.readOnly}
      />
      <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
        {field.placeholder ?? 'Yes, confirmed'}
      </Label>
    </div>
  );
}

function FieldYesNoNa({ field, value, onChange, disabled }: any) {
  return (
    <RadioGroup
      value={String(value ?? '')}
      onValueChange={onChange}
      disabled={disabled || field.readOnly}
      className="flex gap-4"
    >
      {['Yes', 'No', 'N/A'].map(opt => (
        <div key={opt} className="flex items-center gap-2">
          <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
          <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal cursor-pointer">
            {opt}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function FieldRating({ field, value, onChange, disabled }: any) {
  const min = field.ratingMin ?? 1;
  const max = field.ratingMax ?? 5;
  const current = Number(value ?? 0);
  const labels = field.ratingLabels ?? [];
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button
            key={n}
            type="button"
            disabled={disabled || field.readOnly}
            onClick={() => onChange(n)}
            className={`
              w-9 h-9 rounded-md border text-sm font-medium transition-colors
              ${n === current
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent/40 text-muted-foreground'}
            `}
          >
            {n}
          </button>
        ))}
      </div>
      {labels[current - min] && (
        <p className="text-xs text-muted-foreground">{labels[current - min]}</p>
      )}
    </div>
  );
}

function FieldUserSelect({ field, value, onChange, disabled }: any) {
  const profiles = useQMSStore(s => s.profiles);
  return (
    <Select value={String(value ?? '')} onValueChange={onChange} disabled={disabled || field.readOnly}>
      <SelectTrigger>
        <SelectValue placeholder="Select user..." />
      </SelectTrigger>
      <SelectContent>
        {profiles.map(p => (
          <SelectItem key={p.id} value={p.id}>
            {p.fullName || p.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldFile({ field, value, onChange, disabled }: any) {
  const files: string[] = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-muted rounded px-2 py-1">
              <FileText className="h-3 w-3" />
              {f}
              {!disabled && (
                <button type="button" onClick={() => onChange(files.filter((_: string, j: number) => j !== i))}
                  className="text-muted-foreground hover:text-destructive ml-1">×</button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && !field.readOnly && (
        <label className={`
          flex items-center gap-2 w-full border-2 border-dashed rounded-lg px-4 py-3
          text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-primary
          transition-colors
        `}>
          <FileText className="h-4 w-4 shrink-0" />
          <span>Attach file
            {field.acceptedFormats && (
              <span className="ml-1 text-xs opacity-60">
                ({field.acceptedFormats.join(', ')}
                {field.maxFileSizeMB && ` - max ${field.maxFileSizeMB} MB`})
              </span>
            )}
          </span>
          <input
            type="file"
            className="sr-only"
            accept={field.acceptedFormats?.join(',')}
            onChange={e => {
              const name = e.target.files?.[0]?.name;
              if (name) onChange([...files, name]);
            }}
          />
        </label>
      )}
    </div>
  );
}

function FieldRepeater({ field, value, onChange, disabled }: any) {
  const rows: Record<string, unknown>[] = Array.isArray(value) ? value : [];
  const columns: RepeaterColumn[] = field.columns ?? [];

  const addRow = () => {
    const empty = Object.fromEntries(columns.map(c => [c.id, '']));
    onChange([...rows, empty]);
  };

  const updateCell = (rowIdx: number, colId: string, val: unknown) => {
    const next = rows.map((r, i) =>
      i === rowIdx ? { ...r, [colId]: val } : r
    );
    onChange(next);
  };

  const removeRow = (idx: number) => onChange(rows.filter((_: any, i: number) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {columns.map(col => (
                  <th key={col.id} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    {col.label}
                    {col.required && <span className="text-destructive ml-0.5">*</span>}
                  </th>
                ))}
                {!disabled && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1}
                    className="text-center text-muted-foreground text-sm py-6 italic">
                    No rows — click &quot;Add&quot; to begin
                  </td>
                </tr>
              )}
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0 hover:bg-muted/20">
                  {columns.map(col => (
                    <td key={col.id} className="px-2 py-1.5 align-top">
                      {col.type === 'textarea' ? (
                        <Textarea
                          value={String(row[col.id] ?? '')}
                          onChange={e => updateCell(ri, col.id, e.target.value)}
                          disabled={disabled}
                          rows={2}
                          className="text-sm min-w-[120px] resize-none"
                        />
                      ) : col.type === 'select' ? (
                        <Select
                          value={String(row[col.id] ?? '')}
                          onValueChange={v => updateCell(ri, col.id, v)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="..." />
                          </SelectTrigger>
                          <SelectContent>
                            {col.options?.map(o => (
                              <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : col.type === 'checkbox' ? (
                        <Checkbox
                          checked={Boolean(row[col.id])}
                          onCheckedChange={v => updateCell(ri, col.id, v)}
                          disabled={disabled}
                        />
                      ) : col.type === 'date' ? (
                        <Input
                          type="date"
                          value={String(row[col.id] ?? '')}
                          onChange={e => updateCell(ri, col.id, e.target.value)}
                          disabled={disabled}
                          className="h-8 text-xs min-w-[120px]"
                        />
                      ) : (
                        <Input
                          value={String(row[col.id] ?? '')}
                          onChange={e => updateCell(ri, col.id, e.target.value)}
                          disabled={disabled}
                          className="h-8 text-xs min-w-[100px]"
                        />
                      )}
                    </td>
                  ))}
                  {!disabled && (
                    <td className="px-1 py-1.5 align-middle">
                      <button
                        type="button"
                        onClick={() => removeRow(ri)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}
          disabled={field.maxRows ? rows.length >= field.maxRows : false}
          className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      )}
      {field.minRows && rows.length < field.minRows && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Minimum {field.minRows} row(s) required
        </p>
      )}
    </div>
  );
}

function FieldSignature({ field, value, onChange, disabled }: any) {
  const [open, setOpen] = useState(false);
  const signed = Boolean(value);
  return (
    <div>
      {signed ? (
        <div className="flex items-center gap-2 rounded-md border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Document signed</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/60 font-mono mt-0.5">
              Hash: {String(value).slice(0, 24)}...
            </p>
          </div>
          <Lock className="h-3.5 w-3.5 text-green-500 ml-auto" />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || field.readOnly}
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PenLine className="h-4 w-4" />
          Sign Electronically (21 CFR Part 11)
        </button>
      )}
      {open && (
        <ElectronicSignatureModal
          open={open}
          onClose={() => setOpen(false)}
          onSign={(data: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
            onChange(data.signatureHash);
            setOpen(false);
          }}
          recordTitle={field.label}
          recordId={field.id}
          signatureType="approval"
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Field dispatcher
// ══════════════════════════════════════════════════════════════════════════════

function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: RichFieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}) {
  const props = { field, value, onChange, disabled };

  switch (field.type) {
    case 'text':          return <FieldText {...props} />;
    case 'number':        return <FieldNumber {...props} />;
    case 'textarea':      return <FieldTextarea {...props} />;
    case 'rich_text':     return <FieldRichText {...props} />;
    case 'select':        return <FieldSelect {...props} />;
    case 'multi_select':  return <FieldMultiSelect {...props} />;
    case 'date':          return <FieldDate {...props} />;
    case 'date_range':    return <FieldDateRange {...props} />;
    case 'checkbox':      return <FieldCheckbox {...props} />;
    case 'yes_no_na':     return <FieldYesNoNa {...props} />;
    case 'rating':        return <FieldRating {...props} />;
    case 'user_select':   return <FieldUserSelect {...props} />;
    case 'file':          return <FieldFile {...props} />;
    case 'repeater':      return <FieldRepeater {...props} />;
    case 'signature':     return <FieldSignature {...props} />;
    case 'section_header':return <Separator className="my-1" />;
    case 'calculated':
      return (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">
            {value !== undefined ? String(value) : '—'}
          </span>
          <span className="text-xs text-muted-foreground ml-1">(auto-calculated)</span>
        </div>
      );
    default:
      return <Input value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Field wrapper with label, norm badge, help text, error
// ══════════════════════════════════════════════════════════════════════════════

function FormField({
  field,
  value,
  onChange,
  disabled,
  showError,
}: {
  field: RichFieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  showError: boolean;
}) {
  if (field.type === 'section_header') {
    return (
      <div className="col-span-full">
        <p className="text-sm font-medium text-muted-foreground mb-2">{field.label}</p>
        <Separator />
      </div>
    );
  }

  const isEmpty = value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0);
  const hasError = showError && field.required && isEmpty;

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Label className={`text-sm ${hasError ? 'text-destructive' : ''}`}>
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
          {field.requiredForClosure && !field.required && (
            <span className="text-amber-500 ml-0.5" title="Required for closure">⊡</span>
          )}
        </Label>
        {field.normClause && (
          <Badge variant="outline" className="text-[10px] py-0 font-normal text-muted-foreground">
            {field.normClause}
          </Badge>
        )}
        {field.readOnly && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Field */}
      <FieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />

      {/* Help text */}
      {field.helpText && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          {field.helpText}
        </p>
      )}

      {/* Error */}
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          This field is required
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section
// ══════════════════════════════════════════════════════════════════════════════

function FormSection({
  section,
  values,
  onChange,
  disabled,
  showErrors,
}: {
  section: RichFormSection;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  disabled: boolean;
  showErrors: boolean;
}) {
  const [isOpen, setIsOpen] = useState(!section.defaultCollapsed);
  const { filled, total } = getSectionCompletion(section, values);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 100;
  const complete = total === 0 || filled === total;

  const visibleFields = section.fields.filter(f =>
    !f.showIf || evalCondition(f.showIf, values)
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Section header */}
      <CollapsibleTrigger className="w-full">
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left
          ${complete
            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
            : 'bg-muted/30 border-border hover:bg-muted/50'}
        `}>
          {/* Status icon */}
          {complete
            ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
          }

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{section.title}</span>
              {section.normClause && (
                <Badge variant="outline" className="text-[10px] py-0 font-normal">
                  {section.normClause}
                </Badge>
              )}
              {section.requiredForClosure && (
                <Badge className="text-[10px] py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                  Required for closure
                </Badge>
              )}
            </div>
            {total > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Progress value={pct} className="h-1 flex-1 max-w-32" />
                <span className="text-[11px] text-muted-foreground">
                  {filled}/{total} required fields
                </span>
              </div>
            )}
          </div>

          {section.collapsible !== false && (
            isOpen
              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </CollapsibleTrigger>

      {/* Section body */}
      <CollapsibleContent>
        {section.description && (
          <p className="text-sm text-muted-foreground px-4 pt-3 pb-1">
            {section.description}
          </p>
        )}
        <div className="px-4 py-4 space-y-5">
          {visibleFields.map(field => (
            <FormField
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={v => onChange({ ...values, [field.id]: v })}
              disabled={disabled}
              showError={showErrors}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component — RichFormRenderer
// ══════════════════════════════════════════════════════════════════════════════

export function RichFormRenderer({
  template,
  values,
  onChange,
  mode = 'edit',
  onSubmit,
  onSaveDraft,
  isLocked = false,
  className = '',
}: RichFormRendererProps) {
  const [showErrors, setShowErrors]   = useState(false);
  const [sigOpen, setSigOpen]         = useState(false);

  const disabled = mode === 'view' || isLocked;

  const missingClosure = useMemo(
    () => getMissingClosureFields(template, values),
    [template, values],
  );

  const totalSections = template.sections.length;
  const completedSections = template.sections.filter(s => {
    const { filled, total } = getSectionCompletion(s, values);
    return total === 0 || filled === total;
  }).length;
  const overallPct = Math.round((completedSections / totalSections) * 100);

  const handleSubmit = useCallback(() => {
    setShowErrors(true);
    if (missingClosure.length > 0) return;
    setSigOpen(true);
  }, [missingClosure]);

  return (
    <div className={`space-y-3 ${className}`}>

      {/* ── Form Header ── */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">{template.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs">{template.normReference}</Badge>
              <Badge variant="outline" className="text-xs">v{template.version}</Badge>
              <Badge variant="outline" className="text-xs">
                Retention {template.retentionYears} years
              </Badge>
              {isLocked && (
                <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 gap-1">
                  <Lock className="h-3 w-3" /> Record finalized 4.2.4
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-semibold">{overallPct}%</div>
            <div className="text-xs text-muted-foreground">
              {completedSections}/{totalSections} sections
            </div>
          </div>
        </div>
        <Progress value={overallPct} className="mt-3 h-1.5" />
      </div>

      {/* ── Missing fields alert ── */}
      {showErrors && missingClosure.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {missingClosure.length} mandatory field(s) missing before closure (4.2.4)
              </p>
              <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
                {missingClosure.map((f, i) => <li key={i}>&#8226; {f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {template.sections
        .sort((a, b) => a.order - b.order)
        .map(section => (
          <FormSection
            key={section.id}
            section={section}
            values={values}
            onChange={onChange}
            disabled={disabled}
            showErrors={showErrors}
          />
        ))
      }

      {/* ── Actions ── */}
      {!isLocked && mode !== 'view' && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            &#8865; = Required for closure &nbsp;&middot;&nbsp; * = Required for submission
          </div>
          <div className="flex gap-2">
            {onSaveDraft && (
              <Button variant="outline" onClick={() => onSaveDraft(values)}>
                Save Draft
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={missingClosure.length > 0 && showErrors}>
              <PenLine className="h-4 w-4 mr-1.5" />
              Submit & Sign
            </Button>
          </div>
        </div>
      )}

      {/* ── Electronic signature modal ── */}
      {sigOpen && (
        <ElectronicSignatureModal
          open={sigOpen}
          onClose={() => setSigOpen(false)}
          onSign={(data: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
            setSigOpen(false);
            onSubmit?.(values, data.signatureHash);
          }}
          recordTitle={template.title}
          recordId={template.id}
          signatureType="approval"
        />
      )}
    </div>
  );
}
