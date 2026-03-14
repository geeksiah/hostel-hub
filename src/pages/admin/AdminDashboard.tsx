import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockBookings, mockPayments, mockTickets, mockRooms } from '@/services/mock-data';
import { BedDouble, Users, CreditCard, Ticket, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const totalBeds = mockRooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = mockRooms.reduce((s, r) => s + r.occupancy, 0);
  const available = totalBeds - occupied;
  const pendingBookings = mockBookings.filter(b => b.status === 'pending').length;
  const revenue = mockPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const openTickets = mockTickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Dreamland Hostel — Semester 1, 2024/2025" />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="Total Beds" value={totalBeds} icon={BedDouble} subtitle={`${occupied} occupied`} />
        <MetricCard title="Available" value={available} icon={BedDouble} variant="emerald" />
        <MetricCard title="Revenue" value={`GHS ${revenue.toLocaleString()}`} icon={CreditCard} variant="navy" trend={{ value: 12, label: 'vs last sem' }} />
        <MetricCard title="Open Tickets" value={openTickets} icon={Ticket} variant={openTickets > 0 ? 'amber' : 'default'} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="emerald" size="sm">+ New Booking</Button>
        <Button variant="outline" size="sm">Check In Resident</Button>
        <Button variant="outline" size="sm">View Reports</Button>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h3 className="font-display font-semibold">Recent Bookings</h3>
          <div className="space-y-2">
            {mockBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">Booking #{b.id}</p>
                  <p className="text-xs text-muted-foreground">Room {mockRooms.find(r => r.id === b.roomId)?.name} · GHS {b.amount}</p>
                </div>
                <StatusBadge status={b.status} type="booking" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h3 className="font-display font-semibold">Support Tickets</h3>
          <div className="space-y-2">
            {mockTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.category} · {t.priority} priority</p>
                </div>
                <StatusBadge status={t.status} type="ticket" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="font-display font-semibold">Occupancy Rate</h3>
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald rounded-full transition-all" style={{ width: `${(occupied / totalBeds) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{Math.round((occupied / totalBeds) * 100)}% occupied ({occupied}/{totalBeds} beds)</p>
      </div>
    </div>
  );
}
