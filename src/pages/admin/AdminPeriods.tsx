import { PageHeader } from '@/components/shared/PageHeader';
import { mockPeriods } from '@/services/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPeriods() {
  return (
    <div className="space-y-6">
      <PageHeader title="Academic Periods" description="Manage semesters and booking periods"
        actions={<Button variant="emerald" size="sm" onClick={() => toast.info('Create period form')}><Plus className="h-4 w-4 mr-1" /> Add Period</Button>}
      />
      <div className="space-y-3">
        {mockPeriods.map(p => (
          <div key={p.id} className="bg-card border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.type} · {p.startDate} — {p.endDate}</p>
            </div>
            <StatusBadge status={p.isActive ? 'active' : 'inactive'} variant={p.isActive ? 'success' : 'neutral'} />
          </div>
        ))}
      </div>
    </div>
  );
}
