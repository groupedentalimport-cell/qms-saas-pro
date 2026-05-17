
import React, { useState, useMemo, useCallback } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import type { Document, DocumentLevel } from '@/qms/types/qms';
import { cn, formatDate } from '@/qms/lib/utils';
import {
  GitBranch, ChevronDown, ChevronRight, FileText, FolderOpen,
  Shield, AlertTriangle, Search, Eye, ArrowUpDown, Layers,
  Unlink, Link2, TreePine, TreeDeciduous, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/qms/components/ui/card';
import { Badge } from '@/qms/components/ui/badge';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Label } from '@/qms/components/ui/label';
import { Separator } from '@/qms/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/qms/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/qms/components/ui/dialog';

// Level colors matching DocumentControlView: N1=purple, N2=teal, N3=cyan, N4=slate
const levelColors: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  2: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  3: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  4: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const levelBorderColors: Record<number, string> = {
  1: 'border-l-purple-400',
  2: 'border-l-teal-400',
  3: 'border-l-cyan-400',
  4: 'border-l-slate-400',
};

const levelDotColors: Record<number, string> = {
  1: 'bg-purple-400',
  2: 'bg-teal-400',
  3: 'bg-cyan-400',
  4: 'bg-slate-400',
};

const levelLabels: Record<number, string> = {
  1: 'N1 - Policy',
  2: 'N2 - SOP',
  3: 'N3 - WI',
  4: 'N4 - Form/Record',
};

const statusColors: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Obsolete': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// TreeNode component
interface TreeNodeProps {
  doc: Document;
  childDocs: Document[];
  allDocs: Document[];
  depth: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onDocClick: (doc: Document) => void;
  searchHighlight?: string;
}

