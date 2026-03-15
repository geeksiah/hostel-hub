import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import {
  LayoutDashboard, BedDouble, Users, CalendarDays, CreditCard,
  Ticket, Building2, Settings, BarChart3, LogOut, ChevronLeft, UserCircle,
  ListChecks, DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types';
import { useSiteContext } from '@/contexts/SiteContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminCapability, hasAdminCapability } from '@/modules/admin/permissions';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  capability?: AdminCapability;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['tenant_admin'], capability: 'dashboard' },
  { label: 'Rooms', path: '/admin/rooms', icon: BedDouble, roles: ['tenant_admin'], capability: 'rooms' },
  { label: 'Residents', path: '/admin/residents', icon: Users, roles: ['tenant_admin'], capability: 'residents' },
  { label: 'Bookings', path: '/admin/bookings', icon: CalendarDays, roles: ['tenant_admin'], capability: 'bookings' },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard, roles: ['tenant_admin'], capability: 'payments' },
  { label: 'Tickets', path: '/admin/tickets', icon: Ticket, roles: ['tenant_admin'], capability: 'tickets' },
  { label: 'Check-In/Out', path: '/admin/checkin', icon: DoorOpen, roles: ['tenant_admin'], capability: 'checkin' },
  { label: 'Waiting List', path: '/admin/waiting-list', icon: ListChecks, roles: ['tenant_admin'], capability: 'waiting_list' },
  { label: 'Periods', path: '/admin/periods', icon: CalendarDays, roles: ['tenant_admin'], capability: 'periods' },
  { label: 'Pricing', path: '/admin/pricing', icon: CreditCard, roles: ['tenant_admin'], capability: 'pricing' },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3, roles: ['tenant_admin'], capability: 'reports' },
  { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['tenant_admin'], capability: 'settings' },
  { label: 'Account', path: '/admin/account', icon: UserCircle, roles: ['tenant_admin'], capability: 'account' },
  // Platform owner
  { label: 'Platform', path: '/platform', icon: LayoutDashboard, roles: ['platform_owner'] },
  { label: 'Tenants', path: '/platform/tenants', icon: Building2, roles: ['platform_owner'] },
  { label: 'Analytics', path: '/platform/analytics', icon: BarChart3, roles: ['platform_owner'] },
  { label: 'Features', path: '/platform/features', icon: Settings, roles: ['platform_owner'] },
  { label: 'Account', path: '/platform/account', icon: UserCircle, roles: ['platform_owner'] },
];

export function AdminSidebar() {
  const { currentRole, currentUser, sidebarOpen, setSidebarOpen, logout } = useApp();
  const { activeTheme } = useSiteContext();
  const location = useLocation();

  const filtered = navItems.filter((item) => {
    if (!item.roles.includes(currentRole)) return false;
    if (currentRole !== 'tenant_admin' || !item.capability) return true;
    return hasAdminCapability(currentUser, item.capability);
  });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-16',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {sidebarOpen && <span className="font-display font-bold text-lg">{activeTheme?.logoText ?? "HostelHub"}</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {filtered.map(item => {
            const active = location.pathname === item.path;
            const link = (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );

            if (sidebarOpen) return link;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User */}
        {currentUser && sidebarOpen && (
          <div className="border-t border-sidebar-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <UserCircle className="h-8 w-8 text-sidebar-foreground/60" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{currentRole.replace('_', ' ')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
