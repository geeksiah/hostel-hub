import { Link, useLocation } from 'react-router-dom';
import type { ElementType } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  LayoutDashboard, BedDouble, Users, CalendarDays, CreditCard,
  Ticket, Building2, Settings, BarChart3, LogOut, ChevronLeft, UserCircle,
  DoorOpen,
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
  icon: ElementType;
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
  { label: 'Check-in', path: '/admin/checkin', icon: DoorOpen, roles: ['tenant_admin'], capability: 'checkin' },
  { label: 'Periods', path: '/admin/periods', icon: CalendarDays, roles: ['tenant_admin'], capability: 'periods' },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3, roles: ['tenant_admin'], capability: 'reports' },
  { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['tenant_admin'], capability: 'settings' },
  // Platform owner
  { label: 'Platform', path: '/platform', icon: LayoutDashboard, roles: ['platform_owner'] },
  { label: 'Tenants', path: '/platform/tenants', icon: Building2, roles: ['platform_owner'] },
  { label: 'Analytics', path: '/platform/analytics', icon: BarChart3, roles: ['platform_owner'] },
  { label: 'Features', path: '/platform/features', icon: Settings, roles: ['platform_owner'] },
  { label: 'Account', path: '/platform/account', icon: UserCircle, roles: ['platform_owner'] },
];

export function AdminSidebar() {
  const { currentRole, currentUser, sidebarOpen, setSidebarOpen, logout } = useApp();
  const { activeTheme, buildPublicPath } = useSiteContext();
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
        'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col border-r border-white/8 bg-slate-950 text-slate-100 transition-transform duration-200',
        sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-[92px]',
      )}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/8 px-4">
          {sidebarOpen && (
            <div>
              <span className="font-display text-lg font-semibold tracking-tight">{activeTheme?.logoText ?? "HostelHub"}</span>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{currentRole.replace('_', ' ')}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-300 hover:bg-white/6 hover:text-white">
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {filtered.map(item => {
            const active = location.pathname === item.path;
            const link = (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white shadow-none'
                    : 'text-slate-400 hover:bg-white/6 hover:text-white',
                  !sidebarOpen && 'justify-center px-0',
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

        <div className="border-t border-white/8 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout(buildPublicPath("/"))}
            className={cn(
              "w-full rounded-xl text-slate-400 hover:bg-white/6 hover:text-white",
              sidebarOpen ? "justify-start" : "justify-center px-0",
            )}
          >
            <LogOut className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
            {sidebarOpen ? "Sign Out" : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
