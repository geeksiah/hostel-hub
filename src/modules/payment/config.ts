import type { MarketConfig, TenantPaymentMethodConfig } from "@/types";

function defaultInstructions(method: TenantPaymentMethodConfig["method"]) {
  if (method === "bank_transfer") return "Share your bank details with residents and ask them to upload proof for manual verification.";
  if (method === "cash") return "Collect payment at the front desk and verify it manually before confirming the booking.";
  if (method === "momo") return "Route residents through the tenant's configured mobile money gateway.";
  return "Use the tenant's configured online checkout to capture payment instantly.";
}

export function createDefaultTenantPaymentMethods(marketConfig: MarketConfig): TenantPaymentMethodConfig[] {
  return marketConfig.paymentMethods.map((method) => ({
    method: method.value,
    enabled: method.value === "bank_transfer",
    channel: method.value === "cash" || method.value === "bank_transfer" ? "offline" : "online",
    displayLabel: method.label,
    instructions: defaultInstructions(method.value),
  }));
}

export function mergeTenantPaymentMethods(
  marketConfig: MarketConfig,
  existing: TenantPaymentMethodConfig[] | undefined,
) {
  const defaults = createDefaultTenantPaymentMethods(marketConfig);
  if (!existing?.length) return defaults;

  return defaults.map((fallback) => {
    const current = existing.find((item) => item.method === fallback.method);
    return current ? { ...fallback, ...current } : fallback;
  });
}
