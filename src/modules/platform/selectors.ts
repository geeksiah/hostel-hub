import type { AppDatabase, TenantDetailView } from "@/types";
import { getTenantBrandTheme, getTenantPaymentConfig, getTenantSites } from "@/modules/site/selectors";

export function getPlatformWorkspace(database: AppDatabase, selectedTenantId?: string) {
  const selectedTenant = database.tenants.find((tenant) => tenant.id === selectedTenantId) ?? database.tenants[0];
  const detail = selectedTenant ? getTenantDetailView(database, selectedTenant.id) : undefined;
  const totalRevenue = database.payments
    .filter((payment) => payment.status === "completed" || payment.status === "verified")
    .reduce((total, payment) => total + payment.amount, 0);

  return {
    metrics: {
      totalTenants: database.tenants.length,
      activeTenants: database.tenants.filter((tenant) => tenant.status === "active").length,
      suspendedTenants: database.tenants.filter((tenant) => tenant.status === "suspended").length,
      totalHostels: database.hostels.length,
      totalResidents: database.users.filter((user) => user.role === "resident").length,
      totalRevenue,
    },
    selectedTenant,
    detail,
    tenants: database.tenants,
  };
}

export function getTenantDetailView(database: AppDatabase, tenantId: string): TenantDetailView | undefined {
  const tenant = database.tenants.find((item) => item.id === tenantId);
  if (!tenant) return undefined;
  const hostels = database.hostels.filter((hostel) => tenant.hostels.includes(hostel.id));
  const sites = getTenantSites(database, tenantId);
  const domains = database.domains.filter((domain) => sites.some((site) => site.id === domain.siteId));
  const hostelIds = new Set(hostels.map((hostel) => hostel.id));
  const bookingIds = new Set(database.bookings.filter((booking) => hostelIds.has(booking.hostelId)).map((booking) => booking.id));
  const brandTheme = getTenantBrandTheme(database, tenantId);
  const paymentConfig = getTenantPaymentConfig(database, tenantId);
  const readiness = {
    website: sites.some((site) => Boolean(site.publishedVersionId) && site.status === "published"),
    domain: domains.some((domain) => domain.verificationStatus === "verified" && domain.isPrimary),
    brand: Boolean(brandTheme?.logoText && brandTheme.primaryColor),
    payments: Boolean(paymentConfig?.provider && paymentConfig.status === "live"),
  };
  return {
    tenant,
    hostels,
    flags: database.featureFlags.filter((flag) => flag.tenantId === tenantId),
    sites,
    domains,
    residents: database.users.filter((user) => user.role === "resident" && user.hostelId && hostelIds.has(user.hostelId)).length,
    revenue: database.payments
      .filter((payment) => (payment.bookingId ? bookingIds.has(payment.bookingId) : false))
      .filter((payment) => payment.status === "completed" || payment.status === "verified")
      .reduce((total, payment) => total + payment.amount, 0),
    brandTheme,
    paymentConfig,
    readiness,
  };
}
