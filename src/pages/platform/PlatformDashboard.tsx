import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Shield, TrendingUp, Users } from "lucide-react";
import { Grid } from "@/components/shared/Grid";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/currency";
import { getPlatformWorkspace } from "@/modules/platform/selectors";

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-muted/35 px-4 py-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function PlatformDashboard() {
  const { database } = useApp();
  const workspace = useMemo(() => (database ? getPlatformWorkspace(database) : null), [database]);

  if (!workspace || !database) return <div className="py-10">Loading platform...</div>;

  const { metrics, tenants, detail } = workspace;
  const enabledFlags = database.featureFlags.filter((flag) => flag.enabled).length;
  const totalFlags = database.featureFlags.length;
  const recentTenants = tenants.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform"
        description="Cross-tenant operations and readiness"
        actions={
          <>
            <Link to="/platform/analytics">
              <Button variant="outline" size="sm">
                Analytics
              </Button>
            </Link>
            <Link to="/platform/tenants">
              <Button variant="emerald" size="sm">
                Tenants
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      />

      <SurfacePanel className="p-6 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Control center</p>
              <h2 className="font-display text-[2rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[2.4rem]">
                Platform health at a glance
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Track tenant performance, operational readiness, and feature rollout without switching context.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile label="Tenants" value={`${metrics.totalTenants} total`} />
              <InfoTile label="Readiness" value={detail ? `${detail.tenant.name} in focus` : "No tenant selected"} />
              <InfoTile label="Flags" value={`${enabledFlags}/${totalFlags} enabled`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/platform/tenants">
              <Button variant="emerald" className="w-full">
                Manage tenants
              </Button>
            </Link>
            <Link to="/platform/features">
              <Button variant="outline" className="w-full">
                Feature flags
              </Button>
            </Link>
          </div>
        </div>
      </SurfacePanel>

      <Grid className="md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Tenants" value={metrics.totalTenants} icon={Building2} variant="navy" />
        <MetricCard title="Active" value={metrics.activeTenants} icon={Shield} variant="emerald" />
        <MetricCard title="Residents" value={metrics.totalResidents} icon={Users} />
        <MetricCard title="Revenue" value={formatCurrency(metrics.totalRevenue, database.marketConfig.currency)} icon={TrendingUp} />
      </Grid>

      <Grid className="xl:grid-cols-[1.02fr_0.98fr]">
        <SurfacePanel title="Recent tenants" description="Newest tenant accounts and their current state.">
          <div className="space-y-3">
            {recentTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{tenant.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tenant.hostels.length} hostels · {tenant.createdAt.slice(0, 10)}
                  </p>
                </div>
                <StatusBadge
                  status={tenant.status}
                  variant={tenant.status === "active" ? "success" : tenant.status === "suspended" ? "error" : "warning"}
                />
              </div>
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel title={detail?.tenant.name ?? "Tenant focus"} description="Operational readiness for the highlighted tenant.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-muted/35 px-4 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Revenue</p>
              <p className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-foreground">
                {formatCurrency(detail?.revenue ?? 0, detail?.tenant.currency ?? database.marketConfig.currency)}
              </p>
            </div>
            <div className="rounded-[18px] bg-muted/35 px-4 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Residents</p>
              <p className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-foreground">{detail?.residents ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="text-sm text-muted-foreground">Website</span>
              <span className="font-medium text-foreground">{detail?.readiness.website ? "Live" : "Draft"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="text-sm text-muted-foreground">Domain</span>
              <span className="font-medium text-foreground">{detail?.readiness.domain ? "Verified" : "Pending"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="text-sm text-muted-foreground">Brand</span>
              <span className="font-medium text-foreground">{detail?.readiness.brand ? "Ready" : "Missing"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="text-sm text-muted-foreground">Payments</span>
              <span className="font-medium text-foreground">{detail?.readiness.payments ? "Live" : "Setup"}</span>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-border/70 bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Feature rollout</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {enabledFlags}/{totalFlags} enabled
                </p>
              </div>
              <Link to="/platform/features" className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
                Open flags
              </Link>
            </div>
          </div>
        </SurfacePanel>
      </Grid>
    </div>
  );
}
