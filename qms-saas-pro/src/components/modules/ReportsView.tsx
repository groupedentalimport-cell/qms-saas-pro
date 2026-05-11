
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatDate } from '@/lib/utils';
import {
  BarChart3,
  Shield,
  AlertTriangle,
  GraduationCap,
  ClipboardCheck,
  Target,
  FileText,
  Truck,
  Package,
  LayoutDashboard,
  Download,
  Eye,
  X,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = [
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(217, 91%, 60%)',
  'hsl(280, 67%, 58%)',
  'hsl(173, 58%, 39%)',
];

const CHART_COLORS = {
  green: 'hsl(142, 76%, 36%)',
  amber: 'hsl(38, 92%, 50%)',
  red: 'hsl(0, 84%, 60%)',
  blue: 'hsl(217, 91%, 60%)',
  purple: 'hsl(280, 67%, 58%)',
  teal: 'hsl(173, 58%, 39%)',
};

// ---------------------------------------------------------------------------
// Report Template type
// ---------------------------------------------------------------------------

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'capa-summary',
    title: 'CAPA Summary Report',
    description: 'CAPA statistics, aging analysis, and closure rates',
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    category: 'CAPA',
  },
  {
    id: 'ncr-trend',
    title: 'NCR Trend Report',
    description: 'NCR trends by type, severity, and resolution time',
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    category: 'NCR',
  },
  {
    id: 'training-compliance',
    title: 'Training Compliance Report',
    description: 'Training completion rates and overdue training items',
    icon: <GraduationCap className="h-6 w-6" />,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    category: 'Training',
  },
  {
    id: 'audit-findings',
    title: 'Audit Findings Report',
    description: 'Audit findings summary and open findings tracking',
    icon: <ClipboardCheck className="h-6 w-6" />,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    category: 'Audit',
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment Report',
    description: 'Risk profile overview and RPN distribution analysis',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    category: 'Risk',
  },
  {
    id: 'document-status',
    title: 'Document Status Report',
    description: 'Document lifecycle status and approval metrics',
    icon: <FileText className="h-6 w-6" />,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    category: 'Documents',
  },
  {
    id: 'supplier-performance',
    title: 'Supplier Performance Report',
    description: 'Supplier scores, qualification status, and review metrics',
    icon: <Truck className="h-6 w-6" />,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    category: 'Supplier',
  },
  {
    id: 'batch-release',
    title: 'Batch Release Report',
    description: 'Batch status overview and release metrics',
    icon: <Package className="h-6 w-6" />,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    category: 'Batch',
  },
  {
    id: 'management-review',
    title: 'Management Review Report',
    description: 'Comprehensive QMS overview for management review',
    icon: <LayoutDashboard className="h-6 w-6" />,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    category: 'Management',
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportsView() {
  const store = useQMSStore();
  const { hasPermission } = useAuth();

  const documents = store.documents;
  const capas = store.capas;
  const ncrs = store.ncrs;
  const audits = store.audits;
  const trainingItems = store.training;
  const risks = store.risks;
  const batchRecords = store.batchRecords;
  const suppliers = store.suppliers;

  const [previewReport, setPreviewReport] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('12m');

  // -------------------------------------------------------------------------
  // Dashboard Metrics Summary
  // -------------------------------------------------------------------------

  const totalRecords = documents.length + capas.length + ncrs.length + audits.length + trainingItems.length + risks.length;
  const overdueItems = useMemo(() => {
    const overdueCapas = capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()).length;
    const overdueTraining = trainingItems.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length;
    const overdueAudits = audits.filter(a => a.status !== 'Completed' && new Date(a.scheduledDate) < new Date()).length;
    return overdueCapas + overdueTraining + overdueAudits;
  }, [capas, trainingItems, audits]);

  const compliancePct = Math.round(
    ((documents.filter(d => d.status === 'Approved').length +
      capas.filter(c => c.status === 'Closed').length +
      ncrs.filter(n => n.status === 'Closed').length +
      audits.filter(a => a.status === 'Completed').length +
      trainingItems.filter(t => t.status === 'Completed').length) /
      Math.max(totalRecords, 1)) * 100
  );

  const openItems = capas.filter(c => c.status !== 'Closed').length +
    ncrs.filter(n => n.status !== 'Closed').length +
    audits.filter(a => a.status !== 'Completed').length +
    trainingItems.filter(t => t.status !== 'Completed').length;

  const closedItems = capas.filter(c => c.status === 'Closed').length +
    ncrs.filter(n => n.status === 'Closed').length +
    audits.filter(a => a.status === 'Completed').length +
    trainingItems.filter(t => t.status === 'Completed').length;

  // -------------------------------------------------------------------------
  // Report-specific data computations
  // -------------------------------------------------------------------------

  // CAPA data
  const capaByStatus = useMemo(() => [
    { name: 'Open', value: capas.filter(c => c.status === 'Open').length },
    { name: 'Investigation', value: capas.filter(c => c.status === 'Investigation').length },
    { name: 'Implementation', value: capas.filter(c => c.status === 'Implementation').length },
    { name: 'Effectiveness', value: capas.filter(c => c.status === 'Effectiveness Check').length },
    { name: 'Closed', value: capas.filter(c => c.status === 'Closed').length },
  ].filter(d => d.value > 0), [capas]);

  const capaByPriority = useMemo(() => [
    { name: 'Critical', count: capas.filter(c => c.priority === 'Critical').length },
    { name: 'High', count: capas.filter(c => c.priority === 'High').length },
    { name: 'Medium', count: capas.filter(c => c.priority === 'Medium').length },
    { name: 'Low', count: capas.filter(c => c.priority === 'Low').length },
  ].filter(d => d.count > 0), [capas]);

  const capaAging = useMemo(() => {
    const now = new Date();
    const ranges = [
      { name: '< 30d', min: 0, max: 30 },
      { name: '30-60d', min: 30, max: 60 },
      { name: '60-90d', min: 60, max: 90 },
      { name: '> 90d', min: 90, max: Infinity },
    ];
    return ranges.map(r => ({
      name: r.name,
      count: capas.filter(c => {
        if (c.status === 'Closed') return false;
        const days = Math.floor((now.getTime() - new Date(c.createdDate).getTime()) / (1000 * 60 * 60 * 24));
        return days >= r.min && days < r.max;
      }).length,
    }));
  }, [capas]);

  // NCR data
  const ncrByType = useMemo(() => [
    { name: 'Product', value: ncrs.filter(n => n.type === 'Product').length },
    { name: 'Process', value: ncrs.filter(n => n.type === 'Process').length },
    { name: 'System', value: ncrs.filter(n => n.type === 'System').length },
    { name: 'Supplier', value: ncrs.filter(n => n.type === 'Supplier').length },
    { name: 'OOS', value: ncrs.filter(n => n.type === 'OOS').length },
    { name: 'OOT', value: ncrs.filter(n => n.type === 'OOT').length },
  ].filter(d => d.value > 0), [ncrs]);

  const ncrBySeverity = useMemo(() => [
    { name: 'Critical', count: ncrs.filter(n => n.severity === 'Critical').length, fill: CHART_COLORS.red },
    { name: 'Major', count: ncrs.filter(n => n.severity === 'Major').length, fill: CHART_COLORS.amber },
    { name: 'Minor', count: ncrs.filter(n => n.severity === 'Minor').length, fill: CHART_COLORS.green },
  ], [ncrs]);

  const ncrByStatus = useMemo(() => [
    { name: 'Open', count: ncrs.filter(n => n.status === 'Open').length },
    { name: 'Under Investigation', count: ncrs.filter(n => n.status === 'Under Investigation').length },
    { name: 'Pending Disposition', count: ncrs.filter(n => n.status === 'Pending Disposition').length },
    { name: 'Closed', count: ncrs.filter(n => n.status === 'Closed').length },
  ], [ncrs]);

  // Training data
  const trainingByStatus = useMemo(() => [
    { name: 'Planned', value: trainingItems.filter(t => t.status === 'Planned').length },
    { name: 'In Progress', value: trainingItems.filter(t => t.status === 'In Progress').length },
    { name: 'Completed', value: trainingItems.filter(t => t.status === 'Completed').length },
    { name: 'Overdue', value: trainingItems.filter(t => t.status === 'Overdue' || (t.status !== 'Completed' && new Date(t.dueDate) < new Date())).length },
  ].filter(d => d.value > 0), [trainingItems]);

  const trainingByType = useMemo(() => [
    { name: 'Onboarding', count: trainingItems.filter(t => t.type === 'Onboarding').length },
    { name: 'SOP', count: trainingItems.filter(t => t.type === 'SOP').length },
    { name: 'Regulatory', count: trainingItems.filter(t => t.type === 'Regulatory').length },
    { name: 'Skill', count: trainingItems.filter(t => t.type === 'Skill').length },
    { name: 'Certification', count: trainingItems.filter(t => t.type === 'Certification').length },
  ].filter(d => d.count > 0), [trainingItems]);

  // Audit data
  const auditFindingsBySeverity = useMemo(() => {
    const allFindings = audits.flatMap(a => a.findings || []);
    return [
      { name: 'Critical', count: allFindings.filter(f => f.severity === 'Critical').length },
      { name: 'Major', count: allFindings.filter(f => f.severity === 'Major').length },
      { name: 'Minor', count: allFindings.filter(f => f.severity === 'Minor').length },
      { name: 'Observation', count: allFindings.filter(f => f.severity === 'Observation').length },
    ].filter(d => d.count > 0);
  }, [audits]);

  // Risk data
  const riskByLevel = useMemo(() => [
    { name: 'Low', value: risks.filter(r => r.riskLevel === 'Low').length, color: CHART_COLORS.green },
    { name: 'Medium', value: risks.filter(r => r.riskLevel === 'Medium').length, color: CHART_COLORS.amber },
    { name: 'High', value: risks.filter(r => r.riskLevel === 'High').length, color: CHART_COLORS.red },
    { name: 'Critical', value: risks.filter(r => r.riskLevel === 'Critical').length, color: CHART_COLORS.purple },
  ].filter(d => d.value > 0), [risks]);

  const rpnDistribution = useMemo(() => {
    const ranges = [
      { name: '1-10', min: 1, max: 11 },
      { name: '11-30', min: 11, max: 31 },
      { name: '31-60', min: 31, max: 61 },
      { name: '61-125', min: 61, max: 126 },
    ];
    return ranges.map(r => ({
      name: r.name,
      count: risks.filter(risk => risk.rpn >= r.min && risk.rpn < r.max).length,
    }));
  }, [risks]);

  // Document data
  const docByStatus = useMemo(() => [
    { name: 'Draft', value: documents.filter(d => d.status === 'Draft').length },
    { name: 'In Review', value: documents.filter(d => d.status === 'In Review').length },
    { name: 'Approved', value: documents.filter(d => d.status === 'Approved').length },
    { name: 'Obsolete', value: documents.filter(d => d.status === 'Obsolete').length },
  ].filter(d => d.value > 0), [documents]);

  const docByType = useMemo(() => {
    const types = new Set(documents.map(d => d.type));
    return Array.from(types).map(t => ({
      name: t,
      count: documents.filter(d => d.type === t).length,
    })).sort((a, b) => b.count - a.count);
  }, [documents]);

  // Supplier data
  const supplierByStatus = useMemo(() => [
    { name: 'Qualified', value: suppliers.filter(s => s.status === 'Qualified').length },
    { name: 'Conditional', value: suppliers.filter(s => s.status === 'Conditional').length },
    { name: 'Disqualified', value: suppliers.filter(s => s.status === 'Disqualified').length },
    { name: 'Under Evaluation', value: suppliers.filter(s => s.status === 'Under Evaluation').length },
  ].filter(d => d.value > 0), [suppliers]);

  const supplierPerformance = useMemo(() =>
    suppliers.filter(s => s.performanceScore !== undefined && s.performanceScore !== null).map(s => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + '…' : s.name,
      score: s.performanceScore || 0,
    })).sort((a, b) => b.score - a.score)
  , [suppliers]);

  // Batch data
  const batchByStatus = useMemo(() => [
    { name: 'In Progress', count: batchRecords.filter(b => b.status === 'In Progress').length },
    { name: 'Pending QA', count: batchRecords.filter(b => b.status === 'Pending QA Review').length },
    { name: 'Released', count: batchRecords.filter(b => b.status === 'Released').length },
    { name: 'Rejected', count: batchRecords.filter(b => b.status === 'Rejected').length },
    { name: 'Quarantine', count: batchRecords.filter(b => b.status === 'Quarantine').length },
  ], [batchRecords]);

  // -------------------------------------------------------------------------
  // Export handler (simulated)
  // -------------------------------------------------------------------------

  const handleExport = (reportId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === reportId);
    if (!template) return;

    let csvContent = '';
    switch (reportId) {
      case 'capa-summary':
        csvContent = [
          ['CAPA #', 'Title', 'Type', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created'].join(','),
          ...capas.map(c => [c.capaNumber, `"${c.title}"`, c.type, c.status, c.priority || '', c.assignedTo, formatDate(c.dueDate, true), formatDate(c.createdDate, true)].join(','))
        ].join('\n');
        break;
      case 'ncr-trend':
        csvContent = [
          ['NCR #', 'Title', 'Type', 'Severity', 'Status', 'Disposition', 'Created'].join(','),
          ...ncrs.map(n => [n.ncrNumber, `"${n.title}"`, n.type, n.severity || '', n.status, n.disposition || '', formatDate(n.createdDate, true)].join(','))
        ].join('\n');
        break;
      case 'training-compliance':
        csvContent = [
          ['Title', 'Type', 'Assigned To', 'Status', 'Due Date', 'Completed'].join(','),
          ...trainingItems.map(t => [`"${t.title}"`, t.type, t.assignedTo, t.status, formatDate(t.dueDate, true), t.completedDate ? formatDate(t.completedDate, true) : ''].join(','))
        ].join('\n');
        break;
      case 'audit-findings':
        csvContent = [
          ['Audit #', 'Title', 'Type', 'Status', 'Findings', 'Scheduled'].join(','),
          ...audits.map(a => [a.auditNumber, `"${a.title}"`, a.type, a.status, String(a.findings?.length || 0), formatDate(a.scheduledDate, true)].join(','))
        ].join('\n');
        break;
      case 'risk-assessment':
        csvContent = [
          ['Risk #', 'Title', 'Category', 'P', 'I', 'D', 'RPN', 'Level', 'Status'].join(','),
          ...risks.map(r => [r.riskNumber, `"${r.title}"`, r.category || '', r.probability, r.impact, r.detectability, r.rpn, r.riskLevel, r.status].join(','))
        ].join('\n');
        break;
      case 'document-status':
        csvContent = [
          ['Doc #', 'Title', 'Type', 'Status', 'Version', 'Owner'].join(','),
          ...documents.map(d => [d.documentNumber, `"${d.title}"`, d.type, d.status, d.version, d.owner || ''].join(','))
        ].join('\n');
        break;
      case 'supplier-performance':
        csvContent = [
          ['Code', 'Name', 'Category', 'Status', 'Score'].join(','),
          ...suppliers.map(s => [s.supplierCode, `"${s.name}"`, s.category || '', s.status, String(s.performanceScore || 0)].join(','))
        ].join('\n');
        break;
      case 'batch-release':
        csvContent = [
          ['Lot #', 'Product', 'Status', 'Mfg Date', 'Expiry'].join(','),
          ...batchRecords.map(b => [b.lotNumber, `"${b.productName}"`, b.status, formatDate(b.manufacturingDate, true), b.expiryDate ? formatDate(b.expiryDate, true) : ''].join(','))
        ].join('\n');
        break;
      default:
        csvContent = 'Report export not available';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportId}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------------------
  // Permission check
  // -------------------------------------------------------------------------

  if (!hasPermission('reports.view')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">Access Restricted</h3>
            <p className="text-muted-foreground text-sm mt-1">You do not have permission to view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />Reports &amp; Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Quality metrics, dashboards, and analytics</p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Dashboard Metrics Summary                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRecords}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{overdueItems}</p>
                <p className="text-xs text-muted-foreground">Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{compliancePct}%</p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  <span className="text-green-600">{closedItems}</span>
                  <span className="text-muted-foreground text-sm font-normal">/</span>
                  <span className="text-red-600">{openItems}</span>
                </p>
                <p className="text-xs text-muted-foreground">Closed / Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Report Templates                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Report Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2.5 rounded-lg shrink-0', template.color)}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{template.title}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">{template.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => setPreviewReport(template.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />Generate
                      </Button>
                      {hasPermission('reports.export') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleExport(template.id)}
                        >
                          <Download className="h-3 w-3 mr-1" />Export
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Report Preview Dialog                                             */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {REPORT_TEMPLATES.find(t => t.id === previewReport)?.icon}
                {REPORT_TEMPLATES.find(t => t.id === previewReport)?.title || 'Report'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="12m">Last 12 Months</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                {hasPermission('reports.export') && previewReport && (
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleExport(previewReport)}>
                    <Download className="h-3 w-3 mr-1" />Export CSV
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated on {formatDate(new Date().toISOString())} &middot; Data period: {periodFilter === 'all' ? 'All Time' : `Last ${periodFilter.replace('m', ' Months')}`}
            </p>
          </DialogHeader>

          <Separator />

          {/* CAPA Summary Report */}
          {previewReport === 'capa-summary' && (
            <div className="space-y-6">
              {/* Key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{capas.length}</p>
                  <p className="text-xs text-muted-foreground">Total CAPAs</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{capas.filter(c => c.status === 'Closed').length}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{capas.length > 0 ? Math.round((capas.filter(c => c.status === 'Closed').length / capas.length) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Closure Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()).length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">CAPA by Status</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={capaByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {capaByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">CAPA by Priority</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={capaByPriority}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Aging chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">CAPA Aging (Open)</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capaAging}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} name="Open CAPAs" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div>
                <h4 className="text-sm font-medium mb-2">CAPA Details</h4>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">CAPA #</TableHead>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Priority</TableHead>
                        <TableHead className="text-xs">Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {capas.slice(0, 10).map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">{c.capaNumber}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{c.title}</TableCell>
                          <TableCell className="text-xs">{c.type}</TableCell>
                          <TableCell className="text-xs">{c.status}</TableCell>
                          <TableCell className="text-xs">{c.priority || '-'}</TableCell>
                          <TableCell className="text-xs">{formatDate(c.dueDate, true)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* NCR Trend Report */}
          {previewReport === 'ncr-trend' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{ncrs.length}</p>
                  <p className="text-xs text-muted-foreground">Total NCRs</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{ncrs.filter(n => n.status === 'Closed').length}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{ncrs.length > 0 ? Math.round((ncrs.filter(n => n.status === 'Closed').length / ncrs.length) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Resolution Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{ncrs.filter(n => n.severity === 'Critical').length}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">NCR by Type</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ncrByType} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {ncrByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">NCR by Severity</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ncrBySeverity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                          {ncrBySeverity.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">NCR by Status</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ncrByStatus}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} name="NCRs" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Training Compliance Report */}
          {previewReport === 'training-compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{trainingItems.length}</p>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{trainingItems.filter(t => t.status === 'Completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{trainingItems.length > 0 ? Math.round((trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{trainingItems.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Training by Status</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={trainingByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {trainingByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Training by Type</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trainingByType}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Overdue Training</h4>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Assigned To</TableHead>
                        <TableHead className="text-xs">Due Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingItems.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).slice(0, 10).map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{t.title}</TableCell>
                          <TableCell className="text-xs">{t.type}</TableCell>
                          <TableCell className="text-xs">{t.assignedTo}</TableCell>
                          <TableCell className="text-xs text-red-600">{formatDate(t.dueDate, true)}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Audit Findings Report */}
          {previewReport === 'audit-findings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{audits.length}</p>
                  <p className="text-xs text-muted-foreground">Total Audits</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{audits.filter(a => a.status === 'Completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{audits.flatMap(a => a.findings || []).length}</p>
                  <p className="text-xs text-muted-foreground">Total Findings</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{audits.flatMap(a => a.findings || []).filter(f => f.correctiveActionRequired).length}</p>
                  <p className="text-xs text-muted-foreground">CAR Required</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Findings by Severity</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={auditFindingsBySeverity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="Findings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Audit Details</h4>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Audit #</TableHead>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Findings</TableHead>
                        <TableHead className="text-xs">Scheduled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audits.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">{a.auditNumber}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{a.title}</TableCell>
                          <TableCell className="text-xs">{a.type}</TableCell>
                          <TableCell className="text-xs">{a.status}</TableCell>
                          <TableCell className="text-xs">{a.findings?.length || 0}</TableCell>
                          <TableCell className="text-xs">{formatDate(a.scheduledDate, true)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment Report */}
          {previewReport === 'risk-assessment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{risks.length}</p>
                  <p className="text-xs text-muted-foreground">Total Risks</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{risks.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical').length}</p>
                  <p className="text-xs text-muted-foreground">High / Critical</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{risks.length > 0 ? Math.round(risks.reduce((a, r) => a + r.rpn, 0) / risks.length) : 0}</p>
                  <p className="text-xs text-muted-foreground">Avg RPN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{risks.filter(r => r.status === 'Closed' || r.status === 'Mitigated').length}</p>
                  <p className="text-xs text-muted-foreground">Mitigated/Closed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Risk by Level</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskByLevel} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {riskByLevel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">RPN Distribution</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rpnDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} name="Risks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Status Report */}
          {previewReport === 'document-status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{documents.filter(d => d.status === 'Approved').length}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-amber-600">{documents.filter(d => d.status === 'In Review').length}</p>
                  <p className="text-xs text-muted-foreground">In Review</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{documents.filter(d => d.status === 'Obsolete').length}</p>
                  <p className="text-xs text-muted-foreground">Obsolete</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Document by Status</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={docByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {docByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Document by Type</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={docByType}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" angle={-20} textAnchor="end" height={50} />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} name="Documents" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supplier Performance Report */}
          {previewReport === 'supplier-performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{suppliers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Suppliers</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{suppliers.filter(s => s.status === 'Qualified').length}</p>
                  <p className="text-xs text-muted-foreground">Qualified</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-red-600">{suppliers.filter(s => s.status === 'Disqualified').length}</p>
                  <p className="text-xs text-muted-foreground">Disqualified</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">
                    {suppliers.filter(s => s.performanceScore && s.performanceScore > 0).length > 0
                      ? Math.round(suppliers.filter(s => s.performanceScore && s.performanceScore > 0).reduce((a, s) => a + (s.performanceScore || 0), 0) / suppliers.filter(s => s.performanceScore && s.performanceScore > 0).length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Supplier by Status</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={supplierByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                          {supplierByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Performance Scores</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supplierPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                        <Tooltip />
                        <Bar dataKey="score" fill={CHART_COLORS.purple} radius={[0, 4, 4, 0]} name="Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch Release Report */}
          {previewReport === 'batch-release' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{batchRecords.length}</p>
                  <p className="text-xs text-muted-foreground">Total Batches</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{batchRecords.filter(b => b.status === 'Released').length}</p>
                  <p className="text-xs text-muted-foreground">Released</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-amber-600">{batchRecords.filter(b => b.status === 'Pending QA Review').length}</p>
                  <p className="text-xs text-muted-foreground">Pending QA</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{batchRecords.length > 0 ? Math.round((batchRecords.filter(b => b.status === 'Released').length / batchRecords.length) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Release Rate</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Batch by Status</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchByStatus}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} name="Batches" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Batch Details</h4>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Lot #</TableHead>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Mfg Date</TableHead>
                        <TableHead className="text-xs">Expiry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchRecords.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">{b.lotNumber}</TableCell>
                          <TableCell className="text-xs">{b.productName}</TableCell>
                          <TableCell className="text-xs">{b.status}</TableCell>
                          <TableCell className="text-xs">{formatDate(b.manufacturingDate, true)}</TableCell>
                          <TableCell className="text-xs">{b.expiryDate ? formatDate(b.expiryDate, true) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Management Review Report */}
          {previewReport === 'management-review' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border bg-muted/10">
                <h4 className="text-sm font-semibold mb-2">Management Review Summary</h4>
                <p className="text-xs text-muted-foreground">
                  This comprehensive QMS overview aggregates key quality indicators for management review
                  as required by ISO 13485:2016 §5.6.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{documents.filter(d => d.status === 'Approved').length}/{documents.length}</p>
                  <p className="text-xs text-muted-foreground">Docs Approved</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-green-600">{capas.filter(c => c.status === 'Closed').length}/{capas.length}</p>
                  <p className="text-xs text-muted-foreground">CAPAs Closed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{ncrs.filter(n => n.status === 'Closed').length}/{ncrs.length}</p>
                  <p className="text-xs text-muted-foreground">NCRs Closed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-amber-600">{overdueItems}</p>
                  <p className="text-xs text-muted-foreground">Overdue Items</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">CAPA Status</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={capaByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                          {capaByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Risk Level Distribution</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskByLevel} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                          {riskByLevel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend className="text-xs" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Training Compliance</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trainingByType}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Document Status</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={docByType.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" angle={-20} textAnchor="end" height={50} />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} name="Documents" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary table */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Performance Indicators</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Area</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                      <TableHead className="text-xs">Completed/Closed</TableHead>
                      <TableHead className="text-xs">Rate</TableHead>
                      <TableHead className="text-xs">Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Documents</TableCell>
                      <TableCell className="text-xs">{documents.length}</TableCell>
                      <TableCell className="text-xs">{documents.filter(d => d.status === 'Approved').length}</TableCell>
                      <TableCell className="text-xs">{documents.length > 0 ? Math.round((documents.filter(d => d.status === 'Approved').length / documents.length) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs">{documents.filter(d => d.status === 'Draft').length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">CAPAs</TableCell>
                      <TableCell className="text-xs">{capas.length}</TableCell>
                      <TableCell className="text-xs">{capas.filter(c => c.status === 'Closed').length}</TableCell>
                      <TableCell className="text-xs">{capas.length > 0 ? Math.round((capas.filter(c => c.status === 'Closed').length / capas.length) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs text-red-600">{capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()).length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">NCRs</TableCell>
                      <TableCell className="text-xs">{ncrs.length}</TableCell>
                      <TableCell className="text-xs">{ncrs.filter(n => n.status === 'Closed').length}</TableCell>
                      <TableCell className="text-xs">{ncrs.length > 0 ? Math.round((ncrs.filter(n => n.status === 'Closed').length / ncrs.length) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Audits</TableCell>
                      <TableCell className="text-xs">{audits.length}</TableCell>
                      <TableCell className="text-xs">{audits.filter(a => a.status === 'Completed').length}</TableCell>
                      <TableCell className="text-xs">{audits.length > 0 ? Math.round((audits.filter(a => a.status === 'Completed').length / audits.length) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs text-red-600">{audits.filter(a => a.status !== 'Completed' && new Date(a.scheduledDate) < new Date()).length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Training</TableCell>
                      <TableCell className="text-xs">{trainingItems.length}</TableCell>
                      <TableCell className="text-xs">{trainingItems.filter(t => t.status === 'Completed').length}</TableCell>
                      <TableCell className="text-xs">{trainingItems.length > 0 ? Math.round((trainingItems.filter(t => t.status === 'Completed').length / trainingItems.length) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs text-red-600">{trainingItems.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
