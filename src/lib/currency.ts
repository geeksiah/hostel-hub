import type { AppDatabase } from "@/types";

export function getTenantCurrency(database: AppDatabase, tenantId?: string) {
  if (!tenantId) return database.marketConfig.currency;
  return database.tenants.find((tenant) => tenant.id === tenantId)?.currency ?? database.marketConfig.currency;
}

export function getHostelCurrency(database: AppDatabase, hostelId?: string) {
  if (!hostelId) return database.marketConfig.currency;
  const tenantId = database.hostels.find((hostel) => hostel.id === hostelId)?.tenantId;
  return getTenantCurrency(database, tenantId);
}

export function getUserCurrency(database: AppDatabase, userId?: string) {
  if (!userId) return database.marketConfig.currency;
  const user = database.users.find((candidate) => candidate.id === userId);
  if (user?.tenantId) return getTenantCurrency(database, user.tenantId);
  if (user?.hostelId) return getHostelCurrency(database, user.hostelId);
  return database.marketConfig.currency;
}

export function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}
