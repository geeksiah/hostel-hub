import type { TenantEmailConfig, TenantSmsConfig } from "@/types";

export function createDefaultTenantEmailConfig(tenantId: string, tenantName: string): TenantEmailConfig {
  return {
    id: `mailcfg-${tenantId}`,
    tenantId,
    providerDisplayName: "Select email provider",
    senderName: tenantName,
    providerFields: {},
    generatedFields: {},
    status: "draft",
  };
}

export function createDefaultTenantSmsConfig(tenantId: string): TenantSmsConfig {
  return {
    id: `smscfg-${tenantId}`,
    tenantId,
    providerDisplayName: "Select SMS provider",
    providerFields: {},
    generatedFields: {},
    status: "draft",
  };
}

export function credentialHint(value?: string) {
  if (!value) return undefined;
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
