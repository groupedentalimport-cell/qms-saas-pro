'use client';

import React, { useState, useMemo } from 'react';
import { createSupplier } from '@/services/supplierService';
import { useAuth } from '@/contexts/AuthContext';
import { useQMSStore } from '@/lib/demo-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SupplierCategory, SupplierStatus } from '@/types/qms';
import {
  Truck, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Plus, Trash2, ShieldCheck, AlertTriangle, Globe,
  Award, ClipboardCheck, BarChart3, FileText,
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
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface CertEntry {
  tempId: string;
  name: string;
  certNumber: string;
  expiryDate: string;
}

interface SupplierCreateFormProps {
  onComplete: () => void;
}

const STEPS = [
  { number: 1, label: 'Supplier Information', icon: Truck },
  { number: 2, label: 'Contact & Location', icon: Globe },
  { number: 3, label: 'Qualification & Approval', icon: ClipboardCheck },
  { number: 4, label: 'Certifications & Compliance', icon: Award },
  { number: 5, label: 'Evaluation & Performance', icon: BarChart3 },
  { number: 6, label: 'Review & Submit', icon: ShieldCheck },
];

const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'Raw Material', 'Packaging', 'Equipment', 'Service',
  'Contract Manufacturer', 'Laboratory', 'Other',
];

const SUPPLIER_STATUSES: SupplierStatus[] = [
  'Qualified', 'Conditional', 'Disqualified', 'Under Evaluation',
];

const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const MONITORING_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const QUALIFICATION_METHODS = ['On-site Audit', 'Desktop Audit', 'Questionnaire', 'Historical Performance', 'Sample Testing'];

// ============================================================================
// Component
// ============================================================================

