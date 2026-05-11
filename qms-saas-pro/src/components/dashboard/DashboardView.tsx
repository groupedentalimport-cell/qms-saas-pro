
import React from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTranslation } from '@/lib/i18n';
import { INDUSTRY_CONFIG, isIndustryType } from '@/types/qms';
import type { IndustryType } from '@/types/qms';
import {
  FileText,
  Shield,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  Package,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Upload,
  Calendar,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(280, 67%, 58%)'];

// Circular compliance gauge
function ComplianceGauge({ score, size = 140, label }: { score: number; size?: number; label: string }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  let color = 'hsl(142, 76%, 36%)'; // green
  if (score < 60) color = 'hsl(0, 84%, 60%)'; // red
  else if (score < 80) color = 'hsl(38, 92%, 50%)'; // amber

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function DashboardView() {
  const { currentUser } = useAuth();
  const { currentOrg, orgSettings } = useOrganization();
  const store = useQMSStore();
  const t = useTranslation();

  const documents = store.documents;
  const capas = store.capas;
  const ncrs = store.ncrs;
  const audits = store.audits;
  const trainingItems = store.training;
  const batchRecords = store.batchRecords;
  const suppliers = store.suppliers;
  const risks = store.risks;
  const auditTrails = store.auditTrails;

  // KPI calculations
  const openCapas = capas.filter(c => c.status !== 'Closed').length;
  const openNcrs = ncrs.filter(n => n.status !== 'Closed').length;
  const approvedDocs = documents.filter(d => d.status === 'Approved').length;
  const draftDocs = documents.filter(d => d.status === 'Draft').length;
  const inReviewDocs = documents.filter(d => d.status === 'In Review').length;
  const overdueCapas = capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()).length;
  const overdueTraining = trainingItems.filter(t => t.status === 'Overdue').length;
  const releasedBatches = batchRecords.filter(b => b.status === 'Released').length;
  const qualifiedSuppliers = suppliers.filter(s => s.status === 'Qualified').length;
  const highRisks = risks.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical').length;

  // Industry configuration
  const industryType = orgSettings?.industry_type || 'medical_device';
  const industryConfig = INDUSTRY_CONFIG[isIndustryType(industryType) ? industryType : 'medical_device'] || INDUSTRY_CONFIG.medical_device;
  const activeModules = orgSettings?.active_modules || [];
  const hasBatchRecords = activeModules.includes('batch_records');
  const isPharmaBiotech = industryType === 'pharmaceutical' || industryType === 'biotech';

  // Compliance score calculation — uses industry-specific weights
  const docCompliance = documents.length > 0 ? (approvedDocs / documents.length) * 100 : 0;
  const capaCompliance = capas.length > 0 ? (capas.filter(c => c.status === 'Closed').length / capas.length) * 100 : 100;
  const trainingCompliance = trainingItems.length > 0 ? (trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100 : 100;
  const auditCompliance = audits.length > 0 ? (audits.filter(a => a.status === 'Completed').length / audits.length) * 100 : 100;
  const ncrCompliance = ncrs.length > 0 ? (ncrs.filter(n => n.status === 'Closed').length / ncrs.length) * 100 : 100;
  const riskCompliance = risks.length > 0 ? (risks.filter(r => r.status !== 'Open').length / risks.length) * 100 : 100;
  const batchCompliance = batchRecords.length > 0 ? (releasedBatches / batchRecords.length) * 100 : 100;
  const supplierCompliance = suppliers.length > 0 ? (qualifiedSuppliers / suppliers.length) * 100 : 100;

  const w = industryConfig.complianceWeights;
  const complianceScore = Math.round(
    docCompliance * w.documents +
    capaCompliance * w.capas +
    trainingCompliance * w.training +
    auditCompliance * w.audits +
    ncrCompliance * w.ncrs +
    riskCompliance * w.risks +
    batchCompliance * w.batchRecords +
    supplierCompliance * w.suppliers
  );

  // Chart data - CAPA status distribution
  const capaStatusData = [
    { name: 'Open', value: capas.filter(c => c.status === 'Open').length },
    { name: 'Investigation', value: capas.filter(c => c.status === 'Investigation').length },
    { name: 'Implementation', value: capas.filter(c => c.status === 'Implementation').length },
    { name: 'Effectiveness', value: capas.filter(c => c.status === 'Effectiveness Check').length },
    { name: 'Closed', value: capas.filter(c => c.status === 'Closed').length },
  ].filter(d => d.value > 0);

  // Chart data - NCR by type
  const ncrTypeData = [
    { name: 'Product', count: ncrs.filter(n => n.type === 'Product').length },
    { name: 'Process', count: ncrs.filter(n => n.type === 'Process').length },
    { name: 'System', count: ncrs.filter(n => n.type === 'System').length },
    { name: 'Supplier', count: ncrs.filter(n => n.type === 'Supplier').length },
    { name: 'OOS', count: ncrs.filter(n => n.type === 'OOS').length },
  ].filter(d => d.count > 0);

  // Chart data - Risk level distribution
  const riskLevelData = [
    { name: 'Low', value: risks.filter(r => r.riskLevel === 'Low').length, color: 'hsl(142, 76%, 36%)' },
    { name: 'Medium', value: risks.filter(r => r.riskLevel === 'Medium').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'High', value: risks.filter(r => r.riskLevel === 'High').length, color: 'hsl(0, 84%, 60%)' },
    { name: 'Critical', value: risks.filter(r => r.riskLevel === 'Critical').length, color: 'hsl(280, 67%, 58%)' },
  ].filter(d => d.value > 0);

  // Monthly trend data (mock)
  const monthlyTrend = [
    { month: 'Jan', capas: 2, ncrs: 1, audits: 1 },
    { month: 'Feb', capas: 3, ncrs: 2, audits: 0 },
    { month: 'Mar', capas: 1, ncrs: 3, audits: 1 },
    { month: 'Apr', capas: 4, ncrs: 1, audits: 2 },
    { month: 'May', capas: 2, ncrs: 2, audits: 1 },
    { month: 'Jun', capas: 1, ncrs: 1, audits: 1 },
  ];

  // Recent activity from audit trail
  const recentActivity = auditTrails.slice(0, 8);

  const firstName = currentUser?.fullName?.split(' ')[0] || 'User';

  // Quick actions — adapted per industry
  const quickActions = [
    { label: t.dashboard.createCapa, icon: <Shield className="h-5 w-5" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', module: undefined },
    { label: t.dashboard.createNcr, icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', module: undefined },
    { label: t.dashboard.batchRecords, icon: <Package className="h-5 w-5" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', module: 'batch_records' as string | undefined },
    { label: t.dashboard.uploadDoc, icon: <Upload className="h-5 w-5" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', module: undefined },
    { label: t.dashboard.scheduleAudit, icon: <Calendar className="h-5 w-5" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', module: undefined },
  ].filter(action => !action.module || activeModules.includes(action.module));

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard.welcome}, {firstName}</h1>
          <p className="text-muted-foreground mt-1">
            {currentOrg?.name} — {t.dashboard.qualityDashboard}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {industryConfig.primaryStandard}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {industryConfig.label}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open CAPAs */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.openCapas}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{openCapas}</div>
              {overdueCapas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCapas} {t.dashboard.overdue}
                </Badge>
              )}
            </div>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-destructive mr-1" />
              <span className="text-destructive">+2</span>
            </div>
            <Progress value={(capas.filter(c => c.status === 'Closed').length / capas.length) * 100} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((capas.filter(c => c.status === 'Closed').length / capas.length) * 100)}% {t.dashboard.closureRate}</p>
          </CardContent>
        </Card>

        {/* Open NCRs */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.modules.ncr.title}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{openNcrs}</div>
              {ncrs.filter(n => n.severity === 'Critical').length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {ncrs.filter(n => n.severity === 'Critical').length} {t.dashboard.critical}
                </Badge>
              )}
            </div>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <ArrowDownRight className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">-1</span>
            </div>
            <Progress value={((ncrs.length - openNcrs) / ncrs.length) * 100} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(((ncrs.length - openNcrs) / ncrs.length) * 100)}% {t.dashboard.closureRate}</p>
          </CardContent>
        </Card>

        {/* Approved Documents */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.modules.documents.title}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-green-600">{approvedDocs} {t.dashboard.approved}</span>
              <span className="text-xs text-amber-600">{inReviewDocs} {t.dashboard.inReview}</span>
              <span className="text-xs text-muted-foreground">{draftDocs} {t.dashboard.drafts}</span>
            </div>
            <Progress value={(approvedDocs / documents.length) * 100} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((approvedDocs / documents.length) * 100)}% {t.dashboard.closureRate}</p>
          </CardContent>
        </Card>

        {/* Training Compliance */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.modules.training.title}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{trainingItems.length}</div>
              {overdueTraining > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueTraining} {t.dashboard.overdue}
                </Badge>
              )}
            </div>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
              {trainingItems.filter(t => t.status === 'Completed').length} {t.statuses.completed.toLowerCase()}
            </div>
            <Progress value={(trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100)}% {t.dashboard.closureRate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Compliance Score row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.complianceScore}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ComplianceGauge score={complianceScore} label={t.modules.compliance.title} />
            <div className="w-full mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.modules.documents.title} ({Math.round(w.documents * 100)}%)</span>
                <span className="font-medium">{Math.round(docCompliance)}%</span>
              </div>
              <Progress value={docCompliance} className="h-1.5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.modules.capa.title} ({Math.round(w.capas * 100)}%)</span>
                <span className="font-medium">{Math.round(capaCompliance)}%</span>
              </div>
              <Progress value={capaCompliance} className="h-1.5" />
              {hasBatchRecords && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{industryConfig.terminology.batchRecord || t.dashboard.batchRecords} ({Math.round(w.batchRecords * 100)}%)</span>
                    <span className="font-medium">{Math.round(batchCompliance)}%</span>
                  </div>
                  <Progress value={batchCompliance} className="h-1.5" />
                </>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.modules.training.title} ({Math.round(w.training * 100)}%)</span>
                <span className="font-medium">{Math.round(trainingCompliance)}%</span>
              </div>
              <Progress value={trainingCompliance} className="h-1.5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.modules.audit.title} ({Math.round(w.audits * 100)}%)</span>
                <span className="font-medium">{Math.round(auditCompliance)}%</span>
              </div>
              <Progress value={auditCompliance} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI row — industry-aware */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasBatchRecords ? 'lg:grid-cols-3' : ''} gap-4`}>
        {hasBatchRecords && (
          <Card className={isPharmaBiotech ? 'border-primary/20' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPharmaBiotech ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{industryConfig.terminology.batchRecord || t.dashboard.batchRecords}</p>
                    <p className="text-xl font-bold">{batchRecords.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">{releasedBatches} {t.dashboard.released}</p>
                  <p className="text-xs text-muted-foreground">{batchRecords.filter(b => b.status === 'In Progress').length} {t.statuses.inProgress.toLowerCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={!hasBatchRecords ? 'border-primary/20' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.activeRisks}</p>
                  <p className="text-xl font-bold">{risks.filter(r => r.status === 'Open' || r.status === 'Mitigated').length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-600 font-medium">{highRisks}</p>
                <p className="text-xs text-muted-foreground">RPN: {risks.length > 0 ? Math.round(risks.reduce((a, r) => a + r.rpn, 0) / risks.length) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.suppliers}</p>
                  <p className="text-xl font-bold">{suppliers.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">{qualifiedSuppliers} {t.dashboard.qualified}</p>
                <p className="text-xs text-muted-foreground">{suppliers.filter(s => s.performanceScore && s.performanceScore > 0).length > 0 ? Math.round(suppliers.filter(s => s.performanceScore && s.performanceScore > 0).reduce((a, s) => a + (s.performanceScore || 0), 0) / suppliers.filter(s => s.performanceScore && s.performanceScore > 0).length) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.qualityMetricsTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="capas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="CAPAs" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="ncrs" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="NCRs" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="audits" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Audits" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CAPA Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.capaStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capaStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {capaStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend className="text-xs" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NCR by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.modules.ncr.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ncrTypeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.riskProfile}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskLevelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend className="text-xs" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.dashboard.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivity.map((activity) => {
              const actionColors: Record<string, string> = {
                CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                SIGN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                LOGIN: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                EXPORT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              };

              return (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn('px-2 py-1 rounded text-xs font-medium', actionColors[activity.action] || 'bg-gray-100 text-gray-700')}>
                    {activity.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{activity.tableName}</span>
                      {activity.newValues && (
                        <span className="text-muted-foreground ml-1">
                          — {Object.entries(activity.newValues).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.userEmail} • {new Date(activity.createdAt).toLocaleDateString(localeFromT(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to get locale string for date formatting
function localeFromT(): string {
  // We can't use useI18n here since it's not a hook context
  // Default to browser locale
  if (typeof navigator !== 'undefined') {
    return navigator.language;
  }
  return 'fr-FR';
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
