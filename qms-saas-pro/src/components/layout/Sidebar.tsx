'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQMSStore } from '@/lib/demo-store';
import { useTranslation } from '@/lib/i18n';
import type { ActiveSection, Permission } from '@/types/qms';
import { CORE_MODULES, INDUSTRY_CONFIG, isIndustryType } from '@/types/qms';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  BarChart3,
  GraduationCap,
  ArrowLeftRight,
  AlertOctagon,
  Package,
  Truck,
  FlaskConical,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: ActiveSection;
  labelKey: string;
  icon: React.ElementType;
  module?: string;
  /** If set, the item is only visible when the user has this permission */
  permission?: Permission;
  showBadge?: boolean;
  getBadgeCount?: (store: ReturnType<typeof useQMSStore.getState>) => number;
}

interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation group definitions
// ---------------------------------------------------------------------------

const NAV_GROUPS: NavGroup[] = [
  {
    // Main
    items: [
      { id: 'dashboard' as ActiveSection, labelKey: 'nav.dashboard', icon: LayoutDashboard },
    ],
  },
  {
    // Documents
    labelKey: 'nav.documents',
    items: [
      { id: 'documents' as ActiveSection, labelKey: 'nav.documents', icon: FileText, module: 'documents', permission: 'documents.read', showBadge: true, getBadgeCount: (s: ReturnType<typeof useQMSStore.getState>) => s.documents.filter(d => d.status === 'In Review').length },
      { id: 'document-hierarchy' as ActiveSection, labelKey: 'nav.documentHierarchy', icon: GitBranch, module: 'hierarchy', permission: 'documents.read' },
    ],
  },
  {
    // Records
    labelKey: 'nav.records',
    items: [
      { id: 'ncr' as ActiveSection, labelKey: 'nav.ncr', icon: AlertTriangle, module: 'ncr', permission: 'ncr.read', showBadge: true, getBadgeCount: (s: ReturnType<typeof useQMSStore.getState>) => s.ncrs.filter(n => n.status === 'Open' || n.status === 'Under Investigation').length },
      { id: 'capa' as ActiveSection, labelKey: 'nav.capa', icon: Shield, module: 'capa', permission: 'capa.read', showBadge: true, getBadgeCount: (s: ReturnType<typeof useQMSStore.getState>) => s.capas.filter(c => c.status !== 'Closed').length },
      { id: 'audits' as ActiveSection, labelKey: 'nav.audits', icon: ClipboardCheck, module: 'audits', permission: 'audit.read' },
      { id: 'risks' as ActiveSection, labelKey: 'nav.risks', icon: BarChart3, module: 'risks', permission: 'risk.read' },
      { id: 'training' as ActiveSection, labelKey: 'nav.training', icon: GraduationCap, module: 'training', permission: 'training.read', showBadge: true, getBadgeCount: (s: ReturnType<typeof useQMSStore.getState>) => s.training.filter(t => t.status === 'Overdue').length },
      { id: 'change-control' as ActiveSection, labelKey: 'nav.changeControl', icon: ArrowLeftRight, module: 'change_control', permission: 'documents.read' },
      { id: 'deviations' as ActiveSection, labelKey: 'nav.deviations', icon: AlertOctagon, module: 'deviations', permission: 'ncr.read' },
      { id: 'batch-records' as ActiveSection, labelKey: 'nav.batchRecords', icon: Package, module: 'batch_records', permission: 'batch.read' },
      { id: 'suppliers' as ActiveSection, labelKey: 'nav.suppliers', icon: Truck, module: 'suppliers', permission: 'supplier.read' },
      { id: 'oos-oot' as ActiveSection, labelKey: 'nav.oosOot', icon: FlaskConical, module: 'oos_oot', permission: 'ncr.read' },
      { id: 'forms' as ActiveSection, labelKey: 'nav.forms', icon: FileSpreadsheet, module: 'forms', permission: 'documents.read' },
    ],
  },
  {
    // Governance
    labelKey: 'nav.governance',
    items: [
      { id: 'reports' as ActiveSection, labelKey: 'nav.reports', icon: PieChart, module: 'reports', permission: 'reports.view' },
      { id: 'compliance' as ActiveSection, labelKey: 'nav.compliance', icon: CheckCircle2, module: 'compliance', permission: 'compliance.view' },
    ],
  },
];

// Settings items — only visible with admin.users permission
const SETTINGS_ITEMS: NavItem[] = [
  { id: 'user-management', labelKey: 'nav.userManagement', icon: Users, permission: 'admin.users' },
];

// ---------------------------------------------------------------------------
// Helper to resolve nested key from translation object
// Accepts a nested record structure and resolves dot-separated key paths
// ---------------------------------------------------------------------------

type TranslationRecord = Record<string, unknown>;

function resolveTranslationKey(obj: TranslationRecord, keyPath: string): string {
  const keys = keyPath.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && current !== null && key in (current as TranslationRecord)) {
      current = (current as TranslationRecord)[key];
    } else {
      return keyPath; // fallback to key path
    }
  }
  return typeof current === 'string' ? current : keyPath;
}

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export function Sidebar({ activeSection, onSectionChange, collapsed, onToggle }: SidebarProps) {
  const { orgSettings } = useOrganization();
  const { hasPermission } = useAuth();
  const store = useQMSStore();
  const t = useTranslation();
  const tRecord = t as unknown as TranslationRecord;

  const activeModules = orgSettings?.active_modules || [];

  // -------------------------------------------------------------------------
  // Visibility logic: combines module filtering AND permission checks
  // -------------------------------------------------------------------------

  const isItemVisible = (item: NavItem): boolean => {
    // 1. Permission check — if a permission is defined, user must have it
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    // 2. Module filtering — core modules are always visible
    if (!item.module) return true; // No module = always visible (e.g. Dashboard)

    const coreModulesList: readonly string[] = CORE_MODULES;
    if (coreModulesList.includes(item.module)) return true;

    // 3. Optional modules — only visible if in active_modules
    return activeModules.includes(item.module);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo / Org Name */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate">QMS SaaS Pro</h1>
              <p className="text-xs text-muted-foreground truncate">{INDUSTRY_CONFIG[orgSettings?.industry_type && isIndustryType(orgSettings.industry_type) ? orgSettings.industry_type : 'medical_device']?.primaryStandard || 'QMS'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {NAV_GROUPS.map((group, groupIdx) => {
            const visibleItems = group.items.filter(item => isItemVisible(item));
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx}>
                {group.labelKey && !collapsed && (
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {resolveTranslationKey(tRecord, group.labelKey)}
                    </span>
                  </div>
                )}
                {group.labelKey && collapsed && (
                  <Separator className="my-2" />
                )}
                {visibleItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const badgeCount = item.showBadge && item.getBadgeCount ? item.getBadgeCount(store) : 0;
                  const Icon = item.icon;
                  const label = resolveTranslationKey(tRecord, item.labelKey);

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        'w-full justify-start gap-3 h-9 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                      {!collapsed && (
                        <>
                          <span className="truncate text-sm">{label}</span>
                          {badgeCount > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs px-1.5">
                              {badgeCount}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1">
                          {badgeCount}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Settings section at bottom */}
      <div className="border-t border-sidebar-border py-2 px-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3 h-3" />
              {t.nav.settings}
            </span>
          </div>
        )}
        {SETTINGS_ITEMS.filter(item => isItemVisible(item)).map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          const label = resolveTranslationKey(tRecord, item.labelKey);

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full justify-start gap-3 h-9 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate text-sm">{label}</span>}
            </Button>
          );
        })}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full mt-1 justify-center h-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
