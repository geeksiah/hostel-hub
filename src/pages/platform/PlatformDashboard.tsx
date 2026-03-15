import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Shield, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { getPlatformWorkspace } from "@/modules/platform/selectors";

export default function PlatformDashboard() {
  const { database } = useApp();

  const workspace = useMemo(() => (database ? getPlatformWorkspace(database) : null), [database]);

  if (!workspace || !database) return <div className="py-10">Loading platform...</div>;

  const { metrics, tenants, detail } = workspace;
  const recentTenants = tenants.slice(0, 5);
  const enabledFlags = database.featureFlags.filter((flag) => flag.enabled).length;
  const totalFlags = database.featureFlags.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Platform snapshot."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/platform/analytics">
              <Button variant="outline" size="sm">
                Analytics
              </Button>
            </Link>
            <Link to="/platform/tenants">
              <Button variant="emerald" size="sm">
                Manage tenants
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Total tenants" value={metrics.totalTenants} icon={Building2} variant="navy" />
        <MetricCard title="Active" value={metrics.activeTenants} icon={Shield} variant="emerald" />
        <MetricCard title="Residents" value={metrics.totalResidents} icon={Users} />
        <MetricCard title="Revenue" value={`GHS ${metrics.totalRevenue.toLocaleString()}`} icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Recent tenants</h2>
              <p className="text-sm text-muted-foreground">Latest tenant accounts and current status.</p>
            </div>
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hostels</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={tenant.status}
                        variant={tenant.status === "active" ? "success" : tenant.status === "suspended" ? "error" : "warning"}
                      />
                    </TableCell>
                    <TableCell>{tenant.hostels.length}</TableCell>
                    <TableCell>{tenant.createdAt.slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Status mix</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Active tenants</span>
                  <span className="font-semibold">{metrics.activeTenants}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Suspended tenants</span>
                  <span className="font-semibold">{metrics.suspendedTenants}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Total hostels</span>
                  <span className="font-semibold">{metrics.totalHostels}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Feature adoption</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Enabled flags</p>
                  <p className="font-display text-2xl font-semibold">{enabledFlags}/{totalFlags}</p>
                </div>
                <p className="text-sm text-muted-foreground">Roll product access out tenant by tenant from the feature flags page.</p>
                <Link to="/platform/features" className="inline-flex items-center text-sm font-medium text-emerald">
                  Open feature flags
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{detail?.tenant.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {detail?.hostels.length} hostels / {detail?.residents} residents
                </p>
              </div>
              <StatusBadge
                status={detail?.tenant.status ?? "pending"}
                variant={
                  detail?.tenant.status === "active"
                    ? "success"
                    : detail?.tenant.status === "suspended"
                      ? "error"
                      : "warning"
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Tenant revenue</p>
                <p className="font-display text-lg font-semibold">GHS {detail?.revenue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Active features</p>
                <p className="font-display text-lg font-semibold">{detail?.flags.filter((flag) => flag.enabled).length}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Website readiness</p>
                <p className="font-medium">{detail?.readiness.website ? "Published" : "Draft"}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Domain</p>
                <p className="font-medium">{detail?.readiness.domain ? "Verified" : "Pending"}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="font-medium">{detail?.readiness.brand ? "Configured" : "Missing"}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="font-medium">{detail?.readiness.payments ? "Live" : "Needs setup"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Hostel footprint</h2>
            <div className="mt-3 space-y-3">
              {detail?.hostels.length ? (
                detail.hostels.map((hostel) => (
                  <div key={hostel.id} className="rounded-xl border p-3">
                    <p className="font-medium">{hostel.name}</p>
                    <p className="text-sm text-muted-foreground">{hostel.location}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hostels added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