export function SupplierCreateForm({ onComplete }: SupplierCreateFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const suppliers = useQMSStore(state => state.suppliers);
  const profiles = useQMSStore(state => state.profiles);
  const documents = useQMSStore(state => state.documents);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Supplier Information
  const [name, setName] = useState('');
  const [autoCode, setAutoCode] = useState(true);
  const [supplierCode, setSupplierCode] = useState('');
  const [category, setCategory] = useState<SupplierCategory>('Raw Material');
  const [supplierType, setSupplierType] = useState<'Critical' | 'Non-Critical'>('Non-Critical');
  const [website, setWebsite] = useState('');

  // Step 2: Contact & Location
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Step 3: Qualification & Approval
  const [status, setStatus] = useState<SupplierStatus>('Under Evaluation');
  const [qualificationDate, setQualificationDate] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [qualificationMethod, setQualificationMethod] = useState('');
  const [approvedById, setApprovedById] = useState('');

  // Step 4: Certifications & Compliance
  const [certifications, setCertifications] = useState<CertEntry[]>([]);
  const [regulations, setRegulations] = useState('');
  const [qualityAgreement, setQualityAgreement] = useState(false);
  const [confidentialityAgreement, setConfidentialityAgreement] = useState(false);

  // Step 5: Evaluation & Performance
  const [performanceScore, setPerformanceScore] = useState(80);
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [monitoringFrequency, setMonitoringFrequency] = useState('Quarterly');
  const [qualificationDocId, setQualificationDocId] = useState('');

  // Auto-code generator
  const suggestedCode = useMemo(() => {
    const count = suppliers.length + 1;
    return `SUP-${String(count).padStart(3, '0')}`;
  }, [suppliers]);

  // QA/Management profiles
  const approverProfiles = profiles.filter(p =>
    p.role === 'quality_manager' || p.role === 'admin' || p.role === 'executive'
  );

  // Approved documents for qualification doc link
  const approvedDocuments = documents.filter(d => d.status === 'Approved');

  // Step validation
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && (autoCode || supplierCode.trim().length > 0);
      case 2:
        return true;
      case 3:
        return true;
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

  // Cert management
  const addCert = () => {
    setCertifications(prev => [
      ...prev,
      { tempId: `cert-${Date.now()}`, name: '', certNumber: '', expiryDate: '' },
    ]);
  };

  const removeCert = (tempId: string) => {
    setCertifications(prev => prev.filter(c => c.tempId !== tempId));
  };

  const updateCert = (tempId: string, field: keyof CertEntry, value: string) => {
    setCertifications(prev =>
      prev.map(c => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  // Score helpers
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Acceptable';
    return 'Needs Improvement';
  };

  // Submit
  const handleSubmit = () => {
    const finalCode = autoCode ? suggestedCode : supplierCode;
    try {
      createSupplier({
        supplierCode: finalCode,
        name,
        category,
        status,
        qualificationDate: qualificationDate ? new Date(qualificationDate).toISOString() : undefined,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate).toISOString() : undefined,
        certifications: certifications
          .filter(c => c.name.trim().length > 0)
          .map(c => c.name),
        performanceScore,
        qualificationDocId: qualificationDocId || undefined,
        organizationId: 'org-001',
        createdById: currentUser?.id,
      });

      toast({
        title: 'Supplier Created',
        description: `Supplier ${name} (${finalCode}) has been created successfully.`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error Creating Supplier',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

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
          <StepSupplierInformation
            name={name} setName={setName}
            autoCode={autoCode} setAutoCode={setAutoCode}
            supplierCode={supplierCode} setSupplierCode={setSupplierCode}
            suggestedCode={suggestedCode}
            category={category} setCategory={setCategory}
            supplierType={supplierType} setSupplierType={setSupplierType}
            website={website} setWebsite={setWebsite}
          />
        )}
        {currentStep === 2 && (
          <StepContactLocation
            contactName={contactName} setContactName={setContactName}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            address={address} setAddress={setAddress}
            country={country} setCountry={setCountry}
            emergencyContact={emergencyContact} setEmergencyContact={setEmergencyContact}
            emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
          />
        )}
        {currentStep === 3 && (
          <StepQualificationApproval
            status={status} setStatus={setStatus}
            qualificationDate={qualificationDate} setQualificationDate={setQualificationDate}
            nextReviewDate={nextReviewDate} setNextReviewDate={setNextReviewDate}
            qualificationMethod={qualificationMethod} setQualificationMethod={setQualificationMethod}
            approvedById={approvedById} setApprovedById={setApprovedById}
            approverProfiles={approverProfiles}
          />
        )}
        {currentStep === 4 && (
          <StepCertificationsCompliance
            certifications={certifications}
            addCert={addCert}
            removeCert={removeCert}
            updateCert={updateCert}
            regulations={regulations} setRegulations={setRegulations}
            qualityAgreement={qualityAgreement} setQualityAgreement={setQualityAgreement}
            confidentialityAgreement={confidentialityAgreement} setConfidentialityAgreement={setConfidentialityAgreement}
          />
        )}
        {currentStep === 5 && (
          <StepEvaluationPerformance
            performanceScore={performanceScore} setPerformanceScore={setPerformanceScore}
            evaluationCriteria={evaluationCriteria} setEvaluationCriteria={setEvaluationCriteria}
            riskLevel={riskLevel} setRiskLevel={setRiskLevel}
            monitoringFrequency={monitoringFrequency} setMonitoringFrequency={setMonitoringFrequency}
            qualificationDocId={qualificationDocId} setQualificationDocId={setQualificationDocId}
            approvedDocuments={approvedDocuments}
            getScoreColorClass={getScoreColorClass}
            getScoreBarColor={getScoreBarColor}
            getScoreLabel={getScoreLabel}
          />
        )}
        {currentStep === 6 && (
          <StepReviewSubmit
            name={name}
            supplierCode={autoCode ? suggestedCode : supplierCode}
            category={category}
            supplierType={supplierType}
            website={website}
            contactName={contactName}
            contactEmail={contactEmail}
            country={country}
            status={status}
            qualificationDate={qualificationDate}
            nextReviewDate={nextReviewDate}
            qualificationMethod={qualificationMethod}
            approvedById={approvedById}
            approverProfiles={approverProfiles}
            certifications={certifications}
            regulations={regulations}
            qualityAgreement={qualityAgreement}
            confidentialityAgreement={confidentialityAgreement}
            performanceScore={performanceScore}
            evaluationCriteria={evaluationCriteria}
            riskLevel={riskLevel}
            monitoringFrequency={monitoringFrequency}
            qualificationDocId={qualificationDocId}
            approvedDocuments={approvedDocuments}
            getScoreColorClass={getScoreColorClass}
            getScoreBarColor={getScoreBarColor}
            getScoreLabel={getScoreLabel}
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
            <ShieldCheck className="h-4 w-4 mr-2" /> Create Supplier
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Step 1: Supplier Information
// ============================================================================

interface StepSupplierInfoProps {
  name: string; setName: (v: string) => void;
  autoCode: boolean; setAutoCode: (v: boolean) => void;
  supplierCode: string; setSupplierCode: (v: string) => void;
  suggestedCode: string;
  category: SupplierCategory; setCategory: (v: SupplierCategory) => void;
  supplierType: 'Critical' | 'Non-Critical'; setSupplierType: (v: 'Critical' | 'Non-Critical') => void;
  website: string; setWebsite: (v: string) => void;
}

function StepSupplierInformation({
  name, setName,
  autoCode, setAutoCode,
  supplierCode, setSupplierCode,
  suggestedCode,
  category, setCategory,
  supplierType, setSupplierType,
  website, setWebsite,
}: StepSupplierInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Supplier Information
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the supplier identification and classification details.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">
                Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PharmaChem Industries"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Supplier Code <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="autoCode"
                  checked={autoCode}
                  onCheckedChange={(checked) => setAutoCode(checked === true)}
                />
                <Label htmlFor="autoCode" className="text-sm cursor-pointer">Auto-generate</Label>
              </div>
              {autoCode ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-medium">{suggestedCode}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">Auto-generated</Badge>
                </div>
              ) : (
                <Input
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  placeholder="e.g., SUP-001"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as SupplierCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSupplierType('Critical')}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm font-medium transition-all',
                    supplierType === 'Critical'
                      ? 'border-red-300 bg-red-50/50 text-red-700 dark:border-red-700 dark:bg-red-900/10 dark:text-red-400'
                      : 'border-muted hover:border-muted-foreground/30'
                  )}
                >
                  <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                  Critical
                </button>
                <button
                  onClick={() => setSupplierType('Non-Critical')}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm font-medium transition-all',
                    supplierType === 'Non-Critical'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                  Non-Critical
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 2: Contact & Location
// ============================================================================

interface StepContactLocationProps {
  contactName: string; setContactName: (v: string) => void;
  contactEmail: string; setContactEmail: (v: string) => void;
  contactPhone: string; setContactPhone: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  emergencyContact: string; setEmergencyContact: (v: string) => void;
  emergencyPhone: string; setEmergencyPhone: (v: string) => void;
}

function StepContactLocation({
  contactName, setContactName,
  contactEmail, setContactEmail,
  contactPhone, setContactPhone,
  address, setAddress,
  country, setCountry,
  emergencyContact, setEmergencyContact,
  emergencyPhone, setEmergencyPhone,
}: StepContactLocationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Contact & Location
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Primary contact details and location information.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Primary Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact Name</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john.smith@supplier.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1-555-123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address including street, city, state, postal code..."
                className="min-h-[70px] text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., United States"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Emergency Contact Name</Label>
              <Input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Emergency contact person"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Emergency Phone</Label>
              <Input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1-555-000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 3: Qualification & Approval
// ============================================================================

interface StepQualificationProps {
  status: SupplierStatus; setStatus: (v: SupplierStatus) => void;
  qualificationDate: string; setQualificationDate: (v: string) => void;
  nextReviewDate: string; setNextReviewDate: (v: string) => void;
  qualificationMethod: string; setQualificationMethod: (v: string) => void;
  approvedById: string; setApprovedById: (v: string) => void;
  approverProfiles: { id: string; fullName?: string; email: string }[];
}

function StepQualificationApproval({
  status, setStatus,
  qualificationDate, setQualificationDate,
  nextReviewDate, setNextReviewDate,
  qualificationMethod, setQualificationMethod,
  approvedById, setApprovedById,
  approverProfiles,
}: StepQualificationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Qualification & Approval
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Define the supplier qualification status and approval workflow.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SupplierStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Qualification Method</Label>
              <Select value={qualificationMethod} onValueChange={setQualificationMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATION_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Qualification Date</Label>
              <Input
                type="date"
                value={qualificationDate}
                onChange={(e) => setQualificationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Next Review Date</Label>
              <Input
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Approved By</Label>
              <Select value={approvedById} onValueChange={setApprovedById}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  {approverProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName || p.email}
                    </SelectItem>
                  ))}
                  {approverProfiles.length === 0 && (
                    <SelectItem value="none" disabled>No approver profiles available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 4: Certifications & Compliance
// ============================================================================

interface StepCertsProps {
  certifications: CertEntry[];
  addCert: () => void;
  removeCert: (tempId: string) => void;
  updateCert: (tempId: string, field: keyof CertEntry, value: string) => void;
  regulations: string; setRegulations: (v: string) => void;
  qualityAgreement: boolean; setQualityAgreement: (v: boolean) => void;
  confidentialityAgreement: boolean; setConfidentialityAgreement: (v: boolean) => void;
}

function StepCertificationsCompliance({
  certifications, addCert, removeCert, updateCert,
  regulations, setRegulations,
  qualityAgreement, setQualityAgreement,
  confidentialityAgreement, setConfidentialityAgreement,
}: StepCertsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certifications & Compliance
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          List supplier certifications, regulatory compliance, and agreement status.
        </p>
      </div>

      <div className="space-y-3">
        {certifications.map((cert, index) => (
          <Card key={cert.tempId}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Certification {index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => removeCert(cert.tempId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Certification Name</Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => updateCert(cert.tempId, 'name', e.target.value)}
                    placeholder="e.g., ISO 13485:2016"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Certificate #</Label>
                  <Input
                    value={cert.certNumber}
                    onChange={(e) => updateCert(cert.tempId, 'certNumber', e.target.value)}
                    placeholder="e.g., CERT-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Expiry Date</Label>
                  <Input
                    type="date"
                    value={cert.expiryDate}
                    onChange={(e) => updateCert(cert.tempId, 'expiryDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addCert} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Certification
      </Button>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Applicable Regulations</Label>
            <Textarea
              value={regulations}
              onChange={(e) => setRegulations(e.target.value)}
              placeholder="List applicable regulations (e.g., FDA 21 CFR 820, ISO 13485:2016, EU MDR 2017/745)..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="qualityAgreement"
                checked={qualityAgreement}
                onCheckedChange={(checked) => setQualityAgreement(checked === true)}
              />
              <Label htmlFor="qualityAgreement" className="text-sm font-medium cursor-pointer">
                Quality Agreement in Place
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="confidentialityAgreement"
                checked={confidentialityAgreement}
                onCheckedChange={(checked) => setConfidentialityAgreement(checked === true)}
              />
              <Label htmlFor="confidentialityAgreement" className="text-sm font-medium cursor-pointer">
                Confidentiality Agreement (NDA) in Place
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 5: Evaluation & Performance
// ============================================================================

interface StepEvaluationProps {
  performanceScore: number; setPerformanceScore: (v: number) => void;
  evaluationCriteria: string; setEvaluationCriteria: (v: string) => void;
  riskLevel: string; setRiskLevel: (v: string) => void;
  monitoringFrequency: string; setMonitoringFrequency: (v: string) => void;
  qualificationDocId: string; setQualificationDocId: (v: string) => void;
  approvedDocuments: { id: string; title: string; documentNumber: string }[];
  getScoreColorClass: (score: number) => string;
  getScoreBarColor: (score: number) => string;
  getScoreLabel: (score: number) => string;
}

function StepEvaluationPerformance({
  performanceScore, setPerformanceScore,
  evaluationCriteria, setEvaluationCriteria,
  riskLevel, setRiskLevel,
  monitoringFrequency, setMonitoringFrequency,
  qualificationDocId, setQualificationDocId,
  approvedDocuments,
  getScoreColorClass, getScoreBarColor, getScoreLabel,
}: StepEvaluationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Evaluation & Performance
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Set initial performance score, risk assessment, and monitoring parameters.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Performance Score</Label>
              <span className={cn('text-lg font-bold', getScoreColorClass(performanceScore))}>
                {performanceScore}
              </span>
            </div>
            <Slider
              value={[performanceScore]}
              onValueChange={(v) => setPerformanceScore(v[0])}
              min={0}
              max={100}
              step={1}
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getScoreBarColor(performanceScore))}
                    style={{ width: `${performanceScore}%` }}
                  />
                </div>
              </div>
              <Badge variant="outline" className={cn('text-xs', getScoreColorClass(performanceScore))}>
                {getScoreLabel(performanceScore)}
              </Badge>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Monitoring Frequency</Label>
              <Select value={monitoringFrequency} onValueChange={setMonitoringFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONITORING_FREQUENCIES.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Evaluation Criteria</Label>
            <Textarea
              value={evaluationCriteria}
              onChange={(e) => setEvaluationCriteria(e.target.value)}
              placeholder="Describe evaluation criteria (e.g., on-time delivery ≥95%, NCR rate <1%, audit findings resolution within 30 days)..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Linked Qualification Document</Label>
            <Select value={qualificationDocId} onValueChange={setQualificationDocId}>
              <SelectTrigger>
                <SelectValue placeholder="Select qualification document" />
              </SelectTrigger>
              <SelectContent>
                {approvedDocuments.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.documentNumber} — {d.title}
                  </SelectItem>
                ))}
                {approvedDocuments.length === 0 && (
                  <SelectItem value="none" disabled>No approved documents available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Link to an approved qualification document from the Document Control module.
            </p>
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
  name: string;
  supplierCode: string;
  category: SupplierCategory;
  supplierType: string;
  website: string;
  contactName: string;
  contactEmail: string;
  country: string;
  status: SupplierStatus;
  qualificationDate: string;
  nextReviewDate: string;
  qualificationMethod: string;
  approvedById: string;
  approverProfiles: { id: string; fullName?: string; email: string }[];
  certifications: CertEntry[];
  regulations: string;
  qualityAgreement: boolean;
  confidentialityAgreement: boolean;
  performanceScore: number;
  evaluationCriteria: string;
  riskLevel: string;
  monitoringFrequency: string;
  qualificationDocId: string;
  approvedDocuments: { id: string; title: string; documentNumber: string }[];
  getScoreColorClass: (score: number) => string;
  getScoreBarColor: (score: number) => string;
  getScoreLabel: (score: number) => string;
}

function StepReviewSubmit({
  name, supplierCode, category, supplierType, website,
  contactName, contactEmail, country,
  status, qualificationDate, nextReviewDate, qualificationMethod,
  approvedById, approverProfiles,
  certifications, regulations, qualityAgreement, confidentialityAgreement,
  performanceScore, evaluationCriteria, riskLevel, monitoringFrequency,
  qualificationDocId, approvedDocuments,
  getScoreColorClass, getScoreBarColor, getScoreLabel,
}: StepReviewSubmitProps) {
  const approver = approverProfiles.find(p => p.id === approvedById);
  const qualDoc = approvedDocuments.find(d => d.id === qualificationDocId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Review & Submit
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review all details before creating the supplier record.
        </p>
      </div>

      {/* Compliance Banner */}
      <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-md p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Regulatory Compliance</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            This supplier record must comply with ISO 13485 §7.4 (Purchasing) and FDA 21 CFR 820.50
            (Purchasing Controls). Critical suppliers require additional qualification documentation,
            on-site audit records, and enhanced monitoring per applicable quality system regulations.
          </p>
        </div>
      </div>

      {/* Critical supplier warning */}
      {supplierType === 'Critical' && (
        <div className="border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Critical Supplier</p>
            <p className="text-xs text-red-700 dark:text-red-500 mt-1">
              This supplier is classified as Critical. Additional qualification requirements apply:
              on-site audit within 12 months, quality agreement mandatory, enhanced monitoring,
              and re-qualification at least annually per ISO 13485 §7.4.3 and FDA 21 CFR 820.50(b).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Information Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" /> Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <ReviewRow label="Name" value={name} />
            <ReviewRow label="Code" value={supplierCode} mono />
            <ReviewRow label="Category" value={category} />
            <ReviewRow label="Type" value={supplierType} />
            {website && <ReviewRow label="Website" value={website} />}
          </CardContent>
        </Card>

        {/* Contact & Location Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" /> Contact & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {contactName && <ReviewRow label="Contact" value={contactName} />}
            {contactEmail && <ReviewRow label="Email" value={contactEmail} />}
            {country && <ReviewRow label="Country" value={country} />}
          </CardContent>
        </Card>

        {/* Qualification Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5" /> Qualification & Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <ReviewRow label="Status" value={status} />
            {qualificationMethod && <ReviewRow label="Method" value={qualificationMethod} />}
            {qualificationDate && <ReviewRow label="Qual. Date" value={qualificationDate} />}
            {nextReviewDate && <ReviewRow label="Next Review" value={nextReviewDate} />}
            {approver && <ReviewRow label="Approved By" value={approver.fullName || approver.email} />}
          </CardContent>
        </Card>

        {/* Certifications & Compliance Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Award className="h-3.5 w-3.5" /> Certifications ({certifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
            {certifications.length > 0 ? certifications.map(cert => (
              <div key={cert.tempId} className="flex items-start gap-2">
                <Award className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-xs truncate">{cert.name || 'Unnamed Cert'}</p>
                  {cert.certNumber && (
                    <p className="text-xs text-muted-foreground">{cert.certNumber}</p>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">No certifications listed</p>
            )}
            <Separator className="my-2" />
            <ReviewRow label="Quality Agreement" value={qualityAgreement ? 'Yes' : 'No'} />
            <ReviewRow label="NDA" value={confidentialityAgreement ? 'Yes' : 'No'} />
          </CardContent>
        </Card>

        {/* Evaluation & Performance Summary */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" /> Evaluation & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex items-center gap-4">
              <ReviewRow label="Performance Score" value={`${performanceScore}/100`} />
              <Badge variant="outline" className={cn('text-xs', getScoreColorClass(performanceScore))}>
                {getScoreLabel(performanceScore)}
              </Badge>
            </div>
            <ReviewRow label="Risk Level" value={riskLevel} />
            <ReviewRow label="Monitoring" value={monitoringFrequency} />
            {evaluationCriteria && <ReviewRow label="Criteria" value={evaluationCriteria} />}
            {qualDoc && <ReviewRow label="Qual. Document" value={`${qualDoc.documentNumber} — ${qualDoc.title}`} />}
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
