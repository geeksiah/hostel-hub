import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mockHostels, mockGroupBookings } from '@/services/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function GroupBookingPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container py-6 space-y-6 max-w-lg mx-auto">
      <PageHeader title="Group Booking" description="Request accommodation for your group" />

      {/* Existing requests */}
      {mockGroupBookings.map(gb => (
        <div key={gb.id} className="bg-card border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">{gb.groupName}</p>
            <StatusBadge status={gb.status} variant={gb.status === 'requested' ? 'warning' : gb.status === 'confirmed' ? 'success' : 'info'} />
          </div>
          <p className="text-xs text-muted-foreground">{gb.bedsRequired} beds requested · {mockHostels.find(h => h.id === gb.hostelId)?.name}</p>
        </div>
      ))}

      {/* New request form */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h3 className="font-display font-semibold">New Group Request</h3>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Group Name</Label><Input placeholder="Church Youth Group" /></div>
          <div className="space-y-2"><Label>Number of Beds</Label><Input type="number" placeholder="15" /></div>
          <div className="space-y-2"><Label>Preferred Hostel</Label><Input placeholder="Dreamland Hostel" /></div>
          <div className="space-y-2"><Label>Stay Period</Label><Input placeholder="June 10 - Aug 15, 2025" /></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Any special requirements..." /></div>
          <Button variant="emerald" className="w-full" onClick={() => { toast.success('Group booking request submitted!'); setSubmitted(true); }}>
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}
