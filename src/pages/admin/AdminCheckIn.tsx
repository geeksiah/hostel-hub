import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockBookings, mockRooms, mockUsers } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { DoorOpen, Search } from 'lucide-react';

export default function AdminCheckIn() {
  const [search, setSearch] = useState('');
  const activeBookings = mockBookings.filter(b => ['confirmed', 'checked_in'].includes(b.status));

  return (
    <div className="space-y-6">
      <PageHeader title="Check-In / Check-Out" description="Manage resident arrivals and departures" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or room..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-3">
        {activeBookings.map(b => {
          const user = mockUsers.find(u => u.id === b.residentId);
          const room = mockRooms.find(r => r.id === b.roomId);
          return (
            <div key={b.id} className="bg-card border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Room {room?.name} · Booking #{b.id}</p>
                <StatusBadge status={b.status} type="booking" />
              </div>
              <div className="flex gap-2">
                {b.status === 'confirmed' && (
                  <Button variant="emerald" size="sm" onClick={() => toast.success(`${user?.name} checked in!`)}>
                    <DoorOpen className="h-4 w-4 mr-1" /> Check In
                  </Button>
                )}
                {b.status === 'checked_in' && (
                  <Button variant="outline" size="sm" onClick={() => toast.success(`${user?.name} checked out!`)}>
                    <DoorOpen className="h-4 w-4 mr-1" /> Check Out
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
