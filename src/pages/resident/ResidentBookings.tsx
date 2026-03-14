import { mockBookings, mockRooms } from '@/services/mock-data';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ResidentBookings() {
  const { currentUser } = useApp();
  const bookings = mockBookings.filter(b => b.residentId === currentUser?.id);

  return (
    <div className="container py-6 space-y-4 max-w-lg mx-auto">
      <PageHeader title="My Bookings" />
      {bookings.map(b => {
        const room = mockRooms.find(r => r.id === b.roomId);
        return (
          <div key={b.id} className="bg-card border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">Room {room?.name}</p>
              <StatusBadge status={b.status} type="booking" />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="capitalize">{room?.type} · Floor {room?.floor}</p>
              <p>Amount: <span className="font-medium text-foreground">GHS {b.amount.toLocaleString()}</span></p>
              <p>Booked: {b.createdAt}</p>
              {b.checkInDate && <p>Check-in: {b.checkInDate}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
