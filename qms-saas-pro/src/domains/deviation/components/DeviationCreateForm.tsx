import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createDeviation } from '@/services/deviationService';
import { cn } from '@/lib/utils';
import type {
  DeviationType, DeviationSeverity, DeviationCategory,
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

interface DeviationCreateFormProps {
  onComplete: () => void;
}

const STEPS = [
  'Identification',
  'Deviation Details',
  'Product & Lot Info',
  'Risk & Assessment',
  'Actions & CAPA',
  'Review & Submit',
] as const;

const DEV_TYPES: DeviationType[] = ['Planned', 'Unplanned'];
const DEV_SEVERITIES: DeviationSeverity[] = ['Critical', 'Major', 'Minor'];
const DEV_CATEGORIES: DeviationCategory[] = [
  'Process', 'Equipment', 'Material', 'Environment', 'Personnel', 'Documentation',
];

const PRODUCT_STAGES = [
  'Raw Material', 'In-Process', 'Finished Product', 'Stability', 'Other',
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function DeviationCreateForm({ onComplete }: DeviationCreateFormProps) {
  const profiles = useQMSStore(s => s.profiles);
  const documents = useQMSStore(s => s.documents);
  const capas = useQMSStore(s => s.capas);
  const deviations = useQMSStore(s => s.deviations);

  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 — Identification
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DeviationType>('Unplanned');
  const [severity, setSeverity] = useState<DeviationSeverity>('Minor');
  const [category, setCategory] = useState<DeviationCategory>('Process');
  const [detectedDate, setDetectedDate] = useState('');

  // Step 2 — Deviation Details
  const [description, setDescription] = useState('');
  const [deviationDetails, setDeviationDetails] = useState('');
  const [sopReference, setSopReference] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');

  // Step 3 — Product & Lot Info
  const [productCode, setProductCode] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [quantityAffected, setQuantityAffected] = useState('');
  const [productStage, setProductStage] = useState('');
  const [isolationStatus, setIsolationStatus] = useState(false);

  // Step 4 — Risk & Assessment
  const [riskAssessment, setRiskAssessment] = useState('');
  const [justification, setJustification] = useState('');
  const [impactValidatedState, setImpactValidatedState] = useState(false);
  const [validatedStateDetails, setValidatedStateDetails] = useState('');
  const [impactRegulatoryFiling, setImpactRegulatoryFiling] = useState(false);
  const [regulatoryFilingDetails, setRegulatoryFilingDetails] = useState('');
  const [immediateContainment, setImmediateContainment] = useState('');

  // Step 5 — Actions & CAPA
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [linkedCapaId, setLinkedCapaId] = useState('');
  const [linkedDocumentId, setLinkedDocumentId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  // ─── Step validation ─────────────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!title && !!type && !!severity && !!category;
      case 1:
        return !!description && !!deviationDetails;
      case 2:
        return true; // optional
      case 3:
        // Justification is required for Planned deviations
        if (type === 'Planned' && !justification) return false;
        return true;
      case 4:
        return !!assignedTo && !!dueDate;
      case 5:
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
    createDeviation({
      devNumber: `DEV-2024-${String(deviations.length + 1).padStart(3, '0')}`,
      title,
      type,
      status: 'Open',
      severity,
      category,
      description,
      deviationDetails,
      justification: justification || undefined,
      riskAssessment: riskAssessment || undefined,
      correctiveAction: correctiveAction || undefined,
      preventiveAction: preventiveAction || undefined,
      lotNumber: lotNumber || undefined,
      productCode: productCode || undefined,
      quantityAffected: quantityAffected ? parseInt(quantityAffected) : undefined,
      linkedCapaId: linkedCapaId && linkedCapaId !== 'none' ? linkedCapaId : undefined,
      linkedDocumentId: linkedDocumentId && linkedDocumentId !== 'none' ? linkedDocumentId : undefined,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      organizationId: 'org-001',
    });

    onComplete();
  };

  // ─── Step indicator ──────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-6 overflow-x-auto py-2">
      {STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <React.Fragment key={label}>
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
      // ─── Step 1: Identification ────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dev-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="dev-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter deviation title"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select value={type} onValueChange={v => setType(v as DeviationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEV_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity <span className="text-red-500">*</span></Label>
                <Select value={severity} onValueChange={v => setSeverity(v as DeviationSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEV_SEVERITIES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={v => setCategory(v as DeviationCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEV_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-detected-date">Deviation Detected Date</Label>
              <Input
                id="dev-detected-date"
                type="date"
                value={detectedDate}
                onChange={e => setDetectedDate(e.target.value)}
              />
            </div>
            {type === 'Planned' && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <CardContent className="pt-4 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Planned Deviation</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                      Planned deviations require documented justification per ISO 13485 §8.7.
                      A justification must be provided in the Risk &amp; Assessment step.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      // ─── Step 2: Deviation Details ─────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dev-description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="dev-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the deviation..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-details">Detailed Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="dev-details"
                value={deviationDetails}
                onChange={e => setDeviationDetails(e.target.value)}
                placeholder="Provide detailed information about the deviation, including what happened, when, and where..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-sop">SOP Reference</Label>
              <Input
                id="dev-sop"
                value={sopReference}
                onChange={e => setSopReference(e.target.value)}
                placeholder="e.g., SOP-QC-001 v3.2"
              />
              <p className="text-xs text-muted-foreground">Reference the SOP or procedure that was deviated from.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dev-expected">Expected Result</Label>
                <Textarea
                  id="dev-expected"
                  value={expectedResult}
                  onChange={e => setExpectedResult(e.target.value)}
                  placeholder="What should have happened per procedure..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-actual">Actual Result</Label>
                <Textarea
                  id="dev-actual"
                  value={actualResult}
                  onChange={e => setActualResult(e.target.value)}
                  placeholder="What actually happened..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      // ─── Step 3: Product & Lot Info ────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dev-product-code">Product Code</Label>
                <Input
                  id="dev-product-code"
                  value={productCode}
                  onChange={e => setProductCode(e.target.value)}
                  placeholder="e.g., PROD-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-lot">Lot Number</Label>
                <Input
                  id="dev-lot"
                  value={lotNumber}
                  onChange={e => setLotNumber(e.target.value)}
                  placeholder="e.g., BN-2024-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dev-qty">Quantity Affected</Label>
                <Input
                  id="dev-qty"
                  type="number"
                  value={quantityAffected}
                  onChange={e => setQuantityAffected(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Product Stage</Label>
                <Select value={productStage} onValueChange={setProductStage}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PRODUCT_STAGES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={isolationStatus}
                  onCheckedChange={checked => setIsolationStatus(!!checked)}
                />
                <span className="text-sm font-medium">Product / Material Isolated and Quarantined</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Check this if the affected product or material has been physically isolated and quarantined
                pending investigation and disposition.
              </p>
            </div>
          </div>
        );

      // ─── Step 4: Risk & Assessment ─────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dev-risk">Risk Assessment</Label>
              <Textarea
                id="dev-risk"
                value={riskAssessment}
                onChange={e => setRiskAssessment(e.target.value)}
                placeholder="Assess the risk associated with this deviation (probability, severity, detectability)..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dev-justification">
                Justification {type === 'Planned' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="dev-justification"
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder={
                  type === 'Planned'
                    ? 'Required: Provide justification for this planned deviation...'
                    : 'Optional: Provide justification if applicable...'
                }
                rows={3}
              />
              {type === 'Planned' && !justification && (
                <p className="text-xs text-red-500">Justification is required for planned deviations per ISO 13485 §8.7.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={impactValidatedState}
                  onCheckedChange={checked => setImpactValidatedState(!!checked)}
                />
                <span className="text-sm font-medium">Impact on Validated State</span>
              </label>
              {impactValidatedState && (
                <Textarea
                  value={validatedStateDetails}
                  onChange={e => setValidatedStateDetails(e.target.value)}
                  placeholder="Describe the impact on validated state and re-validation requirements..."
                  rows={3}
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={impactRegulatoryFiling}
                  onCheckedChange={checked => setImpactRegulatoryFiling(!!checked)}
                />
                <span className="text-sm font-medium">Impact on Regulatory Filing</span>
              </label>
              {impactRegulatoryFiling && (
                <Textarea
                  value={regulatoryFilingDetails}
                  onChange={e => setRegulatoryFilingDetails(e.target.value)}
                  placeholder="Describe the impact on regulatory filings, submissions, or registrations..."
                  rows={3}
                />
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="dev-containment">Immediate Containment Action</Label>
              <Textarea
                id="dev-containment"
                value={immediateContainment}
                onChange={e => setImmediateContainment(e.target.value)}
                placeholder="Describe any immediate containment actions taken to prevent further impact..."
                rows={3}
              />
            </div>
          </div>
        );

      // ─── Step 5: Actions & CAPA ────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dev-corrective">Corrective Action</Label>
                <Textarea
                  id="dev-corrective"
                  value={correctiveAction}
                  onChange={e => setCorrectiveAction(e.target.value)}
                  placeholder="Describe corrective actions to address the deviation..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-preventive">Preventive Action</Label>
                <Textarea
                  id="dev-preventive"
                  value={preventiveAction}
                  onChange={e => setPreventiveAction(e.target.value)}
                  placeholder="Describe preventive actions to avoid recurrence..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="dev-due">Due Date <span className="text-red-500">*</span></Label>
                <Input
                  id="dev-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      // ─── Step 6: Review & Submit ───────────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            {/* Compliance banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Regulatory Compliance</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                    This deviation record complies with ISO 13485:2016 §8.7 Control of Nonconforming Product
                    and cGMP 21 CFR 211.192 requirements. All deviations must be documented, investigated,
                    and resolved with appropriate corrective and preventive actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Planned deviation warning */}
            {type === 'Planned' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Planned Deviation</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                      Per ISO 13485 §8.7, planned deviations must include documented justification, pre-defined
                      acceptance criteria, and approval prior to execution. Ensure all requirements are met before submission.
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
                    type === 'Unplanned' ? 'border-amber-300 text-amber-700' : 'border-green-300 text-green-700'
                  )}>{type}</Badge></div>
                  <div><span className="text-muted-foreground">Severity:</span> <Badge variant="secondary" className={cn(
                    severity === 'Critical' ? 'bg-red-100 text-red-700' :
                    severity === 'Major' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  )}>{severity}</Badge></div>
                  <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline">{category}</Badge></div>
                  <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium">{profiles.find(p => p.id === assignedTo)?.fullName || '—'}</span></div>
                  <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{dueDate || '—'}</span></div>
                  {detectedDate && <div><span className="text-muted-foreground">Detected Date:</span> <span className="font-medium">{detectedDate}</span></div>}
                  {productCode && <div><span className="text-muted-foreground">Product Code:</span> <span className="font-medium font-mono">{productCode}</span></div>}
                  {lotNumber && <div><span className="text-muted-foreground">Lot Number:</span> <span className="font-medium font-mono">{lotNumber}</span></div>}
                  {quantityAffected && <div><span className="text-muted-foreground">Qty Affected:</span> <span className="font-medium">{quantityAffected}</span></div>}
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Detailed Description:</span>
                  <p className="text-sm mt-0.5 bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-200 dark:border-amber-800">{deviationDetails}</p>
                </div>

                {justification && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Justification {type === 'Planned' && <Badge variant="outline" className="ml-1 text-xs border-blue-300 text-blue-700">Required</Badge>}:
                    </span>
                    <p className="text-sm mt-0.5 bg-blue-50 dark:bg-blue-900/10 p-2 rounded border border-blue-200 dark:border-blue-800">{justification}</p>
                  </div>
                )}

                {(sopReference || expectedResult || actualResult) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {sopReference && <div><span className="text-muted-foreground">SOP Reference:</span> <span className="font-medium font-mono">{sopReference}</span></div>}
                      {expectedResult && (
                        <div>
                          <span className="text-muted-foreground">Expected Result:</span>
                          <p className="mt-0.5 bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-800">{expectedResult}</p>
                        </div>
                      )}
                      {actualResult && (
                        <div>
                          <span className="text-muted-foreground">Actual Result:</span>
                          <p className="mt-0.5 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-800">{actualResult}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(riskAssessment || impactValidatedState || impactRegulatoryFiling || immediateContainment) && (
                  <>
                    <Separator />
                    {riskAssessment && (
                      <div>
                        <span className="text-muted-foreground text-sm">Risk Assessment:</span>
                        <p className="text-sm mt-0.5 bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-200 dark:border-orange-800">{riskAssessment}</p>
                      </div>
                    )}
                    {impactValidatedState && (
                      <div>
                        <span className="text-muted-foreground text-sm">Impact on Validated State:</span>
                        <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{validatedStateDetails || 'Not specified'}</p>
                      </div>
                    )}
                    {impactRegulatoryFiling && (
                      <div>
                        <span className="text-muted-foreground text-sm">Impact on Regulatory Filing:</span>
                        <p className="text-sm mt-0.5 bg-muted/30 p-2 rounded">{regulatoryFilingDetails || 'Not specified'}</p>
                      </div>
                    )}
                    {immediateContainment && (
                      <div>
                        <span className="text-muted-foreground text-sm">Immediate Containment Action:</span>
                        <p className="text-sm mt-0.5 bg-cyan-50 dark:bg-cyan-900/10 p-2 rounded border border-cyan-200 dark:border-cyan-800">{immediateContainment}</p>
                      </div>
                    )}
                  </>
                )}

                {(correctiveAction || preventiveAction) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {correctiveAction && (
                        <div>
                          <span className="text-muted-foreground">Corrective Action:</span>
                          <p className="mt-0.5 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-800">{correctiveAction}</p>
                        </div>
                      )}
                      {preventiveAction && (
                        <div>
                          <span className="text-muted-foreground">Preventive Action:</span>
                          <p className="mt-0.5 bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-800">{preventiveAction}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {((linkedCapaId && linkedCapaId !== 'none') || (linkedDocumentId && linkedDocumentId !== 'none')) && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    {linkedCapaId && linkedCapaId !== 'none' && (
                      <div>
                        <span className="text-muted-foreground">Linked CAPA:</span>{' '}
                        <span className="font-medium">
                          {(() => {
                            const capa = capas.find(c => c.id === linkedCapaId);
                            return capa ? `${capa.capaNumber} — ${capa.title}` : '—';
                          })()}
                        </span>
                      </div>
                    )}
                    {linkedDocumentId && linkedDocumentId !== 'none' && (
                      <div>
                        <span className="text-muted-foreground">Linked Document:</span>{' '}
                        <span className="font-medium">
                          {(() => {
                            const doc = approvedDocuments.find(d => d.id === linkedDocumentId);
                            return doc ? `${doc.documentNumber} — ${doc.title}` : '—';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isolationStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400 font-medium">Product / Material Isolated and Quarantined</span>
                  </div>
                )}
              </CardContent>
            </Card>
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
          <Button onClick={handleSubmit} disabled={!validateStep(0) || !validateStep(1) || !validateStep(3) || !validateStep(4)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Submit Deviation
          </Button>
        )}
      </div>
    </div>
  );
}
