
import React from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import {
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
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/qms/components/ui/card';
import { Badge } from '@/qms/components/ui/badge';
import { Button } from '@/qms/components/ui/button';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: string;
}

/** Common shape shared by all QMS entities displayed in placeholder views */
interface PlaceholderItem {
  id: string;
  status: string;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  priority?: string;
  riskLevel?: string;
}

const iconMap: Record<string, React.ElementType> = {
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
  Users,
};

export function PlaceholderView({ title, description, icon }: PlaceholderViewProps) {
  const store = useQMSStore();
  const Icon = iconMap[icon] || FileText;

  // Get relevant data based on the section
  const getData = () => {
    switch (icon) {
      case 'Shield':
        return {
          items: store.capas,
          label: 'CAPAs',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Implementation': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              'Effectiveness Check': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
              'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { capaNumber?: string }).capaNumber ?? '',
          getTitle: (item: PlaceholderItem) => item.title ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'AlertTriangle':
        return {
          items: store.ncrs,
          label: 'NCRs',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'Under Investigation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Pending Disposition': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              'Closed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { ncrNumber?: string }).ncrNumber ?? '',
          getTitle: (item: PlaceholderItem) => item.title ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'ClipboardCheck':
        return {
          items: store.audits,
          label: 'Audits',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Planned': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { auditNumber?: string }).auditNumber ?? '',
          getTitle: (item: PlaceholderItem) => item.title ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'BarChart3':
        return {
          items: store.risks,
          label: 'Risks',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Open': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Mitigated': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              'Accepted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'Closed': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { riskNumber?: string }).riskNumber ?? '',
          getTitle: (item: PlaceholderItem) => item.title ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'GraduationCap':
        return {
          items: store.training,
          label: 'Training',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Planned': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              'Overdue': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            };
            return colors[status] || '';
          },
          getNumber: (_item: PlaceholderItem) => '',
          getTitle: (item: PlaceholderItem) => item.title ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'Package':
        return {
          items: store.batchRecords,
          label: 'Batch Records',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Pending QA Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              'Released': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              'Quarantine': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { lotNumber?: string }).lotNumber ?? '',
          getTitle: (item: PlaceholderItem) => (item as { productName?: string }).productName ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      case 'Truck':
        return {
          items: store.suppliers,
          label: 'Suppliers',
          getStatusColor: (status: string) => {
            const colors: Record<string, string> = {
              'Qualified': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              'Conditional': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              'Disqualified': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              'Under Evaluation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            };
            return colors[status] || '';
          },
          getNumber: (item: PlaceholderItem) => (item as { supplierCode?: string }).supplierCode ?? '',
          getTitle: (item: PlaceholderItem) => (item as { name?: string }).name ?? '',
          getStatus: (item: PlaceholderItem) => item.status,
        };
      default:
        return {
          items: [],
          label: 'Items',
          getStatusColor: (_status: string) => '',
          getNumber: (_item: PlaceholderItem) => '',
          getTitle: (_item: PlaceholderItem) => '',
          getStatus: (_item: PlaceholderItem) => '',
        };
    }
  };

  const data = getData();
  const items = data.items as PlaceholderItem[];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button>
          <span className="mr-2">+</span>
          New {title.replace(/s$/, '')}
        </Button>
      </div>

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">{items.length}</span>
              </div>
            </CardContent>
          </Card>
          {items.length > 0 && (
            <>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="text-lg font-bold text-amber-600">{items.filter((i: { status: string }) => i.status !== 'Closed' && i.status !== 'Completed' && i.status !== 'Released').length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-lg font-bold text-green-600">{items.filter((i: { status: string }) => i.status === 'Closed' || i.status === 'Completed' || i.status === 'Released').length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className="text-lg font-bold text-red-600">{items.filter((i: { status: string }) => i.status === 'Overdue').length}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Items list */}
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item: PlaceholderItem) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {data.getNumber(item) && (
                          <span className="font-mono text-xs text-muted-foreground">{data.getNumber(item)}</span>
                        )}
                        <h3 className="font-medium truncate">{data.getTitle(item)}</h3>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.type && (
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    )}
                    {item.severity && (
                      <Badge variant="outline" className="text-xs">{item.severity}</Badge>
                    )}
                    {item.priority && (
                      <Badge variant="outline" className="text-xs">{item.priority}</Badge>
                    )}
                    {item.riskLevel && (
                      <Badge variant="outline" className="text-xs">{item.riskLevel}</Badge>
                    )}
                    <Badge className={cn('text-xs', data.getStatusColor(data.getStatus(item)))} variant="secondary">
                      {data.getStatus(item)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No {title} yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first {title.replace(/s$/, '').toLowerCase()}</p>
              <Button>
                <span className="mr-2">+</span>
                Create {title.replace(/s$/, '')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
