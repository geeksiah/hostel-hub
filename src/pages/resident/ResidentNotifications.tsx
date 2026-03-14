import { mockNotifications } from '@/services/mock-data';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Bell, CreditCard, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = { booking: CalendarDays, payment: CreditCard, ticket: AlertCircle, system: Bell };

export default function ResidentNotifications() {
  const { currentUser } = useApp();
  const notifs = mockNotifications.filter(n => n.userId === currentUser?.id);

  return (
    <div className="container py-6 space-y-4 max-w-lg mx-auto">
      <PageHeader title="Notifications" />
      {notifs.map(n => {
        const Icon = typeIcons[n.type];
        return (
          <div key={n.id} className={cn('bg-card border rounded-lg p-4 flex items-start gap-3', !n.read && 'border-emerald/30 bg-emerald-light')}>
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt} · {n.channel}</p>
            </div>
            {!n.read && <span className="h-2 w-2 rounded-full bg-emerald shrink-0 mt-1.5" />}
          </div>
        );
      })}
    </div>
  );
}
