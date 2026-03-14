import { PageHeader } from '@/components/shared/PageHeader';
import { mockUsers, mockBookings, mockRooms } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCircle } from 'lucide-react';

export default function AdminResidents() {
  const residents = mockUsers.filter(u => u.role === 'resident');

  return (
    <div className="space-y-6">
      <PageHeader title="Residents" description="View and manage residents" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {residents.map(r => {
          const booking = mockBookings.find(b => b.residentId === r.id && ['confirmed', 'checked_in'].includes(b.status));
          const room = booking ? mockRooms.find(rm => rm.id === booking.roomId) : null;
          return (
            <div key={r.id} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
              </div>
              {booking && (
                <div className="text-xs space-y-1">
                  <p>Room: <span className="font-medium">{room?.name}</span></p>
                  <StatusBadge status={booking.status} type="booking" />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">View</Button>
                <Button variant="ghost" size="sm">Message</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
