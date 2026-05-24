import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createChangeControl } from '@/services/changeControlService';
import { checkPrerequisites } from '@/services/compliance/prerequisiteEngine';
import { cn } from '@/lib/utils';
import type {
  ChangeControlType, ChangeControlPriority, ChangeControlCategory,
} from '@/types/qms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChangeControlCreateFormProps {
  onComplete: () => void;
}

const STEPS = [
  'Change Request',
  'Description & Justification',
  'Proposed Change',
  'Risk & Impact Assessment',
  'Approval & Assignment',
  'Linked Records',
  'Review & Submit',
] as const;

const CC_TYPES: ChangeControlType[] = ['Planned', 'Unplanned', 'Emergency'];
const CC_PRIORITIES: ChangeControlPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const CC_CATEGORIES: ChangeControlCategory[] = [
  'Process', 'Equipment', 'Facility', 'Document', 'Material', 'Computer System', 'Organizational',
];

const AFFECTED_AREAS = [
  'Manufacturing', 'QC', 'QA', 'Regulatory', 'Supply Chain', 'Warehouse', 'Other',
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function ChangeControlCreateForm({ onComplete }: ChangeControlCreateFormProps) {
  const profiles = useQMSStore(s => s.profiles);
  const documents = useQMSStore(s => s.documents);
  const capas = useQMSStore(s => s.capas);
  const changeControls = useQMSStore(s => s.changeControls);

  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Step 1 — Change Request
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChangeControlType>('Planned');
  const [priority, setPriority] = useState<ChangeControlPriority>('Medium');
  const [category, setCategory] = useState<ChangeControlCategory>('Process');

  // Step 2 — Description & Justification
  const [description, setDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [regulatoryTrigger, setRegulatoryTrigger] = useState('');

  // Step 3 — Proposed Change
  const [proposedChange, setProposedChange] = useState('');
  const [implementationPlan, setImplementationPlan] = useState('');
  const [implementationDate, setImplementationDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  // Step 4 — Risk & Impact
  const [riskAssessment, setRiskAssessment] = useState('');
  const [impactAnalysis, setImpactAnalysis] = useState('');
  const [affectedAreas, setAffectedAreas] = useState<string[]>([]);
  const [impactValidatedSystems, setImpactValidatedSystems] = useState(false);
  const [validatedSystemsDetails, setValidatedSystemsDetails] = useState('');

  // Step 5 — Approval & Assignment
  const [requestedBy, setRequestedBy] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Step 6 — Linked Records
  const [linkedDocumentId, setLinkedDocumentId] = useState('');
  const [linkedCapaId, setLinkedCapaId] = useState('');
  const [additionalRefs, setAdditionalRefs] = useState('');

  // ─── Step validation ─────────────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!title && !!type && !!priority && !!category;
      case 1:
        return !!description && !!justification;
      case 2:
        return !!proposedChange;
      case 3:
        return true; // optional fields
      case 4:
        return !!requestedBy && !!assignedTo && !!dueDate;
      case 5:
        return true; // optional
      case 6:
        return true; // review
      default:
        return false;
    }
  };

  const canGoNext = validateStep(currentStep);

  const handleNext = () => {
    if (canGoNext && currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    const prereqResult = checkPrerequisites('CHANGE_CONTROL', 'org-001');
    if (!prereqResult.met) {
      setPrereqError(`Prerequisite not met: ${prereqResult.missing.map(p => p.description).join(', ')}`);
      return;
    }

    createChangeControl({
      ccNumber: `CC-2024-${String(changeControls.length + 1).padStart(3, '0')}`,
      title,
      type,
      status: 'Requested',
      priority,
      category,
      description,
      justification,
      proposedChange,
      riskAssessment: riskAssessment || undefined,
      impactAnalysis: impactAnalysis || undefined,
      implementationPlan: implementationPlan || undefined,
      implementationDate: implementationDate || undefined,
      linkedDocumentId: linkedDocumentId && linkedDocumentId !== 'none' ? linkedDocumentId : undefined,
      linkedCapaId: linkedCapaId && linkedCapaId !== 'none' ? linkedCapaId : undefined,
      assignedTo,
      requestedBy,
      approvedBy: approvedBy || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      organizationId: 'org-001',
    });

    onComplete();
  };

  // ─── Affected areas toggle ───────────────────────────────────────────────

  const toggleArea = (area: string) => {
    setAffectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  // ─── Step indicator ──────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-6 overflow-x-auto py-2">
      {STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <React.Fragment key={label}>
            {/* Circle + label */}
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 text-center leading-tight max-w-[70px]',
                  isCurrent ? 'text-primary font-medium' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 sm:w-10 mb-5 transition-colors',
                  i < currentStep ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Step content ────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      // ─── Step 1: Change Request ────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="cc-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter change control title"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select value={type} onValueChange={v => setType(v as ChangeControlType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CC_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority <span className="text-red-500">*</span></Label>
                <Select value={priority} onValueChange={v => setPriority(v as ChangeControlPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CC_PRIORITIES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={v => setCategory(v as ChangeControlCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CC_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {type === 'Emergency' && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="pt-4 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Emergency Change Control</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                      Emergency changes require retroactive approval within 72 hours per FDA 21 CFR 820.70(i).
                      All emergency changes must be fully documented and reviewed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      // ─── Step 2: Description & Justification ───────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="cc-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the current situation and the need for change..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-justification">Justification <span className="text-red-500">*</span></Label>
              <Textarea
                id="cc-justification"
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Why is this change needed? Provide business or compliance justification..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-regulatory">Regulatory Trigger</Label>
              <Input
                id="cc-regulatory"
                value={regulatoryTrigger}
                onChange={e => setRegulatoryTrigger(e.target.value)}
                placeholder="e.g., FDA guidance update, ISO standard revision, audit finding..."
              />
              <p className="text-xs text-muted-foreground">Reference any regulatory requirement that triggered this change.</p>
            </div>
          </div>
        );

      // ─── Step 3: Proposed Change ───────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-proposed">Proposed Change <span className="text-red-500">*</span></Label>
              <Textarea
                id="cc-proposed"
                value={proposedChange}
                onChange={e => setProposedChange(e.target.value)}
                placeholder="Describe the proposed change in detail..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-impl-plan">Implementation Plan</Label>
              <Textarea
                id="cc-impl-plan"
                value={implementationPlan}
                onChange={e => setImplementationPlan(e.target.value)}
                placeholder="Outline the steps for implementing this change..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cc-impl-date">Implementation Date</Label>
                <Input
                  id="cc-impl-date"
                  type="date"
                  value={implementationDate}
                  onChange={e => setImplementationDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-cost">Estimated Cost / Impact</Label>
                <Input
                  id="cc-cost"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  placeholder="e.g., $50,000 or 2 weeks downtime"
                />
              </div>
            </div>
          </div>
        );

      // ─── Step 4: Risk & Impact Assessment ──────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-risk">Risk Assessment</Label>
              <Textarea
                id="cc-risk"
                value={riskAssessment}
                onChange={e => setRiskAssessment(e.target.value)}
                placeholder="Assess the risk associated with this change (probability, impact, detection)..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-impact">Impact Analysis</Label>
              <Textarea
                id="cc-impact"
                value={impactAnalysis}
                onChange={e => setImpactAnalysis(e.target.value)}
                placeholder="Analyze the potential impact on products, processes, and systems..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Affected Areas</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AFFECTED_AREAS.map(area => (
                  <label key={area} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={affectedAreas.includes(area)}
                      onCheckedChange={() => toggleArea(area)}
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={impactValidatedSystems}
                  onCheckedChange={checked => setImpactValidatedSystems(!!checked)}
                />
                <span className="text-sm font-medium">Impact on Validated Systems</span>
              </label>
              {impactValidatedSystems && (
                <Textarea
                  value={validatedSystemsDetails}
                  onChange={e => setValidatedSystemsDetails(e.target.value)}
                  placeholder="Describe the impact on validated systems, including re-validation requirements..."
                  rows={3}
                />
              )}
            </div>
          </div>
        );

      // ─── Step 5: Approval & Assignment ─────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requested By <span className="text-red-500">*</span></Label>
                <Select value={requestedBy} onValueChange={setRequestedBy}>
                  <SelectTrigger><SelectValue placeholder="Select requester" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To <span className="text-red-500">*</span></Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Approver</Label>
              <Select value={approvedBy} onValueChange={setApprovedBy}>
                <SelectTrigger><SelectValue placeholder="Select approver (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-due">Due Date <span className="text-red-500">*</span></Label>
              <Input
                id="cc-due"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
        );

      // ─── Step 6: Linked Records ────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Linked Document</Label>
                <Select value={linkedDocumentId} onValueChange={setLinkedDocumentId}>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvedDocuments.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.documentNumber} — {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked CAPA</Label>
                <Select value={linkedCapaId} onValueChange={setLinkedCapaId}>
                  <SelectTrigger><SelectValue placeholder="Select CAPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {capas.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.capaNumber} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-additional-refs">Additional References</Label>
              <Textarea
                id="cc-additional-refs"
                value={additionalRefs}
                onChange={e => setAdditionalRefs(e.target.value)}
                placeholder="Any additional reference numbers, audit findings, external references..."
                rows={3}
              />
            </div>
          </div>
        );

      // ─── Step 7: Review & Submit ───────────────────────────────────────
      case 6:
        return (
          <div className="space-y-4">
            {/* Compliance banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Regulatory Compliance</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                    This change control complies with ICH Q10 Pharmaceutical Quality System,
                    ISO 13485:2016 §7.3 Design and Development, and FDA 21 CFR 820.70(i) Change Control requirements.
                    All changes require documented justification, risk assessment, and approval before implementation.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency warning */}
            {type === 'Emergency' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Emergency Change Control</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                      Per FDA 21 CFR 820.70(i), emergency changes must be documented at the time of implementation
                      and retroactively approved within 72 hours. Ensure all actions are fully documented.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{title}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className={cn(
                    type === 'Emergency' ? 'border-red-300 text-red-700' :
                    type === 'Unplanned' ? 'border-amber-300 text-amber-700' :
                    'border-green-300 text-green-700'
                  )}>{type}</Badge></div>
                  <div><span className="text-muted-foreground">Priority:</span> <Badge variant="secondary" className={cn(
                    priority === 'Critical' ? 'bg-red-100 text-red-700' :
                    priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  )}>{priority}</Badge></div>
                  <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline">{category}</Badge></div>
                  <div><span className="text-muted-foreground">Requested By:</span> <span className="font-medium">{profiles.find(p => p.id === requestedBy)?.fullName || '—'}</span></div>
                  <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium">{profiles.find(p => p.id === assignedTo)?.fullName || '—'}</span></div>
                  {approvedBy && approvedBy !== 'none' && (
                    <div><span className="text-muted-foreground">Approver:</span> <span className="font-medium">{profiles.find(p => p.id === approvedBy)?.fullName || '—'}</span></div>
                  )}
                  <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{dueDate || '—'}</span></div>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Justification:</span>
                  <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{justification}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Proposed Change:</span>
                  <p className="text-sm mt-0.5 bg-primary/5 border border-primary/20 p-2 rounded">{proposedChange}</p>
                </div>

                {(riskAssessment || impactAnalysis) && (
                  <>
                    <Separator />
                    {riskAssessment && (
                      <div>
                        <span className="text-muted-foreground text-sm">Risk Assessment:</span>
                        <p className="text-sm mt-0.5 bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-200 dark:border-amber-800">{riskAssessment}</p>
                      </div>
                    )}
                    {impactAnalysis && (
                      <div>
                        <span className="text-muted-foreground text-sm">Impact Analysis:</span>
                        <p className="text-sm mt-0.5 bg-blue-50 dark:bg-blue-900/10 p-2 rounded border border-blue-200 dark:border-blue-800">{impactAnalysis}</p>
                      </div>
                    )}
                  </>
                )}

                {affectedAreas.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Affected Areas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {affectedAreas.map(a => (
                        <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {impactValidatedSystems && (
                  <div>
                    <span className="text-muted-foreground text-sm">Impact on Validated Systems:</span>
                    <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{validatedSystemsDetails || 'Not specified'}</p>
                  </div>
                )}

                {(implementationPlan || implementationDate || estimatedCost) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      {implementationPlan && <div><span className="text-muted-foreground">Implementation Plan:</span> <p className="mt-0.5 bg-muted/30 p-2 rounded">{implementationPlan}</p></div>}
                      {implementationDate && <div><span className="text-muted-foreground">Implementation Date:</span> <p className="mt-0.5 font-medium">{implementationDate}</p></div>}
                      {estimatedCost && <div><span className="text-muted-foreground">Est. Cost/Impact:</span> <p className="mt-0.5 font-medium">{estimatedCost}</p></div>}
                    </div>
                  </>
                )}

                {(linkedDocumentId && linkedDocumentId !== 'none') && (
                  <div>
                    <span className="text-muted-foreground text-sm">Linked Document:</span>{' '}
                    <span className="text-sm font-medium">
                      {(() => {
                        const doc = approvedDocuments.find(d => d.id === linkedDocumentId);
                        return doc ? `${doc.documentNumber} — ${doc.title}` : '—';
                      })()}
                    </span>
                  </div>
                )}

                {(linkedCapaId && linkedCapaId !== 'none') && (
                  <div>
                    <span className="text-muted-foreground text-sm">Linked CAPA:</span>{' '}
                    <span className="text-sm font-medium">
                      {(() => {
                        const capa = capas.find(c => c.id === linkedCapaId);
                        return capa ? `${capa.capaNumber} — ${capa.title}` : '—';
                      })()}
                    </span>
                  </div>
                )}

                {additionalRefs && (
                  <div>
                    <span className="text-muted-foreground text-sm">Additional References:</span>
                    <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{additionalRefs}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prerequisite error */}
            {prereqError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{prereqError}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {renderStepIndicator()}
      <div className="min-h-[300px]">
        {renderStepContent()}
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </span>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canGoNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(4)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Submit Change Control
          </Button>
        )}
      </div>
    </div>
  );
}
