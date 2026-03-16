import { Link } from "react-router-dom";
import {
  BedDouble,
  CalendarDays,
  CreditCard,
  DoorOpen,
  ListChecks,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Grid } from "@/components/shared/Grid";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { getAdminAccountType, hasAdminCapability } from "@/modules/admin/permissions";
import { getTenantAdminWorkspace } from "@/modules/tenantAdmin/selectors";

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-muted/35 px-4 py-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ActionTile({
  title,
  href,
  variant = "outline",
}: {
  title: string;
  href: string;
  variant?: "outline" | "emerald";
}) {
  return (
    <Link to={href} className="block">
      <Button variant={variant} className="w-full justify-center">
        {title}
      </Button>
    </Link>
  );
}

function QueueItem({
  title,
  subtitle,
  status,
  type,
}: {
  title: string;
  subtitle: string;
  status: string;
  type: "booking" | "payment" | "ticket";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <StatusBadge status={status} type={type} />
    </div>
  );
}

export default function AdminDashboard() {
  const { database, session, currentUser } = useApp();

  if (!database || !currentUser) return <div className="py-10">Loading dashboard...</div>;

  const workspace = getTenantAdminWorkspace(database, session.currentHostelId);
  const adminType = getAdminAccountType(currentUser);
  const currency = getHostelCurrency(database, session.currentHostelId);
  const occupancyRate = workspace.metrics.totalBeds
    ? Math.round((workspace.metrics.occupiedBeds / workspace.metrics.totalBeds) * 100)
    : 0;
  const recentBookings = [...workspace.bookings].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);
  const checkInQueue = [...workspace.bookings]
    .filter((booking) => booking.status === "confirmed" || booking.status === "checked_in")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5);
  const recentCheckedIn = [...workspace.bookings]
    .filter((booking) => booking.status === "checked_in")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5);
  const recentTickets = [...workspace.tickets]
    .filter((ticket) => ticket.status !== "closed")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5);
  const recentPayments = [...workspace.payments].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);
  const pendingPayments = recentPayments.filter((payment) => payment.status === "pending");
  const checkedInCount = workspace.bookings.filter((booking) => booking.status === "checked_in").length;
  const verifiedPaymentsCount = workspace.payments.filter((payment) => payment.status === "completed" || payment.status === "verified").length;

  const pageTitle =
    adminType === "security" ? "Security desk" : adminType === "accountant" ? "Finance desk" : adminType === "receptionist" ? "Front desk" : "Dashboard";

  const heroDescription =
    adminType === "security"
      ? "Resident verification and check-in control for the current hostel."
      : adminType === "accountant"
        ? "Payment review and revenue visibility for the current hostel."
        : adminType === "receptionist"
          ? "Bookings, check-ins, and resident arrivals in one place."
          : "Live occupancy, bookings, payments, and support across the hostel.";

  const summaryCards =
    adminType === "manager"
      ? [
          {
            title: "Occupancy",
            value: `${occupancyRate}%`,
            subtitle: `${workspace.metrics.occupiedBeds}/${workspace.metrics.totalBeds} beds`,
            icon: BedDouble,
          },
          {
            title: "Beds open",
            value: workspace.metrics.availableBeds,
            icon: DoorOpen,
            variant: "emerald" as const,
          },
          {
            title: "Revenue",
            value: formatCurrency(workspace.metrics.revenue, currency),
            icon: CreditCard,
            variant: "navy" as const,
          },
          {
            title: "Open tickets",
            value: workspace.metrics.openTickets,
            icon: Ticket,
            variant: workspace.metrics.openTickets > 0 ? ("amber" as const) : ("default" as const),
          },
        ]
      : adminType === "receptionist"
        ? [
            {
              title: "Pending bookings",
              value: workspace.metrics.pendingBookings,
              icon: CalendarDays,
            },
            {
              title: "Checked in",
              value: checkedInCount,
              icon: DoorOpen,
              variant: "emerald" as const,
            },
            {
              title: "Waitlist",
              value: workspace.waitingList.length,
              icon: ListChecks,
            },
          ]
        : adminType === "accountant"
          ? [
              {
                title: "Revenue",
                value: formatCurrency(workspace.metrics.revenue, currency),
                icon: CreditCard,
                variant: "navy" as const,
              },
              {
                title: "Pending payments",
                value: workspace.metrics.pendingPayments,
                icon: CreditCard,
                variant: workspace.metrics.pendingPayments > 0 ? ("amber" as const) : ("default" as const),
              },
              {
                title: "Verified payments",
                value: verifiedPaymentsCount,
                icon: CreditCard,
                variant: "emerald" as const,
              },
            ]
          : [];

  const quickLinks =
    adminType === "security"
      ? [{ label: "Open scanner", href: "/admin/checkin", variant: "emerald" as const }]
      : adminType === "accountant"
        ? [
            { label: "Payments", href: "/admin/payments", variant: "emerald" as const },
            ...(hasAdminCapability(currentUser, "reports")
              ? [{ label: "Reports", href: "/admin/reports", variant: "outline" as const }]
              : []),
          ]
        : [
            ...(hasAdminCapability(currentUser, "bookings")
              ? [{ label: "Bookings", href: "/admin/bookings", variant: "emerald" as const }]
              : []),
            ...(hasAdminCapability(currentUser, "checkin")
              ? [{ label: "Check-in", href: "/admin/checkin", variant: "outline" as const }]
              : []),
            ...(hasAdminCapability(currentUser, "tickets")
              ? [{ label: "Tickets", href: "/admin/tickets", variant: "outline" as const }]
              : []),
          ];

  const overviewTiles = [
    { label: "Assignment", value: workspace.hostel?.name ?? "Current hostel" },
    { label: "Role", value: adminType.replace(/_/g, " ") },
    {
      label: "Focus",
      value:
        adminType === "security"
          ? "Verification"
          : adminType === "accountant"
            ? "Payments"
            : adminType === "receptionist"
              ? "Front desk"
              : "Operations",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={workspace.hostel?.name ?? "Overview"}
        actions={
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <ActionTile key={link.href} title={link.label} href={link.href} variant={link.variant} />
            ))}
          </div>
        }
      />

      <SurfacePanel className="p-6 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
              <h2 className="font-display text-[2rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[2.4rem]">
                {workspace.hostel?.name ?? "Current hostel"}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{heroDescription}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {overviewTiles.map((tile) => (
                <InfoTile key={tile.label} label={tile.label} value={tile.value} />
              ))}
            </div>
          </div>

          <div className={cn("grid gap-3", quickLinks.length > 1 ? "sm:grid-cols-2" : "")}>
            {quickLinks.map((link) => (
              <ActionTile key={link.href} title={link.label} href={link.href} variant={link.variant} />
            ))}
          </div>
        </div>
      </SurfacePanel>

      {summaryCards.length ? (
        <Grid className={summaryCards.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}>
          {summaryCards.map((card) => (
            <MetricCard key={card.title} title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} variant={card.variant} />
          ))}
        </Grid>
      ) : null}

      {adminType === "security" ? (
        <Grid className="xl:grid-cols-2">
          <SurfacePanel title="Verification queue" description="Residents waiting for confirmation or entry review.">
            <div className="space-y-3">
              {checkInQueue.length ? (
                checkInQueue.map((booking) => {
                  const resident = database.users.find((user) => user.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  return (
                    <QueueItem
                      key={booking.id}
                      title={resident?.name ?? "Resident"}
                      subtitle={`Room ${room?.name} · ${booking.durationLabel}`}
                      status={booking.status}
                      type="booking"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No residents in the queue.</p>
              )}
            </div>
          </SurfacePanel>

          <SurfacePanel title="Recent entries" description="Most recent successful check-ins.">
            <div className="space-y-3">
              {recentCheckedIn.length ? (
                recentCheckedIn.map((booking) => {
                  const resident = database.users.find((user) => user.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  return (
                    <QueueItem
                      key={booking.id}
                      title={resident?.name ?? "Resident"}
                      subtitle={`Room ${room?.name} · ${booking.checkInDate?.slice(0, 10) ?? "Checked in"}`}
                      status={booking.status}
                      type="booking"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No recent check-ins.</p>
              )}
            </div>
          </SurfacePanel>
        </Grid>
      ) : adminType === "accountant" ? (
        <Grid className="xl:grid-cols-2">
          <SurfacePanel title="Pending payment review" description="Payments waiting for confirmation or verification.">
            <div className="space-y-3">
              {pendingPayments.length ? (
                pendingPayments.map((payment) => (
                  <QueueItem
                    key={payment.id}
                    title={payment.reference}
                    subtitle={`${payment.method.replace("_", " ")} · ${formatCurrency(payment.amount, currency)}`}
                    status={payment.status}
                    type="payment"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payments waiting for review.</p>
              )}
            </div>
          </SurfacePanel>

          <SurfacePanel title="Recent payment activity" description="Latest recorded payment updates.">
            <div className="space-y-3">
              {recentPayments.length ? (
                recentPayments.map((payment) => (
                  <QueueItem
                    key={payment.id}
                    title={formatCurrency(payment.amount, currency)}
                    subtitle={`${payment.reference} · ${payment.method.replace("_", " ")}`}
                    status={payment.status}
                    type="payment"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent payment activity.</p>
              )}
            </div>
          </SurfacePanel>
        </Grid>
      ) : adminType === "receptionist" ? (
        <Grid className="xl:grid-cols-2">
          <SurfacePanel title="Latest bookings" description="Newest reservations and booking changes.">
            <div className="space-y-3">
              {recentBookings.length ? (
                recentBookings.map((booking) => {
                  const resident = database.users.find((user) => user.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  return (
                    <QueueItem
                      key={booking.id}
                      title={resident?.name ?? "Resident"}
                      subtitle={`Room ${room?.name} · ${formatCurrency(booking.amount, currency)}`}
                      status={booking.status}
                      type="booking"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              )}
            </div>
          </SurfacePanel>

          <SurfacePanel title="Check-in queue" description="Residents ready for front desk check-in.">
            <div className="space-y-3">
              {checkInQueue.length ? (
                checkInQueue.map((booking) => {
                  const resident = database.users.find((user) => user.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  return (
                    <QueueItem
                      key={booking.id}
                      title={resident?.name ?? "Resident"}
                      subtitle={`Room ${room?.name} · ${booking.durationLabel}`}
                      status={booking.status}
                      type="booking"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No one is waiting to check in.</p>
              )}
            </div>
          </SurfacePanel>
        </Grid>
      ) : (
        <Grid className="xl:grid-cols-2">
          <SurfacePanel title="Recent bookings" description="Latest booking activity across the hostel.">
            <div className="space-y-3">
              {recentBookings.length ? (
                recentBookings.map((booking) => {
                  const resident = database.users.find((user) => user.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  return (
                    <QueueItem
                      key={booking.id}
                      title={resident?.name ?? "Resident"}
                      subtitle={`Room ${room?.name} · ${formatCurrency(booking.amount, currency)}`}
                      status={booking.status}
                      type="booking"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              )}
            </div>
          </SurfacePanel>

          <SurfacePanel title="Support queue" description="Open issues and resident requests that need attention.">
            <div className="space-y-3">
              {recentTickets.length ? (
                recentTickets.map((ticket) => {
                  const resident = database.users.find((user) => user.id === ticket.residentId);
                  return (
                    <QueueItem
                      key={ticket.id}
                      title={ticket.subject}
                      subtitle={`${resident?.name ?? "Resident"} · ${ticket.category.replace("_", " ")}`}
                      status={ticket.status}
                      type="ticket"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No open tickets.</p>
              )}
            </div>
          </SurfacePanel>
        </Grid>
      )}
    </div>
  );
}
