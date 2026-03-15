import { useMemo } from "react";
import { BarChart3, Building2, DollarSign, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApp } from "@/contexts/AppContext";
import { getPlatformWorkspace } from "@/modules/platform/selectors";
import { formatCurrency } from "@/lib/currency";

export default function PlatformAnalytics() {
  const { database } = useApp();
  const workspace = useMemo(() => (database ? getPlatformWorkspace(database) : null), [database]);

  if (!workspace || !database) return <div className="py-10">Loading analytics...</div>;

  const { tenants, metrics } = workspace;
  const pendingTenants = tenants.filter((tenant) => tenant.status === "pending");
  const fleetTenants = tenants.filter((tenant) => tenant.accountType === "fleet");
  const singleTenants = tenants.filter((tenant) => tenant.accountType === "single");
  const topTenants = tenants
    .map((tenant) => {
      const hostelIds = database.hostels.filter((hostel) => hostel.tenantId === tenant.id).map((hostel) => hostel.id);
      const bookingIds = database.bookings.filter((booking) => hostelIds.includes(booking.hostelId)).map((booking) => booking.id);
      const revenue = database.payments
        .filter((payment) => payment.status === "completed" || payment.status === "verified")
        .filter((payment) => (payment.bookingId ? bookingIds.includes(payment.bookingId) : payment.tenantId === tenant.id))
        .reduce((total, payment) => total + payment.amount, 0);
      const residents = database.users.filter((user) => user.role === "resident" && user.hostelId && hostelIds.includes(user.hostelId)).length;
      return { tenant, revenue, residents };
    })
    .sort((left, right) => right.revenue - left.revenue);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform analytics"
        description="Revenue, approvals, growth, and account mix."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue" value={formatCurrency(metrics.totalRevenue, database.marketConfig.currency)} icon={DollarSign} variant="emerald" />
        <MetricCard title="Residents" value={metrics.totalResidents} icon={Users} />
        <MetricCard title="Fleet tenants" value={fleetTenants.length} icon={Building2} variant="navy" />
        <MetricCard title="Pending approvals" value={pendingTenants.length} icon={BarChart3} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Revenue leaders</h2>
          <div className="mt-4 space-y-3">
            {topTenants.map(({ tenant, revenue, residents }) => (
              <div key={tenant.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.accountType} account / {tenant.hostels.length} of {tenant.accountType === "fleet" ? tenant.hostelLimit : 1} hostel slots used
                    </p>
                  </div>
                  <StatusBadge
                    status={tenant.status}
                    variant={tenant.status === "active" ? "success" : tenant.status === "suspended" ? "error" : "warning"}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-display text-lg font-semibold">{formatCurrency(revenue, tenant.currency)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Residents</p>
                    <p className="font-display text-lg font-semibold">{residents}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{tenant.createdAt.slice(0, 10)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Account mix</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Single tenants</p>
                <p className="font-display text-2xl font-semibold">{singleTenants.length}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Fleet tenants</p>
                <p className="font-display text-2xl font-semibold">{fleetTenants.length}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Active approval rate</p>
                <p className="font-display text-2xl font-semibold">
                  {tenants.length ? Math.round((metrics.activeTenants / tenants.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Approval queue</h2>
            <div className="mt-4 space-y-3">
              {pendingTenants.length ? (
                pendingTenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.accountType} / {tenant.accountType === "fleet" ? `${tenant.hostelLimit} hostel limit requested` : "1 hostel"}
                        </p>
                      </div>
                      <StatusBadge status="pending" variant="warning" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pending tenant approvals right now.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
