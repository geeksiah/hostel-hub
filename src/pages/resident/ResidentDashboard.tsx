import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockBookings, mockRooms, mockNotifications, mockTickets } from '@/services/mock-data';
import { useApp } from '@/contexts/AppContext';
import { BedDouble, CreditCard, Ticket, Bell, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import roomImage from '@/assets/room-single.jpg';

export default function ResidentDashboard() {
  const { currentUser } = useApp();
  const myBookings = mockBookings.filter(b => b.residentId === currentUser?.id);
  const activeBooking = myBookings.find(b => ['confirmed', 'checked_in'].includes(b.status));
  const room = activeBooking ? mockRooms.find(r => r.id === activeBooking.roomId) : null;
  const myNotifs = mockNotifications.filter(n => n.userId === currentUser?.id && !n.read);
  const myTickets = mockTickets.filter(t => t.residentId === currentUser?.id);

  return (
    <div className="container py-6 space-y-6 max-w-lg mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-xl font-bold">Hello, {currentUser?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Welcome back to HostelHub</p>
      </div>

      {/* Active Room */}
      {activeBooking && room && (
        <Link to="/resident/bookings" className="block">
          <div className="bg-emerald rounded-xl p-4 text-secondary-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-80">Current Room</span>
              <StatusBadge status={activeBooking.status} variant="success" className="border-secondary-foreground/20 bg-secondary-foreground/10 text-secondary-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary-foreground/10">
                <img src={roomImage} alt="Room" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-bold text-lg">Room {room.name}</p>
                <p className="text-xs opacity-80">
                  {room.type} · Floor {room.floor} · GHS {activeBooking.amount.toLocaleString()}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto opacity-60" />
            </div>
          </div>
        </Link>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard title="Bookings" value={myBookings.length} icon={BedDouble} />
        <MetricCard title="Tickets" value={myTickets.length} icon={Ticket} />
        <MetricCard title="Alerts" value={myNotifs.length} icon={Bell} variant={myNotifs.length > 0 ? 'amber' : 'default'} />
      </div>

      {/* Notifications */}
      {myNotifs.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-sm">Notifications</h2>
          {myNotifs.map(n => (
            <div key={n.id} className="bg-card border rounded-lg p-3 flex items-start gap-3">
              <Bell className="h-4 w-4 text-amber mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/explore" className="bg-card border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <BedDouble className="h-6 w-6 mx-auto mb-1 text-emerald" />
          <p className="text-sm font-medium">Browse Rooms</p>
        </Link>
        <Link to="/resident/tickets" className="bg-card border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <Ticket className="h-6 w-6 mx-auto mb-1 text-amber" />
          <p className="text-sm font-medium">Submit Ticket</p>
        </Link>
      </div>
    </div>
  );
}
