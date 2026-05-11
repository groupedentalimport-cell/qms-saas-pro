
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createRisk, updateRisk } from '@/services/riskService';
import { cn, formatDate } from '@/lib/utils';
import type { Risk, RiskCategory, RiskLevel, RiskStatus } from '@/types/qms';
import {
  BarChart3, Plus, Search, Eye, AlertTriangle, Shield, ShieldCheck,
  ArrowRight, AlertCircle, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const riskLevelColors: Record<RiskLevel, string> = {
  'Low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const riskStatusColors: Record<RiskStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Mitigated': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Accepted': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Closed': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const riskCategories: RiskCategory[] = ['Product', 'Process', 'System', 'Supplier'];
const riskStatuses: RiskStatus[] = ['Open', 'Mitigated', 'Accepted', 'Closed'];
const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];

/** RPN-based risk level per spec: 1-10=Low, 11-30=Medium, 31-60=High, 61+=Critical */
function getRiskLevel(rpn: number): RiskLevel {
  if (rpn >= 61) return 'Critical';
  if (rpn >= 31) return 'High';
  if (rpn >= 11) return 'Medium';
  return 'Low';
}

/** Matrix cell color based on RPN thresholds */
function getMatrixCellColor(rpn: number): string {
  if (rpn >= 61) return 'bg-red-500/80 text-white';
  if (rpn >= 31) return 'bg-orange-400/80 text-white';
  if (rpn >= 11) return 'bg-yellow-300/80 text-gray-900';
  return 'bg-green-400/80 text-white';
}

/** Status flow: Open → Mitigated → Closed (or Open → Accepted) */
function getAvailableTransitions(current: RiskStatus): RiskStatus[] {
  switch (current) {
    case 'Open': return ['Mitigated', 'Accepted'];
    case 'Mitigated': return ['Closed'];
    case 'Accepted': return [];
    case 'Closed': return [];
    default: return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskView() {
  const { currentUser, hasPermission } = useAuth();
  const risks = useQMSStore(state => state.risks);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<RiskCategory>('Process');
  const [formProbability, setFormProbability] = useState(3);
  const [formImpact, setFormImpact] = useState(3);
  const [formDetectability, setFormDetectability] = useState(3);
  const [formMitigation, setFormMitigation] = useState('');
  const [formResidualRisk, setFormResidualRisk] = useState('');
  const [formStatus, setFormStatus] = useState<RiskStatus>('Open');

  // Computed
  const formRpn = formProbability * formImpact * formDetectability;
  const formRiskLevel = getRiskLevel(formRpn);

  // Filtered risks
  const filteredRisks = risks.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.riskNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || r.riskLevel === levelFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesLevel && matchesCategory;
  });

  // Summary counts
  const summaryCounts = useMemo(() => ({
    total: risks.length,
    highCritical: risks.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical').length,
    open: risks.filter(r => r.status === 'Open').length,
    mitigated: risks.filter(r => r.status === 'Mitigated').length,
  }), [risks]);

  // Matrix counts (probability vs impact)
  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const key = `${r.probability}-${r.impact}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [risks]);

  // Form helpers
  const resetForm = () => {
    setFormTitle('');
    setFormCategory('Process');
    setFormProbability(3);
    setFormImpact(3);
    setFormDetectability(3);
    setFormMitigation('');
    setFormResidualRisk('');
    setFormStatus('Open');
  };

  const handleCreate = () => {
    if (!formTitle.trim()) return;
    createRisk({
      riskNumber: `RISK-2024-${String(risks.length + 1).padStart(3, '0')}`,
      title: formTitle.trim(),
      category: formCategory,
      probability: formProbability,
      impact: formImpact,
      detectability: formDetectability,
      rpn: formRpn,
      riskLevel: formRiskLevel,
      mitigation: formMitigation.trim() || undefined,
      residualRisk: formResidualRisk.trim() || undefined,
      status: formStatus,
      organizationId: 'org-001',
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const openDetail = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowDetailDialog(true);
  };

  const handleStatusAdvance = (risk: Risk, newStatus: RiskStatus) => {
    updateRisk(risk.id, { status: newStatus });
    if (selectedRisk?.id === risk.id) {
      setSelectedRisk({ ...risk, status: newStatus });
    }
  };

  // Probability/Impact labels for display
  const probLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
  const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Risk Management
          </h1>
          <p className="text-muted-foreground mt-1">Risk assessment and management (ISO 14971)</p>
        </div>
        {hasPermission('risk.create') && (
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Risk
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Risks</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">High / Critical</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{summaryCounts.highCritical}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{summaryCounts.open}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Mitigated</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.mitigated}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: List + Matrix */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Risk Register</TabsTrigger>
          <TabsTrigger value="matrix">RPN Risk Matrix</TabsTrigger>
        </TabsList>

        {/* ─── Risk Register Tab ─── */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search risks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {riskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {riskLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {riskCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Risk #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                      <TableHead className="w-[50px]">P</TableHead>
                      <TableHead className="w-[50px]">I</TableHead>
                      <TableHead className="w-[50px]">D</TableHead>
                      <TableHead className="w-[70px]">RPN</TableHead>
                      <TableHead className="w-[100px]">Risk Level</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRisks.map(risk => (
                      <TableRow key={risk.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(risk)}>
                        <TableCell className="font-mono text-xs">{risk.riskNumber}</TableCell>
                        <TableCell><p className="font-medium truncate max-w-xs">{risk.title}</p></TableCell>
                        <TableCell><Badge variant="outline">{risk.category}</Badge></TableCell>
                        <TableCell className="text-center font-mono">{risk.probability}</TableCell>
                        <TableCell className="text-center font-mono">{risk.impact}</TableCell>
                        <TableCell className="text-center font-mono">{risk.detectability}</TableCell>
                        <TableCell className="text-center font-bold">{risk.rpn}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', riskLevelColors[risk.riskLevel])} variant="secondary">{risk.riskLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', riskStatusColors[risk.status])} variant="secondary">{risk.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(risk); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRisks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No risks found matching filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Risk Matrix Tab ─── */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RPN Risk Matrix — Probability (1-5) × Impact (1-5)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cell values show P×I base score. Counts indicate how many risks occupy each cell.
                Risk level is determined by full RPN (P × I × D).
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                {/* Y-axis label */}
                <div className="text-sm text-muted-foreground -rotate-90 whitespace-nowrap font-medium mb-20">
                  Probability →
                </div>

                <div>
                  {/* Impact header row */}
                  <div className="grid grid-cols-5 gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={`h-${i}`} className="text-xs text-center text-muted-foreground w-[72px]">
                        <div className="font-medium">Impact {i}</div>
                        <div className="text-[10px]">{impactLabels[i - 1]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Matrix rows (probability 5 down to 1) */}
                  {[5, 4, 3, 2, 1].map(p => (
                    <div key={p} className="grid grid-cols-5 gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => {
                        const count = matrixCounts[`${p}-${i}`] || 0;
                        const baseRpn = p * i;
                        const cellLevel = getRiskLevel(baseRpn * 3); // use median detectability=3 for cell color
                        return (
                          <div
                            key={`${p}-${i}`}
                            className={cn(
                              'w-[72px] h-[72px] rounded-md flex flex-col items-center justify-center text-xs font-medium cursor-default',
                              getMatrixCellColor(baseRpn * 3)
                            )}
                          >
                            <span className="font-bold">{baseRpn}</span>
                            {count > 0 && (
                              <span className="text-[10px] opacity-90 mt-0.5">({count} risk{count > 1 ? 's' : ''})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* X-axis label */}
                  <div className="text-xs text-center text-muted-foreground mt-2 font-medium">Impact →</div>
                </div>

                {/* Probability row labels */}
                <div className="flex flex-col justify-around mb-6">
                  {[5, 4, 3, 2, 1].map(p => (
                    <div key={`pl-${p}`} className="h-[72px] flex items-center">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-medium">P{p}</span>
                        <span className="text-[10px] ml-1">{probLabels[p - 1]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-400/80" /> Low (RPN 1-10)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-300/80" /> Medium (RPN 11-30)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-400/80" /> High (RPN 31-60)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/80" /> Critical (RPN 61+)</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Create Risk Dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Risk</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Risk title" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as RiskCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {riskCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as RiskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {riskStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* P / I / D selectors */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Probability (1-5)</Label>
                <Select value={String(formProbability)} onValueChange={(v) => setFormProbability(Number(v))}>
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
                <Select value={String(formImpact)} onValueChange={(v) => setFormImpact(Number(v))}>
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
                <Select value={String(formDetectability)} onValueChange={(v) => setFormDetectability(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => (
                      <SelectItem key={v} value={String(v)}>{v} — {v === 1 ? 'Very Detectable' : v === 5 ? 'Undetectable' : `Level ${v}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RPN preview */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
              <div>
                <span className="text-sm text-muted-foreground">RPN:</span>
                <span className="text-xl font-bold ml-2">{formRpn}</span>
              </div>
              <Badge className={cn('text-xs', riskLevelColors[formRiskLevel])} variant="secondary">{formRiskLevel}</Badge>
              <div className="text-xs text-muted-foreground">(P × I × D = {formProbability} × {formImpact} × {formDetectability})</div>
            </div>

            <div className="grid gap-2">
              <Label>Mitigation</Label>
              <Textarea value={formMitigation} onChange={(e) => setFormMitigation(e.target.value)} placeholder="Risk mitigation plan..." rows={3} />
            </div>

            <div className="grid gap-2">
              <Label>Residual Risk</Label>
              <Textarea value={formResidualRisk} onChange={(e) => setFormResidualRisk(e.target.value)} placeholder="Residual risk after mitigation..." rows={2} />
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={!formTitle.trim()}>
              Create Risk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedRisk && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedRisk.riskNumber}</span>
                  {selectedRisk.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(riskLevelColors[selectedRisk.riskLevel])} variant="secondary">{selectedRisk.riskLevel} Risk</Badge>
                  <Badge className={cn(riskStatusColors[selectedRisk.status])} variant="secondary">{selectedRisk.status}</Badge>
                  {selectedRisk.category && <Badge variant="outline">{selectedRisk.category}</Badge>}
                </div>

                {/* Status flow visualization */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {(['Open', 'Mitigated', 'Closed'] as RiskStatus[]).map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedRisk.status ? 'bg-primary text-primary-foreground' :
                        (s === 'Open' && selectedRisk.status !== 'Open') ||
                        (s === 'Mitigated' && selectedRisk.status === 'Closed') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                  {selectedRisk.status === 'Accepted' && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mx-1" />
                      <div className="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Accepted
                      </div>
                    </>
                  )}
                </div>

                {/* RPN Breakdown */}
                <div className="grid grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-3 pb-3 text-center">
                      <div className="text-xs text-muted-foreground">Probability</div>
                      <div className="text-xl font-bold">{selectedRisk.probability}</div>
                      <div className="text-[10px] text-muted-foreground">{probLabels[selectedRisk.probability - 1]}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3 text-center">
                      <div className="text-xs text-muted-foreground">Impact</div>
                      <div className="text-xl font-bold">{selectedRisk.impact}</div>
                      <div className="text-[10px] text-muted-foreground">{impactLabels[selectedRisk.impact - 1]}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3 text-center">
                      <div className="text-xs text-muted-foreground">Detectability</div>
                      <div className="text-xl font-bold">{selectedRisk.detectability}</div>
                      <div className="text-[10px] text-muted-foreground">{selectedRisk.detectability === 1 ? 'Very Detectable' : selectedRisk.detectability === 5 ? 'Undetectable' : `Level ${selectedRisk.detectability}`}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3 text-center">
                      <div className="text-xs text-muted-foreground">RPN</div>
                      <div className="text-xl font-bold">{selectedRisk.rpn}</div>
                      <div className="text-[10px] text-muted-foreground">P×I×D</div>
                    </CardContent>
                  </Card>
                </div>

                {/* RPN formula */}
                <div className="p-3 bg-muted/30 rounded-md text-sm">
                  <span className="text-muted-foreground">RPN Calculation: </span>
                  <span className="font-mono font-medium">{selectedRisk.probability} × {selectedRisk.impact} × {selectedRisk.detectability} = {selectedRisk.rpn}</span>
                  <span className="text-muted-foreground ml-2">→ </span>
                  <Badge className={cn('text-xs ml-1', riskLevelColors[selectedRisk.riskLevel])} variant="secondary">{selectedRisk.riskLevel}</Badge>
                </div>

                {/* Risk Matrix Position (highlighted) */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Matrix Position</h4>
                  <div className="inline-block">
                    <div className="grid grid-cols-5 gap-0.5">
                      {/* Impact header */}
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={`dh-${i}`} className="text-[10px] text-center text-muted-foreground pb-0.5 w-10">I{i}</div>
                      ))}
                      {/* Rows */}
                      {[5, 4, 3, 2, 1].map(p => (
                        <React.Fragment key={`drow-${p}`}>
                          {[1, 2, 3, 4, 5].map(i => {
                            const isHighlighted = selectedRisk.probability === p && selectedRisk.impact === i;
                            return (
                              <div
                                key={`d-${p}-${i}`}
                                className={cn(
                                  'w-10 h-10 rounded flex items-center justify-center text-[10px] font-medium',
                                  isHighlighted
                                    ? 'ring-2 ring-primary ring-offset-1 ' + getMatrixCellColor(p * i * selectedRisk.detectability)
                                    : getMatrixCellColor(p * i * 3)
                                )}
                              >
                                {isHighlighted ? <span className="font-bold">{selectedRisk.rpn}</span> : p * i}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mitigation & Residual Risk */}
                {selectedRisk.mitigation && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Mitigation</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedRisk.mitigation}</p>
                  </div>
                )}
                {selectedRisk.residualRisk && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Residual Risk</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedRisk.residualRisk}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{formatDate(selectedRisk.createdAt)}</span></div>
                  <div><span className="text-muted-foreground">Updated:</span> <span className="font-medium ml-1">{formatDate(selectedRisk.updatedAt)}</span></div>
                </div>

                {/* Status Advancement Buttons */}
                {hasPermission('risk.update') && getAvailableTransitions(selectedRisk.status).length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {getAvailableTransitions(selectedRisk.status).map(nextStatus => (
                      <Button
                        key={nextStatus}
                        className="flex-1"
                        variant={nextStatus === 'Accepted' ? 'outline' : 'default'}
                        onClick={() => handleStatusAdvance(selectedRisk, nextStatus)}
                      >
                        {nextStatus === 'Mitigated' && <ShieldCheck className="h-4 w-4 mr-2" />}
                        {nextStatus === 'Accepted' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {nextStatus === 'Closed' && <XCircle className="h-4 w-4 mr-2" />}
                        Mark as {nextStatus}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
