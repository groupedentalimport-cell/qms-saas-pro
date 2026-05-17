
import React, { useState, useMemo } from 'react';
import { useQMSStore } from '@/qms/lib/demo-store';
import { createProfile, updateProfile } from '@/qms/services/profileService';
import { useAuth } from '@/qms/contexts/AuthContext';
import { useOrganization } from '@/qms/contexts/OrganizationContext';
import type { UserRole, Profile, Permission } from '@/qms/types/qms';
import { rolePermissions, isUserRole } from '@/qms/types/qms';
import { cn, formatDate } from '@/qms/lib/utils';
import {
  Users, Plus, Search, Edit, Shield, Mail, UserCheck, UserX,
  Eye, CheckCircle2, XCircle, Phone, Building2, Briefcase, Info,
  ChevronDown, ChevronRight, Key,
} from 'lucide-react';
import { Card, CardContent } from '@/qms/components/ui/card';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Badge } from '@/qms/components/ui/badge';
import { Label } from '@/qms/components/ui/label';
import { Separator } from '@/qms/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/qms/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/qms/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/qms/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/qms/components/ui/tooltip';

const roleColors: Record<UserRole, string> = {
  'admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'quality_manager': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'auditor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'document_controller': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'executive': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'operator': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const roleLabels: Record<UserRole, string> = {
  'admin': 'Administrator',
  'quality_manager': 'Quality Manager',
  'auditor': 'Auditor',
  'document_controller': 'Document Controller',
  'executive': 'Executive',
  'operator': 'Operator',
};

const roleDescriptions: Record<UserRole, string> = {
  'admin': 'Full system access including user management, organization settings, and audit trail. Can create, read, update, and delete all records across all modules.',
  'quality_manager': 'Manages quality processes including CAPA, NCR, documents, and approvals. Can create and approve records but cannot delete or manage users.',
  'auditor': 'Read-only access to most modules with full audit management capabilities. Can create and update audit records and view audit trails.',
  'document_controller': 'Full document lifecycle management including create, approve, and delete. Read-only access to other modules. Can manage training records.',
  'executive': 'Read-only dashboard access to all modules with report viewing and export capabilities. No create or update permissions on operational records.',
  'operator': 'Limited access focused on production operations. Can create NCRs, manage batch records, and view documents and training.',
};

// Group permissions by category
const permissionGroups: Record<string, { label: string; icon: React.ReactNode; permissions: Permission[] }> = {
  documents: {
    label: 'Documents',
    icon: <Edit className="h-3.5 w-3.5" />,
    permissions: ['documents.create', 'documents.read', 'documents.update', 'documents.delete', 'documents.approve'],
  },
  capa: {
    label: 'CAPA',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    permissions: ['capa.create', 'capa.read', 'capa.update', 'capa.delete', 'capa.approve'],
  },
  ncr: {
    label: 'NCR',
    icon: <XCircle className="h-3.5 w-3.5" />,
    permissions: ['ncr.create', 'ncr.read', 'ncr.update', 'ncr.delete', 'ncr.approve'],
  },
  audit: {
    label: 'Audits',
    icon: <Eye className="h-3.5 w-3.5" />,
    permissions: ['audit.create', 'audit.read', 'audit.update', 'audit.delete'],
  },
  training: {
    label: 'Training',
    icon: <Users className="h-3.5 w-3.5" />,
    permissions: ['training.create', 'training.read', 'training.update', 'training.delete'],
  },
  risk: {
    label: 'Risk',
    icon: <Info className="h-3.5 w-3.5" />,
    permissions: ['risk.create', 'risk.read', 'risk.update', 'risk.delete'],
  },
  batch: {
    label: 'Batch Records',
    icon: <Building2 className="h-3.5 w-3.5" />,
    permissions: ['batch.create', 'batch.read', 'batch.update', 'batch.delete', 'batch.release'],
  },
  supplier: {
    label: 'Suppliers',
    icon: <Briefcase className="h-3.5 w-3.5" />,
    permissions: ['supplier.create', 'supplier.read', 'supplier.update', 'supplier.delete'],
  },
  reports: {
    label: 'Reports',
    icon: <Info className="h-3.5 w-3.5" />,
    permissions: ['reports.view', 'reports.export'],
  },
  compliance: {
    label: 'Compliance',
    icon: <Shield className="h-3.5 w-3.5" />,
    permissions: ['compliance.view', 'compliance.manage'],
  },
  admin: {
    label: 'Administration',
    icon: <Key className="h-3.5 w-3.5" />,
    permissions: ['admin.users', 'admin.settings', 'admin.audit_trail'],
  },
};

function PermissionSummary({ role, compact = false }: { role: UserRole; compact?: boolean }) {
  const permissions = rolePermissions[role];
  const totalPerms = permissions.length;
  const maxPerms = Object.values(rolePermissions).flat().filter((v, i, a) => a.indexOf(v) === i).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          {roleLabels[role]} Permissions
        </span>
        <Badge variant="outline" className="text-xs">
          {totalPerms} / {maxPerms} permissions
        </Badge>
      </div>
      <div className="space-y-2">
        {Object.entries(permissionGroups).map(([key, group]) => {
          const grantedCount = group.permissions.filter(p => permissions.includes(p)).length;
          if (grantedCount === 0 && compact) return null;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {group.icon}
                {group.label}
                <span className="ml-auto text-[10px]">{grantedCount}/{group.permissions.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 ml-5">
                {group.permissions.map(p => {
                  const has = permissions.includes(p);
                  const shortName = p.split('.')[1];
                  return (
                    <Badge
                      key={p}
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-normal',
                        has
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600 line-through'
                      )}
                    >
                      {has ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                      {shortName}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors: Record<string, string> = {
  'admin': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'quality_manager': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  'auditor': 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  'document_controller': 'bg-sky-200 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  'executive': 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  'operator': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const roles: UserRole[] = ['admin', 'quality_manager', 'auditor', 'document_controller', 'executive', 'operator'];

export function UserManagementView() {
  const { currentUser, hasPermission } = useAuth();
  const { currentOrg, updateSettings } = useOrganization();
  // Read from store via selectors
  const profiles = useQMSStore(state => state.profiles);
  const orgMembers = useQMSStore(state => state.orgMembers);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Add user form
  const [addForm, setAddForm] = useState<{
    email: string; fullName: string; role: UserRole; department: string; jobTitle: string; phone: string;
  }>({
    email: '', fullName: '', role: 'operator',
    department: '', jobTitle: '', phone: '',
  });

  // Edit user form
  const [editForm, setEditForm] = useState<{
    email: string; fullName: string; role: UserRole; department: string; jobTitle: string; phone: string;
  }>({
    email: '', fullName: '', role: 'operator',
    department: '', jobTitle: '', phone: '',
  });

  // Permission preview role (for Add dialog)
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  const filteredUsers = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = searchTerm === '' ||
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, roleFilter]);

  // Stats
  const stats = useMemo(() => {
    const byRole: Record<string, number> = {};
    for (const r of roles) {
      byRole[r] = profiles.filter(p => p.role === r).length;
    }
    return {
      total: profiles.length,
      active: orgMembers.filter(m => m.status === 'active').length,
      inactive: orgMembers.filter(m => m.status === 'inactive').length,
      byRole,
    };
  }, [profiles, orgMembers]);

  const getMemberStatus = (userId: string) => {
    return orgMembers.find(m => m.userId === userId)?.status || 'active';
  };

  const resetAddForm = () => {
    setAddForm({ email: '', fullName: '', role: 'operator', department: '', jobTitle: '', phone: '' });
    setPreviewRole(null);
  };

  const handleAddUser = () => {
    if (!addForm.fullName || !addForm.email) return;
    createProfile({
      email: addForm.email,
      fullName: addForm.fullName,
      role: addForm.role,
      department: addForm.department || undefined,
      jobTitle: addForm.jobTitle || undefined,
      phone: addForm.phone || undefined,
    });
    resetAddForm();
    setShowAddDialog(false);
  };

  const openEditDialog = (profile: Profile) => {
    setEditForm({
      email: profile.email,
      fullName: profile.fullName || '',
      role: profile.role,
      department: profile.department || '',
      jobTitle: profile.jobTitle || '',
      phone: profile.phone || '',
    });
    setSelectedUser(profile);
    setShowEditDialog(true);
  };

  const handleEditUser = () => {
    if (!selectedUser || !editForm.fullName || !editForm.email) return;
    updateProfile(selectedUser.id, {
      email: editForm.email,
      fullName: editForm.fullName,
      role: editForm.role,
      department: editForm.department || undefined,
      jobTitle: editForm.jobTitle || undefined,
      phone: editForm.phone || undefined,
    });
    setSelectedUser(null);
    setShowEditDialog(false);
  };

  const openDetail = (profile: Profile) => {
    setSelectedUser(profile);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />User Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, roles and permissions</p>
        </div>
        {hasPermission('admin.users') && (
          <Button onClick={() => { resetAddForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />Add User
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Users</span></div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-500" /><span className="text-sm text-muted-foreground">Active</span></div>
            <span className="text-2xl font-bold text-green-600">{stats.active}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2"><UserX className="h-4 w-4 text-red-500" /><span className="text-sm text-muted-foreground">Inactive</span></div>
            <span className="text-2xl font-bold text-red-600">{stats.inactive}</span>
          </CardContent>
        </Card>
        {roles.slice(0, 3).map(r => (
          <Card key={r}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] px-1.5', roleColors[r])} variant="secondary">{roleLabels[r]}</Badge>
              </div>
              <span className="text-2xl font-bold">{stats.byRole[r]}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Breakdown (remaining 3 roles) */}
      <div className="flex flex-wrap gap-2">
        {roles.slice(3).map(r => (
          <TooltipProvider key={r}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={cn('cursor-default px-3 py-1.5 text-xs', roleColors[r])} variant="secondary">
                  {roleLabels[r]}: {stats.byRole[r]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{roleLabels[r]}</p>
                <p className="text-xs text-muted-foreground mt-1">{roleDescriptions[r]}</p>
                <p className="text-xs mt-1">{rolePermissions[r].length} permissions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead className="w-[220px]">Email</TableHead>
                  <TableHead className="w-[160px]">Role</TableHead>
                  <TableHead className="w-[140px]">Department</TableHead>
                  <TableHead className="w-[150px]">Job Title</TableHead>
                  <TableHead className="w-[110px]">Created Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(profile => {
                  const memberStatus = getMemberStatus(profile.id);
                  return (
                    <TableRow key={profile.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(profile)}>
                      <TableCell>
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold', avatarColors[profile.role])}>
                          {getInitials(profile.fullName)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{profile.fullName || 'Unknown'}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className={cn('text-[10px] h-4', memberStatus === 'active' ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400' : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400')}>
                              {memberStatus === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{profile.email}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={cn('text-xs cursor-default', roleColors[profile.role])} variant="secondary">
                                {roleLabels[profile.role]}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-xs">{roleDescriptions[profile.role]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-sm">{profile.department || '-'}</TableCell>
                      <TableCell className="text-sm">{profile.jobTitle || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(profile.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDetail(profile); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {hasPermission('admin.users') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditDialog(profile); }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Full Name *</Label>
                <Input value={addForm.fullName} onChange={(e) => setAddForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role *</Label>
                <Select value={addForm.role} onValueChange={(v) => { const role = isUserRole(v) ? v : 'operator' as UserRole; setAddForm(f => ({ ...f, role })); setPreviewRole(role); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-[10px] px-1', roleColors[r])} variant="secondary">{roleLabels[r]}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Input value={addForm.department} onChange={(e) => setAddForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Quality Assurance" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Job Title</Label>
                <Input value={addForm.jobTitle} onChange={(e) => setAddForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. QA Director" />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+33 1 23 45 67 89" />
              </div>
            </div>

            {/* Role Description */}
            {addForm.role && (
              <div className="border rounded-md p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Info className="h-3 w-3" />Role Description</p>
                <p className="text-xs text-muted-foreground">{roleDescriptions[addForm.role]}</p>
              </div>
            )}

            {/* Permissions Preview */}
            {(previewRole || addForm.role) && (
              <div className="border rounded-md p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Permissions for {roleLabels[addForm.role]}:</p>
                <PermissionSummary role={addForm.role} compact />
              </div>
            )}

            <Button className="w-full" onClick={handleAddUser} disabled={!addForm.fullName || !addForm.email}>Add User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold', avatarColors[editForm.role])}>
                  {getInitials(editForm.fullName)}
                </div>
                <div>
                  <p className="font-medium">{editForm.fullName || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{editForm.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Full Name *</Label>
                  <Input value={editForm.fullName} onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Role *</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm(f => ({ ...f, role: isUserRole(v) ? v : 'operator' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r} value={r}>
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-[10px] px-1', roleColors[r])} variant="secondary">{roleLabels[r]}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Input value={editForm.department} onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Quality Assurance" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Job Title</Label>
                  <Input value={editForm.jobTitle} onChange={(e) => setEditForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. QA Director" />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+33 1 23 45 67 89" />
                </div>
              </div>

              {/* Role Description */}
              {editForm.role && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Info className="h-3 w-3" />Role Description</p>
                  <p className="text-xs text-muted-foreground">{roleDescriptions[editForm.role]}</p>
                </div>
              )}

              {/* Permissions Preview for new role */}
              {editForm.role !== selectedUser.role && (
                <div className="border rounded-md p-3 space-y-2 border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Permissions will change to {roleLabels[editForm.role]}:</p>
                  <PermissionSummary role={editForm.role} compact />
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleEditUser} disabled={!editForm.fullName || !editForm.email}>Save Changes</Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold', avatarColors[selectedUser.role])}>
                    {getInitials(selectedUser.fullName)}
                  </div>
                  <div>
                    <p>{selectedUser.fullName || 'Unknown'}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Role Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(roleColors[selectedUser.role])} variant="secondary">{roleLabels[selectedUser.role]}</Badge>
                  <Badge variant="outline" className={cn(
                    getMemberStatus(selectedUser.id) === 'active'
                      ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400'
                      : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
                  )}>
                    {getMemberStatus(selectedUser.id) === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* User Profile Info */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{selectedUser.department || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Job Title:</span>
                      <span className="font-medium">{selectedUser.jobTitle || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedUser.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">{formatDate(selectedUser.updatedAt)}</span>
                    </div>
                  </div>
                  {hasPermission('admin.users') && (
                    <Button size="sm" variant="outline" onClick={() => { setShowDetailDialog(false); openEditDialog(selectedUser); }}>
                      <Edit className="h-3 w-3 mr-1" />Edit User
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Role & Permissions */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Role & Permissions
                    </h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={cn('cursor-default', roleColors[selectedUser.role])} variant="secondary">{roleLabels[selectedUser.role]}</Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">{roleDescriptions[selectedUser.role]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Role Description */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-xs text-muted-foreground">{roleDescriptions[selectedUser.role]}</p>
                  </div>

                  {/* Permission Summary with badges */}
                  <PermissionSummary role={selectedUser.role} />

                  {/* Permission count summary */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Key className="h-3.5 w-3.5" />
                    <span>
                      {rolePermissions[selectedUser.role].length} permissions granted across {
                        Object.entries(permissionGroups).filter(([_, group]) =>
                          group.permissions.some(p => rolePermissions[selectedUser.role].includes(p))
                        ).length
                      } modules
                    </span>
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
