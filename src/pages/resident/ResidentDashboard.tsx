import { Link } from "react-router-dom";
import { Bell, BedDouble, CreditCard, Ticket } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getUserCurrency } from "@/lib/currency";
import { getResidentWorkspace } from "@/modules/resident/selectors";
import roomImage from "@/assets/room-single.jpg";
import { resolveImageSource } from "@/lib/media";

export default function ResidentDashboard() {
  const { database, currentUser } = useApp();
  const { buildPublicPath } = useSiteContext();

  if (!database || !currentUser) return <div className="container py-10">Loading dashboard...</div>;

  const workspace = getResidentWorkspace(database, currentUser.id);
  const latestPayment = workspace.payments[0];
  const browsePath = buildPublicPath("/properties");
  const currency = getUserCurrency(database, currentUser.id);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border">
            <AvatarImage src={currentUser.avatar ? resolveImageSource(currentUser.avatar) : undefined} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold">Hello, {currentUser.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">Bookings, payments, and support in one place.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={browsePath}><Button variant="outline" size="sm">Browse rooms</Button></Link>
          <Link to="/resident/tickets"><Button variant="emerald" size="sm">New ticket</Button></Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {workspace.activeBooking && workspace.room ? (
            <Link to="/resident/bookings" className="block rounded-lg border bg-card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current assignment</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">Room {workspace.room.name}</h2>
                  <p className="text-sm text-muted-foreground">{workspace.hostel?.name}</p>
                </div>
                <StatusBadge status={workspace.activeBooking.status} type="booking" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
                <img src={roomImage} alt={workspace.room.name} className="h-28 w-full rounded-lg object-cover" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-display text-lg font-semibold">{formatCurrency(workspace.activeBooking.amount, currency)}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Stay</p>
                    <p className="font-medium">{workspace.activeBooking.durationLabel}</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">No active room assignment</h2>
              <p className="mt-2 text-sm text-muted-foreground">Browse the rooms available on your tenant site and complete a booking when ready.</p>
              <div className="mt-4">
                <Link to={browsePath}><Button variant="emerald" size="sm">Browse rooms</Button></Link>
              </div>
            </div>
          )}

          {workspace.unreadNotifications.length > 0 && (
            <div className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Unread notifications</h2>
                <Link to="/resident/notifications" className="text-sm text-emerald">View all</Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {workspace.unreadNotifications.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <MetricCard title="Bookings" value={workspace.bookings.length} icon={BedDouble} />
            <MetricCard title="Payments" value={workspace.payments.length} icon={CreditCard} />
            <MetricCard title="Alerts" value={workspace.unreadNotifications.length} icon={Bell} variant={workspace.unreadNotifications.length > 0 ? "amber" : "default"} />
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/resident/bookings" className="rounded-md border p-4 transition hover:bg-muted/40">
                <p className="font-medium">My bookings</p>
                <p className="mt-1 text-xs text-muted-foreground">Status and room changes.</p>
              </Link>
              <Link to="/resident/payments" className="rounded-md border p-4 transition hover:bg-muted/40">
                <p className="font-medium">Payments</p>
                <p className="mt-1 text-xs text-muted-foreground">Proof and receipts.</p>
              </Link>
              <Link to="/resident/qr" className="rounded-md border p-4 transition hover:bg-muted/40">
                <p className="font-medium">QR ID</p>
                <p className="mt-1 text-xs text-muted-foreground">Show for verification.</p>
              </Link>
              <Link to="/resident/profile" className="rounded-md border p-4 transition hover:bg-muted/40">
                <p className="font-medium">Profile</p>
                <p className="mt-1 text-xs text-muted-foreground">Details and documents.</p>
              </Link>
            </div>
          </div>

          {latestPayment && (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Latest payment</h2>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{formatCurrency(latestPayment.amount, currency)}</p>
                  <p className="text-sm capitalize text-muted-foreground">{latestPayment.method.replace("_", " ")}</p>
                </div>
                <StatusBadge status={latestPayment.status} type="payment" />
              </div>
            </div>
          )}

          <Link to="/resident/tickets" className="block rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-light p-2">
                <Ticket className="h-5 w-5 text-amber" />
              </div>
              <div>
                <p className="font-medium">Need help?</p>
                <p className="text-sm text-muted-foreground">Report an issue or request a change.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
