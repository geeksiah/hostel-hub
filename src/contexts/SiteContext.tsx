import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { BrandTheme, Site, SiteVersion, Tenant, TenantPaymentConfig } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { createBrandThemeStyle, mergeBrandTheme } from "@/lib/brand-theme";
import {
  buildSitePath,
  buildSitePreviewPath,
  getSiteVersion,
  getTenantBrandTheme,
  getTenantForHostel,
  getTenantPaymentConfig,
  getTenantPrimarySite,
  getTenantSites,
  isLocalHostname,
  resolveSiteFromRequest,
  stripSitePrefix,
} from "@/modules/site/selectors";

type SiteSource = "hostname" | "slug" | "none";

interface SiteContextValue {
  publicSite?: Site;
  preferredSite?: Site;
  activeTenant?: Tenant;
  activeTheme?: BrandTheme;
  activeVersion?: SiteVersion;
  activePaymentConfig?: TenantPaymentConfig;
  siteSource: SiteSource;
  publicPathname: string;
  isPreviewMode: boolean;
  isPublicCustomCode: boolean;
  tenantSites: Site[];
  buildPublicPath: (path?: string) => string;
  buildPreviewPath: (path?: string) => string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { database, currentUser, session } = useApp();

  const value = useMemo<SiteContextValue>(() => {
    if (!database) {
      return {
        siteSource: "none",
        publicPathname: location.pathname,
        isPreviewMode: false,
        isPublicCustomCode: false,
        tenantSites: [],
        buildPublicPath: (path = "/") => path,
        buildPreviewPath: (path = "/") => path,
      };
    }

    const hostname = typeof window !== "undefined" ? window.location.host : "";
    const { site: resolvedSite, source } = resolveSiteFromRequest(database, location.pathname, hostname);
    const currentHostelTenant =
      currentUser?.tenantId ??
      getTenantForHostel(database, currentUser?.hostelId)?.id ??
      getTenantForHostel(database, session.pendingBooking?.hostelId)?.id ??
      getTenantForHostel(database, session.currentHostelId)?.id;
    const preferredSite = resolvedSite ?? getTenantPrimarySite(database, currentHostelTenant);
    const activeTenantId = resolvedSite?.tenantId ?? preferredSite?.tenantId ?? currentHostelTenant;
    const activeTenant = activeTenantId ? database.tenants.find((tenant) => tenant.id === activeTenantId) : undefined;
    const baseTheme = getTenantBrandTheme(database, activeTenantId);
    const activeTheme = baseTheme && resolvedSite ? mergeBrandTheme(baseTheme, resolvedSite.themeOverride) : baseTheme;
    const isPreviewMode = location.search.includes("preview=1") && Boolean(currentUser?.tenantId && currentUser.tenantId === resolvedSite?.tenantId);
    const activeVersion = getSiteVersion(database, resolvedSite ?? preferredSite, isPreviewMode);
    const localFallbackSource: SiteSource = isLocalHostname(hostname) ? "slug" : source;

    return {
      publicSite: resolvedSite,
      preferredSite,
      activeTenant,
      activeTheme,
      activeVersion,
      activePaymentConfig: getTenantPaymentConfig(database, activeTenantId),
      siteSource: resolvedSite ? source : localFallbackSource,
      publicPathname: stripSitePrefix(location.pathname, resolvedSite, source),
      isPreviewMode,
      isPublicCustomCode: Boolean(resolvedSite && resolvedSite.renderMode === "custom_code"),
      tenantSites: getTenantSites(database, activeTenantId),
      buildPublicPath: (path = "/") => buildSitePath(preferredSite, resolvedSite ? source : localFallbackSource, path),
      buildPreviewPath: (path = "/") => buildSitePreviewPath(preferredSite, resolvedSite ? source : localFallbackSource, path),
    };
  }, [currentUser?.hostelId, currentUser?.tenantId, database, location.pathname, location.search, session.currentHostelId, session.pendingBooking?.hostelId]);

  return (
    <SiteContext.Provider value={value}>
      <div style={value.activeTheme ? createBrandThemeStyle(value.activeTheme) : undefined} className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSiteContext must be used within SiteProvider");
  return ctx;
}
