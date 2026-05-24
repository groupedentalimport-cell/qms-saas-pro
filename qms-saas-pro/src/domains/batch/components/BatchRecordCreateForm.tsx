'use client';

import React, { useState, useMemo } from 'react';
import { createBatchRecord } from '@/services/batchService';
import { useAuth } from '@/contexts/AuthContext';
import { useQMSStore } from '@/lib/demo-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BatchStep } from '@/types/qms';
import {
  Package, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Plus, Trash2, ShieldCheck, AlertTriangle, FlaskConical,
  ClipboardList, FileCheck, Beaker, Factory,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface ProcessStepForm {
  tempId: string;
  stepName: string;
  instructions: string;
  expectedValue: string;
}

interface BatchRecordCreateFormProps {
  onComplete: () => void;
}

const STEPS = [
  { number: 1, label: 'Product Information', icon: Package },
  { number: 2, label: 'Manufacturing Details', icon: Factory },
  { number: 3, label: 'Process Steps', icon: ClipboardList },
  { number: 4, label: 'Quality Specifications', icon: Beaker },
  { number: 5, label: 'QA Review & Release', icon: FileCheck },
  { number: 6, label: 'Review & Submit', icon: ShieldCheck },
];

const BATCH_SIZE_UNITS = ['vials', 'units', 'tablets', 'kg', 'liters', 'capsules', 'sachets'];
const PRODUCT_TYPES = ['Finished Product', 'Intermediate', 'API', 'Clinical Trial Material', 'Placebo'];

const DEFAULT_STEPS: ProcessStepForm[] = [
  { tempId: 'temp-1', stepName: 'Raw Material Verification', instructions: 'Verify all raw materials against the master formula and approved specifications.', expectedValue: 'All materials verified and within specification' },
  { tempId: 'temp-2', stepName: 'Manufacturing Process Execution', instructions: 'Execute manufacturing process per approved batch manufacturing record.', expectedValue: 'Process completed per SOP without deviations' },
  { tempId: 'temp-3', stepName: 'In-Process Quality Checks', instructions: 'Perform in-process quality checks at defined intervals.', expectedValue: 'All in-process checks within specification' },
];

// ============================================================================
// Component
// ============================================================================

export function BatchRecordCreateForm({ onComplete }: BatchRecordCreateFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const batchRecords = useQMSStore(state => state.batchRecords);
  const profiles = useQMSStore(state => state.profiles);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Product Information
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [autoLot, setAutoLot] = useState(true);
  const [lotNumber, setLotNumber] = useState('');
  const [masterFormulaId, setMasterFormulaId] = useState('');
  const [productType, setProductType] = useState('');

  // Step 2: Manufacturing Details
  const [batchSize, setBatchSize] = useState('');
  const [batchSizeUnit, setBatchSizeUnit] = useState('vials');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturingSite, setManufacturingSite] = useState('');
  const [productionLine, setProductionLine] = useState('');

  // Step 3: Process Steps
  const [processSteps, setProcessSteps] = useState<ProcessStepForm[]>([...DEFAULT_STEPS]);

  // Step 4: Quality Specifications
  const [specReference, setSpecReference] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [inProcessControls, setInProcessControls] = useState('');
  const [samplingPlan, setSamplingPlan] = useState('');
  const [holdTimes, setHoldTimes] = useState('');

  // Step 5: QA Review & Release
  const [qaReviewerId, setQaReviewerId] = useState('');
  const [releaseCriteria, setReleaseCriteria] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [stabilityStudy, setStabilityStudy] = useState(false);
  const [stabilityDetails, setStabilityDetails] = useState('');

  // Lot number generator
  const suggestedLotNumber = useMemo(() => {
    const count = batchRecords.length + 1;
    return `LOT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  }, [batchRecords]);

  // Step validation
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return productName.trim().length > 0 && (autoLot || lotNumber.trim().length > 0);
      case 2:
        return batchSize.trim().length > 0 && manufacturingDate.trim().length > 0;
      case 3:
        return processSteps.length > 0 && processSteps.every(s => s.stepName.trim().length > 0);
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < 6 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Process step management
  const addStep = () => {
    setProcessSteps(prev => [
      ...prev,
      { tempId: `temp-${Date.now()}`, stepName: '', instructions: '', expectedValue: '' },
    ]);
  };

  const removeStep = (tempId: string) => {
    setProcessSteps(prev => prev.filter(s => s.tempId !== tempId));
  };

  const updateStep = (tempId: string, field: keyof ProcessStepForm, value: string) => {
    setProcessSteps(prev =>
      prev.map(s => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  // Submit
  const handleSubmit = () => {
    const finalLotNumber = autoLot ? suggestedLotNumber : lotNumber;
    try {
      createBatchRecord({
        lotNumber: finalLotNumber,
        productName,
        productCode: productCode || undefined,
        batchSize: batchSize ? parseInt(batchSize) : undefined,
        batchSizeUnit,
        masterFormulaId: masterFormulaId || undefined,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate).toISOString() : new Date().toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        status: 'In Progress',
        isLocked: false,
        organizationId: 'org-001',
        createdById: currentUser?.id,
        // NOTE: steps are NOT passed here — they require id/batchRecordId/createdAt
        // which are only available after the batch record is created
      });

      toast({
        title: 'Batch Record Created',
        description: `Batch record ${finalLotNumber} has been created successfully.`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error Creating Batch Record',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // QA reviewer profiles
  const qaProfiles = profiles.filter(p =>
    p.role === 'quality_manager' || p.role === 'admin'
  );

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              <button
                onClick={() => {
                  if (step.number < currentStep) setCurrentStep(step.number);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  step.number === currentStep
                    ? 'bg-primary/10 text-primary'
                    : step.number < currentStep
                    ? 'text-primary cursor-pointer hover:bg-primary/5'
                    : 'text-muted-foreground'
                )}
              >
                {step.number < currentStep ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : step.number === currentStep ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.number}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 rounded-full transition-colors',
                  step.number < currentStep ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentStep === 1 && (
          <StepProductInformation
            productName={productName}
            setProductName={setProductName}
            productCode={productCode}
            setProductCode={setProductCode}
            autoLot={autoLot}
            setAutoLot={setAutoLot}
            lotNumber={lotNumber}
            setLotNumber={setLotNumber}
            suggestedLotNumber={suggestedLotNumber}
            masterFormulaId={masterFormulaId}
            setMasterFormulaId={setMasterFormulaId}
            productType={productType}
            setProductType={setProductType}
          />
        )}
        {currentStep === 2 && (
          <StepManufacturingDetails
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            batchSizeUnit={batchSizeUnit}
            setBatchSizeUnit={setBatchSizeUnit}
            manufacturingDate={manufacturingDate}
            setManufacturingDate={setManufacturingDate}
            expiryDate={expiryDate}
            setExpiryDate={setExpiryDate}
            manufacturingSite={manufacturingSite}
            setManufacturingSite={setManufacturingSite}
            productionLine={productionLine}
            setProductionLine={setProductionLine}
          />
        )}
        {currentStep === 3 && (
          <StepProcessSteps
            processSteps={processSteps}
            addStep={addStep}
            removeStep={removeStep}
            updateStep={updateStep}
          />
        )}
        {currentStep === 4 && (
          <StepQualitySpecifications
            specReference={specReference}
            setSpecReference={setSpecReference}
            acceptanceCriteria={acceptanceCriteria}
            setAcceptanceCriteria={setAcceptanceCriteria}
            inProcessControls={inProcessControls}
            setInProcessControls={setInProcessControls}
            samplingPlan={samplingPlan}
            setSamplingPlan={setSamplingPlan}
            holdTimes={holdTimes}
            setHoldTimes={setHoldTimes}
          />
        )}
        {currentStep === 5 && (
          <StepQAReview
            qaReviewerId={qaReviewerId}
            setQaReviewerId={setQaReviewerId}
            releaseCriteria={releaseCriteria}
            setReleaseCriteria={setReleaseCriteria}
            specialInstructions={specialInstructions}
            setSpecialInstructions={setSpecialInstructions}
            stabilityStudy={stabilityStudy}
            setStabilityStudy={setStabilityStudy}
            stabilityDetails={stabilityDetails}
            setStabilityDetails={setStabilityDetails}
            qaProfiles={qaProfiles}
          />
        )}
        {currentStep === 6 && (
          <StepReviewSubmit
            productName={productName}
            productCode={productCode}
            lotNumber={autoLot ? suggestedLotNumber : lotNumber}
            masterFormulaId={masterFormulaId}
            productType={productType}
            batchSize={batchSize}
            batchSizeUnit={batchSizeUnit}
            manufacturingDate={manufacturingDate}
            expiryDate={expiryDate}
            manufacturingSite={manufacturingSite}
            productionLine={productionLine}
            processSteps={processSteps}
            specReference={specReference}
            acceptanceCriteria={acceptanceCriteria}
            inProcessControls={inProcessControls}
            samplingPlan={samplingPlan}
            holdTimes={holdTimes}
            qaReviewerId={qaReviewerId}
            releaseCriteria={releaseCriteria}
            specialInstructions={specialInstructions}
            stabilityStudy={stabilityStudy}
            stabilityDetails={stabilityDetails}
            qaProfiles={qaProfiles}
          />
        )}
      </div>

      {/* Footer navigation */}
      <div className="border-t px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
        {currentStep < 6 ? (
          <Button onClick={goNext} disabled={!canGoNext()}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Create Batch Record
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Step 1: Product Information
// ============================================================================

interface StepProductInfoProps {
  productName: string; setProductName: (v: string) => void;
  productCode: string; setProductCode: (v: string) => void;
  autoLot: boolean; setAutoLot: (v: boolean) => void;
  lotNumber: string; setLotNumber: (v: string) => void;
  suggestedLotNumber: string;
  masterFormulaId: string; setMasterFormulaId: (v: string) => void;
  productType: string; setProductType: (v: string) => void;
}

function StepProductInformation({
  productName, setProductName,
  productCode, setProductCode,
  autoLot, setAutoLot,
  lotNumber, setLotNumber,
  suggestedLotNumber,
  masterFormulaId, setMasterFormulaId,
  productType, setProductType,
}: StepProductInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Product Information
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the product and lot identification details for the batch record.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Aspirin 500mg Tablets"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Code</Label>
              <Input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g., PROD-001"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="autoLot"
                  checked={autoLot}
                  onCheckedChange={(checked) => setAutoLot(checked === true)}
                />
                <Label htmlFor="autoLot" className="text-sm font-medium cursor-pointer">
                  Auto-generate lot number
                </Label>
              </div>
              {autoLot ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-medium">{suggestedLotNumber}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">Auto-generated</Badge>
                </div>
              ) : (
                <Input
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="e.g., LOT-2025-001"
                />
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Master Formula ID</Label>
              <Input
                value={masterFormulaId}
                onChange={(e) => setMasterFormulaId(e.target.value)}
                placeholder="Reference to approved master formula document"
              />
              <p className="text-xs text-muted-foreground">
                Links this batch to its approved master formula / specification document.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 2: Manufacturing Details
// ============================================================================

interface StepManufacturingDetailsProps {
  batchSize: string; setBatchSize: (v: string) => void;
  batchSizeUnit: string; setBatchSizeUnit: (v: string) => void;
  manufacturingDate: string; setManufacturingDate: (v: string) => void;
  expiryDate: string; setExpiryDate: (v: string) => void;
  manufacturingSite: string; setManufacturingSite: (v: string) => void;
  productionLine: string; setProductionLine: (v: string) => void;
}

function StepManufacturingDetails({
  batchSize, setBatchSize,
  batchSizeUnit, setBatchSizeUnit,
  manufacturingDate, setManufacturingDate,
  expiryDate, setExpiryDate,
  manufacturingSite, setManufacturingSite,
  productionLine, setProductionLine,
}: StepManufacturingDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          Manufacturing Details
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Specify batch size, manufacturing dates, and production location.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Batch Size <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="e.g., 10000"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Unit</Label>
              <Select value={batchSizeUnit} onValueChange={setBatchSizeUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_SIZE_UNITS.map(u => (
                    <SelectItem key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Manufacturing Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Manufacturing Site</Label>
              <Input
                value={manufacturingSite}
                onChange={(e) => setManufacturingSite(e.target.value)}
                placeholder="e.g., Site A - Building 1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Production Line</Label>
              <Input
                value={productionLine}
                onChange={(e) => setProductionLine(e.target.value)}
                placeholder="e.g., Line 3"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 3: Process Steps
// ============================================================================

interface StepProcessStepsProps {
  processSteps: ProcessStepForm[];
  addStep: () => void;
  removeStep: (tempId: string) => void;
  updateStep: (tempId: string, field: keyof ProcessStepForm, value: string) => void;
}

function StepProcessSteps({ processSteps, addStep, removeStep, updateStep }: StepProcessStepsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Process Steps
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Define the manufacturing process steps. Each step will be tracked during production.
        </p>
      </div>

      <div className="space-y-3">
        {processSteps.map((step, index) => (
          <Card key={step.tempId}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">Step {index + 1}</span>
                </div>
                {processSteps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => removeStep(step.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Step Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={step.stepName}
                  onChange={(e) => updateStep(step.tempId, 'stepName', e.target.value)}
                  placeholder="e.g., Raw Material Verification"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Instructions</Label>
                  <Textarea
                    value={step.instructions}
                    onChange={(e) => updateStep(step.tempId, 'instructions', e.target.value)}
                    placeholder="Describe what should be done in this step..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Expected Value</Label>
                  <Textarea
                    value={step.expectedValue}
                    onChange={(e) => updateStep(step.tempId, 'expectedValue', e.target.value)}
                    placeholder="Expected outcome or acceptance criteria..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addStep} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Process Step
      </Button>
    </div>
  );
}

// ============================================================================
// Step 4: Quality Specifications
// ============================================================================

interface StepQualitySpecsProps {
  specReference: string; setSpecReference: (v: string) => void;
  acceptanceCriteria: string; setAcceptanceCriteria: (v: string) => void;
  inProcessControls: string; setInProcessControls: (v: string) => void;
  samplingPlan: string; setSamplingPlan: (v: string) => void;
  holdTimes: string; setHoldTimes: (v: string) => void;
}

function StepQualitySpecifications({
  specReference, setSpecReference,
  acceptanceCriteria, setAcceptanceCriteria,
  inProcessControls, setInProcessControls,
  samplingPlan, setSamplingPlan,
  holdTimes, setHoldTimes,
}: StepQualitySpecsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          Quality Specifications
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Define the quality requirements and acceptance criteria for this batch.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Specification Reference</Label>
            <Input
              value={specReference}
              onChange={(e) => setSpecReference(e.target.value)}
              placeholder="e.g., SPEC-PROD-001 Rev 03"
            />
            <p className="text-xs text-muted-foreground">
              Reference to the approved product specification document.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Acceptance Criteria</Label>
            <Textarea
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="Define the acceptance criteria for batch release (e.g., assay 95-105%, dissolution NLT 80%)..."
              className="min-h-[100px] text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">In-Process Controls</Label>
            <Textarea
              value={inProcessControls}
              onChange={(e) => setInProcessControls(e.target.value)}
              placeholder="List in-process controls and their limits (e.g., pH 6.0-7.0, temperature 25±2°C)..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sampling Plan</Label>
              <Textarea
                value={samplingPlan}
                onChange={(e) => setSamplingPlan(e.target.value)}
                placeholder="Describe sampling strategy (e.g., per ISO 2859-1, AQL 0.65)..."
                className="min-h-[80px] text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hold Times</Label>
              <Textarea
                value={holdTimes}
                onChange={(e) => setHoldTimes(e.target.value)}
                placeholder="Specify maximum hold times for intermediates (e.g., bulk solution max 24h at 2-8°C)..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 5: QA Review & Release
// ============================================================================

interface StepQAReviewProps {
  qaReviewerId: string; setQaReviewerId: (v: string) => void;
  releaseCriteria: string; setReleaseCriteria: (v: string) => void;
  specialInstructions: string; setSpecialInstructions: (v: string) => void;
  stabilityStudy: boolean; setStabilityStudy: (v: boolean) => void;
  stabilityDetails: string; setStabilityDetails: (v: string) => void;
  qaProfiles: { id: string; fullName?: string; email: string }[];
}

function StepQAReview({
  qaReviewerId, setQaReviewerId,
  releaseCriteria, setReleaseCriteria,
  specialInstructions, setSpecialInstructions,
  stabilityStudy, setStabilityStudy,
  stabilityDetails, setStabilityDetails,
  qaProfiles,
}: StepQAReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          QA Review & Release
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure QA review parameters and release requirements.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assigned QA Reviewer</Label>
            <Select value={qaReviewerId} onValueChange={setQaReviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select QA reviewer" />
              </SelectTrigger>
              <SelectContent>
                {qaProfiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName || p.email}
                  </SelectItem>
                ))}
                {qaProfiles.length === 0 && (
                  <SelectItem value="none" disabled>No QA profiles available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Release Criteria</Label>
            <Textarea
              value={releaseCriteria}
              onChange={(e) => setReleaseCriteria(e.target.value)}
              placeholder="Define specific release criteria for this batch (e.g., all test results within specification, no open deviations)..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Special Instructions</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special instructions for QA review or batch disposition..."
              className="min-h-[60px] text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="stabilityStudy"
                checked={stabilityStudy}
                onCheckedChange={(checked) => setStabilityStudy(checked === true)}
              />
              <Label htmlFor="stabilityStudy" className="text-sm font-medium cursor-pointer">
                Include in Stability Study
              </Label>
            </div>
            {stabilityStudy && (
              <div className="space-y-2 ml-7">
                <Label className="text-sm font-medium">Stability Study Details</Label>
                <Textarea
                  value={stabilityDetails}
                  onChange={(e) => setStabilityDetails(e.target.value)}
                  placeholder="Describe the stability study conditions and schedule (e.g., ICH Q1A conditions, 25°C/60%RH, testing at 0, 3, 6, 12, 24 months)..."
                  className="min-h-[80px] text-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 6: Review & Submit
// ============================================================================

interface StepReviewSubmitProps {
  productName: string;
  productCode: string;
  lotNumber: string;
  masterFormulaId: string;
  productType: string;
  batchSize: string;
  batchSizeUnit: string;
  manufacturingDate: string;
  expiryDate: string;
  manufacturingSite: string;
  productionLine: string;
  processSteps: ProcessStepForm[];
  specReference: string;
  acceptanceCriteria: string;
  inProcessControls: string;
  samplingPlan: string;
  holdTimes: string;
  qaReviewerId: string;
  releaseCriteria: string;
  specialInstructions: string;
  stabilityStudy: boolean;
  stabilityDetails: string;
  qaProfiles: { id: string; fullName?: string; email: string }[];
}

function StepReviewSubmit({
  productName, productCode, lotNumber, masterFormulaId, productType,
  batchSize, batchSizeUnit, manufacturingDate, expiryDate,
  manufacturingSite, productionLine,
  processSteps,
  specReference, acceptanceCriteria, inProcessControls, samplingPlan, holdTimes,
  qaReviewerId, releaseCriteria, specialInstructions,
  stabilityStudy, stabilityDetails,
  qaProfiles,
}: StepReviewSubmitProps) {
  const qaReviewer = qaProfiles.find(p => p.id === qaReviewerId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Review & Submit
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review all details before creating the batch record.
        </p>
      </div>

      {/* Compliance Banner */}
      <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-md p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Regulatory Compliance</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            This batch record must comply with FDA 21 CFR 211 (Current Good Manufacturing Practice),
            cGMP requirements, and ISO 13485 §8.5.1 (Control of Production and Service Provision).
            All steps require proper documentation, electronic signatures, and audit trail recording.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Information Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="h-3.5 w-3.5" /> Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <ReviewRow label="Product Name" value={productName} />
            {productCode && <ReviewRow label="Product Code" value={productCode} />}
            <ReviewRow label="Lot Number" value={lotNumber} mono />
            {masterFormulaId && <ReviewRow label="Master Formula" value={masterFormulaId} />}
            {productType && <ReviewRow label="Product Type" value={productType} />}
          </CardContent>
        </Card>

        {/* Manufacturing Details Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Factory className="h-3.5 w-3.5" /> Manufacturing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <ReviewRow label="Batch Size" value={batchSize ? `${batchSize} ${batchSizeUnit}` : '-'} />
            {manufacturingDate && <ReviewRow label="Mfg Date" value={manufacturingDate} />}
            {expiryDate && <ReviewRow label="Expiry Date" value={expiryDate} />}
            {manufacturingSite && <ReviewRow label="Site" value={manufacturingSite} />}
            {productionLine && <ReviewRow label="Line" value={productionLine} />}
          </CardContent>
        </Card>

        {/* Process Steps Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5" /> Process Steps ({processSteps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {processSteps.map((step, i) => (
              <div key={step.tempId} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{step.stepName || `Step ${i + 1}`}</p>
                  {step.expectedValue && (
                    <p className="text-xs text-muted-foreground truncate">Expected: {step.expectedValue}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quality Specifications Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Beaker className="h-3.5 w-3.5" /> Quality Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
            {specReference && <ReviewRow label="Spec Reference" value={specReference} />}
            {acceptanceCriteria && <ReviewRow label="Acceptance Criteria" value={acceptanceCriteria} />}
            {inProcessControls && <ReviewRow label="In-Process Controls" value={inProcessControls} />}
            {samplingPlan && <ReviewRow label="Sampling Plan" value={samplingPlan} />}
            {holdTimes && <ReviewRow label="Hold Times" value={holdTimes} />}
            {!specReference && !acceptanceCriteria && !inProcessControls && !samplingPlan && !holdTimes && (
              <p className="text-xs text-muted-foreground">No specifications defined</p>
            )}
          </CardContent>
        </Card>

        {/* QA Review Summary */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5" /> QA Review & Release
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {qaReviewer && <ReviewRow label="QA Reviewer" value={qaReviewer.fullName || qaReviewer.email} />}
            {releaseCriteria && <ReviewRow label="Release Criteria" value={releaseCriteria} />}
            {specialInstructions && <ReviewRow label="Special Instructions" value={specialInstructions} />}
            <ReviewRow label="Stability Study" value={stabilityStudy ? 'Yes' : 'No'} />
            {stabilityStudy && stabilityDetails && <ReviewRow label="Stability Details" value={stabilityDetails} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Helper
// ============================================================================

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground text-xs shrink-0">{label}</span>
      <span className={cn('text-right text-xs', mono && 'font-mono')}>{value || '-'}</span>
    </div>
  );
}
