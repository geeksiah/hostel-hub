import { toast } from "sonner";
import { CheckCircle2, Slash } from "lucide-react";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { TenantService } from "@/services";

export default function PlatformFeatures() {
  const { database, refreshData } = useApp();

  if (!database) return <div className="py-10">Loading features...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Feature flags" description="Control feature access." />

      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead>Tenant</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {database.featureFlags.map((flag) => {
              const tenant = database.tenants.find((item) => item.id === flag.tenantId);
              return (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium">{tenant?.name ?? "Global"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{flag.name}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={flag.enabled ? "enabled" : "disabled"} variant={flag.enabled ? "success" : "neutral"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenuSheet
                      title={flag.name}
                      description={tenant?.name ?? "Global flag"}
                      details={<p><span className="text-muted-foreground">Tenant:</span> {tenant?.name ?? "Global"}</p>}
                      actions={[
                        {
                          label: flag.enabled ? "Disable feature" : "Enable feature",
                          icon: flag.enabled ? <Slash className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
                          onSelect: async () => {
                            if (!flag.tenantId) return;
                            await TenantService.updateFeatureFlags(flag.tenantId, flag.key, !flag.enabled);
                            await refreshData();
                            toast.success(`${flag.name} ${flag.enabled ? "disabled" : "enabled"}.`);
                          },
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
