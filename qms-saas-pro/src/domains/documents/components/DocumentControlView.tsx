
import React, { useState } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, updateDocument } from '@/services/documentService';
import type { Document, DocumentType, DocumentStatus, DocumentLevel, DocumentClassification, SignatureType, ElectronicSignature } from '@/types/qms';
import { ElectronicSignatureModal } from '@/components/shared/ElectronicSignatureModal';
import { cn, formatDate } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  ShieldCheck,
  GitBranch,
  Layers,
  History,
  Link2,
  Sparkles,
  Save,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const statusColors: Record<DocumentStatus, string> = {
  'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Obsolete': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const levelLabels: Record<DocumentLevel, string> = {
  1: 'N1 — Policy',
  2: 'N2 — SOP',
  3: 'N3 — WI',
  4: 'N4 — Form/Record',
};

const levelShortLabels: Record<DocumentLevel, string> = {
  1: 'N1',
  2: 'N2',
  3: 'N3',
  4: 'N4',
};

const levelColors: Record<DocumentLevel, string> = {
  1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  2: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  3: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  4: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const levelDescriptions: Record<DocumentLevel, string> = {
  1: 'Top-level governance documents (Quality Policy, etc.). No parent required. Governs N2 SOPs.',
  2: 'Standard Operating Procedures. Must reference an N1 parent. Governs N3 WIs.',
  3: 'Work Instructions with step-by-step details. Must reference an N2 parent. Governs N4 Forms.',
  4: 'Forms & Records that capture objective evidence. Must reference an N3 parent. Generates record instances subject to validation workflow.',
};

const classificationLabels: Record<DocumentClassification, string> = {
  'Internal': 'Interne',
  'External': 'Externe',
  'Regulatory': 'Réglementaire',
  'Confidential': 'Confidentiel',
};

const statusFlow: DocumentStatus[] = ['Draft', 'In Review', 'Approved', 'Obsolete'];

function getNextStatus(current: DocumentStatus): DocumentStatus | null {
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

const documentTypes: DocumentType[] = ['SOP', 'WI', 'Form', 'Policy', 'Specification', 'Technical', 'Risk Analysis', 'Validation Protocol', 'Record'];
const documentStatuses: DocumentStatus[] = ['Draft', 'In Review', 'Approved', 'Obsolete'];
const documentClassifications: DocumentClassification[] = ['Internal', 'External', 'Regulatory', 'Confidential'];
const documentLevels: DocumentLevel[] = [1, 2, 3, 4];

// ═══════════════════════════════════════════════════════════════
// Document Form Component (shared between Create & Edit)
// ═══════════════════════════════════════════════════════════════

interface DocumentFormProps {
  editDocument?: Document | null;
  onSave: (data: {
    documentNumber: string;
    title: string;
    type: DocumentType;
    description: string;
    department: string;
    classification: DocumentClassification;
    documentLevel: DocumentLevel;
    scope: string;
    retentionPeriod: string;
    parentDocumentId: string;
    references: string;
    // N1 specific
    n1RegulatoryFramework?: string;
    // N4 specific
    n4GeneratesRecords?: boolean;
    n4RecordLifecycle?: string;
    n4RecordTemplateName?: string;
    n4AutoNumbering?: string;
    n4DataIntegrity?: string;
  }) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function DocumentForm({ editDocument, onSave, onCancel, isEdit = false }: DocumentFormProps) {
  const documents = useQMSStore(s => s.documents);
  const { currentUser } = useAuth();

  // Form state
  const [formDocNumber, setFormDocNumber] = useState(editDocument?.documentNumber ?? '');
  const [formTitle, setFormTitle] = useState(editDocument?.title ?? '');
  const [formType, setFormType] = useState<DocumentType>(editDocument?.type ?? 'SOP');
  const [formDescription, setFormDescription] = useState(editDocument?.description ?? '');
  const [formDepartment, setFormDepartment] = useState(editDocument?.department ?? '');
  const [formClassification, setFormClassification] = useState<DocumentClassification>(editDocument?.classification ?? 'Internal');
  const [formLevel, setFormLevel] = useState<DocumentLevel>(editDocument?.documentLevel ?? 2);
  const [formScope, setFormScope] = useState(editDocument?.scope ?? '');
  const [formRetentionPeriod, setFormRetentionPeriod] = useState(editDocument?.retentionPeriod ?? '');
  const [formParentDocId, setFormParentDocId] = useState(editDocument?.parentDocumentId ?? '');
  const [formReferences, setFormReferences] = useState(editDocument?.references ?? '');

  // N1 specific
  const [formN1RegulatoryFramework, setFormN1RegulatoryFramework] = useState('');

  // N4 specific
  const [formN4GeneratesRecords, setFormN4GeneratesRecords] = useState(false);
  const [formN4RecordLifecycle, setFormN4RecordLifecycle] = useState('');
  const [formN4RecordTemplateName, setFormN4RecordTemplateName] = useState('');
  const [formN4AutoNumbering, setFormN4AutoNumbering] = useState('');
  const [formN4DataIntegrity, setFormN4DataIntegrity] = useState('');

  // Section collapse state
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    identification: true,
    scope: true,
    hierarchy: true,
    n1specific: true,
    n4specific: true,
  });

  const toggleSection = (id: string) => {
    setSectionOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isFormValid = formDocNumber.trim() !== '' && formTitle.trim() !== '';

  const handleSave = (status: 'Draft' | 'In Review') => {
    onSave({
      documentNumber: formDocNumber.trim(),
      title: formTitle.trim(),
      type: formType,
      description: formDescription.trim(),
      department: formDepartment.trim(),
      classification: formClassification,
      documentLevel: formLevel,
      scope: formScope.trim(),
      retentionPeriod: formRetentionPeriod.trim(),
      parentDocumentId: formParentDocId || '',
      references: formReferences.trim(),
      n1RegulatoryFramework: formN1RegulatoryFramework,
      n4GeneratesRecords: formN4GeneratesRecords,
      n4RecordLifecycle: formN4RecordLifecycle,
      n4RecordTemplateName: formN4RecordTemplateName,
      n4AutoNumbering: formN4AutoNumbering,
      n4DataIntegrity: formN4DataIntegrity,
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Level indicator ── */}
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border', levelColors[formLevel])}>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-white/50 dark:bg-black/20')}>
          N{formLevel}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{levelLabels[formLevel]}</p>
          <p className="text-xs opacity-80 mt-0.5">{levelDescriptions[formLevel]}</p>
        </div>
        {formLevel === 4 && (
          <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-0 text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Record Template
          </Badge>
        )}
      </div>

      {/* ══════ Section 1: Document Identification ══════ */}
      <Collapsible open={sectionOpen.identification} onOpenChange={() => toggleSection('identification')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <CheckCircle2 className={cn('h-4 w-4 shrink-0', formDocNumber && formTitle ? 'text-green-600' : 'text-muted-foreground/30')} />
            <span className="text-sm font-medium flex-1">1. Document Identification / Identification du document</span>
            <Badge variant="outline" className="text-[10px]">ISO 13485 4.2.3(a)</Badge>
            {sectionOpen.identification ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4 border-x border-b rounded-b-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Document Number * / Numero de document *</Label>
                <Input value={formDocNumber} onChange={(e) => setFormDocNumber(e.target.value)} placeholder="SOP-QMS-XXX" />
                <p className="text-[11px] text-muted-foreground">Enter the document number following your naming convention</p>
              </div>
              <div className="grid gap-2">
                <Label>Type * / Type *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as DocumentType)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Title * / Titre *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Document title" />
            </div>
            <div className="grid gap-2">
              <Label>Description / Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Document description" rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Classification</Label>
                <Select value={formClassification} onValueChange={(v) => setFormClassification(v as DocumentClassification)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {documentClassifications.map(c => (
                      <SelectItem key={c} value={c}>{classificationLabels[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Document Level * / Niveau *</Label>
                <Select value={String(formLevel)} onValueChange={(v) => setFormLevel(Number(v) as DocumentLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {documentLevels.map(l => (
                      <SelectItem key={l} value={String(l)}>{levelLabels[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department / Departement</Label>
                <Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} placeholder="Quality, Production..." />
              </div>
            </div>
            {isEdit && editDocument && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">Version <Lock className="h-3 w-3 text-muted-foreground" /></Label>
                  <Input value={editDocument.version} disabled className="bg-muted" />
                  <p className="text-[11px] text-muted-foreground">Version is managed through revision history</p>
                </div>
                <div className="grid gap-2">
                  <Label>Retention Period / Periode de conservation</Label>
                  <Input value={formRetentionPeriod} onChange={(e) => setFormRetentionPeriod(e.target.value)} placeholder="e.g. 5 years" />
                </div>
              </div>
            )}
            {!isEdit && (
              <div className="grid gap-2">
                <Label>Retention Period / Periode de conservation</Label>
                <Input value={formRetentionPeriod} onChange={(e) => setFormRetentionPeriod(e.target.value)} placeholder="e.g. 5 years, 15 years..." />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ══════ Section 2: Scope & Description ══════ */}
      <Collapsible open={sectionOpen.scope} onOpenChange={() => toggleSection('scope')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <CheckCircle2 className={cn('h-4 w-4 shrink-0', formScope ? 'text-green-600' : 'text-muted-foreground/30')} />
            <span className="text-sm font-medium flex-1">2. Scope / Périmètre d'application</span>
            <Badge variant="outline" className="text-[10px]">ISO 13485 4.2.3(b)</Badge>
            {sectionOpen.scope ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4 border-x border-b rounded-b-lg">
            <div className="grid gap-2">
              <Label>Scope / Périmètre</Label>
              <Textarea value={formScope} onChange={(e) => setFormScope(e.target.value)} placeholder="What is covered? Which sites, processes, products are in scope?" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>References / References</Label>
              <Textarea value={formReferences} onChange={(e) => setFormReferences(e.target.value)} placeholder="External references, regulatory standards, linked documents..." rows={2} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ══════ Section 3: Hierarchy ══════ */}
      <Collapsible open={sectionOpen.hierarchy} onOpenChange={() => toggleSection('hierarchy')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1">3. Document Hierarchy / Hiérarchie</span>
            <Badge variant="outline" className="text-[10px]">ISO 13485 4.2.3</Badge>
            {sectionOpen.hierarchy ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4 border-x border-b rounded-b-lg">
            {/* N1 = no parent required */}
            {formLevel === 1 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <Layers className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">N1 — Top-Level Document</p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/60">N1 policies do not require a parent document. They govern N2 SOPs.</p>
                </div>
              </div>
            )}
            {/* N2-N4 = parent required */}
            {formLevel > 1 && (
              <div className="grid gap-2">
                <Label>Parent Document * / Document parent *</Label>
                <Select value={formParentDocId} onValueChange={setFormParentDocId}>
                  <SelectTrigger><SelectValue placeholder="Select parent document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {documents.filter(d => d.status === 'Approved').map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2">
                          <Badge className={cn('text-[9px] px-1', levelColors[d.documentLevel || 1])} variant="secondary">
                            N{d.documentLevel || 1}
                          </Badge>
                          {d.documentNumber} — {d.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {formLevel === 2 && 'N2 SOPs must reference an N1 Policy parent'}
                  {formLevel === 3 && 'N3 WIs must reference an N2 SOP parent'}
                  {formLevel === 4 && 'N4 Forms/Records must reference an N3 WI parent'}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ══════ Section 4: N1-Specific — Regulatory Framework ══════ */}
      {formLevel === 1 && (
        <Collapsible open={sectionOpen.n1specific} onOpenChange={() => toggleSection('n1specific')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors text-left">
              <ShieldCheck className="h-4 w-4 text-purple-500 shrink-0" />
              <span className="text-sm font-medium flex-1">4. N1 — Regulatory Framework / Référentiel réglementaire</span>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 text-[10px]">N1 only</Badge>
              {sectionOpen.n1specific ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-4 space-y-4 border-x border-b border-purple-200 dark:border-purple-800 rounded-b-lg">
              <div className="grid gap-2">
                <Label>Regulatory Framework / Référentiel réglementaire</Label>
                <Textarea
                  value={formN1RegulatoryFramework}
                  onChange={(e) => setFormN1RegulatoryFramework(e.target.value)}
                  placeholder="ISO 13485:2016, FDA 21 CFR 820, EU MDR 2017/745, ICH Q10..."
                  rows={3}
                />
                <p className="text-[11px] text-muted-foreground">N1: Identify all regulatory frameworks this policy maps to</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">N1 policies require Management Review per ISO 13485 clause 5.6</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ══════ Section 4: N4-Specific — Record Template ══════ */}
      {formLevel === 4 && (
        <Collapsible open={sectionOpen.n4specific} onOpenChange={() => toggleSection('n4specific')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors text-left">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium flex-1">4. N4 — Record Template / Template d'enregistrement</span>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">N4 only</Badge>
              {sectionOpen.n4specific ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-4 space-y-4 border-x border-b border-amber-200 dark:border-amber-800 rounded-b-lg">
              {/* Info banner */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">N4 Record Template</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Upon approval, this N4 form generates record instances. Each instance follows its own
                    validation workflow (Draft → Review → Approved) with electronic signatures per 21 CFR Part 11.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="n4-generates-records"
                  checked={formN4GeneratesRecords}
                  onCheckedChange={(v) => setFormN4GeneratesRecords(Boolean(v))}
                />
                <Label htmlFor="n4-generates-records" className="text-sm font-normal cursor-pointer">
                  This form generates records (instances) / Ce formulaire génère des enregistrements
                </Label>
              </div>

              {formN4GeneratesRecords && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Record Lifecycle / Cycle de vie</Label>
                      <Select value={formN4RecordLifecycle} onValueChange={setFormN4RecordLifecycle}>
                        <SelectTrigger><SelectValue placeholder="Select lifecycle..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft-review-approved">Draft → Review → Approved → Archived</SelectItem>
                          <SelectItem value="draft-qa-approved">Draft → QA Review → Approved → Archived</SelectItem>
                          <SelectItem value="draft-dual-approved">Draft → Dual Review → Approved → Archived</SelectItem>
                          <SelectItem value="immediate-esig">Immediate (auto-approved with e-signature)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Record Template Name / Nom du template</Label>
                      <Input
                        value={formN4RecordTemplateName}
                        onChange={(e) => setFormN4RecordTemplateName(e.target.value)}
                        placeholder="e.g. BATCH-RECORD, INSPECTION-REPORT"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Auto-Numbering Format</Label>
                      <Input
                        value={formN4AutoNumbering}
                        onChange={(e) => setFormN4AutoNumbering(e.target.value)}
                        placeholder="REC-{YYYY}-{NNN}"
                      />
                      <p className="text-[11px] text-muted-foreground">Use {'{YYYY}'} for year, {'{NNN}'} for sequential number</p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data Integrity (ALCOA+)</Label>
                      <Select value={formN4DataIntegrity} onValueChange={setFormN4DataIntegrity}>
                        <SelectTrigger><SelectValue placeholder="Select compliance level..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-alcoa">Full ALCOA+ (all 9 principles)</SelectItem>
                          <SelectItem value="alcoa-core">ALCOA Core (5 principles)</SelectItem>
                          <SelectItem value="basic">Basic (Attributable, Legible, Accurate)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ══════ Action Buttons ══════ */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel / Annuler
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('Draft')} disabled={!isFormValid} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isEdit ? 'Save Changes' : 'Save Draft'}
          </Button>
          <Button onClick={() => handleSave('In Review')} disabled={!isFormValid} className="gap-1.5">
            <ArrowRight className="h-4 w-4" />
            {isEdit ? 'Save & Submit' : 'Create & Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Document Control View
// ═══════════════════════════════════════════════════════════════

export function DocumentControlView() {
  const { currentUser, hasPermission } = useAuth();
  const documents = useQMSStore(state => state.documents);
  const profiles = useQMSStore(state => state.profiles);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Dialogs
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingStatusAdvance, setPendingStatusAdvance] = useState<Document | null>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || String(doc.documentLevel) === levelFilter;
    return matchesSearch && matchesType && matchesStatus && matchesLevel;
  });

  const getUserName = (userId?: string) => {
    if (!userId) return '-';
    const profile = profiles.find(p => p.id === userId);
    return profile?.fullName || profile?.email || userId;
  };

  const getParentDocument = (parentId?: string) => {
    if (!parentId) return null;
    return documents.find(d => d.id === parentId) || null;
  };

  const getChildDocuments = (docId: string) => {
    return documents.filter(d => d.parentDocumentId === docId);
  };

  // ── Create document ──
  const handleCreate = (data: any) => {
    createDocument({
      documentNumber: data.documentNumber,
      title: data.title,
      type: data.type,
      version: '1.0',
      status: 'Draft',
      description: data.description || undefined,
      department: data.department || undefined,
      classification: data.classification,
      documentLevel: data.documentLevel,
      scope: data.scope || undefined,
      retentionPeriod: data.retentionPeriod || undefined,
      parentDocumentId: data.parentDocumentId || undefined,
      references: data.references || undefined,
      owner: currentUser?.fullName || currentUser?.email,
      createdById: currentUser?.id,
      authorId: currentUser?.id,
      organizationId: 'org-001',
      signatures: [],
    });
    setShowNewDocDialog(false);
  };

  // ── Edit document (only Draft status) ──
  const handleEdit = (data: any) => {
    if (!editDoc) return;
    updateDocument(editDoc.id, {
      documentNumber: data.documentNumber,
      title: data.title,
      type: data.type,
      description: data.description || undefined,
      department: data.department || undefined,
      classification: data.classification,
      documentLevel: data.documentLevel,
      scope: data.scope || undefined,
      retentionPeriod: data.retentionPeriod || undefined,
      parentDocumentId: data.parentDocumentId || undefined,
      references: data.references || undefined,
    });
    setShowEditDialog(false);
    setEditDoc(null);
    // Refresh detail if open
    if (selectedDoc?.id === editDoc.id) {
      setSelectedDoc({
        ...editDoc,
        documentNumber: data.documentNumber,
        title: data.title,
        type: data.type,
        description: data.description,
        department: data.department,
        classification: data.classification,
        documentLevel: data.documentLevel,
        scope: data.scope,
        retentionPeriod: data.retentionPeriod,
        parentDocumentId: data.parentDocumentId || undefined,
        references: data.references,
      });
    }
  };

  // ── Open edit dialog for Draft docs ──
  const openEdit = (doc: Document) => {
    setEditDoc(doc);
    setShowEditDialog(true);
  };

  // Open detail dialog
  const openDetail = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDetailDialog(true);
  };

  // Status advancement
  const handleAdvanceStatus = (doc: Document) => {
    const next = getNextStatus(doc.status);
    if (!next) return;

    // If advancing to Approved, require electronic signature
    if (next === 'Approved') {
      setPendingStatusAdvance(doc);
      setShowSignatureModal(true);
      return;
    }

    // For other status transitions, just update directly
    updateDocument(doc.id, {
      status: next,
      effectiveDate: undefined,
      lastReviewed: next === 'In Review' ? new Date().toISOString() : undefined,
    });

    if (selectedDoc?.id === doc.id) {
      setSelectedDoc({
        ...doc,
        status: next,
        effectiveDate: doc.effectiveDate,
        lastReviewed: next === 'In Review' ? new Date().toISOString() : doc.lastReviewed,
      });
    }
  };

  // Electronic signature callback
  const handleSignatureConfirm = (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => {
    if (!pendingStatusAdvance) return;

    const doc = pendingStatusAdvance;
    const newSignature: ElectronicSignature = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      documentId: doc.id,
      signedById: currentUser?.id || 'unknown',
      signerName: currentUser?.fullName || currentUser?.email || 'Unknown',
      signerRole: 'Approver',
      signatureType: signatureData.signatureType,
      signatureHash: signatureData.signatureHash,
      revoked: false,
      createdAt: signatureData.signedAt,
    };

    const existingSignatures = doc.signatures || [];
    updateDocument(doc.id, {
      status: 'Approved',
      effectiveDate: new Date().toISOString(),
      signatures: [...existingSignatures, newSignature],
    });

    if (selectedDoc?.id === doc.id) {
      setSelectedDoc({
        ...doc,
        status: 'Approved',
        effectiveDate: new Date().toISOString(),
        signatures: [...existingSignatures, newSignature],
      });
    }

    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  const handleSignatureCancel = () => {
    setPendingStatusAdvance(null);
    setShowSignatureModal(false);
  };

  // Summary counts
  const summaryCounts = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'Approved').length,
    inReview: documents.filter(d => d.status === 'In Review').length,
    draft: documents.filter(d => d.status === 'Draft').length,
    obsolete: documents.filter(d => d.status === 'Obsolete').length,
    n1: documents.filter(d => d.documentLevel === 1).length,
    n2: documents.filter(d => d.documentLevel === 2).length,
    n3: documents.filter(d => d.documentLevel === 3).length,
    n4: documents.filter(d => d.documentLevel === 4).length,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Document Control
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des documents qualité / Quality Document Management</p>
        </div>
        {hasPermission('documents.create') && (
          <Button onClick={() => setShowNewDocDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        )}
      </div>

      {/* Summary cards — status + level */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{summaryCounts.approved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">In Review</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{summaryCounts.inReview}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">Draft</span>
            </div>
            <span className="text-2xl font-bold text-gray-600">{summaryCounts.draft}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Obsolete</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{summaryCounts.obsolete}</span>
          </CardContent>
        </Card>
        {/* Level cards — clickable to filter */}
        <Card className="cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all" onClick={() => setLevelFilter(levelFilter === '1' ? 'all' : '1')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5', levelColors[1])} variant="secondary">N1</Badge>
              <span className="text-xs text-muted-foreground">Policy</span>
            </div>
            <span className="text-2xl font-bold text-purple-600">{summaryCounts.n1}</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-teal-300 transition-all" onClick={() => setLevelFilter(levelFilter === '2' ? 'all' : '2')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5', levelColors[2])} variant="secondary">N2</Badge>
              <span className="text-xs text-muted-foreground">SOP</span>
            </div>
            <span className="text-2xl font-bold text-teal-600">{summaryCounts.n2}</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-cyan-300 transition-all" onClick={() => setLevelFilter(levelFilter === '3' ? 'all' : '3')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5', levelColors[3])} variant="secondary">N3</Badge>
              <span className="text-xs text-muted-foreground">WI</span>
            </div>
            <span className="text-2xl font-bold text-cyan-600">{summaryCounts.n3}</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all" onClick={() => setLevelFilter(levelFilter === '4' ? 'all' : '4')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5', levelColors[4])} variant="secondary">N4</Badge>
              <span className="text-xs text-muted-foreground">Form/Rec</span>
            </div>
            <span className="text-2xl font-bold">{summaryCounts.n4}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {documentLevels.map(l => (
              <SelectItem key={l} value={String(l)}>{levelLabels[l]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {documentStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Doc Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[80px]">Level</TableHead>
                  <TableHead className="w-[90px]">Type</TableHead>
                  <TableHead className="w-[70px]">Version</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[120px]">Department</TableHead>
                  <TableHead className="w-[100px]">Effective</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => {
                  const childDocs = getChildDocuments(doc.id);
                  const parentDoc = getParentDocument(doc.parentDocumentId);
                  return (
                    <TableRow key={doc.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(doc)}>
                      <TableCell className="font-mono text-xs">{doc.documentNumber}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {doc.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{doc.description}</p>
                            )}
                          </div>
                          {(parentDoc || childDocs.length > 0) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                              {parentDoc && (
                                <span className="text-xs text-muted-foreground">↑ {parentDoc.documentNumber}</span>
                              )}
                              {childDocs.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {parentDoc ? ' · ' : ''}↓ {childDocs.length}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.documentLevel && (
                          <Badge className={cn('text-xs font-mono', levelColors[doc.documentLevel])} variant="secondary">
                            {levelShortLabels[doc.documentLevel]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <History className="h-3 w-3 text-muted-foreground" />
                          {doc.version}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', statusColors[doc.status])} variant="secondary">
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.department || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.effectiveDate, true)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(doc); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {/* ✅ FIX: Edit opens edit form for Draft documents */}
                            {hasPermission('documents.update') && doc.status === 'Draft' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(doc); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Document
                              </DropdownMenuItem>
                            )}
                            {hasPermission('documents.approve') && getNextStatus(doc.status) && doc.status !== 'Obsolete' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(doc); }}>
                                  {getNextStatus(doc.status) === 'Approved' ? (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                  ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                  )}
                                  Advance to {getNextStatus(doc.status)}
                                </DropdownMenuItem>
                              </>
                            )}
                            {hasPermission('documents.delete') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDocs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No documents found matching filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ══════ Create Document Dialog ══════ */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Document / Nouveau Document
            </DialogTitle>
          </DialogHeader>
          <DocumentForm
            onSave={handleCreate}
            onCancel={() => setShowNewDocDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ══════ Edit Document Dialog (Draft only) ══════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Document / Modifier le document
              {editDoc && (
                <Badge variant="outline" className="font-mono text-xs ml-2">{editDoc.documentNumber}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm
            editDocument={editDoc}
            onSave={handleEdit}
            onCancel={() => { setShowEditDialog(false); setEditDoc(null); }}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedDoc.documentNumber}</span>
                  {selectedDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Level Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedDoc.status])} variant="secondary">{selectedDoc.status}</Badge>
                  <Badge variant="outline">{selectedDoc.type}</Badge>
                  {selectedDoc.documentLevel && (
                    <Badge className={cn(levelColors[selectedDoc.documentLevel])} variant="secondary">
                      <Layers className="h-3 w-3 mr-1" />
                      {levelLabels[selectedDoc.documentLevel]}
                    </Badge>
                  )}
                  {selectedDoc.classification && (
                    <Badge variant="outline">{classificationLabels[selectedDoc.classification]}</Badge>
                  )}
                  <Badge variant="outline" className="font-mono">
                    <History className="h-3 w-3 mr-1" />
                    v{selectedDoc.version}
                  </Badge>
                </div>

                {/* Status Flow */}
                <div className="flex items-center gap-1 p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  {statusFlow.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        s === selectedDoc.status ? 'bg-primary text-primary-foreground' :
                        statusFlow.indexOf(s) < statusFlow.indexOf(selectedDoc.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s}
                      </div>
                      {i < statusFlow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Document Number:</span>{' '}
                    <span className="font-mono font-medium">{selectedDoc.documentNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>{' '}
                    <span className="font-medium">{selectedDoc.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span className="font-medium">{selectedDoc.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{' '}
                    <span className="font-medium">{selectedDoc.department || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Classification:</span>{' '}
                    <span className="font-medium">{selectedDoc.classification ? classificationLabels[selectedDoc.classification] : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retention:</span>{' '}
                    <span className="font-medium">{selectedDoc.retentionPeriod || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Owner:</span>{' '}
                    <span className="font-medium">{selectedDoc.owner || getUserName(selectedDoc.createdById)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created By:</span>{' '}
                    <span className="font-medium">{getUserName(selectedDoc.createdById)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedDoc.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    <span className="font-medium">{formatDate(selectedDoc.updatedAt)}</span>
                  </div>
                  {selectedDoc.effectiveDate && (
                    <div>
                      <span className="text-muted-foreground">Effective Date:</span>{' '}
                      <span className="font-medium">{formatDate(selectedDoc.effectiveDate)}</span>
                    </div>
                  )}
                  {selectedDoc.lastReviewed && (
                    <div>
                      <span className="text-muted-foreground">Last Reviewed:</span>{' '}
                      <span className="font-medium">{formatDate(selectedDoc.lastReviewed)}</span>
                    </div>
                  )}
                  {selectedDoc.nextReview && (
                    <div>
                      <span className="text-muted-foreground">Next Review:</span>{' '}
                      <span className="font-medium">{formatDate(selectedDoc.nextReview)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                {selectedDoc.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedDoc.description}</p>
                  </div>
                )}

                {/* Scope */}
                {selectedDoc.scope && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Scope / Périmètre</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedDoc.scope}</p>
                  </div>
                )}

                {/* References */}
                {selectedDoc.references && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">References</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedDoc.references}</p>
                  </div>
                )}

                {/* Parent/Child Document Links */}
                {(getParentDocument(selectedDoc.parentDocumentId) || getChildDocuments(selectedDoc.id).length > 0) && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <GitBranch className="h-4 w-4" />
                      Document Hierarchy / Hiérarchie des documents
                    </h4>
                    <div className="bg-muted/30 p-3 rounded-md space-y-2">
                      {getParentDocument(selectedDoc.parentDocumentId) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Parent:</span>
                          <Badge variant="outline" className="font-mono text-xs cursor-pointer" onClick={() => openDetail(getParentDocument(selectedDoc.parentDocumentId)!)}>
                            ↑ {getParentDocument(selectedDoc.parentDocumentId)!.documentNumber}
                          </Badge>
                          <span className="text-muted-foreground truncate">{getParentDocument(selectedDoc.parentDocumentId)!.title}</span>
                        </div>
                      )}
                      {getChildDocuments(selectedDoc.id).length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Child documents:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getChildDocuments(selectedDoc.id).map(child => (
                              <Badge key={child.id} variant="outline" className="font-mono text-xs cursor-pointer" onClick={() => openDetail(child)}>
                                ↓ {child.documentNumber}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Electronic Signatures */}
                {selectedDoc.signatures && selectedDoc.signatures.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      Electronic Signatures / Signatures électroniques
                    </h4>
                    <div className="space-y-2">
                      {selectedDoc.signatures.map((sig) => (
                        <div key={sig.id} className="bg-muted/30 p-3 rounded-md flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-green-500" />
                              <span className="font-medium">{sig.signerName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{sig.signatureType}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground font-mono">{sig.signatureHash.substring(0, 20)}...</span>
                            <span className="text-xs text-muted-foreground">{formatDate(sig.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* ✅ FIX: Edit button for Draft documents in detail view */}
                  {hasPermission('documents.update') && selectedDoc.status === 'Draft' && (
                    <Button variant="outline" className="flex-1" onClick={() => {
                      setShowDetailDialog(false);
                      openEdit(selectedDoc);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Document / Modifier
                    </Button>
                  )}
                  {hasPermission('documents.approve') && getNextStatus(selectedDoc.status) && selectedDoc.status !== 'Obsolete' && (
                    <Button className="flex-1" onClick={() => handleAdvanceStatus(selectedDoc)}>
                      {getNextStatus(selectedDoc.status) === 'Approved' ? (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Approve with E-Signature
                        </>
                      ) : (
                        <>
                          Advance to {getNextStatus(selectedDoc.status)}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal */}
      <ElectronicSignatureModal
        open={showSignatureModal}
        onClose={handleSignatureCancel}
        onSign={handleSignatureConfirm}
        recordTitle={pendingStatusAdvance ? `${pendingStatusAdvance.documentNumber} — ${pendingStatusAdvance.title}` : ''}
        recordId={pendingStatusAdvance?.id || ''}
        signatureType="approval"
      />
    </div>
  );
}
