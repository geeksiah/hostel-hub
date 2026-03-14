import { mockPayments } from '@/services/mock-data';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ResidentPayments() {
  const { currentUser } = useApp();
  const payments = mockPayments.filter(p => p.residentId === currentUser?.id);

  return (
    <div className="container py-6 space-y-4 max-w-lg mx-auto">
      <PageHeader title="Payments" />
      {payments.map(p => (
        <div key={p.id} className="bg-card border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">GHS {p.amount.toLocaleString()}</p>
            <StatusBadge status={p.status} type="payment" />
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Ref: <span className="font-mono">{p.reference}</span></p>
            <p className="uppercase">{p.method}</p>
            <p>{p.createdAt}</p>
          </div>
          {p.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => toast.info('Downloading receipt...')}>
              <Download className="h-3.5 w-3.5 mr-1" /> Receipt
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
