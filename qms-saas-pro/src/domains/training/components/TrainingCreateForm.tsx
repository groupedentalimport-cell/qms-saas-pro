'use client';

import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { createTraining } from '@/services/trainingService';
import { cn } from '@/lib/utils';
import type { TrainingType } from '@/types/qms';
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

const trainingTypes: TrainingType[] = ['Onboarding', 'SOP', 'Regulatory', 'Skill', 'Certification'];

const deliveryMethods = [
  'Classroom', 'Online/Self-paced', 'On-the-Job', 'Webinar', 'Blended',
] as const;

const trainingCategories = [
  'GMP', 'GLP', 'GCP', 'Safety', 'Quality', 'Other',
] as const;

const priorityOptions = ['Low', 'Medium', 'High', 'Critical'] as const;

const steps = [
  'Training Details',
  'Content & Materials',
  'Assignment & Schedule',
  'Competency Assessment',
  'Compliance & Certification',
  'Review & Submit',
];

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface TrainingFormState {
  // Step 1
  title: string;
  type: TrainingType;
  description: string;
  regulatoryReference: string;
  // Step 2
  documentId: string;
  materialsDescription: string;
  duration: string;
  deliveryMethod: string;
  // Step 3
  assignedTo: string;
  trainer: string;
  dueDate: string;
  priority: string;
  // Step 4
  assessmentRequired: boolean;
  assessmentMethod: string;
  passingScore: string;
  retrainingInterval: string;
  // Step 5
  requiresCertification: boolean;
  certificationValidity: string;
  standards: string;
  category: string;
}

