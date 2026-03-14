import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockPayments, mockUsers } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminPayments() {
  const handleVerify = (id: string) => toast.success(`Payment ${id} verified`);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track and verify payments" />
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Reference</th>
                <th className="text-left p-3 font-medium">Resident</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockPayments.map(p => {
                const user = mockUsers.find(u => u.id === p.residentId);
                return (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{p.reference}</td>
                    <td className="p-3">{user?.name}</td>
                    <td className="p-3 font-medium">GHS {p.amount.toLocaleString()}</td>
                    <td className="p-3 uppercase text-xs">{p.method}</td>
                    <td className="p-3"><StatusBadge status={p.status} type="payment" /></td>
                    <td className="p-3">
                      {p.status === 'pending' && <Button variant="emerald" size="sm" onClick={() => handleVerify(p.id)}>Verify</Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
