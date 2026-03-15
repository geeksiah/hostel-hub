import type { AdminAccountType, User } from "@/types";

export type AdminCapability =
  | "dashboard"
  | "rooms"
  | "residents"
  | "bookings"
  | "payments"
  | "tickets"
  | "checkin"
  | "waiting_list"
  | "periods"
  | "pricing"
  | "reports"
  | "notifications"
  | "settings"
  | "account";

const allCapabilities: AdminCapability[] = [
  "dashboard",
  "rooms",
  "residents",
  "bookings",
  "payments",
  "tickets",
  "checkin",
  "waiting_list",
  "periods",
  "pricing",
  "reports",
  "notifications",
  "settings",
  "account",
];

const capabilityByAdminType: Record<AdminAccountType, AdminCapability[]> = {
  manager: allCapabilities,
  receptionist: [
    "dashboard",
    "rooms",
    "residents",
    "bookings",
    "tickets",
    "checkin",
    "waiting_list",
    "periods",
    "notifications",
    "account",
  ],
  accountant: [
    "dashboard",
    "payments",
    "pricing",
    "reports",
    "notifications",
    "account",
  ],
  security: [
    "dashboard",
    "checkin",
    "notifications",
    "account",
  ],
};

const adminPathCapabilities: Array<{ capability: AdminCapability; matcher: (path: string) => boolean }> = [
  { capability: "dashboard", matcher: (path) => path === "/admin" },
  { capability: "rooms", matcher: (path) => path.startsWith("/admin/rooms") },
  { capability: "residents", matcher: (path) => path.startsWith("/admin/residents") },
  { capability: "bookings", matcher: (path) => path.startsWith("/admin/bookings") },
  { capability: "payments", matcher: (path) => path.startsWith("/admin/payments") },
  { capability: "tickets", matcher: (path) => path.startsWith("/admin/tickets") },
  { capability: "checkin", matcher: (path) => path.startsWith("/admin/checkin") },
  { capability: "waiting_list", matcher: (path) => path.startsWith("/admin/waiting-list") },
  { capability: "periods", matcher: (path) => path.startsWith("/admin/periods") },
  { capability: "pricing", matcher: (path) => path.startsWith("/admin/pricing") },
  { capability: "reports", matcher: (path) => path.startsWith("/admin/reports") },
  { capability: "notifications", matcher: (path) => path.startsWith("/admin/notifications") },
  { capability: "settings", matcher: (path) => path.startsWith("/admin/settings") },
  { capability: "account", matcher: (path) => path.startsWith("/admin/account") },
];

export const adminAccountTypeOptions: Array<{ value: AdminAccountType; label: string; description: string }> = [
  { value: "manager", label: "Manager", description: "Full access across operations, finance, settings, and staff management." },
  { value: "receptionist", label: "Receptionist", description: "Front-desk operations without financial reports or payment configuration." },
  { value: "accountant", label: "Accountant", description: "Payments, pricing, and financial reports only." },
  { value: "security", label: "Security", description: "Scanner desk for resident and group access verification." },
];

export function getAdminAccountType(user?: User | null): AdminAccountType {
  return user?.adminAccountType ?? "manager";
}

export function getAdminCapabilities(user?: User | null): Set<AdminCapability> {
  return new Set(capabilityByAdminType[getAdminAccountType(user)]);
}

export function hasAdminCapability(user: User | null | undefined, capability: AdminCapability) {
  if (!user || user.role !== "tenant_admin") return false;
  return capabilityByAdminType[getAdminAccountType(user)].includes(capability);
}

export function canAccessAdminPath(user: User | null | undefined, path: string) {
  if (!user || user.role !== "tenant_admin") return false;
  const required = adminPathCapabilities.find((item) => item.matcher(path));
  if (!required) return true;
  return hasAdminCapability(user, required.capability);
}

export function getAdminFallbackPath(user: User | null | undefined) {
  if (!user || user.role !== "tenant_admin") return "/login";
  const adminType = getAdminAccountType(user);
  if (adminType === "security") return "/admin/checkin";
  if (adminType === "accountant") return "/admin/payments";
  return "/admin";
}

export function isFinanceRestrictedAdmin(user?: User | null) {
  return getAdminAccountType(user) === "receptionist";
}

export function isSecurityAdmin(user?: User | null) {
  return getAdminAccountType(user) === "security";
}
