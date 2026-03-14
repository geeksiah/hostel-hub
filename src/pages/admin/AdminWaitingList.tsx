import { PageHeader } from '@/components/shared/PageHeader';
import { mockWaitingList, mockUsers } from '@/services/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminWaitingList() {
  return (
    <div className="space-y-6">
      <PageHeader title="Waiting List" description="Manage bed waiting lists" />
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Resident</th>
              <th className="text-left p-3 font-medium">Room Type</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockWaitingList.map(w => {
              const user = mockUsers.find(u => u.id === w.residentId);
              return (
                <tr key={w.id}>
                  <td className="p-3">{w.position}</td>
                  <td className="p-3">{user?.name}</td>
                  <td className="p-3 capitalize">{w.roomType}</td>
                  <td className="p-3"><StatusBadge status={w.status} variant={w.status === 'waiting' ? 'warning' : 'success'} /></td>
                  <td className="p-3"><Button variant="emerald" size="sm" onClick={() => toast.success('Resident notified')}>Notify</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
