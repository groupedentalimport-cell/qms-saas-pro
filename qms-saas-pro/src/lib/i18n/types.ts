export type Locale = 'en' | 'fr';

export interface TranslationStrings {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    loading: string;
    noData: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;
    status: string;
    actions: string;
    details: string;
    date: string;
    description: string;
    title: string;
    type: string;
    priority: string;
    assignedTo: string;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    owner: string;
    department: string;
  };
  // Navigation
  nav: {
    dashboard: string;
    documents: string;
    documentHierarchy: string;
    capa: string;
    ncr: string;
    audits: string;
    risks: string;
    training: string;
    changeControl: string;
    deviations: string;
    batchRecords: string;
    suppliers: string;
    oosOot: string;
    forms: string;
    reports: string;
    compliance: string;
    userManagement: string;
    settings: string;
    records: string;
    governance: string;
  };
  // Dashboard
  dashboard: {
    welcome: string;
    qualityDashboard: string;
    openCapas: string;
    overdue: string;
    critical: string;
    approved: string;
    inReview: string;
    drafts: string;
    closureRate: string;
    createCapa: string;
    createNcr: string;
    uploadDoc: string;
    scheduleAudit: string;
    complianceScore: string;
    quickActions: string;
    batchRecords: string;
    activeRisks: string;
    suppliers: string;
    released: string;
    qualified: string;
    qualityMetricsTrend: string;
    capaStatus: string;
    riskProfile: string;
    recentActivity: string;
  };
  // Setup
  setup: {
    organization: string;
    industry: string;
    standards: string;
    modules: string;
    team: string;
    summary: string;
    selectCountry: string;
    coreModules: string;
    optionalModules: string;
    applicableStandards: string;
    previous: string;
    next: string;
    cancel: string;
    launch: string;
    optionalStep: string;
    selected: string;
    companyName: string;
    companySize: string;
  };
  // Industries
  industries: {
    medicalDevice: string;
    pharmaceutical: string;
    biotech: string;
    ivd: string;
    combinationProduct: string;
  };
  // Document statuses
  statuses: {
    draft: string;
    inReview: string;
    approved: string;
    obsolete: string;
    open: string;
    investigation: string;
    implementation: string;
    effectivenessCheck: string;
    closed: string;
    planned: string;
    inProgress: string;
    completed: string;
    overdue: string;
    mitigated: string;
    accepted: string;
    qualified: string;
    conditional: string;
    disqualified: string;
    underEvaluation: string;
    released: string;
    rejected: string;
    quarantine: string;
    pending: string;
    submitted: string;
    locked: string;
  };
  // Modules specific labels
  modules: {
    documents: { title: string; documentNumber: string; effectiveDate: string; expirationDate: string; classification: string; retentionPeriod: string; };
    capa: { title: string; capaNumber: string; rootCause: string; correctiveAction: string; effectiveness: string; source: string; };
    ncr: { title: string; ncrNumber: string; severity: string; disposition: string; lotNumber: string; };
    training: { title: string; assignedTo: string; completedDate: string; };
    risk: { title: string; riskNumber: string; probability: string; impact: string; detectability: string; rpn: string; riskLevel: string; mitigation: string; };
    audit: { title: string; auditNumber: string; leadAuditor: string; findings: string; scheduledDate: string; };
    batch: { title: string; lotNumber: string; productName: string; manufacturingDate: string; expiryDate: string; qaRelease: string; };
    supplier: { title: string; supplierCode: string; qualificationDate: string; performanceScore: string; };
    changeControl: { title: string; ccNumber: string; justification: string; proposedChange: string; };
    deviation: { title: string; devNumber: string; deviationDetails: string; };
    compliance: { title: string; overallCompliance: string; compliant: string; partiallyCompliant: string; nonCompliant: string; notAssessed: string; gaps: string; };
    reports: { title: string; generate: string; export: string; };
  };
  // Auth
  auth: {
    login: string;
    logout: string;
    switchUser: string;
    demoMode: string;
    email: string;
    password: string;
    signIn: string;
  };
}
