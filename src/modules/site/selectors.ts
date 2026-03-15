import type { AppDatabase, BrandTheme, PaymentMethod, Site, SiteVersion, Tenant, TenantPaymentConfig } from "@/types";

type SiteResolutionSource = "hostname" | "slug" | "none";

function stripPort(hostname: string) {
  return hostname.replace(/:\d+$/, "").toLowerCase();
}

export function isLocalHostname(hostname: string) {
  const normalized = stripPort(hostname);
  return normalized === "localhost" || normalized === "127.0.0.1";
}

export function getDomainMapping(database: AppDatabase, hostname: string) {
  const normalized = stripPort(hostname);
  return database.domains.find((domain) => domain.hostname.toLowerCase() === normalized);
}

export function getSiteBySlug(database: AppDatabase, slug: string) {
  return database.sites.find((site) => site.slug === slug);
}

export function resolveSiteFromRequest(database: AppDatabase, pathname: string, hostname: string) {
  const byHostname = getDomainMapping(database, hostname);
  if (byHostname) {
    const site = database.sites.find((candidate) => candidate.id === byHostname.siteId);
    return { site, source: "hostname" as SiteResolutionSource };
  }

  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (firstSegment) {
    const site = getSiteBySlug(database, firstSegment);
    if (site) return { site, source: "slug" as SiteResolutionSource };
  }

  return { site: undefined, source: "none" as SiteResolutionSource };
}

export function getSiteDomains(database: AppDatabase, siteId: string) {
  return database.domains.filter((domain) => domain.siteId === siteId);
}

export function getSiteVersion(database: AppDatabase, site: Site | undefined, useDraft = false): SiteVersion | undefined {
  if (!site) return undefined;
  const targetId = useDraft ? site.currentDraftVersionId ?? site.publishedVersionId : site.publishedVersionId ?? site.currentDraftVersionId;
  return database.siteVersions.find((version) => version.id === targetId);
}

export function getTenantBrandTheme(database: AppDatabase, tenantId: string | undefined): BrandTheme | undefined {
  if (!tenantId) return undefined;
  return database.brandThemes.find((theme) => theme.tenantId === tenantId);
}

export function getTenantPaymentConfig(database: AppDatabase, tenantId: string | undefined): TenantPaymentConfig | undefined {
  if (!tenantId) return undefined;
  return database.tenantPaymentConfigs.find((config) => config.tenantId === tenantId);
}

export function getTenantSites(database: AppDatabase, tenantId: string | undefined) {
  if (!tenantId) return [];
  return database.sites.filter((site) => site.tenantId === tenantId);
}

export function getTenantHostels(database: AppDatabase, tenantId: string | undefined) {
  if (!tenantId) return [];
  return database.hostels.filter((hostel) => hostel.tenantId === tenantId);
}

export function getTenantPrimarySite(database: AppDatabase, tenantId: string | undefined) {
  if (!tenantId) return undefined;
  const tenant = database.tenants.find((candidate) => candidate.id === tenantId);
  return (
    database.sites.find((site) => site.id === tenant?.primarySiteId) ??
    database.sites.find((site) => site.tenantId === tenantId && site.type === "tenant_brand") ??
    database.sites.find((site) => site.tenantId === tenantId)
  );
}

export function getTenantForHostel(database: AppDatabase, hostelId: string | undefined): Tenant | undefined {
  if (!hostelId) return undefined;
  const hostel = database.hostels.find((candidate) => candidate.id === hostelId);
  return hostel ? database.tenants.find((tenant) => tenant.id === hostel.tenantId) : undefined;
}

export function getSiteHostels(database: AppDatabase, site: Site | undefined) {
  if (!site) return [];
  if (site.hostelId) {
    const hostel = database.hostels.find((candidate) => candidate.id === site.hostelId);
    return hostel ? [hostel] : [];
  }
  return getTenantHostels(database, site.tenantId);
}

export function getSiteBasePath(site: Site | undefined, source: SiteResolutionSource) {
  if (!site) return "";
  return source === "slug" ? `/${site.slug}` : "";
}

export function stripSitePrefix(pathname: string, site: Site | undefined, source: SiteResolutionSource) {
  if (!site || source !== "slug") return pathname;
  const prefix = `/${site.slug}`;
  if (pathname === prefix) return "/";
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

export function buildSitePath(site: Site | undefined, source: SiteResolutionSource, path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const basePath = getSiteBasePath(site, source);
  if (!site) return normalized;
  return normalized === "/" ? basePath || "/" : `${basePath}${normalized}`;
}

export function buildSitePreviewPath(site: Site | undefined, source: SiteResolutionSource, path = "/") {
  const target = buildSitePath(site, source, path);
  return target.includes("?") ? `${target}&preview=1` : `${target}?preview=1`;
}

export function isPaymentMethodEnabled(config: TenantPaymentConfig | undefined, method: PaymentMethod) {
  return Boolean(config?.supportedMethods.find((item) => item.method === method && item.enabled));
}
