import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockBookings, mockRooms, mockUsers } from '@/services/mock-data';
import { Button } from '@/components/ui/button';

export default function AdminBookings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="View and manage all bookings" />
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Booking</th>
                <th className="text-left p-3 font-medium">Resident</th>
                <th className="text-left p-3 font-medium">Room</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockBookings.map(b => {
                const room = mockRooms.find(r => r.id === b.roomId);
                const user = mockUsers.find(u => u.id === b.residentId);
                return (
                  <tr key={b.id} className="hover:bg-muted/50">
                    <td className="p-3 font-medium">#{b.id}</td>
                    <td className="p-3">{user?.name}</td>
                    <td className="p-3">{room?.name}</td>
                    <td className="p-3">GHS {b.amount.toLocaleString()}</td>
                    <td className="p-3"><StatusBadge status={b.status} type="booking" /></td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">View</Button>
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
