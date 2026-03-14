import { mockTickets } from '@/services/mock-data';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ResidentTickets() {
  const { currentUser } = useApp();
  const tickets = mockTickets.filter(t => t.residentId === currentUser?.id);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="container py-6 space-y-4 max-w-lg mx-auto">
      <PageHeader title="Support Tickets" actions={
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button variant="emerald" size="sm"><Plus className="h-4 w-4 mr-1" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit a Ticket</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2"><Label>Category</Label><Input placeholder="maintenance / room_change / general" /></div>
              <div className="space-y-2"><Label>Subject</Label><Input placeholder="Brief summary" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the issue..." /></div>
              <Button variant="emerald" className="w-full" onClick={() => { toast.success('Ticket submitted'); setShowNew(false); }}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />
      {tickets.map(t => (
        <div key={t.id} className="bg-card border rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm">{t.subject}</h3>
            <StatusBadge status={t.status} type="ticket" />
          </div>
          <p className="text-xs text-muted-foreground">{t.description}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{t.category} · {t.priority} priority · {t.createdAt}</p>
        </div>
      ))}
    </div>
  );
}