function TreeNode({ doc, childDocs, allDocs, depth, expandedIds, toggleExpand, onDocClick, searchHighlight }: TreeNodeProps) {
  const hasChildren = childDocs.length > 0;
  const isExpanded = expandedIds.has(doc.id);
  const level = doc.documentLevel || 1;

  const highlightText = (text: string) => {
    if (!searchHighlight) return text;
    const idx = text.toLowerCase().indexOf(searchHighlight.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{text.slice(idx, idx + searchHighlight.length)}</mark>
        {text.slice(idx + searchHighlight.length)}
      </>
    );
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer group',
          'border-l-2',
          levelBorderColors[level],
        )}
        style={{ marginLeft: depth * 20 }}
        onClick={() => onDocClick(doc)}
      >
        {hasChildren ? (
          <button
            className="flex-shrink-0 p-0.5 rounded hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); toggleExpand(doc.id); }}
          >
            {isExpanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}
        <Badge className={cn('text-[10px] font-mono px-1.5', levelColors[level])} variant="secondary">
          N{level}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground min-w-fit">{doc.documentNumber}</span>
        <span className="text-sm font-medium truncate flex-1">{highlightText(doc.title)}</span>
        <span className="text-xs text-muted-foreground font-mono">v{doc.version}</span>
        <Badge className={cn('text-[10px]', statusColors[doc.status])} variant="secondary">{doc.status}</Badge>
        {hasChildren && (
          <span className="text-[10px] text-muted-foreground">{childDocs.length}↓</span>
        )}
        <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      {isExpanded && hasChildren && (
        <div className={cn('border-l border-dashed ml-6', levelDotColors[level])} style={{ marginLeft: depth * 20 + 16 }}>
          {childDocs.map(child => {
            const grandChildren = allDocs.filter(d => d.parentDocumentId === child.id);
            return (
              <TreeNode
                key={child.id}
                doc={child}
                childDocs={grandChildren}
                allDocs={allDocs}
                depth={depth + 1}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                onDocClick={onDocClick}
                searchHighlight={searchHighlight}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DocumentHierarchyView() {
  const store = useQMSStore();
  const documents = store.documents;

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Build tree: root docs = no parent, filtered
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchTerm === '' ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || String(doc.documentLevel) === levelFilter;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [documents, searchTerm, levelFilter, statusFilter]);

  // Find root docs from filtered set (docs whose parent is not in the filtered set or has no parent)
  const rootDocs = useMemo(() => {
    const filteredIds = new Set(filteredDocs.map(d => d.id));
    return filteredDocs.filter(d => !d.parentDocumentId || !filteredIds.has(d.parentDocumentId));
  }, [filteredDocs]);

  // Stats
  const stats = useMemo(() => {
    const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    documents.forEach(d => {
      const level = d.documentLevel || 1;
      byLevel[level] = (byLevel[level] || 0) + 1;
    });

    const orphans = documents.filter(d => !d.parentDocumentId && d.documentLevel && d.documentLevel > 1);
    const docsWithChildren = documents.filter(d => documents.some(c => c.parentDocumentId === d.id));

    return { byLevel, orphanCount: orphans.length, docsWithChildrenCount: docsWithChildren.length, total: documents.length };
  }, [documents]);

  // Problem docs (Obsolete with active children, Draft with Approved children)
  const problemDocs = useMemo(() => {
    return documents.filter(d => {
      if (d.status === 'Obsolete') return documents.some(c => c.parentDocumentId === d.id && c.status === 'Approved');
      if (d.status === 'Draft') return documents.some(c => c.parentDocumentId === d.id && c.status === 'Approved');
      return false;
    });
  }, [documents]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set(documents.filter(d => documents.some(c => c.parentDocumentId === d.id)).map(d => d.id));
    setExpandedIds(allIds);
  }, [documents]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleDocClick = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDetailDialog(true);
  };

  const getChildDocuments = (docId: string) => documents.filter(d => d.parentDocumentId === docId);
  const getParentDocument = (parentId?: string) => parentId ? documents.find(d => d.id === parentId) : null;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />Document Hierarchy
        </h1>
        <p className="text-muted-foreground mt-1">Visualize and manage the document hierarchy and relationships</p>
      </div>

      {/* Hierarchy Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total</span></div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        {([1, 2, 3, 4] as const).map(level => (
          <Card key={level}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] px-1.5', levelColors[level])} variant="secondary">N{level}</Badge>
                <span className="text-xs text-muted-foreground">{levelLabels[level].split(' - ')[1]}</span>
              </div>
              <span className="text-2xl font-bold">{stats.byLevel[level]}</span>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><Unlink className="h-4 w-4 text-amber-500" /><span className="text-sm text-muted-foreground">Orphans</span></div>
            <span className={cn('text-2xl font-bold', stats.orphanCount > 0 ? 'text-amber-600' : 'text-green-600')}>{stats.orphanCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-blue-500" /><span className="text-sm text-muted-foreground">With Children</span></div>
            <span className="text-2xl font-bold">{stats.docsWithChildrenCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Alerts */}
      {problemDocs.length > 0 && (
        <div className="space-y-2">
          {problemDocs.map(doc => {
            const activeChildren = documents.filter(d => d.parentDocumentId === doc.id && d.status === 'Approved');
            return (
              <div key={doc.id} className="flex items-start gap-3 p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{doc.documentNumber}</span>
                    <Badge className={cn('text-[10px]', statusColors[doc.status])} variant="secondary">{doc.status}</Badge>
                  </div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {doc.status === 'Obsolete'
                      ? `Obsolete document has ${activeChildren.length} active child document(s)`
                      : `Draft document has ${activeChildren.length} Approved child document(s)`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tree Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents by number or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="1">N1 - Policy</SelectItem>
            <SelectItem value="2">N2 - SOP</SelectItem>
            <SelectItem value="3">N3 - WI</SelectItem>
            <SelectItem value="4">N4 - Form/Record</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="In Review">In Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Obsolete">Obsolete</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <TreePine className="h-3.5 w-3.5 mr-1" />Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <TreeDeciduous className="h-3.5 w-3.5 mr-1" />Collapse All
          </Button>
        </div>
      </div>

      {/* Visual Document Tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Document Tree
            <Badge variant="outline" className="ml-auto">{filteredDocs.length} documents</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto space-y-0.5">
          {rootDocs.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No documents found matching filters</p>
            </div>
          ) : (
            rootDocs.map(doc => {
              const childDocs = filteredDocs.filter(d => d.parentDocumentId === doc.id);
              return (
                <TreeNode
                  key={doc.id}
                  doc={doc}
                  childDocs={childDocs}
                  allDocs={filteredDocs}
                  depth={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  onDocClick={handleDocClick}
                  searchHighlight={searchTerm}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Hierarchy Flow Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />Hierarchy Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {([1, 2, 3, 4] as const).map((level, i) => (
              <React.Fragment key={level}>
                <div className={cn('px-5 py-3 rounded-lg text-center border', levelColors[level])}>
                  <div className="font-bold text-lg">N{level}</div>
                  <div className="text-xs opacity-80">{levelLabels[level].split(' - ')[1]}</div>
                  <div className="text-xs mt-1 font-semibold">{stats.byLevel[level]} docs</div>
                </div>
                {i < 3 && (
                  <div className="flex flex-col items-center px-1">
                    <div className="w-8 h-0.5 bg-muted-foreground/30" />
                    <span className="text-[10px] text-muted-foreground">governs</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold', levelColors[selectedDoc.documentLevel || 1])}>
                    N{selectedDoc.documentLevel || 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{selectedDoc.documentNumber}</p>
                    <p className="truncate">{selectedDoc.title}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(statusColors[selectedDoc.status])} variant="secondary">{selectedDoc.status}</Badge>
                  <Badge variant="outline">{selectedDoc.type}</Badge>
                  {selectedDoc.documentLevel && (
                    <Badge className={cn(levelColors[selectedDoc.documentLevel])} variant="secondary">
                      <Layers className="h-3 w-3 mr-1" />
                      {levelLabels[selectedDoc.documentLevel]}
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono">v{selectedDoc.version}</Badge>
                </div>

                {/* Metadata */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Document Metadata</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Document Number:</span>{' '}
                      <span className="font-mono font-medium">{selectedDoc.documentNumber}</span>
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
                      <span className="text-muted-foreground">Owner:</span>{' '}
                      <span className="font-medium">{selectedDoc.owner || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Classification:</span>{' '}
                      <span className="font-medium">{selectedDoc.classification || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retention:</span>{' '}
                      <span className="font-medium">{selectedDoc.retentionPeriod || '-'}</span>
                    </div>
                    {selectedDoc.effectiveDate && (
                      <div>
                        <span className="text-muted-foreground">Effective:</span>{' '}
                        <span className="font-medium">{formatDate(selectedDoc.effectiveDate)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      <span className="font-medium">{formatDate(selectedDoc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedDoc.description && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedDoc.description}</p>
                  </div>
                )}

                <Separator />

                {/* Parent Document Link */}
                {getParentDocument(selectedDoc.parentDocumentId) && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <GitBranch className="h-4 w-4" />
                      Parent Document
                    </h4>
                    {(() => {
                      const parent = getParentDocument(selectedDoc.parentDocumentId)!;
                      return (
                        <div
                          className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleDocClick(parent)}
                        >
                          <Badge className={cn('text-[10px] font-mono px-1.5', levelColors[parent.documentLevel || 1])} variant="secondary">
                            N{parent.documentLevel || 1}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{parent.documentNumber}</span>
                          <span className="text-sm font-medium truncate flex-1">{parent.title}</span>
                          <Badge className={cn('text-[10px]', statusColors[parent.status])} variant="secondary">{parent.status}</Badge>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Child Documents */}
                {getChildDocuments(selectedDoc.id).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <GitBranch className="h-4 w-4" />
                      Child Documents
                      <Badge variant="outline" className="ml-2 text-xs">{getChildDocuments(selectedDoc.id).length}</Badge>
                    </h4>
                    <div className="space-y-1">
                      {getChildDocuments(selectedDoc.id).map(child => (
                        <div
                          key={child.id}
                          className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleDocClick(child)}
                        >
                          <Badge className={cn('text-[10px] font-mono px-1.5', levelColors[child.documentLevel || 1])} variant="secondary">
                            N{child.documentLevel || 1}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{child.documentNumber}</span>
                          <span className="text-sm font-medium truncate flex-1">{child.title}</span>
                          <Badge className={cn('text-[10px]', statusColors[child.status])} variant="secondary">{child.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Status & Linked Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Quick Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', statusColors[selectedDoc.status]?.includes('green') ? 'bg-green-400' : statusColors[selectedDoc.status]?.includes('amber') ? 'bg-amber-400' : statusColors[selectedDoc.status]?.includes('red') ? 'bg-red-400' : 'bg-gray-400')} />
                      <span className="text-sm">Status: <span className="font-medium">{selectedDoc.status}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Children: <span className="font-medium">{getChildDocuments(selectedDoc.id).length}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Parent: <span className="font-medium">{selectedDoc.parentDocumentId ? 'Yes' : 'None'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Level: <span className="font-medium">{selectedDoc.documentLevel ? `N${selectedDoc.documentLevel}` : 'Unset'}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
