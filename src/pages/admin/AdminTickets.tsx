import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockTickets, mockUsers } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminTickets() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" description="Manage resident support requests" />
      <div className="space-y-3">
        {mockTickets.map(t => {
          const user = mockUsers.find(u => u.id === t.residentId);
          return (
            <div key={t.id} className="bg-card border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{t.subject}</h3>
                  <p className="text-xs text-muted-foreground">{user?.name} · {t.category} · {t.priority} priority</p>
                </div>
                <StatusBadge status={t.status} type="ticket" />
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="flex gap-2">
                {t.status === 'open' && <Button variant="emerald" size="sm" onClick={() => toast.success('Ticket assigned')}>Assign</Button>}
                {t.status === 'assigned' && <Button variant="emerald" size="sm" onClick={() => toast.success('Ticket resolved')}>Resolve</Button>}
                {t.status === 'resolved' && <Button variant="outline" size="sm" onClick={() => toast.success('Ticket closed')}>Close</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
