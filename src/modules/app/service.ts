import type {
  AccountStatus,
  AdminAccountType,
  AppDatabase,
  ResidentProfile,
  ServiceResult,
  TenantType,
  User,
  UserRole,
} from "@/types";
import { createId, readDatabase, resetDatabase, writeDatabase } from "@/services/store";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";
import { createDefaultTenantPaymentMethods } from "@/modules/payment/config";
import { createDefaultTenantEmailConfig, createDefaultTenantSmsConfig } from "@/modules/integrations/config";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";

export const DataService = {
  async getSnapshot(): Promise<ServiceResult<AppDatabase>> {
    await delay(90);
    return ok(readDatabase());
  },

  async resetDemo(): Promise<ServiceResult<AppDatabase>> {
    await delay(90);
    return ok(resetDatabase());
  },
};

export const AuthService = {
  async login(email: string, _password = ""): Promise<ServiceResult<User | null>> {
    await delay();
    const database = readDatabase();
    const user = database.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
    if (!user) return ok(null);
    if (user.accountStatus === "pending") {
      return {
        data: null,
        error: {
          code: "ACCOUNT_PENDING",
          message: "This account is waiting for platform approval.",
        },
      };
    }
    if (user.accountStatus === "suspended") {
      return {
        data: null,
        error: {
          code: "ACCOUNT_SUSPENDED",
          message: "This account has been suspended.",
        },
      };
    }
    if (user.role === "tenant_admin") {
      const tenant = database.tenants.find((item) => item.id === user.tenantId);
      if (tenant?.status === "pending") {
        return {
          data: null,
          error: {
            code: "TENANT_PENDING",
            message: "This tenant account is still waiting for platform approval.",
          },
        };
      }
      if (tenant?.status === "suspended") {
        return {
          data: null,
          error: {
            code: "TENANT_SUSPENDED",
            message: "This tenant account has been suspended by the platform owner.",
          },
        };
      }
    }
    return ok(user);
  },

  async quickLogin(role: UserRole): Promise<ServiceResult<User | null>> {
    await delay();
    const database = readDatabase();
    const user =
      database.users.find((item) => item.role === role && item.accountStatus !== "pending" && item.accountStatus !== "suspended") ?? null;
    return ok(user);
  },

  async register(payload: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    residentType?: ResidentProfile["residentType"];
    institution?: string;
    tenantAccountType?: TenantType;
    hostelLimit?: number;
    tenantId?: string;
    hostelId?: string;
  }): Promise<ServiceResult<User>> {
    await delay();
    const database = readDatabase();
    const user: User = {
      id: createId("user"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      accountStatus: payload.role === "tenant_admin" ? "pending" : "active",
      createdAt: nowIso(),
    };

    if (payload.role === "tenant_admin") {
      const tenantId = createId("tenant");
      const siteId = createId("site");
      const themeId = createId("theme");
      const paymentConfigId = createId("paycfg");
      const emailConfigId = createId("mailcfg");
      const smsConfigId = createId("smscfg");
      const notificationConfigId = createId("notifcfg");
      const versionId = createId("site-version");
      const accountType = payload.tenantAccountType ?? "single";
      const hostelLimit = accountType === "fleet" ? Math.max(2, payload.hostelLimit ?? 3) : 1;
      const slug =
        payload.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || tenantId;

      user.tenantId = tenantId;
      user.adminAccountType = "manager";
      user.isTenantOwner = true;

      database.tenants.push({
        id: tenantId,
        name: payload.name,
        ownerId: user.id,
        status: "pending",
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
        createdAt: nowIso(),
      });

      database.brandThemes.push({
        id: themeId,
        tenantId,
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

      database.sites.push({
        id: siteId,
        tenantId,
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

      database.siteVersions.push({
        id: versionId,
        siteId,
        label: "Initial draft",
        status: "draft",
        createdAt: nowIso(),
        templateContent: {
          eyebrow: payload.name,
          headline: `Launch ${payload.name} as a branded booking site.`,
          subheadline: "Update your theme, website copy, custom domain, and payment setup before publishing.",
          primaryCtaLabel: "Browse properties",
          primaryCtaHref: "/properties",
          secondaryCtaLabel: "Resident login",
          secondaryCtaHref: "/login",
          stats: [],
          featureBullets: ["Draft site created", "Brand theme ready to edit", "Payment setup ready to configure"],
          trustPoints: ["Managed subdomain provisioned", "Dashboards inherit tenant branding", "Publish when ready"],
          faq: [],
        },
      });

      database.domains.push({
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

      database.tenantPaymentConfigs.push({
        id: paymentConfigId,
        tenantId,
        providerDisplayName: "Select provider",
        merchantLabel: payload.name,
        providerFields: {},
        generatedFields: {},
        status: "draft",
        supportedMethods: createDefaultTenantPaymentMethods(database.marketConfig),
      });
      database.tenantEmailConfigs.push({ ...createDefaultTenantEmailConfig(tenantId, payload.name), id: emailConfigId });
      database.tenantSmsConfigs.push({ ...createDefaultTenantSmsConfig(tenantId), id: smsConfigId });
      database.tenantNotificationConfigs.push({ ...createDefaultTenantNotificationConfig(tenantId), id: notificationConfigId });
    }

    database.users.push(user);

    if (payload.role === "resident") {
      const residentHostelId = payload.hostelId;
      const residentTenantId = payload.tenantId ?? database.hostels.find((hostel) => hostel.id === residentHostelId)?.tenantId;
      user.tenantId = residentTenantId;
      user.hostelId = residentHostelId;

      database.residentProfiles.push({
        id: createId("resident"),
        userId: user.id,
        residentType: payload.residentType ?? "student",
        institution:
          payload.institution ??
          database.hostels.find((hostel) => hostel.id === residentHostelId)?.university ??
          "",
        emergencyContact: "",
        gender: "other",
      });
    }

    writeDatabase(database);
    return ok(user);
  },

  async getCurrentUser(userId: string): Promise<ServiceResult<User | null>> {
    await delay(90);
    const database = readDatabase();
    return ok(database.users.find((item) => item.id === userId) ?? null);
  },
};

export const UserService = {
  async updateAccount(
    userId: string,
    payload: Partial<
      Pick<User, "name" | "email" | "phone" | "avatar" | "hostelId" | "tenantId" | "accountStatus" | "adminAccountType" | "isTenantOwner">
    >,
  ): Promise<ServiceResult<User | undefined>> {
    await delay();
    const database = readDatabase();
    const user = database.users.find((item) => item.id === userId);
    if (user) Object.assign(user, payload);
    writeDatabase(database);
    return ok(user);
  },

  async listTenantAdmins(tenantId: string): Promise<ServiceResult<User[]>> {
    await delay();
    const database = readDatabase();
    return ok(database.users.filter((user) => user.role === "tenant_admin" && user.tenantId === tenantId));
  },

  async createTenantAdmin(payload: {
    tenantId: string;
    hostelId?: string;
    name: string;
    email: string;
    phone: string;
    adminAccountType: AdminAccountType;
    accountStatus?: AccountStatus;
  }): Promise<ServiceResult<User>> {
    await delay();
    const database = readDatabase();
    const user: User = {
      id: createId("user"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "tenant_admin",
      tenantId: payload.tenantId,
      hostelId: payload.hostelId,
      adminAccountType: payload.adminAccountType,
      accountStatus: payload.accountStatus ?? "active",
      isTenantOwner: false,
      createdAt: nowIso(),
    };
    database.users.unshift(user);
    writeDatabase(database);
    return ok(user);
  },

  async deleteTenantAdmin(userId: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const user = database.users.find((item) => item.id === userId);
    if (!user || user.role !== "tenant_admin" || user.isTenantOwner) return ok(false);
    database.users = database.users.filter((item) => item.id !== userId);
    database.notifications = database.notifications.filter((item) => item.userId !== userId);
    database.notificationDispatches = database.notificationDispatches.filter((item) => item.userId !== userId);
    database.tickets.forEach((ticket) => {
      if (ticket.assignedTo === userId) ticket.assignedTo = undefined;
    });
    writeDatabase(database);
    return ok(true);
  },

  async createGroupOrganizer(payload: {
    name: string;
    email: string;
    phone: string;
  }): Promise<ServiceResult<User>> {
    await delay();
    const database = readDatabase();
    const user: User = {
      id: createId("user"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "group_organizer",
      accountStatus: "active",
      createdAt: nowIso(),
    };
    database.users.unshift(user);
    writeDatabase(database);
    return ok(user);
  },
};