const initialFormState: TrainingFormState = {
  title: '',
  type: 'SOP',
  description: '',
  regulatoryReference: '',
  documentId: '',
  materialsDescription: '',
  duration: '',
  deliveryMethod: '',
  assignedTo: '',
  trainer: '',
  dueDate: '',
  priority: 'Medium',
  assessmentRequired: false,
  assessmentMethod: '',
  passingScore: '',
  retrainingInterval: '',
  requiresCertification: false,
  certificationValidity: '',
  standards: '',
  category: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TrainingCreateFormProps {
  onComplete: () => void;
}

export function TrainingCreateForm({ onComplete }: TrainingCreateFormProps) {
  const trainings = useQMSStore(state => state.training);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<TrainingFormState>(initialFormState);

  const updateField = <K extends keyof TrainingFormState>(key: K, value: TrainingFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Approved documents for linking
  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  // Validation per step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return form.title.trim().length > 0 && form.type.length > 0;
      case 1: return true;
      case 2: return form.assignedTo.length > 0 && form.dueDate.length > 0;
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
    if (!form.title.trim() || !form.assignedTo || !form.dueDate) return;

    createTraining({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      status: 'Planned',
      assignedTo: form.assignedTo,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : new Date().toISOString(),
      documentId: form.documentId && form.documentId !== 'none' ? form.documentId : undefined,
      organizationId: 'org-001',
    });

    onComplete();
  };

  // Helper to get user name
  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

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
        {/* ─── Step 1: Training Details ─── */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Training Details</h3>
            <p className="text-sm text-muted-foreground">Define the training title, type, and description.</p>

            <div className="grid gap-2">
              <Label htmlFor="train-title">Title *</Label>
              <Input
                id="train-title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., SOP-001 Equipment Operation Training"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => updateField('type', v as TrainingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="regulatory-ref">Regulatory Reference</Label>
                <Input
                  id="regulatory-ref"
                  value={form.regulatoryReference}
                  onChange={(e) => updateField('regulatoryReference', e.target.value)}
                  placeholder="e.g., ISO 13485 §6.2, 21 CFR 820.25"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="train-desc">Description</Label>
              <Textarea
                id="train-desc"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the training objectives and scope..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* ─── Step 2: Content & Materials ─── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Content & Materials</h3>
            <p className="text-sm text-muted-foreground">Link documents and define training materials and delivery.</p>

            <div className="grid gap-2">
              <Label>Linked Document</Label>
              <Select value={form.documentId || 'none'} onValueChange={(v) => updateField('documentId', v === 'none' ? '' : v)}>
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
              <Label htmlFor="materials-desc">Materials Description</Label>
              <Textarea
                id="materials-desc"
                value={form.materialsDescription}
                onChange={(e) => updateField('materialsDescription', e.target.value)}
                placeholder="List training materials, presentations, handouts..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={form.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  placeholder="e.g., 2 hours, 3 days"
                />
              </div>
              <div className="grid gap-2">
                <Label>Delivery Method</Label>
                <Select value={form.deliveryMethod || 'none'} onValueChange={(v) => updateField('deliveryMethod', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {deliveryMethods.map(dm => (
                      <SelectItem key={dm} value={dm}>{dm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Assignment & Schedule ─── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Assignment & Schedule</h3>
            <p className="text-sm text-muted-foreground">Assign trainee and trainer, and set the due date.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assigned To *</Label>
                <Select value={form.assignedTo || 'none'} onValueChange={(v) => updateField('assignedTo', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select trainee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select user</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Trainer</Label>
                <Select value={form.trainer || 'none'} onValueChange={(v) => updateField('trainer', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date *</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => updateField('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(po => (
                      <SelectItem key={po} value={po}>{po}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 4: Competency Assessment ─── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Competency Assessment</h3>
            <p className="text-sm text-muted-foreground">Define if and how competency will be assessed after training.</p>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="assessment-required"
                checked={form.assessmentRequired}
                onChange={(e) => updateField('assessmentRequired', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="assessment-required" className="cursor-pointer">Assessment Required</Label>
            </div>

            {form.assessmentRequired && (
              <div className="space-y-4 pl-2 border-l-2 border-primary/20 ml-1">
                <div className="grid gap-2">
                  <Label htmlFor="assessment-method">Assessment Method</Label>
                  <Select value={form.assessmentMethod || 'none'} onValueChange={(v) => updateField('assessmentMethod', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="Written Exam">Written Exam</SelectItem>
                      <SelectItem value="Practical Demonstration">Practical Demonstration</SelectItem>
                      <SelectItem value="Oral Assessment">Oral Assessment</SelectItem>
                      <SelectItem value="Observation">Observation</SelectItem>
                      <SelectItem value="Combined">Combined (Written + Practical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="passing-score">Passing Score (%)</Label>
                    <Input
                      id="passing-score"
                      type="number"
                      min="0"
                      max="100"
                      value={form.passingScore}
                      onChange={(e) => updateField('passingScore', e.target.value)}
                      placeholder="e.g., 80"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="retraining-interval">Retraining Interval</Label>
                    <Select value={form.retrainingInterval || 'none'} onValueChange={(v) => updateField('retrainingInterval', v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="12 months">12 months</SelectItem>
                        <SelectItem value="24 months">24 months</SelectItem>
                        <SelectItem value="36 months">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {!form.assessmentRequired && (
              <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-md">
                No competency assessment will be required for this training.
              </div>
            )}
          </div>
        )}

        {/* ─── Step 5: Compliance & Certification ─── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Compliance & Certification</h3>
            <p className="text-sm text-muted-foreground">Define certification requirements and compliance category.</p>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requires-certification"
                checked={form.requiresCertification}
                onChange={(e) => updateField('requiresCertification', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requires-certification" className="cursor-pointer">Requires Certification</Label>
            </div>

            {form.requiresCertification && (
              <div className="grid gap-2 pl-2 border-l-2 border-primary/20 ml-1">
                <Label htmlFor="cert-validity">Certification Validity</Label>
                <Select value={form.certificationValidity || 'none'} onValueChange={(v) => updateField('certificationValidity', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select validity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="1 year">1 year</SelectItem>
                    <SelectItem value="2 years">2 years</SelectItem>
                    <SelectItem value="3 years">3 years</SelectItem>
                    <SelectItem value="5 years">5 years</SelectItem>
                    <SelectItem value="Indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="standards">Applicable Standards</Label>
                <Input
                  id="standards"
                  value={form.standards}
                  onChange={(e) => updateField('standards', e.target.value)}
                  placeholder="e.g., ISO 13485, 21 CFR 820"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category || 'none'} onValueChange={(v) => updateField('category', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {trainingCategories.map(tc => (
                      <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 6: Review & Submit ─── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 6: Review & Submit</h3>
            <p className="text-sm text-muted-foreground">Review all information before creating the training record.</p>

            {/* ISO 13485 Compliance Banner */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                ISO 13485 §6.2 — All required fields verified
              </div>
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Training Details */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Training Details</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(0)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{form.title}</span></div>
                    <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline">{form.type}</Badge></div>
                    {form.description && (
                      <div className="col-span-2"><span className="text-muted-foreground">Description:</span> <span className="font-medium">{form.description}</span></div>
                    )}
                    {form.regulatoryReference && (
                      <div><span className="text-muted-foreground">Reg. Ref:</span> <span className="font-medium">{form.regulatoryReference}</span></div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Content & Materials */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content & Materials</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(1)}>Edit</Button>
                  </div>
                  <div className="text-sm space-y-1">
                    {form.documentId && (
                      <div><span className="text-muted-foreground">Document:</span> <span className="font-medium">{documents.find(d => d.id === form.documentId)?.documentNumber || form.documentId}</span></div>
                    )}
                    {form.materialsDescription && <div><span className="text-muted-foreground">Materials:</span> <span className="font-medium">{form.materialsDescription}</span></div>}
                    {form.duration && <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{form.duration}</span></div>}
                    {form.deliveryMethod && <div><span className="text-muted-foreground">Delivery:</span> <span className="font-medium">{form.deliveryMethod}</span></div>}
                    {!form.documentId && !form.materialsDescription && !form.duration && !form.deliveryMethod && (
                      <div className="text-muted-foreground italic">No materials or delivery method specified</div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Assignment & Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment & Schedule</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(2)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium">{form.assignedTo ? getUserName(form.assignedTo) : 'Not assigned'}</span></div>
                    <div><span className="text-muted-foreground">Trainer:</span> <span className="font-medium">{form.trainer ? getUserName(form.trainer) : 'Not assigned'}</span></div>
                    <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{form.dueDate || 'Not set'}</span></div>
                    <div><span className="text-muted-foreground">Priority:</span> <Badge variant="outline">{form.priority}</Badge></div>
                  </div>
                </div>

                <Separator />

                {/* Competency Assessment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Competency Assessment</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(3)}>Edit</Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Assessment Required:</span> <span className={cn('font-medium', form.assessmentRequired ? 'text-green-600' : 'text-muted-foreground')}>{form.assessmentRequired ? 'Yes' : 'No'}</span></div>
                    {form.assessmentRequired && (
                      <>
                        {form.assessmentMethod && <div><span className="text-muted-foreground">Method:</span> <span className="font-medium">{form.assessmentMethod}</span></div>}
                        {form.passingScore && <div><span className="text-muted-foreground">Passing Score:</span> <span className="font-medium">{form.passingScore}%</span></div>}
                        {form.retrainingInterval && <div><span className="text-muted-foreground">Retraining:</span> <span className="font-medium">{form.retrainingInterval}</span></div>}
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Compliance & Certification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance & Certification</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(4)}>Edit</Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Certification Required:</span> <span className={cn('font-medium', form.requiresCertification ? 'text-green-600' : 'text-muted-foreground')}>{form.requiresCertification ? 'Yes' : 'No'}</span></div>
                    {form.requiresCertification && form.certificationValidity && (
                      <div><span className="text-muted-foreground">Validity:</span> <span className="font-medium">{form.certificationValidity}</span></div>
                    )}
                    {form.standards && <div><span className="text-muted-foreground">Standards:</span> <span className="font-medium">{form.standards}</span></div>}
                    {form.category && <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline">{form.category}</Badge></div>}
                    {!form.requiresCertification && !form.standards && !form.category && (
                      <div className="text-muted-foreground italic">No compliance or certification specified</div>
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
          <Button onClick={handleSubmit} disabled={!form.title.trim() || !form.assignedTo || !form.dueDate}>
            Create Training Record
          </Button>
        )}
      </div>
    </div>
  );
}
