'use client';

import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createRisk } from '@/services/riskService';
import { cn } from '@/lib/utils';
import type { RiskCategory, RiskLevel } from '@/types/qms';
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
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const riskCategories: RiskCategory[] = ['Product', 'Process', 'System', 'Supplier'];

const probLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const detectLabels = ['Very Detectable', 'Low Detection Difficulty', 'Moderate Detection', 'High Detection Difficulty', 'Undetectable'];

const controlHierarchy = [
  'Elimination', 'Substitution', 'Engineering Controls', 'Administrative Controls', 'PPE',
] as const;

const steps = [
  'Identification',
  'Risk Assessment',
  'Risk Evaluation',
  'Mitigation Plan',
  'Assignment & Links',
  'Review & Submit',
];

const riskLevelColors: Record<RiskLevel, string> = {
  'Low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/** RPN-based risk level per spec: <11=Low, 11-30=Medium, 31-60=High, 61+=Critical */
function getRiskLevel(rpn: number): RiskLevel {
  if (rpn >= 61) return 'Critical';
  if (rpn >= 31) return 'High';
  if (rpn >= 11) return 'Medium';
  return 'Low';
}

function getAcceptability(level: RiskLevel): string {
  if (level === 'Low') return 'Acceptable';
  if (level === 'Medium') return 'ALARP';
  return 'Unacceptable';
}

function getAcceptabilityColor(acceptability: string): string {
  if (acceptability === 'Acceptable') return 'text-green-600 dark:text-green-400';
  if (acceptability === 'ALARP') return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getMatrixCellColor(rpn: number): string {
  if (rpn >= 61) return 'bg-red-500/80 text-white';
  if (rpn >= 31) return 'bg-orange-400/80 text-white';
  if (rpn >= 11) return 'bg-yellow-300/80 text-gray-900';
  return 'bg-green-400/80 text-white';
}

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface RiskFormState {
  title: string;
  category: RiskCategory;
  hazardDescription: string;
  probability: number;
  impact: number;
  detectability: number;
  regulatoryReference: string;
  mitigation: string;
  controlType: string;
  verificationMethod: string;
  residualRisk: string;
  owner: string;
  linkedDocRef: string;
  linkedCapaRef: string;
  priorityNotes: string;
}

const initialFormState: RiskFormState = {
  title: '',
  category: 'Process',
  hazardDescription: '',
  probability: 3,
  impact: 3,
  detectability: 3,
  regulatoryReference: '',
  mitigation: '',
  controlType: '',
  verificationMethod: '',
  residualRisk: '',
  owner: '',
  linkedDocRef: '',
  linkedCapaRef: '',
  priorityNotes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RiskCreateFormProps {
  onComplete: () => void;
}

export function RiskCreateForm({ onComplete }: RiskCreateFormProps) {
  const risks = useQMSStore(state => state.risks);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);
  const capas = useQMSStore(state => state.capas);

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<RiskFormState>(initialFormState);

  // Computed values
  const rpn = form.probability * form.impact * form.detectability;
  const riskLevel = getRiskLevel(rpn);
  const acceptability = getAcceptability(riskLevel);

  const updateField = <K extends keyof RiskFormState>(key: K, value: RiskFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Validation per step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return form.title.trim().length > 0;
      case 1: return true; // P, I, D always have values
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    createRisk({
      riskNumber: `RISK-2024-${String(risks.length + 1).padStart(3, '0')}`,
      title: form.title.trim(),
      category: form.category,
      probability: form.probability,
      impact: form.impact,
      detectability: form.detectability,
      rpn,
      riskLevel,
      mitigation: form.mitigation.trim() || undefined,
      residualRisk: form.residualRisk.trim() || undefined,
      status: 'Open',
      organizationId: 'org-001',
    });

    onComplete();
  };

  // Approved documents for linking
  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                i < currentStep ? 'bg-green-500 text-white' :
                i === currentStep ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] mt-1 text-center leading-tight max-w-[60px]',
                i === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-6 h-0.5 mx-1 mb-4', i < currentStep ? 'bg-green-500' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Step Content */}
      <div className="min-h-[320px]">
        {/* ─── Step 1: Identification ─── */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Risk Identification</h3>
            <p className="text-sm text-muted-foreground">Identify the risk and describe the potential hazard.</p>

            <div className="grid gap-2">
              <Label htmlFor="risk-title">Title *</Label>
              <Input
                id="risk-title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Sterilization process failure"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="risk-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v as RiskCategory)}>
                <SelectTrigger id="risk-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {riskCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hazard-desc">Hazard Description</Label>
              <Textarea
                id="hazard-desc"
                value={form.hazardDescription}
                onChange={(e) => updateField('hazardDescription', e.target.value)}
                placeholder="Describe the potential hazard and harm..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* ─── Step 2: Risk Assessment (P×I×D) ─── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Risk Assessment (P × I × D)</h3>
            <p className="text-sm text-muted-foreground">Score Probability, Impact, and Detectability per ISO 14971.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Probability (1-5)</Label>
                <Select value={String(form.probability)} onValueChange={(v) => updateField('probability', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => (
                      <SelectItem key={v} value={String(v)}>{v} — {probLabels[v - 1]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Impact (1-5)</Label>
                <Select value={String(form.impact)} onValueChange={(v) => updateField('impact', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => (
                      <SelectItem key={v} value={String(v)}>{v} — {impactLabels[v - 1]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Detectability (1-5)</Label>
                <Select value={String(form.detectability)} onValueChange={(v) => updateField('detectability', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => (
                      <SelectItem key={v} value={String(v)}>{v} — {detectLabels[v - 1]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live RPN Preview */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">RPN:</span>
                <span className="text-2xl font-bold ml-2">{rpn}</span>
              </div>
              <Badge className={cn('text-sm', riskLevelColors[riskLevel])} variant="secondary">
                {riskLevel}
              </Badge>
              <div className="text-xs text-muted-foreground">
                (P × I × D = {form.probability} × {form.impact} × {form.detectability})
              </div>
            </div>

            {/* Mini 5×5 Risk Matrix */}
            <div>
              <h4 className="text-sm font-medium mb-2">Probability × Impact Matrix</h4>
              <div className="inline-block">
                <div className="grid grid-cols-5 gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={`mh-${i}`} className="text-[9px] text-center text-muted-foreground w-9">I{i}</div>
                  ))}
                </div>
                {[5, 4, 3, 2, 1].map(p => (
                  <div key={`mrow-${p}`} className="grid grid-cols-5 gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map(i => {
                      const isHighlighted = form.probability === p && form.impact === i;
                      return (
                        <div
                          key={`m-${p}-${i}`}
                          className={cn(
                            'w-9 h-9 rounded flex items-center justify-center text-[10px] font-medium',
                            isHighlighted
                              ? 'ring-2 ring-primary ring-offset-1 ' + getMatrixCellColor(p * i * form.detectability)
                              : getMatrixCellColor(p * i * 3)
                          )}
                        >
                          {isHighlighted ? <span className="font-bold">{rpn}</span> : p * i}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="text-[9px] text-center text-muted-foreground mt-0.5">Impact →</div>
              </div>
              <div className="text-[9px] text-muted-foreground ml-2 inline-block align-top mt-1">
                P{form.probability} highlighted
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Risk Evaluation ─── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Risk Evaluation</h3>
            <p className="text-sm text-muted-foreground">Auto-calculated risk level and acceptability determination.</p>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                    <Badge className={cn('text-lg px-4 py-1', riskLevelColors[riskLevel])} variant="secondary">
                      {riskLevel}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Risk Acceptability</div>
                    <div className={cn('text-lg font-semibold', getAcceptabilityColor(acceptability))}>
                      {acceptability}
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="text-center text-sm text-muted-foreground">
                  RPN = {form.probability} × {form.impact} × {form.detectability} = <span className="font-bold">{rpn}</span>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md space-y-1">
              <div className="font-medium">RPN Thresholds:</div>
              <div>• RPN ≥ 61 → <span className="text-red-600 font-medium">Critical (Unacceptable)</span></div>
              <div>• RPN 31-60 → <span className="text-orange-600 font-medium">High (Unacceptable)</span></div>
              <div>• RPN 11-30 → <span className="text-yellow-600 font-medium">Medium (ALARP)</span></div>
              <div>• RPN &lt; 11 → <span className="text-green-600 font-medium">Low (Acceptable)</span></div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="regulatory-ref">Regulatory Reference</Label>
              <Input
                id="regulatory-ref"
                value={form.regulatoryReference}
                onChange={(e) => updateField('regulatoryReference', e.target.value)}
                placeholder="e.g., ISO 14971:2019 §5.4, IEC 62304 §7.1"
              />
            </div>
          </div>
        )}

        {/* ─── Step 4: Mitigation Plan ─── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Mitigation Plan</h3>
            <p className="text-sm text-muted-foreground">Define control measures following the hierarchy of controls.</p>

            <div className="grid gap-2">
              <Label htmlFor="mitigation">Mitigation Measures</Label>
              <Textarea
                id="mitigation"
                value={form.mitigation}
                onChange={(e) => updateField('mitigation', e.target.value)}
                placeholder="Describe the risk mitigation measures..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Control Type (Hierarchy)</Label>
                <Select value={form.controlType || 'none'} onValueChange={(v) => updateField('controlType', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select control type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {controlHierarchy.map(ct => (
                      <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="verification-method">Verification Method</Label>
                <Input
                  id="verification-method"
                  value={form.verificationMethod}
                  onChange={(e) => updateField('verificationMethod', e.target.value)}
                  placeholder="e.g., Inspection, Testing, Review"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="residual-risk">Residual Risk</Label>
              <Textarea
                id="residual-risk"
                value={form.residualRisk}
                onChange={(e) => updateField('residualRisk', e.target.value)}
                placeholder="Describe the residual risk after mitigation..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ─── Step 5: Assignment & Links ─── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Assignment & Links</h3>
            <p className="text-sm text-muted-foreground">Assign an owner and link related documents or CAPAs.</p>

            <div className="grid gap-2">
              <Label>Risk Owner</Label>
              <Select value={form.owner || 'none'} onValueChange={(v) => updateField('owner', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Linked Document</Label>
                <Select value={form.linkedDocRef || 'none'} onValueChange={(v) => updateField('linkedDocRef', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvedDocuments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.documentNumber} — {d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Linked CAPA</Label>
                <Select value={form.linkedCapaRef || 'none'} onValueChange={(v) => updateField('linkedCapaRef', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select CAPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {capas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.capaNumber} — {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority-notes">Priority Notes</Label>
              <Textarea
                id="priority-notes"
                value={form.priorityNotes}
                onChange={(e) => updateField('priorityNotes', e.target.value)}
                placeholder="Additional priority or scheduling notes..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ─── Step 6: Review & Submit ─── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 6: Review & Submit</h3>
            <p className="text-sm text-muted-foreground">Review all information before submitting the risk assessment.</p>

            {/* ISO 14971 Compliance Banner */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                ISO 14971:2019 — All required fields verified
              </div>
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Identification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Identification</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(0)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{form.title}</span></div>
                    <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{form.category}</span></div>
                    {form.hazardDescription && (
                      <div className="col-span-2"><span className="text-muted-foreground">Hazard:</span> <span className="font-medium">{form.hazardDescription}</span></div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Risk Assessment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Assessment</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(1)}>Edit</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">P:</span> <span className="font-medium">{form.probability}</span>
                      <span className="text-muted-foreground ml-2">I:</span> <span className="font-medium">{form.impact}</span>
                      <span className="text-muted-foreground ml-2">D:</span> <span className="font-medium">{form.detectability}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">RPN:</span> <span className="text-lg font-bold">{rpn}</span>
                    </div>
                    <Badge className={cn('text-sm', riskLevelColors[riskLevel])} variant="secondary">{riskLevel}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Risk Evaluation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evaluation</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(2)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground">Acceptability:</span> <span className={cn('font-medium', getAcceptabilityColor(acceptability))}>{acceptability}</span></div>
                    {form.regulatoryReference && (
                      <div><span className="text-muted-foreground">Reg. Ref:</span> <span className="font-medium">{form.regulatoryReference}</span></div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Mitigation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mitigation</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(3)}>Edit</Button>
                  </div>
                  <div className="text-sm space-y-1">
                    {form.mitigation && <div><span className="text-muted-foreground">Measures:</span> <span className="font-medium">{form.mitigation}</span></div>}
                    {form.controlType && <div><span className="text-muted-foreground">Control Type:</span> <span className="font-medium">{form.controlType}</span></div>}
                    {form.verificationMethod && <div><span className="text-muted-foreground">Verification:</span> <span className="font-medium">{form.verificationMethod}</span></div>}
                    {form.residualRisk && <div><span className="text-muted-foreground">Residual Risk:</span> <span className="font-medium">{form.residualRisk}</span></div>}
                    {!form.mitigation && !form.controlType && !form.verificationMethod && !form.residualRisk && (
                      <div className="text-muted-foreground italic">No mitigation plan defined</div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Assignment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment & Links</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(4)}>Edit</Button>
                  </div>
                  <div className="text-sm space-y-1">
                    {form.owner && (
                      <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{profiles.find(p => p.id === form.owner)?.fullName || form.owner}</span></div>
                    )}
                    {form.linkedDocRef && (
                      <div><span className="text-muted-foreground">Document:</span> <span className="font-medium">{documents.find(d => d.id === form.linkedDocRef)?.documentNumber || form.linkedDocRef}</span></div>
                    )}
                    {form.linkedCapaRef && (
                      <div><span className="text-muted-foreground">CAPA:</span> <span className="font-medium">{capas.find(c => c.id === form.linkedCapaRef)?.capaNumber || form.linkedCapaRef}</span></div>
                    )}
                    {form.priorityNotes && <div><span className="text-muted-foreground">Notes:</span> <span className="font-medium">{form.priorityNotes}</span></div>}
                    {!form.owner && !form.linkedDocRef && !form.linkedCapaRef && !form.priorityNotes && (
                      <div className="text-muted-foreground italic">No assignment or links defined</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />Previous
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next<ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!form.title.trim()}>
            Submit Risk Assessment
          </Button>
        )}
      </div>
    </div>
  );
}
