import type { DomainMapping, ServiceResult, Site, SiteAsset, SiteRenderMode, SiteType, SiteVersion } from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";

export const SiteService = {
  async listTenantSites(tenantId: string): Promise<ServiceResult<Site[]>> {
    await delay();
    const database = readDatabase();
    return ok(database.sites.filter((site) => site.tenantId === tenantId));
  },

  async createSite(payload: {
    tenantId: string;
    name: string;
    slug: string;
    type?: SiteType;
    renderMode?: SiteRenderMode;
    hostelId?: string;
  }): Promise<ServiceResult<Site>> {
    await delay();
    const database = readDatabase();
    const siteId = createId("site");
    const versionId = createId("site-version");
    const baseSlug =
      payload.slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || createId("site");
    let normalizedSlug = baseSlug;
    let slugAttempt = 2;
    while (database.sites.some((site) => site.slug === normalizedSlug)) {
      normalizedSlug = `${baseSlug}-${slugAttempt}`;
      slugAttempt += 1;
    }
    const type = payload.type ?? "hostel_microsite";
    const renderMode = payload.renderMode ?? "template";
    const linkedHostel = payload.hostelId ? database.hostels.find((hostel) => hostel.id === payload.hostelId) : undefined;

    const site: Site = {
      id: siteId,
      tenantId: payload.tenantId,
      hostelId: linkedHostel?.id,
      name: payload.name,
      slug: normalizedSlug,
      type,
      renderMode,
      status: "draft",
      pageManifest: [
        { id: createId("page"), slug: "", title: "Home", navLabel: "Home", kind: "home", visibleInNav: true },
        { id: createId("page"), slug: "properties", title: type === "hostel_microsite" ? "Rooms" : "Properties", navLabel: type === "hostel_microsite" ? "Rooms" : "Properties", kind: "properties", visibleInNav: true },
        { id: createId("page"), slug: "about", title: "About", navLabel: "About", kind: "about", visibleInNav: true },
        { id: createId("page"), slug: "faq", title: "FAQ", navLabel: "FAQ", kind: "faq", visibleInNav: true },
        { id: createId("page"), slug: "contact", title: "Contact", navLabel: "Contact", kind: "contact", visibleInNav: true },
      ],
      currentDraftVersionId: versionId,
      assetIds: [],
    };

    const version: SiteVersion = {
      id: versionId,
      siteId,
      label: "Initial draft",
      status: "draft",
      createdAt: nowIso(),
      templateContent: {
        eyebrow: linkedHostel?.name ?? payload.name,
        headline: type === "hostel_microsite" ? `Book directly with ${linkedHostel?.name ?? payload.name}.` : `Launch ${payload.name} as a branded booking site.`,
        subheadline:
          type === "hostel_microsite"
            ? "Send residents straight into this property's booking flow without marketplace browsing."
            : "Configure your brand, site pages, domains, and payments before publishing live.",
        primaryCtaLabel: type === "hostel_microsite" && linkedHostel ? "Browse rooms" : "Browse properties",
        primaryCtaHref: type === "hostel_microsite" && linkedHostel ? `/properties/${linkedHostel.id}` : "/properties",
        secondaryCtaLabel: "Resident login",
        secondaryCtaHref: "/login",
        stats: [],
        featureBullets:
          type === "hostel_microsite"
            ? ["Property-specific site created", "Room and booking pages inherit tenant branding", "Managed domain reserved"]
            : ["Draft site created", "Brand theme ready to edit", "Payment setup ready to configure"],
        trustPoints: ["Draft version saved", "Preview and publish workflow enabled", "Tenant branding stays inside the correct site context"],
        faq: [],
      },
    };

    const domain: DomainMapping = {
      id: createId("domain"),
      siteId,
      hostname: `${normalizedSlug}.${database.marketConfig.managedDomainSuffix}`,
      isPrimary: true,
      verificationStatus: "pending",
      sslStatus: "pending",
      dnsInstructions: ["Managed fallback reserved. Publish after verification."],
      redirectToPrimary: false,
      isManagedFallback: true,
    };

    database.sites.unshift(site);
    database.siteVersions.unshift(version);
    database.domains.unshift(domain);

    const tenant = database.tenants.find((candidate) => candidate.id === payload.tenantId);
    if (tenant && (!tenant.primarySiteId || type === "tenant_brand")) {
      tenant.primarySiteId = siteId;
    }

    if (linkedHostel) linkedHostel.siteId = siteId;

    writeDatabase(database);
    return ok(site);
  },

  async updateSite(siteId: string, payload: Partial<Site>): Promise<ServiceResult<Site | undefined>> {
    await delay();
    const database = readDatabase();
    const site = database.sites.find((candidate) => candidate.id === siteId);
    if (site) Object.assign(site, payload);
    writeDatabase(database);
    return ok(site);
  },

  async saveSiteDraft(siteId: string, payload: Partial<SiteVersion>): Promise<ServiceResult<SiteVersion | undefined>> {
    await delay();
    const database = readDatabase();
    const site = database.sites.find((candidate) => candidate.id === siteId);
    if (!site) return ok(undefined);

    let version = database.siteVersions.find((candidate) => candidate.id === site.currentDraftVersionId);
    if (!version) {
      version = {
        id: createId("site-version"),
        siteId,
        label: "Draft",
        status: "draft",
        createdAt: nowIso(),
        templateContent: {
          eyebrow: "",
          headline: "",
          subheadline: "",
          primaryCtaLabel: "",
          primaryCtaHref: "/",
          stats: [],
          featureBullets: [],
          trustPoints: [],
          faq: [],
        },
      };
      database.siteVersions.unshift(version);
      site.currentDraftVersionId = version.id;
    }

    Object.assign(version, payload);
    if (payload.templateContent) {
      version.templateContent = { ...version.templateContent, ...payload.templateContent };
    }
    if (payload.customCode) {
      version.customCode = { ...version.customCode, ...payload.customCode };
    }
    writeDatabase(database);
    return ok(version);
  },

  async publishSite(siteId: string): Promise<ServiceResult<Site | undefined>> {
    await delay();
    const database = readDatabase();
    const site = database.sites.find((candidate) => candidate.id === siteId);
    const draft = database.siteVersions.find((candidate) => candidate.id === site?.currentDraftVersionId);
    if (!site || !draft) return ok(undefined);

    const publishedVersion: SiteVersion = {
      ...draft,
      id: createId("site-version"),
      label: `${draft.label} live`,
      status: "published",
      publishedAt: nowIso(),
    };
    database.siteVersions.unshift(publishedVersion);
    site.publishedVersionId = publishedVersion.id;
    site.status = "published";
    writeDatabase(database);
    return ok(site);
  },

  async rollbackSite(siteId: string, versionId: string): Promise<ServiceResult<Site | undefined>> {
    await delay();
    const database = readDatabase();
    const site = database.sites.find((candidate) => candidate.id === siteId);
    const version = database.siteVersions.find((candidate) => candidate.id === versionId && candidate.siteId === siteId);
    if (!site || !version) return ok(undefined);

    site.publishedVersionId = version.id;
    site.status = "published";

    const clonedDraft: SiteVersion = {
      ...version,
      id: createId("site-version"),
      label: `${version.label} draft`,
      status: "draft",
      createdAt: nowIso(),
      publishedAt: undefined,
    };
    database.siteVersions.unshift(clonedDraft);
    site.currentDraftVersionId = clonedDraft.id;
    writeDatabase(database);
    return ok(site);
  },

  async addDomain(siteId: string, hostname: string): Promise<ServiceResult<DomainMapping>> {
    await delay();
    const database = readDatabase();
    const domain: DomainMapping = {
      id: createId("domain"),
      siteId,
      hostname: hostname.toLowerCase(),
      isPrimary: false,
      verificationStatus: "pending",
      sslStatus: "pending",
      dnsInstructions: [`CNAME ${hostname} -> cname.hostelhub.app`, `TXT _verify -> ${createId("verify")}`],
      redirectToPrimary: false,
      isManagedFallback: false,
    };
    database.domains.unshift(domain);
    writeDatabase(database);
    return ok(domain);
  },

  async verifyDomain(domainId: string): Promise<ServiceResult<DomainMapping | undefined>> {
    await delay();
    const database = readDatabase();
    const domain = database.domains.find((candidate) => candidate.id === domainId);
    if (domain) {
      domain.verificationStatus = "verified";
      domain.sslStatus = "issued";
    }
    writeDatabase(database);
    return ok(domain);
  },

  async setPrimaryDomain(siteId: string, domainId: string): Promise<ServiceResult<DomainMapping | undefined>> {
    await delay();
    const database = readDatabase();
    database.domains.forEach((domain) => {
      if (domain.siteId !== siteId) return;
      domain.isPrimary = domain.id === domainId;
      domain.redirectToPrimary = domain.isManagedFallback && domain.id !== domainId;
    });
    writeDatabase(database);
    return ok(database.domains.find((candidate) => candidate.id === domainId));
  },

  async addAsset(siteId: string, payload: Pick<SiteAsset, "name" | "kind" | "url">): Promise<ServiceResult<SiteAsset>> {
    await delay();
    const database = readDatabase();
    const asset: SiteAsset = {
      id: createId("asset"),
      siteId,
      ...payload,
    };
    database.siteAssets.unshift(asset);
    const site = database.sites.find((candidate) => candidate.id === siteId);
    if (site) site.assetIds.unshift(asset.id);
    writeDatabase(database);
    return ok(asset);
  },
};
