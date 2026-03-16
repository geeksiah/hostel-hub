import type {
  BrandTheme,
  FeatureFlag,
  PaymentProviderStatus,
  ServiceResult,
  Tenant,
  TenantEmailConfig,
  TenantNotificationConfig,
  TenantPaymentConfig,
  TenantSmsConfig,
  TenantType,
  TenantStatus,
  User,
} from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";
import { createDefaultTenantPaymentMethods, mergeTenantPaymentMethods } from "@/modules/payment/config";
import { createDefaultTenantEmailConfig, createDefaultTenantSmsConfig, credentialHint } from "@/modules/integrations/config";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";

export const TenantService = {
  async listTenants(): Promise<ServiceResult<Tenant[]>> {
    await delay();
    const database = readDatabase();
    return ok(database.tenants);
  },

  async getTenant(id: string): Promise<ServiceResult<Tenant | undefined>> {
    await delay();
    const database = readDatabase();
    return ok(database.tenants.find((tenant) => tenant.id === id));
  },

  async createTenant(payload: {
    name: string;
    ownerId?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    accountType?: TenantType;
    hostelLimit?: number;
    status?: TenantStatus;
  }): Promise<ServiceResult<Tenant>> {
    await delay();
    const database = readDatabase();
    const tenantId = createId("tenant");
    const siteId = createId("site");
    const themeId = createId("theme");
    const paymentConfigId = createId("paycfg");
    const emailConfigId = createId("mailcfg");
    const smsConfigId = createId("smscfg");
    const notificationConfigId = createId("notifcfg");
    const versionId = createId("site-version");
    const accountType = payload.accountType ?? "single";
    const hostelLimit = accountType === "fleet" ? Math.max(2, payload.hostelLimit ?? 3) : 1;
    const slug =
      payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || createId("slug");
    let ownerId = payload.ownerId;
    if (!ownerId) {
      const ownerUser: User = {
        id: createId("user"),
        name: payload.ownerName?.trim() || `${payload.name} Manager`,
        email: payload.ownerEmail?.trim() || `${slug}@example.com`,
        phone: payload.ownerPhone?.trim() || "",
        role: "tenant_admin",
        tenantId,
        adminAccountType: "manager",
        accountStatus: payload.status === "active" ? "active" : payload.status === "suspended" ? "suspended" : "pending",
        isTenantOwner: true,
        createdAt: new Date().toISOString(),
      };
      ownerId = ownerUser.id;
      database.users.unshift(ownerUser);
    }
    const tenant: Tenant = {
      id: tenantId,
      name: payload.name,
      ownerId,
      status: payload.status ?? "pending",
      accountType,
      hostelLimit,
      currency: database.marketConfig.currency,
      hostels: [],
      primarySiteId: siteId,
      brandThemeId: themeId,
      paymentConfigId,
      emailConfigId,
      smsConfigId,
      notificationConfigId,
      createdAt: new Date().toISOString(),
    };
    database.tenants.unshift(tenant);
    database.brandThemes.unshift({
      id: themeId,
      tenantId: tenant.id,
      name: `${payload.name} theme`,
      logoText: payload.name,
      fontDisplay: "Plus Jakarta Sans, sans-serif",
      fontBody: "Inter, sans-serif",
      backgroundColor: "#F8FAFC",
      foregroundColor: "#172033",
      cardColor: "#FFFFFF",
      cardForegroundColor: "#172033",
      primaryColor: "#12394A",
      secondaryColor: "#1F9D6B",
      accentColor: "#F59E0B",
      mutedColor: "#EEF3F7",
      mutedForegroundColor: "#5C677D",
      borderColor: "#D9E2EC",
      sidebarBackgroundColor: "#12394A",
      sidebarForegroundColor: "#F8FAFC",
      heroFromColor: "#12394A",
      heroToColor: "#215C72",
    });
    database.sites.unshift({
      id: siteId,
      tenantId: tenant.id,
      name: payload.name,
      slug,
      type: "tenant_brand",
      renderMode: "template",
      status: "draft",
      pageManifest: [
        { id: createId("page"), slug: "", title: "Home", navLabel: "Home", kind: "home", visibleInNav: true },
        { id: createId("page"), slug: "properties", title: "Properties", navLabel: "Properties", kind: "properties", visibleInNav: true },
        { id: createId("page"), slug: "about", title: "About", navLabel: "About", kind: "about", visibleInNav: true },
        { id: createId("page"), slug: "faq", title: "FAQ", navLabel: "FAQ", kind: "faq", visibleInNav: true },
        { id: createId("page"), slug: "contact", title: "Contact", navLabel: "Contact", kind: "contact", visibleInNav: true },
      ],
      currentDraftVersionId: versionId,
      assetIds: [],
    });
    database.siteVersions.unshift({
      id: versionId,
      siteId,
      label: "Initial draft",
      status: "draft",
      createdAt: new Date().toISOString(),
      templateContent: {
        eyebrow: payload.name,
        headline: `Launch ${payload.name} as a branded booking site.`,
        subheadline: "Complete brand, website, domain, and payment setup before publishing.",
        primaryCtaLabel: "Browse properties",
        primaryCtaHref: "/properties",
        secondaryCtaLabel: "Resident login",
        secondaryCtaHref: "/login",
        stats: [],
        featureBullets: ["Draft site created", "Theme ready to edit", "Payments pending setup"],
        trustPoints: ["Managed subdomain reserved", "Admin and resident dashboards inherit branding"],
        faq: [],
      },
    });
    database.domains.unshift({
      id: createId("domain"),
      siteId,
      hostname: `${slug}.${database.marketConfig.managedDomainSuffix}`,
      isPrimary: true,
      verificationStatus: "pending",
      sslStatus: "pending",
      dnsInstructions: ["Managed fallback reserved. Publish after verification."],
      redirectToPrimary: false,
      isManagedFallback: true,
    });
    database.tenantPaymentConfigs.unshift({
      id: paymentConfigId,
      tenantId: tenant.id,
      providerDisplayName: "Select provider",
      merchantLabel: payload.name,
      providerFields: {},
      generatedFields: {},
      status: "draft",
      supportedMethods: createDefaultTenantPaymentMethods(database.marketConfig),
    });
    database.tenantEmailConfigs.unshift({ ...createDefaultTenantEmailConfig(tenant.id, payload.name), id: emailConfigId });
    database.tenantSmsConfigs.unshift({ ...createDefaultTenantSmsConfig(tenant.id), id: smsConfigId });
    database.tenantNotificationConfigs.unshift({ ...createDefaultTenantNotificationConfig(tenant.id), id: notificationConfigId });
    writeDatabase(database);
    return ok(tenant);
  },

  async updateTenant(id: string, payload: Partial<Omit<Tenant, "id" | "createdAt">>): Promise<ServiceResult<Tenant | undefined>> {
    await delay();
    const database = readDatabase();
    const tenant = database.tenants.find((item) => item.id === id);
    if (tenant) {
      Object.assign(tenant, payload);
      tenant.hostelLimit = tenant.accountType === "fleet" ? Math.max(2, tenant.hostelLimit) : 1;
    }
    writeDatabase(database);
    return ok(tenant);
  },

  async deleteTenant(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const siteIds = database.sites.filter((site) => site.tenantId === id).map((site) => site.id);
    const hostelIds = database.hostels.filter((hostel) => hostel.tenantId === id).map((hostel) => hostel.id);
    const blockIds = database.blocks.filter((block) => hostelIds.includes(block.hostelId)).map((block) => block.id);
    const roomIds = database.rooms.filter((room) => hostelIds.includes(room.hostelId)).map((room) => room.id);
    const bedIds = database.beds.filter((bed) => roomIds.includes(bed.roomId)).map((bed) => bed.id);
    const periodIds = database.periods.filter((period) => hostelIds.includes(period.hostelId)).map((period) => period.id);
    const bookingIds = database.bookings.filter((booking) => hostelIds.includes(booking.hostelId)).map((booking) => booking.id);
    const groupBookingIds = database.groupBookings.filter((booking) => hostelIds.includes(booking.hostelId)).map((booking) => booking.id);
    const residentIds = database.users.filter((user) => user.role === "resident" && user.hostelId && hostelIds.includes(user.hostelId)).map((user) => user.id);
    const tenantAdminIds = database.users.filter((user) => user.role === "tenant_admin" && user.tenantId === id).map((user) => user.id);
    const userIds = new Set([...residentIds, ...tenantAdminIds]);
    database.tenants = database.tenants.filter((tenant) => tenant.id !== id);
    database.featureFlags = database.featureFlags.filter((flag) => flag.tenantId !== id);
    database.brandThemes = database.brandThemes.filter((theme) => theme.tenantId !== id);
    database.tenantPaymentConfigs = database.tenantPaymentConfigs.filter((config) => config.tenantId !== id);
    database.tenantEmailConfigs = database.tenantEmailConfigs.filter((config) => config.tenantId !== id);
    database.tenantSmsConfigs = database.tenantSmsConfigs.filter((config) => config.tenantId !== id);
    database.tenantNotificationConfigs = database.tenantNotificationConfigs.filter((config) => config.tenantId !== id);
    database.notificationDispatches = database.notificationDispatches.filter((dispatch) => dispatch.tenantId !== id);
    database.sites = database.sites.filter((site) => site.tenantId !== id);
    database.domains = database.domains.filter((domain) => !siteIds.includes(domain.siteId));
    database.siteVersions = database.siteVersions.filter((version) => !siteIds.includes(version.siteId));
    database.siteAssets = database.siteAssets.filter((asset) => !siteIds.includes(asset.siteId));
    database.hostels = database.hostels.filter((hostel) => hostel.tenantId !== id);
    database.blocks = database.blocks.filter((block) => !blockIds.includes(block.id));
    database.rooms = database.rooms.filter((room) => !roomIds.includes(room.id));
    database.roomPeriodRates = database.roomPeriodRates.filter((rate) => !roomIds.includes(rate.roomId) && !periodIds.includes(rate.periodId));
    database.beds = database.beds.filter((bed) => !bedIds.includes(bed.id));
    database.periods = database.periods.filter((period) => !periodIds.includes(period.id));
    database.bookings = database.bookings.filter((booking) => !bookingIds.includes(booking.id));
    database.groupBookings = database.groupBookings.filter((booking) => !groupBookingIds.includes(booking.id));
    database.payments = database.payments.filter(
      (payment) =>
        payment.tenantId !== id &&
        (!payment.bookingId || !bookingIds.includes(payment.bookingId)) &&
        (!payment.groupBookingId || !groupBookingIds.includes(payment.groupBookingId)),
    );
    database.tickets = database.tickets.filter((ticket) => !hostelIds.includes(ticket.hostelId));
    database.waitingList = database.waitingList.filter((entry) => !hostelIds.includes(entry.hostelId));
    database.pricingRules = database.pricingRules.filter((rule) => !hostelIds.includes(rule.hostelId));
    database.discountCodes = database.discountCodes.filter((code) => !hostelIds.includes(code.hostelId));
    database.notifications = database.notifications.filter(
      (notification) => notification.tenantId !== id && !userIds.has(notification.userId),
    );
    database.users = database.users.filter((user) => !userIds.has(user.id));
    database.residentProfiles = database.residentProfiles.filter((profile) => !residentIds.includes(profile.userId));
    writeDatabase(database);
    return ok(true);
  },

  async updateTenantStatus(id: string, status: TenantStatus): Promise<ServiceResult<Tenant | undefined>> {
    await delay();
    const database = readDatabase();
    const tenant = database.tenants.find((item) => item.id === id);
    if (tenant) {
      tenant.status = status;
      database.users
        .filter((user) => user.role === "tenant_admin" && user.tenantId === id)
        .forEach((user) => {
          user.accountStatus = status === "active" ? "active" : status === "suspended" ? "suspended" : "pending";
        });
    }
    writeDatabase(database);
    return ok(tenant);
  },

  async updateFeatureFlags(
    tenantId: string,
    flagKey: FeatureFlag["key"],
    enabled: boolean,
  ): Promise<ServiceResult<FeatureFlag | undefined>> {
    await delay();
    const database = readDatabase();
    const flag = database.featureFlags.find((item) => item.tenantId === tenantId && item.key === flagKey);
    if (flag) flag.enabled = enabled;
    writeDatabase(database);
    return ok(flag);
  },

  async updateBrandTheme(
    tenantId: string,
    payload: Partial<Omit<BrandTheme, "id" | "tenantId">>,
  ): Promise<ServiceResult<BrandTheme | undefined>> {
    await delay();
    const database = readDatabase();
    let theme = database.brandThemes.find((candidate) => candidate.tenantId === tenantId);
    if (!theme) {
      theme = {
        id: createId("theme"),
        tenantId,
        name: "Tenant theme",
        logoText: "Tenant",
        fontDisplay: "Plus Jakarta Sans, sans-serif",
        fontBody: "Inter, sans-serif",
        backgroundColor: "#F8FAFC",
        foregroundColor: "#172033",
        cardColor: "#FFFFFF",
        cardForegroundColor: "#172033",
        primaryColor: "#12394A",
        secondaryColor: "#1F9D6B",
        accentColor: "#F59E0B",
        mutedColor: "#EEF3F7",
        mutedForegroundColor: "#5C677D",
        borderColor: "#D9E2EC",
        sidebarBackgroundColor: "#12394A",
        sidebarForegroundColor: "#F8FAFC",
        heroFromColor: "#12394A",
        heroToColor: "#215C72",
      };
      database.brandThemes.push(theme);
    }
    Object.assign(theme, payload);
    writeDatabase(database);
    return ok(theme);
  },

  async updatePaymentConfig(
    tenantId: string,
    payload: Partial<Omit<TenantPaymentConfig, "id" | "tenantId">>,
  ): Promise<ServiceResult<TenantPaymentConfig | undefined>> {
    await delay();
    const database = readDatabase();
    let config = database.tenantPaymentConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (!config) {
      config = {
        id: createId("paycfg"),
        tenantId,
        providerDisplayName: "Select provider",
        merchantLabel: "",
        providerFields: {},
        generatedFields: {},
        supportedMethods: createDefaultTenantPaymentMethods(database.marketConfig),
        status: "draft",
      };
      database.tenantPaymentConfigs.push(config);
    }

    Object.assign(config, payload);
    config.providerFields = { ...config.providerFields, ...payload.providerFields };
    if (config.providerFields?.publicKey) config.publicKey = config.providerFields.publicKey;
    if (config.providerFields?.secretKey) {
      config.secretKey = config.providerFields.secretKey;
      config.secretKeyHint = credentialHint(config.providerFields.secretKey);
    }
    if (config.providerFields?.secretHash) config.secretHash = config.providerFields.secretHash;
    if (config.providerFields?.webhookUrl) config.webhookUrl = config.providerFields.webhookUrl;
    if (config.providerFields?.callbackUrl && !config.webhookUrl) config.webhookUrl = config.providerFields.callbackUrl;
    config.supportedMethods = mergeTenantPaymentMethods(database.marketConfig, payload.supportedMethods ?? config.supportedMethods);
    writeDatabase(database);
    return ok(config);
  },

  async testPaymentConfig(tenantId: string): Promise<ServiceResult<TenantPaymentConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantPaymentConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) {
      config.lastTestedAt = nowIso();
      config.testResult = config.provider ? `${config.providerDisplayName} credentials validated in mock mode.` : "Select a provider first.";
      if (config.status === "draft") config.status = "test";
    }
    writeDatabase(database);
    return ok(config);
  },

  async updatePaymentConfigStatus(
    tenantId: string,
    status: PaymentProviderStatus,
  ): Promise<ServiceResult<TenantPaymentConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantPaymentConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) config.status = status;
    writeDatabase(database);
    return ok(config);
  },

  async updateEmailConfig(
    tenantId: string,
    payload: Partial<Omit<TenantEmailConfig, "id" | "tenantId">>,
  ): Promise<ServiceResult<TenantEmailConfig | undefined>> {
    await delay();
    const database = readDatabase();
    let config = database.tenantEmailConfigs.find((candidate) => candidate.tenantId === tenantId);
    const tenant = database.tenants.find((candidate) => candidate.id === tenantId);
    if (!config) {
      config = createDefaultTenantEmailConfig(tenantId, tenant?.name ?? "Tenant");
      config.id = tenant?.emailConfigId ?? createId("mailcfg");
      database.tenantEmailConfigs.push(config);
    }
    Object.assign(config, payload);
    config.providerFields = { ...config.providerFields, ...payload.providerFields };
    config.fromEmail = config.providerFields.fromEmail ?? config.fromEmail;
    config.replyToEmail = config.providerFields.replyToEmail ?? config.replyToEmail;
    config.sendingDomain = config.providerFields.sendingDomain ?? config.sendingDomain;
    writeDatabase(database);
    return ok(config);
  },

  async testEmailConfig(tenantId: string): Promise<ServiceResult<TenantEmailConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantEmailConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) {
      config.lastTestedAt = nowIso();
      config.testResult = config.provider ? `${config.providerDisplayName} sender configuration validated in mock mode.` : "Select an email provider first.";
      if (config.status === "draft") config.status = "test";
    }
    writeDatabase(database);
    return ok(config);
  },

  async updateEmailConfigStatus(
    tenantId: string,
    status: PaymentProviderStatus,
  ): Promise<ServiceResult<TenantEmailConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantEmailConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) config.status = status;
    writeDatabase(database);
    return ok(config);
  },

  async updateSmsConfig(
    tenantId: string,
    payload: Partial<Omit<TenantSmsConfig, "id" | "tenantId">>,
  ): Promise<ServiceResult<TenantSmsConfig | undefined>> {
    await delay();
    const database = readDatabase();
    let config = database.tenantSmsConfigs.find((candidate) => candidate.tenantId === tenantId);
    const tenant = database.tenants.find((candidate) => candidate.id === tenantId);
    if (!config) {
      config = createDefaultTenantSmsConfig(tenantId);
      config.id = tenant?.smsConfigId ?? createId("smscfg");
      database.tenantSmsConfigs.push(config);
    }
    Object.assign(config, payload);
    config.providerFields = { ...config.providerFields, ...payload.providerFields };
    config.senderId = config.providerFields.senderId ?? config.senderId;
    writeDatabase(database);
    return ok(config);
  },

  async testSmsConfig(tenantId: string): Promise<ServiceResult<TenantSmsConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantSmsConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) {
      config.lastTestedAt = nowIso();
      config.testResult = config.provider ? `${config.providerDisplayName} sender credentials validated in mock mode.` : "Select an SMS provider first.";
      if (config.status === "draft") config.status = "test";
    }
    writeDatabase(database);
    return ok(config);
  },

  async updateSmsConfigStatus(
    tenantId: string,
    status: PaymentProviderStatus,
  ): Promise<ServiceResult<TenantSmsConfig | undefined>> {
    await delay();
    const database = readDatabase();
    const config = database.tenantSmsConfigs.find((candidate) => candidate.tenantId === tenantId);
    if (config) config.status = status;
    writeDatabase(database);
    return ok(config);
  },

  async updateNotificationConfig(
    tenantId: string,
    payload: Partial<Omit<TenantNotificationConfig, "id" | "tenantId">>,
  ): Promise<ServiceResult<TenantNotificationConfig | undefined>> {
    await delay();
    const database = readDatabase();
    let config = database.tenantNotificationConfigs.find((candidate) => candidate.tenantId === tenantId);
    const tenant = database.tenants.find((candidate) => candidate.id === tenantId);
    if (!config) {
      config = createDefaultTenantNotificationConfig(tenantId);
      config.id = tenant?.notificationConfigId ?? createId("notifcfg");
      database.tenantNotificationConfigs.push(config);
    }
    Object.assign(config, payload);
    if (payload.triggers) config.triggers = payload.triggers;
    writeDatabase(database);
    return ok(config);
  },

  async getPlatformAnalytics(): Promise<
    ServiceResult<{
      totalTenants: number;
      activeTenants: number;
      suspendedTenants: number;
      totalHostels: number;
      totalResidents: number;
      totalRevenue: number;
    }>
  > {
    await delay(120);
    const database = readDatabase();
    const totalRevenue = database.payments
      .filter((payment) => payment.status === "completed" || payment.status === "verified")
      .reduce((total, payment) => total + payment.amount, 0);

    return ok({
      totalTenants: database.tenants.length,
      activeTenants: database.tenants.filter((tenant) => tenant.status === "active").length,
      suspendedTenants: database.tenants.filter((tenant) => tenant.status === "suspended").length,
      totalHostels: database.hostels.length,
      totalResidents: database.users.filter((user) => user.role === "resident").length,
      totalRevenue,
    });
  },
};
