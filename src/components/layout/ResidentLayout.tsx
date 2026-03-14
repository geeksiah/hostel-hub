import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, CalendarDays, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Home', path: '/resident', icon: Home },
  { label: 'Explore', path: '/explore', icon: Search },
  { label: 'Bookings', path: '/resident/bookings', icon: CalendarDays },
  { label: 'Payments', path: '/resident/payments', icon: CreditCard },
  { label: 'Profile', path: '/resident/profile', icon: User },
];

export function ResidentLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map(tab => {
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 text-xs font-medium transition-colors',
                  active ? 'text-emerald' : 'text-muted-foreground',
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
