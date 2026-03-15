import type { Tenant, TenantType } from "@/types";

export const tenantAccountTypeOptions: Array<{ value: TenantType; label: string; description: string }> = [
  { value: "single", label: "Single", description: "One hostel under one tenant brand." },
  { value: "fleet", label: "Fleet", description: "Multiple hostels under one tenant brand with a platform-set cap." },
];

export function getTenantHostelLimit(tenant?: Tenant | null) {
  if (!tenant) return 0;
  return tenant.accountType === "fleet" ? Math.max(1, tenant.hostelLimit) : 1;
}

export function getRemainingHostelSlots(tenant?: Tenant | null) {
  if (!tenant) return 0;
  return Math.max(0, getTenantHostelLimit(tenant) - tenant.hostels.length);
}

export function canTenantAddHostel(tenant?: Tenant | null) {
  return getRemainingHostelSlots(tenant) > 0;
}
