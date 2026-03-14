import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useApp } from '@/contexts/AppContext';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLayout() {
  const { setSidebarOpen, currentUser } = useApp();

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-card border-b">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald" />
            </Button>
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="font-medium">{currentUser.name}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
