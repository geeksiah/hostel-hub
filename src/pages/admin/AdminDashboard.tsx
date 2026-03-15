import { Link } from "react-router-dom";
import { BedDouble, CreditCard, Ticket, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getTenantAdminWorkspace } from "@/modules/tenantAdmin/selectors";

export default function AdminDashboard() {
  const { database, session } = useApp();

  if (!database) return <div className="py-10">Loading dashboard...</div>;

  const workspace = getTenantAdminWorkspace(database, session.currentHostelId);
  const recentBookings = workspace.bookings.slice(0, 4);
  const recentTickets = workspace.tickets.slice(0, 4);
  const occupancyRate = workspace.metrics.totalBeds
    ? Math.round((workspace.metrics.occupiedBeds / workspace.metrics.totalBeds) * 100)
    : 0;
  const currency = getHostelCurrency(database, session.currentHostelId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={workspace.hostel?.name ?? "Overview"}
        actions={
          <>
            <Link to="/admin/bookings">
              <Button variant="emerald" size="sm">New booking</Button>
            </Link>
            <Link to="/admin/checkin">
              <Button variant="outline" size="sm">Check in</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Total beds" value={workspace.metrics.totalBeds} icon={BedDouble} subtitle={`${workspace.metrics.occupiedBeds} occupied`} />
        <MetricCard title="Available" value={workspace.metrics.availableBeds} icon={BedDouble} variant="emerald" />
        <MetricCard title="Revenue" value={formatCurrency(workspace.metrics.revenue, currency)} icon={CreditCard} variant="navy" />
        <MetricCard title="Open tickets" value={workspace.metrics.openTickets} icon={Ticket} variant={workspace.metrics.openTickets > 0 ? "amber" : "default"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/rooms"><Button variant="outline" size="sm">Rooms</Button></Link>
        <Link to="/admin/residents"><Button variant="outline" size="sm">Residents</Button></Link>
        <Link to="/admin/payments"><Button variant="outline" size="sm">Payments</Button></Link>
        <Link to="/admin/reports"><Button variant="outline" size="sm">Reports</Button></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-display font-semibold">Recent bookings</h2>
          <div className="mt-3 space-y-2">
            {recentBookings.map((booking) => {
              const resident = database.users.find((user) => user.id === booking.residentId);
              const room = database.rooms.find((roomItem) => roomItem.id === booking.roomId);
              return (
                <div key={booking.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{resident?.name ?? "Resident"}</p>
                    <p className="text-xs text-muted-foreground">Room {room?.name} / {formatCurrency(booking.amount, currency)}</p>
                  </div>
                  <StatusBadge status={booking.status} type="booking" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-display font-semibold">Support queue</h2>
          <div className="mt-3 space-y-2">
            {recentTickets.map((ticket) => {
              const resident = database.users.find((user) => user.id === ticket.residentId);
              return (
                <div key={ticket.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{resident?.name ?? "Resident"} / {ticket.category.replace("_", " ")}</p>
                  </div>
                  <StatusBadge status={ticket.status} type="ticket" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-display font-semibold">Occupancy</h2>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${occupancyRate}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {occupancyRate}% occupied · {workspace.metrics.occupiedBeds}/{workspace.metrics.totalBeds} beds
        </p>
      </div>
    </div>
  );
}
