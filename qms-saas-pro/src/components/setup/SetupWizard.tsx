
import React, { useState, useMemo } from 'react';
import {
  Building2,
  Factory,
  Pill,
  Layers,
  FlaskConical,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Shield,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  GraduationCap,
  BarChart3,
  GitBranch,
  Package,
  Truck,
  FileSpreadsheet,
  ArrowLeftRight,
  AlertOctagon,
  TestTube,
  Users,
  Rocket,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { IndustryType, OrgSettings } from '@/types/qms';
import { CORE_MODULES, OPTIONAL_MODULES, STANDARDS_BY_INDUSTRY } from '@/types/qms';
import { useTranslation } from '@/lib/i18n';

// ============================================================================
// Constants
// ============================================================================

function useIndustryOptions() {
  const t = useTranslation();
  return [
    {
      id: 'medical_device' as IndustryType,
      label: t.industries.medicalDevice,
      description: 'ISO 13485, MDR, FDA 21 CFR 820',
      icon: <Factory className="h-8 w-8" />,
    },
    {
      id: 'pharmaceutical' as IndustryType,
      label: t.industries.pharmaceutical,
      description: 'ICH Q10, cGMP, FDA 21 CFR 210/211',
      icon: <Pill className="h-8 w-8" />,
    },
    {
      id: 'combination_product' as IndustryType,
      label: t.industries.combinationProduct,
      description: 'MDR + cGMP',
      icon: <Layers className="h-8 w-8" />,
    },
    {
      id: 'ivd' as IndustryType,
      label: t.industries.ivd,
      description: 'IVDR, CLSI',
      icon: <FlaskConical className="h-8 w-8" />,
    },
  ];
}

function useModuleInfo() {
  const t = useTranslation();
  return {
    documents: { label: t.modules.documents.title, icon: <FileText className="h-5 w-5" />, description: '' },
    capa: { label: t.modules.capa.title, icon: <Shield className="h-5 w-5" />, description: '' },
    ncr: { label: t.modules.ncr.title, icon: <AlertTriangle className="h-5 w-5" />, description: '' },
    audits: { label: t.modules.audit.title, icon: <ClipboardCheck className="h-5 w-5" />, description: '' },
    training: { label: t.modules.training.title, icon: <GraduationCap className="h-5 w-5" />, description: '' },
    reports: { label: t.modules.reports.title, icon: <BarChart3 className="h-5 w-5" />, description: '' },
    compliance: { label: t.modules.compliance.title, icon: <GitBranch className="h-5 w-5" />, description: '' },
    risks: { label: t.modules.risk.title, icon: <AlertOctagon className="h-5 w-5" />, description: '' },
    batch_records: { label: t.modules.batch.title, icon: <Package className="h-5 w-5" />, description: '' },
    suppliers: { label: t.modules.supplier.title, icon: <Truck className="h-5 w-5" />, description: '' },
    forms: { label: t.nav.forms, icon: <FileSpreadsheet className="h-5 w-5" />, description: '' },
    change_control: { label: t.nav.changeControl, icon: <ArrowLeftRight className="h-5 w-5" />, description: '' },
    deviations: { label: t.modules.deviation.title, icon: <AlertOctagon className="h-5 w-5" />, description: '' },
    oos_oot: { label: t.nav.oosOot, icon: <TestTube className="h-5 w-5" />, description: '' },
  };
}

function getRecommendedModules(industry: IndustryType): string[] {
  const base = [...CORE_MODULES];
  switch (industry) {
    case 'medical_device':
      return [...base, 'risks', 'batch_records', 'suppliers', 'forms', 'change_control'];
    case 'pharmaceutical':
      return [...base, 'risks', 'batch_records', 'suppliers', 'forms', 'oos_oot', 'deviations'];
    case 'combination_product':
      return [...base, 'risks', 'batch_records', 'suppliers', 'forms', 'change_control', 'deviations', 'oos_oot'];
    case 'ivd':
      return [...base, 'risks', 'suppliers', 'forms', 'change_control'];
    default:
      return [...base, 'risks', 'batch_records', 'suppliers', 'forms'];
  }
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
}

interface SetupWizardProps {
  onComplete: (settings: Partial<OrgSettings>, orgName: string) => void;
  onCancel?: () => void;
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const t = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [orgSize, setOrgSize] = useState('');

  // Step 2 state
  const [industry, setIndustry] = useState<IndustryType | ''>('');

  // Step 3 state
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);

  // Step 4 state
  const [activeModules, setActiveModules] = useState<string[]>([]);

  // Step 5 state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const STEPS = [
    { number: 1, label: t.setup.organization },
    { number: 2, label: t.setup.industry },
    { number: 3, label: t.setup.standards },
    { number: 4, label: t.setup.modules },
    { number: 5, label: t.setup.team },
    { number: 6, label: t.setup.summary },
  ];

  // Derived values
  const availableStandards = useMemo(() => {
    if (!industry) return [];
    return STANDARDS_BY_INDUSTRY[industry] || [];
  }, [industry]);

  const recommendedModules = useMemo(() => {
    if (!industry) return [];
    return getRecommendedModules(industry);
  }, [industry]);

  // When industry changes, reset standards and update modules
  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry);
    const newStandards = STANDARDS_BY_INDUSTRY[newIndustry] || [];
    setSelectedStandards([...newStandards]);
    setActiveModules([...getRecommendedModules(newIndustry)]);
  };

  // Step navigation
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return orgName.trim().length > 0;
      case 2: return industry !== '';
      case 3: return selectedStandards.length > 0;
      case 4: return activeModules.length > 0;
      case 5: return true; // optional step
      case 6: return true;
      default: return false;
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

  // Standard toggle
  const toggleStandard = (standard: string) => {
    setSelectedStandards(prev =>
      prev.includes(standard)
        ? prev.filter(s => s !== standard)
        : [...prev, standard]
    );
  };

  // Module toggle (only optional)
  const toggleModule = (module: string) => {
    if (CORE_MODULES.includes(module as typeof CORE_MODULES[number])) return;
    setActiveModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  // Team management
  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { id: `team-${Date.now()}`, email: '', role: 'operator' }]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const updateTeamMember = (id: string, field: 'email' | 'role', value: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Final submission
  const handleLaunch = () => {
    const settings: Partial<OrgSettings> = {
      setup_completed: true,
      industry_type: industry as IndustryType,
      applicable_standards: selectedStandards,
      active_modules: activeModules,
      company_name: orgName,
    };
    onComplete(settings, orgName);
  };

  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with progress */}
      <div className="border-b bg-background px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">QMS {t.setup.organization}</h1>
                <p className="text-xs text-muted-foreground">{currentStep}/{STEPS.length}</p>
              </div>
            </div>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> {t.setup.cancel}
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                <button
                  onClick={() => {
                    if (step.number < currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    step.number === currentStep
                      ? 'bg-primary/10 text-primary'
                      : step.number < currentStep
                      ? 'text-primary cursor-pointer hover:bg-primary/5'
                      : 'text-muted-foreground'
                  }`}
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
                  <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                    step.number < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {currentStep === 1 && (
            <StepOrganisation
              orgName={orgName}
              setOrgName={setOrgName}
              country={country}
              setCountry={setCountry}
              city={city}
              setCity={setCity}
              orgSize={orgSize}
              setOrgSize={setOrgSize}
            />
          )}
          {currentStep === 2 && (
            <StepSecteur industry={industry} onSelect={handleIndustryChange} />
          )}
          {currentStep === 3 && (
            <StepNormes
              availableStandards={availableStandards}
              selectedStandards={selectedStandards}
              toggleStandard={toggleStandard}
            />
          )}
          {currentStep === 4 && (
            <StepModules
              activeModules={activeModules}
              toggleModule={toggleModule}
            />
          )}
          {currentStep === 5 && (
            <StepEquipe
              teamMembers={teamMembers}
              addTeamMember={addTeamMember}
              removeTeamMember={removeTeamMember}
              updateTeamMember={updateTeamMember}
            />
          )}
          {currentStep === 6 && (
            <StepRecapitulatif
              orgName={orgName}
              country={country}
              city={city}
              orgSize={orgSize}
              industry={industry}
              selectedStandards={selectedStandards}
              activeModules={activeModules}
              teamMembers={teamMembers}
            />
          )}
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="border-t bg-background px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> {t.setup.previous}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentStep === 5 && (
              <Badge variant="outline" className="text-xs">{t.setup.optionalStep}</Badge>
            )}
          </div>
          {currentStep < 6 ? (
            <Button onClick={goNext} disabled={!canGoNext()}>
              {t.setup.next} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleLaunch} className="bg-primary">
              <Rocket className="h-4 w-4 mr-2" /> {t.setup.launch}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step 1: Organisation
// ============================================================================

interface StepOrganisationProps {
  orgName: string;
  setOrgName: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  orgSize: string;
  setOrgSize: (v: string) => void;
}

function StepOrganisation({ orgName, setOrgName, country, setCountry, city, setCity, orgSize, setOrgSize }: StepOrganisationProps) {
  const t = useTranslation();

  const ORG_SIZES = [
    { value: '1-10', label: '1–10' },
    { value: '11-50', label: '11–50' },
    { value: '51-200', label: '51–200' },
    { value: '200+', label: '200+' },
  ];

  const COUNTRIES = [
    { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'CH', label: 'Suisse' },
    { value: 'BE', label: 'Belgique' },
    { value: 'UK', label: 'Royaume-Uni' },
    { value: 'NL', label: 'Pays-Bas' },
    { value: 'IT', label: 'Italie' },
    { value: 'ES', label: 'Espagne' },
    { value: 'US', label: 'États-Unis' },
    { value: 'CA', label: 'Canada' },
    { value: 'JP', label: 'Japon' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.organization}</h2>
        <p className="text-muted-foreground mt-1">{t.setup.companyName}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="orgName" className="text-sm font-medium">
                {t.setup.companyName} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="PharmaCorp"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.setup.selectCountry}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder={t.setup.selectCountry} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ville / City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">{t.setup.companySize}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ORG_SIZES.map(size => (
                  <button
                    key={size.value}
                    onClick={() => setOrgSize(size.value)}
                    className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                      orgSize === size.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 2: Industry
// ============================================================================

interface StepSecteurProps {
  industry: IndustryType | '';
  onSelect: (industry: IndustryType) => void;
}

function StepSecteur({ industry, onSelect }: StepSecteurProps) {
  const t = useTranslation();
  const industryOptions = useIndustryOptions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.industry}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {industryOptions.map(opt => (
          <Card
            key={opt.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              industry === opt.id
                ? 'border-2 border-primary shadow-md'
                : 'border-2 border-transparent hover:border-muted-foreground/20'
            }`}
            onClick={() => onSelect(opt.id)}
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  industry === opt.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{opt.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                  {industry === opt.id && (
                    <Badge className="mt-2" variant="default">{t.setup.selected}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Step 3: Standards
// ============================================================================

interface StepNormesProps {
  availableStandards: string[];
  selectedStandards: string[];
  toggleStandard: (standard: string) => void;
}

function StepNormes({ availableStandards, selectedStandards, toggleStandard }: StepNormesProps) {
  const t = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.applicableStandards}</h2>
      </div>

      {availableStandards.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>{t.setup.industry}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {selectedStandards.length} {t.setup.selected.toLowerCase()}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedStandards.length === availableStandards.length) {
                    availableStandards.forEach(s => toggleStandard(s));
                  } else {
                    availableStandards.forEach(s => {
                      if (!selectedStandards.includes(s)) toggleStandard(s);
                    });
                  }
                }}
              >
                {selectedStandards.length === availableStandards.length ? '✕' : '✓'}
              </Button>
            </div>
            {availableStandards.map(standard => {
              const isSelected = selectedStandards.includes(standard);
              return (
                <div
                  key={standard}
                  onClick={() => toggleStandard(standard)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleStandard(standard)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{standard}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Step 4: Modules
// ============================================================================

interface StepModulesProps {
  activeModules: string[];
  toggleModule: (module: string) => void;
}

function StepModules({ activeModules, toggleModule }: StepModulesProps) {
  const t = useTranslation();
  const moduleInfo = useModuleInfo();
  const coreModules = CORE_MODULES as readonly string[];
  const optionalModules = OPTIONAL_MODULES as readonly string[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.modules}</h2>
      </div>

      {/* Core modules */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4" /> {t.setup.coreModules}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coreModules.map(mod => {
            const info = moduleInfo[mod as keyof typeof moduleInfo];
            if (!info) return null;
            return (
              <Card key={mod} className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{info.label}</p>
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Optional modules */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t.setup.optionalModules}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {optionalModules.map(mod => {
            const info = moduleInfo[mod as keyof typeof moduleInfo];
            if (!info) return null;
            const isActive = activeModules.includes(mod);
            return (
              <Card
                key={mod}
                className={`cursor-pointer transition-all ${
                  isActive
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 border-transparent hover:border-muted-foreground/20'
                }`}
                onClick={() => toggleModule(mod)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{info.label}</p>
                    </div>
                    <Checkbox checked={isActive} onCheckedChange={() => toggleModule(mod)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step 5: Team
// ============================================================================

interface StepEquipeProps {
  teamMembers: TeamMember[];
  addTeamMember: () => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, field: 'email' | 'role', value: string) => void;
}

function StepEquipe({ teamMembers, addTeamMember, removeTeamMember, updateTeamMember }: StepEquipeProps) {
  const t = useTranslation();

  const TEAM_ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'quality_manager', label: 'Quality Manager' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'document_controller', label: 'Document Controller' },
    { value: 'executive', label: 'Executive' },
    { value: 'operator', label: 'Operator' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.team}</h2>
        <p className="text-muted-foreground mt-1">{t.setup.optionalStep}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {teamMembers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.auth.email}</TableHead>
                  <TableHead className="w-[200px]">Rôle</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                        placeholder="email@company.com"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={member.role} onValueChange={(v) => updateTeamMember(member.id, 'role', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTeamMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {teamMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">{t.common.noData}</p>
            </div>
          )}

          <Button variant="outline" onClick={addTeamMember} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> +
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Step 6: Summary
// ============================================================================

interface StepRecapitulatifProps {
  orgName: string;
  country: string;
  city: string;
  orgSize: string;
  industry: IndustryType | '';
  selectedStandards: string[];
  activeModules: string[];
  teamMembers: TeamMember[];
}

function StepRecapitulatif({ orgName, country, city, orgSize, industry, selectedStandards, activeModules, teamMembers }: StepRecapitulatifProps) {
  const t = useTranslation();
  const industryOptions = useIndustryOptions();
  const moduleInfo = useModuleInfo();

  const industryLabel = industryOptions.find(o => o.id === industry)?.label || industry;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.setup.summary}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Organisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {t.setup.organization}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.setup.companyName}</span>
              <span className="text-sm font-medium">{orgName}</span>
            </div>
            {country && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.setup.selectCountry}</span>
                <span className="text-sm font-medium">{country}</span>
              </div>
            )}
            {city && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ville / City</span>
                <span className="text-sm font-medium">{city}</span>
              </div>
            )}
            {orgSize && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.setup.companySize}</span>
                <span className="text-sm font-medium">{orgSize}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Factory className="h-4 w-4" /> {t.setup.industry}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm">{industryLabel}</Badge>
          </CardContent>
        </Card>

        {/* Standards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4" /> {t.setup.applicableStandards}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedStandards.map(standard => (
                <Badge key={standard} variant="outline" className="text-xs">{standard}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4" /> {t.setup.modules} ({activeModules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeModules.map(mod => {
                const info = moduleInfo[mod as keyof typeof moduleInfo];
                return (
                  <Badge key={mod} variant="secondary" className="text-xs">
                    {info?.label || mod}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className={teamMembers.length > 0 ? 'md:col-span-2' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> {t.setup.team}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span>{member.email || '—'}</span>
                    <Badge variant="outline" className="text-xs">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.common.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
