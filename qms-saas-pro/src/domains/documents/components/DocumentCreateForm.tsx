'use client';

/**
 * DocumentCreateForm.tsx
 * ────────────────────────
 * Rich form for creating/editing documents using RichFormRenderer.
 * The document level (N1-N4) selection dynamically shows/hides sections.
 * N4 documents generate record instances subject to validation workflow.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, updateDocument } from '@/services/documentService';
import { RichFormRenderer } from '@/components/shared/RichFormRenderer';
import { DOCUMENT_FORM_TEMPLATE } from '@/lib/templates/document-form-template';
import type { Document, DocumentType, DocumentLevel, DocumentClassification } from '@/types/qms';
import {
  FileText, Layers, ArrowRight, ShieldCheck, Sparkles,
  ChevronRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ── Level selector visual config ──
const levelConfig: Record<number, {
  label: string;
  labelFr: string;
  description: string;
  color: string;
  borderColor: string;
  icon: typeof Layers;
}> = {
  1: {
    label: 'N1 — Policy',
    labelFr: 'N1 — Politique',
    description: 'Top-level governance documents defining strategic direction, quality policy, and regulatory framework mapping. No parent document required. Governs N2 SOPs.',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
    icon: Layers,
  },
  2: {
    label: 'N2 — SOP',
    labelFr: 'N2 — Procedure',
    description: 'Standard Operating Procedures defining how processes are executed. Must reference an N1 parent policy. Includes procedural steps, definitions, and responsibilities.',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    borderColor: 'border-teal-300 dark:border-teal-700',
    icon: FileText,
  },
  3: {
    label: 'N3 — WI',
    labelFr: 'N3 — Instruction de travail',
    description: 'Detailed work instructions with step-by-step tasks, equipment lists, safety warnings. Must reference an N2 parent SOP. Operators follow these instructions directly.',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    icon: FileText,
  },
  4: {
    label: 'N4 — Form/Record',
    labelFr: 'N4 — Formulaire / Enregistrement',
    description: 'Forms and records that capture objective evidence. Must reference an N3 parent WI. N4 generates record instances subject to the validation workflow (Draft → Review → Approved).',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-600',
    icon: Sparkles,
  },
};

// Mapping from template option string to DocumentLevel number
const levelOptionToNumber: Record<string, DocumentLevel> = {
  'N1 — Policy / Politique': 1,
  'N2 — SOP / Procedure': 2,
  'N3 — WI / Instruction de travail': 3,
  'N4 — Form/Record / Formulaire-Enregistrement': 4,
};

// Mapping from DocumentLevel number to template option string
const levelNumberToOption: Record<number, string> = {
  1: 'N1 — Policy / Politique',
  2: 'N2 — SOP / Procedure',
  3: 'N3 — WI / Instruction de travail',
  4: 'N4 — Form/Record / Formulaire-Enregistrement',
};

interface DocumentCreateFormProps {
  onClose: () => void;
  editDocument?: Document | null;
}

export function DocumentCreateForm({ onClose, editDocument }: DocumentCreateFormProps) {
  const { currentUser } = useAuth();
  const documents = useQMSStore(s => s.documents);
  const profiles = useQMSStore(s => s.profiles);

  // Step 1: Level selection (skip if editing)
  const [selectedLevel, setSelectedLevel] = useState<DocumentLevel | null>(
    editDocument?.documentLevel ?? null
  );
  const [showLevelSelector, setShowLevelSelector] = useState(!editDocument?.documentLevel);

  // Step 2: Rich form values
  const getInitialValues = useCallback((): Record<string, unknown> => {
    if (editDocument) {
      return {
        doc_number: editDocument.documentNumber,
        doc_title: editDocument.title,
        doc_level: levelNumberToOption[editDocument.documentLevel ?? 2],
        doc_type: editDocument.type,
        doc_version: editDocument.version,
        doc_classification: editDocument.classification ?? 'Internal',
        doc_department: editDocument.department ?? '',
        doc_owner: editDocument.createdById ?? '',
        doc_initiation_date: editDocument.createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        doc_description: editDocument.description ?? '',
        doc_scope: editDocument.scope ?? '',
        parent_doc_reference: editDocument.parentDocumentId
          ? (documents.find(d => d.id === editDocument.parentDocumentId)?.documentNumber ?? '')
          : '',
      };
    }
    return {
      doc_version: '1.0',
      doc_initiation_date: new Date().toISOString().split('T')[0],
      doc_classification: 'Internal',
      doc_level: selectedLevel ? levelNumberToOption[selectedLevel] : '',
    };
  }, [editDocument, selectedLevel, documents]);

  const [formValues, setFormValues] = useState<Record<string, unknown>>(getInitialValues);

  // Handle level selection
  const handleLevelSelect = (level: DocumentLevel) => {
    setSelectedLevel(level);
    setShowLevelSelector(false);
    setFormValues(prev => ({
      ...prev,
      doc_level: levelNumberToOption[level],
      doc_initiation_date: new Date().toISOString().split('T')[0],
      doc_version: '1.0',
    }));
  };

  // Handle form submission
  const handleSubmit = useCallback((values: Record<string, unknown>, signatureHash?: string) => {
    const level = levelOptionToNumber[values.doc_level as string] ?? 2;

    // Map form values to Document type
    const docData: Partial<Document> = {
      documentNumber: String(values.doc_number ?? ''),
      title: String(values.doc_title ?? ''),
      type: String(values.doc_type ?? 'SOP') as DocumentType,
      version: String(values.doc_version ?? '1.0'),
      status: 'In Review' as const,
      description: String(values.doc_description ?? ''),
      classification: String(values.doc_classification ?? 'Internal') as DocumentClassification,
      documentLevel: level as DocumentLevel,
      department: String(values.doc_department ?? ''),
      scope: String(values.doc_scope ?? ''),
      retentionPeriod: String(values.retention_period ?? ''),
      owner: currentUser?.fullName || currentUser?.email,
      createdById: currentUser?.id,
      authorId: currentUser?.id,
      organizationId: 'org-001',
      signatures: [],
      // N4 specific
      ...(level === 4 ? {
        references: JSON.stringify({
          generatesRecords: Boolean(values.n4_generates_records),
          recordLifecycle: String(values.n4_record_lifecycle ?? ''),
          recordTemplateName: String(values.n4_record_template_name ?? ''),
          autoNumbering: String(values.n4_auto_numbering ?? ''),
        }),
      } : {}),
    };

    // Find parent document by number
    const parentRef = String(values.parent_doc_reference ?? '');
    if (parentRef) {
      const parentDoc = documents.find(d => d.documentNumber === parentRef);
      if (parentDoc) {
        docData.parentDocumentId = parentDoc.id;
      }
    }

    if (editDocument) {
      updateDocument(editDocument.id, docData);
    } else {
      createDocument(docData as any);
    }

    onClose();
  }, [currentUser, documents, editDocument, onClose]);

  const handleSaveDraft = useCallback((values: Record<string, unknown>) => {
    const level = levelOptionToNumber[values.doc_level as string] ?? 2;

    const docData: Partial<Document> = {
      documentNumber: String(values.doc_number ?? ''),
      title: String(values.doc_title ?? ''),
      type: String(values.doc_type ?? 'SOP') as DocumentType,
      version: String(values.doc_version ?? '1.0'),
      status: 'Draft' as const,
      description: String(values.doc_description ?? ''),
      classification: String(values.doc_classification ?? 'Internal') as DocumentClassification,
      documentLevel: level as DocumentLevel,
      department: String(values.doc_department ?? ''),
      scope: String(values.doc_scope ?? ''),
      retentionPeriod: String(values.retention_period ?? ''),
      owner: currentUser?.fullName || currentUser?.email,
      createdById: currentUser?.id,
      authorId: currentUser?.id,
      organizationId: 'org-001',
      signatures: [],
    };

    const parentRef = String(values.parent_doc_reference ?? '');
    if (parentRef) {
      const parentDoc = documents.find(d => d.documentNumber === parentRef);
      if (parentDoc) {
        docData.parentDocumentId = parentDoc.id;
      }
    }

    if (editDocument) {
      updateDocument(editDocument.id, docData);
    } else {
      createDocument(docData as any);
    }

    onClose();
  }, [currentUser, documents, editDocument, onClose]);

  // ── Level Selector Step ──
  if (showLevelSelector) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Select Document Level / Selectionner le niveau du document
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            The document level determines the template structure, required fields, and workflow. Choose carefully — this affects which sections appear in the form.
          </p>
        </div>

        {/* Level comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([1, 2, 3, 4] as const).map(level => {
            const config = levelConfig[level];
            const Icon = config.icon;
            const isN4 = level === 4;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelSelect(level)}
                className={cn(
                  'text-left p-5 rounded-xl border-2 transition-all hover:shadow-md group',
                  config.borderColor,
                  'hover:border-primary/50',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', config.color)}>
                    N{level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{config.label}</span>
                      <span className="text-sm text-muted-foreground">/ {config.labelFr}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {config.description}
                    </p>
                    {isN4 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          Generates Records
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-xs gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Validation Workflow
                        </Badge>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-2" />
                </div>

                {/* Hierarchy hint */}
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  {level === 1 && <span>No parent required — governs N2 SOPs</span>}
                  {level === 2 && <span>Parent: N1 Policy — governs N3 WIs</span>}
                  {level === 3 && <span>Parent: N2 SOP — governs N4 Forms/Records</span>}
                  {level === 4 && <span>Parent: N3 WI — generates record instances</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hierarchy flow visualization */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {([1, 2, 3, 4] as const).map((level, i) => {
                const config = levelConfig[level];
                return (
                  <React.Fragment key={level}>
                    <div className={cn('px-4 py-2 rounded-lg text-center border', config.color)}>
                      <div className="font-bold">N{level}</div>
                      <div className="text-xs opacity-80">{config.label.split(' — ')[1]}</div>
                    </div>
                    {i < 3 && (
                      <div className="flex flex-col items-center px-1">
                        <div className="w-8 h-0.5 bg-muted-foreground/30" />
                        <span className="text-[10px] text-muted-foreground">governs</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Rich Form Step ──
  return (
    <div className="space-y-4">
      {/* Level indicator bar */}
      {selectedLevel && (
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border', levelConfig[selectedLevel].borderColor)}>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold', levelConfig[selectedLevel].color)}>
            N{selectedLevel}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{levelConfig[selectedLevel].label}</span>
              {selectedLevel === 4 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Record Template
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{levelConfig[selectedLevel].description.slice(0, 120)}...</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowLevelSelector(true)} className="text-xs">
            Change Level
          </Button>
        </div>
      )}

      {/* N4 specific info banner */}
      {selectedLevel === 4 && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              N4 Record Template / Template d'enregistrement N4
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
              This N4 document is a <strong>record template</strong>. Upon approval, it will generate individual record instances
              that follow their own validation workflow (Draft → Review → Approved → Archived). Each instance requires
              its own electronic signatures per 21 CFR Part 11. Define the record lifecycle, numbering format, and
              closure fields in Sections 4 and 5 below.
            </p>
          </div>
        </div>
      )}

      {/* Rich Form Renderer */}
      <RichFormRenderer
        template={DOCUMENT_FORM_TEMPLATE}
        values={formValues}
        onChange={setFormValues}
        mode="edit"
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
