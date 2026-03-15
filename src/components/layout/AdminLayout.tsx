import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar, navItems } from './AdminSidebar';
import { useApp } from '@/contexts/AppContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationTray } from '@/components/notifications/NotificationTray';
import { canAccessAdminPath, getAdminFallbackPath } from '@/modules/admin/permissions';

export function AdminLayout() {
  const location = useLocation();
  const { database, session, setCurrentHostelId, setSidebarOpen, currentUser, currentRole } = useApp();
  const currentPage = navItems.find((item) => item.path === location.pathname && item.roles.includes(currentRole));
  const tenantHostels =
    currentRole === 'tenant_admin' && currentUser?.tenantId && database
      ? database.hostels.filter((hostel) => hostel.tenantId === currentUser.tenantId)
      : [];
  const currentContextLabel =
    currentRole === 'tenant_admin'
      ? tenantHostels.find((hostel) => hostel.id === session.currentHostelId)?.name ?? 'Tenant admin'
      : currentRole === 'platform_owner'
        ? 'Platform'
        : currentRole.replace(/_/g, ' ');
  const unreadNotifications = database && currentUser
    ? database.notifications.filter((item) => item.userId === currentUser.id && !item.read).length
    : 0;
  const notifications = database && currentUser
    ? database.notifications.filter((item) => item.userId === currentUser.id).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    : [];

  if (currentRole === 'tenant_admin' && !canAccessAdminPath(currentUser, location.pathname)) {
    return <Navigate to={getAdminFallbackPath(currentUser)} replace />;
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-8 xl:px-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{currentPage?.label ?? currentRole.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{currentContextLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tenantHostels.length > 1 ? (
                <select
                  value={session.currentHostelId}
                  onChange={(event) => setCurrentHostelId(event.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {tenantHostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {currentRole === 'tenant_admin' ? <NotificationTray basePath="/admin/notifications" notifications={notifications} /> : null}
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="font-medium">{currentUser.name}</span>
                  {unreadNotifications > 0 ? <span className="text-xs text-muted-foreground">{unreadNotifications} unread</span> : null}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:px-10 xl:px-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
