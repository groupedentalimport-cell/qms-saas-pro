'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/qms/lib/utils';
import { AuthProvider, useAuth } from '@/qms/contexts/AuthContext';
import { OrganizationProvider, useOrganization } from '@/qms/contexts/OrganizationContext';
import { QueryProvider } from '@/qms/providers/QueryProvider';
import { ThemeProvider } from '@/qms/providers/ThemeProvider';
import { SetupWizard } from '@/qms/components/setup/SetupWizard';
import { GlobalSearch } from '@/qms/components/shared/GlobalSearch';
import { useI18n } from '@/qms/lib/i18n';
import type { ActiveSection, OrgSettings } from '@/qms/types/qms';
import { DashboardContent } from '@/qms/components/dashboard/DashboardContent';
import { useNavigation, NavigationProvider } from '@/qms/contexts/NavigationContext';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  Globe,
} from 'lucide-react';
import { Button } from '@/qms/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/qms/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/qms/components/ui/dropdown-menu';
import { Badge } from '@/qms/components/ui/badge';
import { useQMSStore } from '@/qms/lib/demo-store';

function AppLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { currentUser, logout, switchUser } = useAuth();
  const { currentOrg, orgSettings, updateSettings, updateOrganization } = useOrganization();
  const { locale, setLocale, t } = useI18n();
  const profiles = useQMSStore(state => state.profiles);
  const capas = useQMSStore(state => state.capas);
  const ncrs = useQMSStore(state => state.ncrs);
  const training = useQMSStore(state => state.training);

  const { activeSection, navigate } = useNavigation();

  const handleSectionChange = (section: ActiveSection) => {
    navigate(section);
    setMobileSidebarOpen(false);
  };

  // Check if setup wizard should be shown
  const showSetupWizard = useMemo(() => {
    if (!currentOrg) return false;
    return orgSettings?.setup_completed === false;
  }, [currentOrg, orgSettings]);

  const handleSetupComplete = (settings: Partial<OrgSettings>, orgName: string) => {
    // Update org settings
    updateSettings(settings);
    // Update org name via service
    if (currentOrg) {
      updateOrganization({ name: orgName });
    }
  };

  const overdueCount = [
    ...capas.filter(c => c.status !== 'Closed' && new Date(c.dueDate) < new Date()),
    ...ncrs.filter(n => n.status !== 'Closed'),
    ...training.filter(t => t.status === 'Overdue'),
  ].length;

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : currentUser?.email?.[0]?.toUpperCase() || 'U';

  // Show SetupWizard if setup is not completed
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile by default */}
      <div className={cn(
        'hidden lg:flex flex-shrink-0',
        mobileSidebarOpen && 'fixed inset-y-0 left-0 z-50 flex lg:relative'
      )}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {activeSection.replace(/-/g, ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <GlobalSearch onNavigate={handleSectionChange} />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1">
                  {overdueCount}
                </span>
              )}
            </Button>

            {/* Locale Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
              className="flex items-center gap-1.5 h-9 px-2"
              title={locale === 'en' ? 'Switch to French' : 'Passer en Anglais'}
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{locale}</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={currentUser?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{currentUser?.fullName || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{currentOrg?.name || 'Organization'}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{currentUser?.fullName}</span>
                    <span className="text-xs text-muted-foreground">{currentUser?.email}</span>
                    <Badge variant="outline" className="mt-1 w-fit text-xs capitalize">
                      {currentUser?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t.auth.switchUser} ({t.auth.demoMode})</DropdownMenuLabel>
                {profiles.filter(p => p.id !== currentUser?.id).map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => switchUser(p.id)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{p.fullName} ({p.role.replace('_', ' ')})</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.auth.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          <DashboardContent activeSection={activeSection} />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <NavigationProvider>
              <AppLayoutInner />
            </NavigationProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
