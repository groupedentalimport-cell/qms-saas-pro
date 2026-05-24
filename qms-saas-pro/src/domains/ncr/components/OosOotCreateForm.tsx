import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createNCR } from '@/services/ncrService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { NcrSeverity, NcrDisposition } from '@/types/qms';
import {
  FlaskConical, ChevronLeft, ChevronRight, CheckCircle2,
  AlertTriangle, Beaker, ShieldCheck, ClipboardCheck,
  Search, FileWarning, Gavel, ClipboardList, Plus,
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
  { id: 1, label: 'Identification', icon: ClipboardCheck },
  { id: 2, label: 'Analytical Data', icon: Beaker },
  { id: 3, label: 'Phase I Investigation', icon: Search },
  { id: 4, label: 'Phase II Investigation', icon: FileWarning },
  { id: 5, label: 'Disposition & Impact', icon: Gavel },
  { id: 6, label: 'Actions & CAPA', icon: ClipboardList },
  { id: 7, label: 'Review & Submit', icon: ShieldCheck },
] as const;

type OosOotType = 'OOS' | 'OOT';

interface OosOotCreateFormProps {
  onComplete: () => void;
}

export function OosOotCreateForm({ onComplete }: OosOotCreateFormProps) {
  const { currentUser } = useAuth();
  const ncrs = useQMSStore(state => state.ncrs);
  const profiles = useQMSStore(state => state.profiles);
  const capas = useQMSStore(state => state.capas);

  // ─── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ─── Step 1: Identification ──────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OosOotType>('OOS');
  const [severity, setSeverity] = useState<NcrSeverity>('Major');
  const [productCode, setProductCode] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [sampleId, setSampleId] = useState('');

  // ─── Step 2: Analytical Data ─────────────────────────────────────────────
  const [analyticalMethod, setAnalyticalMethod] = useState('');
  const [specReference, setSpecReference] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [measuredUnit, setMeasuredUnit] = useState('');
  const [specLimit, setSpecLimit] = useState('');
  const [replicates, setReplicates] = useState('');
  const [testDate, setTestDate] = useState('');

  // ─── Step 3: Phase I Investigation ───────────────────────────────────────
  const [labInvestigation, setLabInvestigation] = useState(true);
  const [analystId, setAnalystId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [labErrorFound, setLabErrorFound] = useState<'Pending' | 'Error Found' | 'No Error Found'>('Pending');
  const [labErrorDescription, setLabErrorDescription] = useState('');
  const [noErrorDescription, setNoErrorDescription] = useState('');

  // ─── Step 4: Phase II Investigation ──────────────────────────────────────
  const [phase2Required, setPhase2Required] = useState(true);
  const [manufacturingInvestigation, setManufacturingInvestigation] = useState('');
  const [processParametersReview, setProcessParametersReview] = useState('');
  const [oosConfirmed, setOosConfirmed] = useState<'Pending' | 'Confirmed OOS' | 'Invalidated'>('Pending');
  const [rootCause, setRootCause] = useState('');

  // ─── Step 5: Disposition & Impact ────────────────────────────────────────
  const [disposition, setDisposition] = useState<NcrDisposition>('Pending');
  const [rejectLot, setRejectLot] = useState(false);
  const [qtyAffected, setQtyAffected] = useState('');
  const [impactOtherBatches, setImpactOtherBatches] = useState('');
  const [impactStability, setImpactStability] = useState('');
  const [patientSafetyImpact, setPatientSafetyImpact] = useState('');

  // ─── Step 6: Actions & CAPA ──────────────────────────────────────────────
  const [containmentAction, setContainmentAction] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [linkedCapaId, setLinkedCapaId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [regulatoryNotification, setRegulatoryNotification] = useState(false);
  const [regulatoryDetails, setRegulatoryDetails] = useState('');

  // ─── Derived ─────────────────────────────────────────────────────────────
  const showPhase2 = labErrorFound === 'No Error Found';

  const stepCanProceed = useMemo(() => {
    switch (step) {
      case 1: return !!title.trim();
      case 2: return !!analyticalMethod.trim() && !!measuredValue.trim() && !!measuredUnit.trim() && !!specLimit.trim();
      case 3: return true;
      case 4: return true;
      case 5: return disposition !== 'Pending';
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  }, [step, title, analyticalMethod, measuredValue, measuredUnit, specLimit, disposition]);

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const ncrCount = ncrs.length;
    createNCR({
      ncrNumber: `NCR-2024-${String(ncrCount + 1).padStart(3, '0')}`,
      title,
      type,
      status: 'Open',
      severity,
      source: 'Quality Control Testing',
      description: [
        `Product Code: ${productCode || 'N/A'}`,
        `Sample ID: ${sampleId || 'N/A'}`,
        labErrorFound === 'Error Found' ? `Lab Error: ${labErrorDescription}` : '',
        labErrorFound === 'No Error Found' ? `No Error Note: ${noErrorDescription}` : '',
        manufacturingInvestigation ? `Mfg Investigation: ${manufacturingInvestigation}` : '',
        rootCause ? `Root Cause: ${rootCause}` : '',
        impactOtherBatches ? `Impact on other batches: ${impactOtherBatches}` : '',
        impactStability ? `Impact on stability: ${impactStability}` : '',
        patientSafetyImpact ? `Patient safety impact: ${patientSafetyImpact}` : '',
        containmentAction ? `Containment: ${containmentAction}` : '',
        correctiveAction ? `Corrective: ${correctiveAction}` : '',
        regulatoryNotification ? `Regulatory notification: ${regulatoryDetails}` : '',
      ].filter(Boolean).join('\n'),
      lotNumber: lotNumber || undefined,
      quantityAffected: qtyAffected ? parseInt(qtyAffected, 10) : undefined,
      disposition,
      linkedCapaId: linkedCapaId || undefined,
      isOosOot: true,
      analyticalMethod: analyticalMethod || undefined,
      measuredValue: measuredValue ? parseFloat(measuredValue) : undefined,
      measuredUnit: measuredUnit || undefined,
      specLimit: specLimit || undefined,
      phase1Conclusion: labErrorFound === 'Pending' ? 'Pending' : labErrorFound === 'Error Found' ? 'Error Found' : 'No Error Found',
      phase2Required: true,
      phase2Conclusion: 'Pending',
      rejectLot,
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      createdDate: new Date().toISOString(),
      createdById: currentUser?.id,
      organizationId: 'org-001',
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
        const isHidden = s.id === 4 && !showPhase2;
        if (isHidden) return null;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && !isHidden && (
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
      // ── Step 1: Identification ─────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Out of Specification Result - API Assay" />
              </div>
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={type} onValueChange={v => setType(v as OosOotType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OOS">OOS - Out of Specification</SelectItem>
                    <SelectItem value="OOT">OOT - Out of Trend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Severity *</Label>
                <Select value={severity} onValueChange={v => setSeverity(v as NcrSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Product Code</Label>
                <Input value={productCode} onChange={e => setProductCode(e.target.value)} placeholder="e.g., PRD-001" />
              </div>
              <div className="grid gap-2">
                <Label>Lot Number</Label>
                <Input value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="e.g., BN-2024-XXX" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Sample ID</Label>
              <Input value={sampleId} onChange={e => setSampleId(e.target.value)} placeholder="e.g., S-2024-0001" />
            </div>
          </div>
        );

      // ── Step 2: Analytical Data ────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Analytical Method *</Label>
                <Input value={analyticalMethod} onChange={e => setAnalyticalMethod(e.target.value)} placeholder="e.g., HPLC Method QC-M-001" />
              </div>
              <div className="grid gap-2">
                <Label>Spec Reference</Label>
                <Input value={specReference} onChange={e => setSpecReference(e.target.value)} placeholder="e.g., USP <621>" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Measured Value *</Label>
                <Input type="number" value={measuredValue} onChange={e => setMeasuredValue(e.target.value)} placeholder="e.g., 92.3" />
              </div>
              <div className="grid gap-2">
                <Label>Unit *</Label>
                <Input value={measuredUnit} onChange={e => setMeasuredUnit(e.target.value)} placeholder="e.g., %, mg/L" />
              </div>
              <div className="grid gap-2">
                <Label>Spec Limit *</Label>
                <Input value={specLimit} onChange={e => setSpecLimit(e.target.value)} placeholder="e.g., 95.0-105.0%" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Replicates</Label>
                <Input type="number" value={replicates} onChange={e => setReplicates(e.target.value)} placeholder="e.g., 3" />
              </div>
              <div className="grid gap-2">
                <Label>Test Date</Label>
                <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
              </div>
            </div>
          </div>
        );

      // ── Step 3: Phase I Investigation ──────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={labInvestigation} onCheckedChange={v => setLabInvestigation(v === true)} id="lab-investigation" />
              <Label htmlFor="lab-investigation" className="cursor-pointer">Lab investigation performed</Label>
            </div>
            {labInvestigation && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Analyst ID</Label>
                    <Input value={analystId} onChange={e => setAnalystId(e.target.value)} placeholder="e.g., ANALYST-001" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Equipment ID</Label>
                    <Input value={equipmentId} onChange={e => setEquipmentId(e.target.value)} placeholder="e.g., EQUIP-HPLC-003" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Lab error found?</Label>
                  <Select value={labErrorFound} onValueChange={v => setLabErrorFound(v as typeof labErrorFound)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Error Found">Error Found</SelectItem>
                      <SelectItem value="No Error Found">No Error Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {labErrorFound === 'Error Found' && (
                  <div className="grid gap-2">
                    <Label>Describe the error found</Label>
                    <Textarea value={labErrorDescription} onChange={e => setLabErrorDescription(e.target.value)} placeholder="Describe the laboratory error identified..." rows={3} />
                  </div>
                )}
                {labErrorFound === 'No Error Found' && (
                  <div className="grid gap-2">
                    <Label>Notes on investigation (no error found)</Label>
                    <Textarea value={noErrorDescription} onChange={e => setNoErrorDescription(e.target.value)} placeholder="Document findings from Phase I investigation..." rows={3} />
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-xs text-blue-700 dark:text-blue-400">
                      No error found in laboratory investigation. Phase II full-scale investigation is required per FDA OOS Guidance.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      // ── Step 4: Phase II Investigation ─────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={phase2Required} onCheckedChange={v => setPhase2Required(v === true)} id="phase2-required" disabled />
              <Label htmlFor="phase2-required" className="cursor-pointer">Phase II required</Label>
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Auto-checked</Badge>
            </div>
            <div className="grid gap-2">
              <Label>Manufacturing Investigation</Label>
              <Textarea value={manufacturingInvestigation} onChange={e => setManufacturingInvestigation(e.target.value)} placeholder="Describe manufacturing investigation findings..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Process Parameters Review</Label>
              <Textarea value={processParametersReview} onChange={e => setProcessParametersReview(e.target.value)} placeholder="Review process parameters and deviations..." rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>OOS Confirmed?</Label>
              <Select value={oosConfirmed} onValueChange={v => setOosConfirmed(v as typeof oosConfirmed)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed OOS">Confirmed OOS</SelectItem>
                  <SelectItem value="Invalidated">Invalidated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Root Cause</Label>
              <Textarea value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Identified root cause..." rows={2} />
            </div>
          </div>
        );

      // ── Step 5: Disposition & Impact ───────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Disposition *</Label>
              <Select value={disposition} onValueChange={v => setDisposition(v as NcrDisposition)}>
                <SelectTrigger><SelectValue placeholder="Select disposition..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Use As Is">Use As Is</SelectItem>
                  <SelectItem value="Rework">Rework</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                  <SelectItem value="Return to Supplier">Return to Supplier</SelectItem>
                  <SelectItem value="Concession">Concession</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={rejectLot} onCheckedChange={v => setRejectLot(v === true)} id="reject-lot" />
              <Label htmlFor="reject-lot" className="cursor-pointer">Reject lot</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity Affected</Label>
                <Input type="number" value={qtyAffected} onChange={e => setQtyAffected(e.target.value)} placeholder="e.g., 500" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Impact on Other Batches</Label>
              <Textarea value={impactOtherBatches} onChange={e => setImpactOtherBatches(e.target.value)} placeholder="Assess impact on other batches..." rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Impact on Stability</Label>
              <Textarea value={impactStability} onChange={e => setImpactStability(e.target.value)} placeholder="Assess impact on stability studies..." rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Patient Safety Impact</Label>
              <Textarea value={patientSafetyImpact} onChange={e => setPatientSafetyImpact(e.target.value)} placeholder="Assess patient safety impact..." rows={2} />
            </div>
          </div>
        );

      // ── Step 6: Actions & CAPA ─────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Containment Action</Label>
              <Textarea value={containmentAction} onChange={e => setContainmentAction(e.target.value)} placeholder="Immediate containment actions taken..." rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Corrective Action</Label>
              <Textarea value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} placeholder="Corrective actions to be implemented..." rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Linked CAPA</Label>
                <Select value={linkedCapaId} onValueChange={setLinkedCapaId}>
                  <SelectTrigger><SelectValue placeholder="Select CAPA..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {capas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.capaNumber} — {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Checkbox checked={regulatoryNotification} onCheckedChange={v => setRegulatoryNotification(v === true)} id="reg-notification" />
              <Label htmlFor="reg-notification" className="cursor-pointer">Regulatory notification required</Label>
            </div>
            {regulatoryNotification && (
              <div className="grid gap-2">
                <Label>Notification Details</Label>
                <Textarea value={regulatoryDetails} onChange={e => setRegulatoryDetails(e.target.value)} placeholder="Describe regulatory notification details..." rows={2} />
              </div>
            )}
          </div>
        );

      // ── Step 7: Review & Submit ────────────────────────────────────────
      case 7:
        return (
          <div className="space-y-4">
            {/* Compliance banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Regulatory Compliance</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  This investigation follows FDA OOS Guidance (2006), ICH Q7, and 21 CFR 211.160 requirements. Phase I/II investigations are conducted per established procedures.
                </p>
              </div>
            </div>

            {/* Summary card */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Investigation Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Title:</span> <span className="font-medium ml-1">{title}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <Badge variant="secondary" className="ml-1 text-xs">{type}</Badge></div>
                <div><span className="text-muted-foreground">Severity:</span> <Badge variant="outline" className="ml-1 text-xs">{severity}</Badge></div>
                <div><span className="text-muted-foreground">Lot #:</span> <span className="font-medium ml-1 font-mono text-xs">{lotNumber || '-'}</span></div>
                <div><span className="text-muted-foreground">Product Code:</span> <span className="font-medium ml-1">{productCode || '-'}</span></div>
                <div><span className="text-muted-foreground">Sample ID:</span> <span className="font-medium ml-1">{sampleId || '-'}</span></div>
              </div>
            </div>

            {/* Analytical summary */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Beaker className="h-4 w-4 text-primary" />
                Analytical Data
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Method:</span> <span className="font-medium ml-1">{analyticalMethod}</span></div>
                <div><span className="text-muted-foreground">Spec Ref:</span> <span className="font-medium ml-1">{specReference || '-'}</span></div>
                <div><span className="text-muted-foreground">Measured:</span> <span className="font-bold ml-1 text-red-600 dark:text-red-400">{measuredValue} {measuredUnit}</span></div>
                <div><span className="text-muted-foreground">Spec Limit:</span> <span className="font-mono font-medium ml-1 text-xs">{specLimit}</span></div>
              </div>
            </div>

            {/* Phase badges */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Investigation Phases</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn(
                  'text-xs',
                  labErrorFound === 'Pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                  labErrorFound === 'Error Found' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )} variant="secondary">
                  Phase I: {labErrorFound}
                </Badge>
                {showPhase2 && (
                  <Badge className={cn(
                    'text-xs',
                    oosConfirmed === 'Pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                    oosConfirmed === 'Confirmed OOS' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )} variant="secondary">
                    Phase II: {oosConfirmed}
                  </Badge>
                )}
              </div>
            </div>

            {/* Disposition & Actions summary */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Disposition & Actions</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Disposition:</span> <Badge variant="outline" className="ml-1 text-xs">{disposition}</Badge></div>
                <div><span className="text-muted-foreground">Reject Lot:</span> <Badge variant="outline" className={cn('ml-1 text-xs', rejectLot && 'border-red-300 text-red-700')}>{rejectLot ? 'Yes' : 'No'}</Badge></div>
                <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium ml-1">{profiles.find(p => p.id === assignedTo)?.fullName || '-'}</span></div>
                <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium ml-1">{dueDate || '-'}</span></div>
              </div>
              {containmentAction && <div><span className="text-muted-foreground text-sm">Containment:</span> <span className="text-sm ml-1">{containmentAction}</span></div>}
              {correctiveAction && <div><span className="text-muted-foreground text-sm">Corrective:</span> <span className="text-sm ml-1">{correctiveAction}</span></div>}
              {regulatoryNotification && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Regulatory notification required</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Navigation helpers ──────────────────────────────────────────────────
  const effectiveSteps = showPhase2 ? 7 : 6;
  const goNext = () => {
    if (step === 3 && !showPhase2) {
      setStep(5); // skip Phase II
    } else if (step < 7) {
      setStep(step + 1);
    }
  };
  const goBack = () => {
    if (step === 5 && !showPhase2) {
      setStep(3); // skip back past Phase II
    } else if (step > 1) {
      setStep(step - 1);
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
        <Button variant="outline" onClick={goBack} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {step} of {effectiveSteps}
        </span>
        {step < 7 ? (
          <Button onClick={goNext} disabled={!stepCanProceed}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!stepCanProceed}>
            <Plus className="h-4 w-4 mr-1" />Create Investigation
          </Button>
        )}
      </div>
    </div>
  );
}
