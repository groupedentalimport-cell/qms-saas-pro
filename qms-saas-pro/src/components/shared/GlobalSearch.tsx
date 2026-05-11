
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import type { ActiveSection } from '@/types/qms';
import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Package,
  Truck,
  GitBranch,
  AlertOctagon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  status: string;
  section: ActiveSection;
  entityType: string;
  icon: React.ElementType;
}

interface GlobalSearchProps {
  onNavigate: (section: ActiveSection) => void;
}

const entityConfig: Record<string, { icon: React.ElementType; section: ActiveSection; label: string }> = {
  documents: { icon: FileText, section: 'documents', label: 'Documents' },
  capas: { icon: ShieldCheck, section: 'capa', label: 'CAPAs' },
  ncrs: { icon: AlertTriangle, section: 'ncr', label: 'NCRs' },
  audits: { icon: ClipboardCheck, section: 'audits', label: 'Audits' },
  training: { icon: GraduationCap, section: 'training', label: 'Training' },
  risks: { icon: BarChart3, section: 'risks', label: 'Risks' },
  batchRecords: { icon: Package, section: 'batch-records', label: 'Batch Records' },
  suppliers: { icon: Truck, section: 'suppliers', label: 'Suppliers' },
  changeControls: { icon: GitBranch, section: 'change-control', label: 'Change Controls' },
  deviations: { icon: AlertOctagon, section: 'deviations', label: 'Deviations' },
};

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const store = useQMSStore();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Documents
    store.documents.forEach(doc => {
      if (
        doc.title.toLowerCase().includes(q) ||
        doc.documentNumber.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: doc.id,
          label: doc.title,
          sublabel: doc.documentNumber,
          status: doc.status,
          section: 'documents',
          entityType: 'documents',
          icon: FileText,
        });
      }
    });

    // CAPAs
    store.capas.forEach(capa => {
      if (
        capa.title.toLowerCase().includes(q) ||
        capa.capaNumber.toLowerCase().includes(q) ||
        capa.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: capa.id,
          label: capa.title,
          sublabel: capa.capaNumber,
          status: capa.status,
          section: 'capa',
          entityType: 'capas',
          icon: ShieldCheck,
        });
      }
    });

    // NCRs
    store.ncrs.forEach(ncr => {
      if (
        ncr.title.toLowerCase().includes(q) ||
        ncr.ncrNumber.toLowerCase().includes(q) ||
        ncr.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: ncr.id,
          label: ncr.title,
          sublabel: ncr.ncrNumber,
          status: ncr.status,
          section: 'ncr',
          entityType: 'ncrs',
          icon: AlertTriangle,
        });
      }
    });

    // Audits
    store.audits.forEach(audit => {
      if (
        audit.title.toLowerCase().includes(q) ||
        audit.auditNumber.toLowerCase().includes(q) ||
        audit.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: audit.id,
          label: audit.title,
          sublabel: audit.auditNumber,
          status: audit.status,
          section: 'audits',
          entityType: 'audits',
          icon: ClipboardCheck,
        });
      }
    });

    // Training
    store.training.forEach(t => {
      if (
        t.title.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
      ) {
        results.push({
          id: t.id,
          label: t.title,
          sublabel: t.assignedTo,
          status: t.status,
          section: 'training',
          entityType: 'training',
          icon: GraduationCap,
        });
      }
    });

    // Risks
    store.risks.forEach(risk => {
      if (
        risk.title.toLowerCase().includes(q) ||
        risk.riskNumber.toLowerCase().includes(q) ||
        risk.riskLevel.toLowerCase().includes(q)
      ) {
        results.push({
          id: risk.id,
          label: risk.title,
          sublabel: risk.riskNumber,
          status: risk.status,
          section: 'risks',
          entityType: 'risks',
          icon: BarChart3,
        });
      }
    });

    // Batch Records
    store.batchRecords.forEach(batch => {
      if (
        batch.lotNumber.toLowerCase().includes(q) ||
        batch.productName.toLowerCase().includes(q) ||
        (batch.productCode && batch.productCode.toLowerCase().includes(q))
      ) {
        results.push({
          id: batch.id,
          label: batch.productName,
          sublabel: batch.lotNumber,
          status: batch.status,
          section: 'batch-records',
          entityType: 'batchRecords',
          icon: Package,
        });
      }
    });

    // Suppliers
    store.suppliers.forEach(supplier => {
      if (
        supplier.name.toLowerCase().includes(q) ||
        supplier.supplierCode.toLowerCase().includes(q) ||
        (supplier.category && supplier.category.toLowerCase().includes(q))
      ) {
        results.push({
          id: supplier.id,
          label: supplier.name,
          sublabel: supplier.supplierCode,
          status: supplier.status,
          section: 'suppliers',
          entityType: 'suppliers',
          icon: Truck,
        });
      }
    });

    // Change Controls
    store.changeControls.forEach(cc => {
      if (
        cc.title.toLowerCase().includes(q) ||
        cc.ccNumber.toLowerCase().includes(q) ||
        cc.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: cc.id,
          label: cc.title,
          sublabel: cc.ccNumber,
          status: cc.status,
          section: 'change-control',
          entityType: 'changeControls',
          icon: GitBranch,
        });
      }
    });

    // Deviations
    store.deviations.forEach(dev => {
      if (
        dev.title.toLowerCase().includes(q) ||
        dev.devNumber.toLowerCase().includes(q) ||
        dev.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: dev.id,
          label: dev.title,
          sublabel: dev.devNumber,
          status: dev.status,
          section: 'deviations',
          entityType: 'deviations',
          icon: AlertOctagon,
        });
      }
    });

    return results;
  }, [query, store.documents, store.capas, store.ncrs, store.audits, store.training, store.risks, store.batchRecords, store.suppliers, store.changeControls, store.deviations]);

  // Group results by entity type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of searchResults) {
      if (!groups[result.entityType]) {
        groups[result.entityType] = [];
      }
      groups[result.entityType].push(result);
    }
    return groups;
  }, [searchResults]);

  const handleSelect = (section: ActiveSection) => {
    setOpen(false);
    setQuery('');
    onNavigate(section);
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className="relative hidden md:flex items-center">
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder="Search..."
        className="pl-9 w-64 h-9"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        role="combobox"
        aria-expanded={open && searchResults.length > 0}
        aria-autocomplete="list"
        aria-label="Search QMS records"
      />

      {open && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50" role="listbox" aria-label="Search results">
          <Command
            className="rounded-lg border shadow-md"
            shouldFilter={false}
          >
            <CommandList className="max-h-96">
              <CommandEmpty>No results found.</CommandEmpty>
              {Object.entries(groupedResults).map(([entityType, items]) => {
                const config = entityConfig[entityType];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <CommandGroup key={entityType} heading={config.label}>
                    {items.slice(0, 5).map(item => {
                      const ItemIcon = item.icon;
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => handleSelect(item.section)}
                          className="cursor-pointer"
                          role="option"
                          aria-label={`${item.label} - ${item.status}`}
                        >
                          <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{item.label}</span>
                            {item.sublabel && (
                              <span className="text-xs text-muted-foreground truncate block">{item.sublabel}</span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                            {item.status}
                          </Badge>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && searchResults.length > 0 && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
