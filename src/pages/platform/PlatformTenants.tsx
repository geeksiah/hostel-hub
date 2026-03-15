import { useMemo, useState } from "react";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/currency";
import { tenantAccountTypeOptions } from "@/modules/platform/account-types";
import { getPlatformWorkspace } from "@/modules/platform/selectors";
import { TenantService, UserService } from "@/services";
import type { TenantStatus } from "@/types";

const emptyTenantForm = {
  id: "",
  name: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  accountType: "single" as const,
  hostelLimit: 1,
  currency: "GHS",
  status: "pending" as TenantStatus,
};

export default function PlatformTenants() {
  const { database, refreshData } = useApp();
  const [selectedTenantId, setSelectedTenantId] = useState("t1");
  const [form, setForm] = useState(emptyTenantForm);
  const [tenantOverlayOpen, setTenantOverlayOpen] = useState(false);

  const workspace = useMemo(
    () => (database ? getPlatformWorkspace(database, selectedTenantId) : null),
    [database, selectedTenantId],
  );

  if (!workspace || !database) return <div className="py-10">Loading tenants...</div>;

  const { tenants, detail } = workspace;

  const openCreate = () => {
    setForm({ ...emptyTenantForm, currency: database.marketConfig.currency });
    setTenantOverlayOpen(true);
  };

  const openEdit = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);
    const owner = tenant ? database.users.find((user) => user.id === tenant.ownerId) : undefined;
    if (!tenant) return;
    setForm({
      id: tenant.id,
      name: tenant.name,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      ownerPhone: owner?.phone ?? "",
      accountType: tenant.accountType,
      hostelLimit: tenant.hostelLimit,
      currency: tenant.currency,
      status: tenant.status,
    });
    setTenantOverlayOpen(true);
  };

  const saveTenant = async () => {
    if (!form.name.trim() || !form.ownerEmail.trim()) return;
    if (form.id) {
      const tenant = tenants.find((item) => item.id === form.id);
      await TenantService.updateTenant(form.id, {
        name: form.name.trim(),
        status: form.status,
        accountType: form.accountType,
        hostelLimit: form.accountType === "fleet" ? Math.max(2, form.hostelLimit) : 1,
        currency: form.currency,
      });
      if (tenant?.ownerId) {
        await UserService.updateAccount(tenant.ownerId, {
          name: form.ownerName.trim(),
          email: form.ownerEmail.trim(),
          phone: form.ownerPhone.trim(),
          accountStatus: form.status === "active" ? "active" : form.status === "suspended" ? "suspended" : "pending",
        });
      }
      toast.success("Tenant updated.");
    } else {
      await TenantService.createTenant({
        name: form.name.trim(),
        ownerName: form.ownerName.trim() || `${form.name.trim()} Manager`,
        ownerEmail: form.ownerEmail.trim(),
        ownerPhone: form.ownerPhone.trim(),
        accountType: form.accountType,
        hostelLimit: form.accountType === "fleet" ? Math.max(2, form.hostelLimit) : 1,
        status: form.status,
      });
      toast.success("Tenant created.");
    }
    await refreshData();
    setTenantOverlayOpen(false);
    setForm(emptyTenantForm);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant accounts"
        description="Approvals, tenant owners, and hostel limits."
        actions={
          <Button variant="emerald" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add tenant
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Tenants</h2>
              <p className="text-sm text-muted-foreground">Platform approval and account management for every tenant.</p>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Tenant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hostels</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className={selectedTenantId === tenant.id ? "bg-muted/30" : ""}
                  onClick={() => setSelectedTenantId(tenant.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.createdAt.slice(0, 10)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {tenant.accountType}
                    <p className="text-xs text-muted-foreground">{tenant.accountType === "fleet" ? `${tenant.hostelLimit} hostels` : "1 hostel"}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={tenant.status}
                      variant={tenant.status === "active" ? "success" : tenant.status === "suspended" ? "error" : "warning"}
                    />
                  </TableCell>
                  <TableCell>{tenant.hostels.length}</TableCell>
                  <TableCell className="text-right">
                    <ActionMenuSheet
                      title={tenant.name}
                      description="Tenant actions"
                      onViewDetails={() => setSelectedTenantId(tenant.id)}
                      details={
                        <>
                          <p><span className="text-muted-foreground">Owner:</span> {database.users.find((user) => user.id === tenant.ownerId)?.email ?? tenant.ownerId}</p>
                          <p><span className="text-muted-foreground">Limit:</span> {tenant.accountType === "fleet" ? tenant.hostelLimit : 1} hostels</p>
                        </>
                      }
                      actions={[
                        {
                          label: tenant.status === "pending" ? "Approve tenant" : tenant.status === "active" ? "Suspend tenant" : "Activate tenant",
                          icon: <Shield className="h-4 w-4" />,
                          onSelect: async () => {
                            const nextStatus = tenant.status === "pending" ? "active" : tenant.status === "active" ? "suspended" : "active";
                            await TenantService.updateTenantStatus(tenant.id, nextStatus);
                            await refreshData();
                            toast.success(`${tenant.name} ${nextStatus}.`);
                          },
                        },
                        {
                          label: "Edit tenant",
                          icon: <Pencil className="h-4 w-4" />,
                          onSelect: () => openEdit(tenant.id),
                        },
                        {
                          label: "Delete tenant",
                          icon: <Trash2 className="h-4 w-4" />,
                          destructive: true,
                          onSelect: async () => {
                            await TenantService.deleteTenant(tenant.id);
                            await refreshData();
                            if (selectedTenantId === tenant.id) {
                              setSelectedTenantId(tenants.find((item) => item.id !== tenant.id)?.id ?? "");
                            }
                            toast.success("Tenant deleted.");
                          },
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{detail?.tenant.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {detail?.tenant.accountType} / {detail?.hostels.length} of {detail?.tenant.accountType === "fleet" ? detail?.tenant.hostelLimit : 1} hostel slots used
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
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-display text-lg font-semibold">{formatCurrency(detail?.revenue ?? 0, detail?.tenant.currency ?? database.marketConfig.currency)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Residents</p>
                <p className="font-display text-lg font-semibold">{detail?.residents ?? 0}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="font-medium">{detail?.readiness.website ? "Ready" : "Draft"}</p>
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

      <ResponsiveOverlay
        open={tenantOverlayOpen}
        onOpenChange={setTenantOverlayOpen}
        title={form.id ? "Edit tenant" : "Create tenant"}
        description="Tenant owner, status, and hostel limit."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tenant name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as TenantStatus })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="pending">Pending approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Owner name</Label>
            <Input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Owner email</Label>
            <Input value={form.ownerEmail} onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Owner phone</Label>
            <Input value={form.ownerPhone} onChange={(event) => setForm({ ...form, ownerPhone: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {database.marketConfig.supportedCurrencies.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Account type</Label>
            <select
              value={form.accountType}
              onChange={(event) => setForm({ ...form, accountType: event.target.value as typeof form.accountType, hostelLimit: event.target.value === "fleet" ? Math.max(2, form.hostelLimit) : 1 })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {tenantAccountTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Hostel limit</Label>
            <Input
              type="number"
              min={form.accountType === "fleet" ? 2 : 1}
              value={form.accountType === "fleet" ? form.hostelLimit : 1}
              disabled={form.accountType === "single"}
              onChange={(event) => setForm({ ...form, hostelLimit: Math.max(2, Number(event.target.value || 2)) })}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setTenantOverlayOpen(false)}>Cancel</Button>
          <Button variant="emerald" onClick={() => void saveTenant()}>
            {form.id ? "Save tenant" : "Create tenant"}
          </Button>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
