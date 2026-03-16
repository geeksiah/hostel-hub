import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Building2, LogOut, Menu, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Container } from "@/components/shared/Container";
import { PageTransition, RevealTransition } from "@/components/shared/motion";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { cn } from "@/lib/utils";
import { getGroupLinks, getResidentLinks } from "@/components/layout/ResidentLayout";
import { getAppHomePath, getBrowsePath } from "@/lib/app-shell";

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useApp();
  const { publicSite, activeTheme, buildPublicPath, isPublicCustomCode } = useSiteContext();

  if (isPublicCustomCode) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const appLinks = currentUser?.role === "group_organizer" ? getGroupLinks(browsePath) : currentUser?.role === "resident" ? getResidentLinks(browsePath) : [];
  const pageLinks = publicSite?.pageManifest.filter((item) => item.visibleInNav && item.kind !== "properties") ?? [];
  const homeHref = publicSite ? buildPublicPath("/") : "/";
  const loginHref = buildPublicPath("/login");
  const logoText = activeTheme?.logoText ?? publicSite?.name ?? "HostelHub";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
        <Container className="flex min-h-[76px] items-center justify-between py-2">
          <Link to={homeHref} className="flex items-center gap-2 font-display text-lg font-bold">
            <Building2 className="h-5 w-5 text-secondary" />
            {logoText}
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            {publicSite ? (
              <>
                {pageLinks.map((page) => (
                  <NavLink
                    key={page.id}
                    to={buildPublicPath(page.slug ? `/${page.slug}` : "/")}
                    className={({ isActive }) =>
                      cn("text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", isActive && "text-foreground")
                    }
                  >
                    {page.navLabel}
                  </NavLink>
                ))}
                <Link to={browsePath} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {publicSite.type === "hostel_microsite" ? "Rooms" : "Properties"}
                </Link>
              </>
            ) : null}
            {currentUser ? (
              <>
                <span className="text-sm text-muted-foreground">{currentUser.name}</span>
                <Link to={getAppHomePath(currentUser)}>
                  <Button variant="outline" size="sm">Open app</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout(buildPublicPath("/"))}>Sign out</Button>
              </>
            ) : (
              <Link to={loginHref}><Button variant="outline" size="sm">Resident portal</Button></Link>
            )}
          </div>

          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </Container>

        <RevealTransition show={menuOpen} className="sm:hidden">
          <div className="border-t border-border/70 bg-card p-4">
            <Container className="space-y-2 px-0">
              {publicSite ? (
                <>
                  {pageLinks.map((page) => (
                    <Link key={page.id} to={buildPublicPath(page.slug ? `/${page.slug}` : "/")} className="block rounded-xl px-3 py-2.5 text-sm font-medium" onClick={() => setMenuOpen(false)}>
                      {page.navLabel}
                    </Link>
                  ))}
                  <Link to={browsePath} className="block rounded-xl px-3 py-2.5 text-sm font-medium" onClick={() => setMenuOpen(false)}>
                    {publicSite.type === "hostel_microsite" ? "Rooms" : "Properties"}
                  </Link>
                </>
              ) : null}
              {currentUser ? (
                <>
                  <div className="surface-card flex items-center gap-3 p-4">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{currentUser.role.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  {appLinks.slice(0, 3).map((link) => (
                    <Link key={link.path} to={link.path} className="block py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                  <Link to={getAppHomePath(currentUser)} onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Open app</Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={() => { logout(buildPublicPath("/")); setMenuOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <Link to={loginHref} onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Resident portal</Button></Link>
              )}
            </Container>
          </div>
        </RevealTransition>
      </header>

      <main className="min-h-[calc(100vh-8rem)] pb-24 md:pb-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="border-t border-border/70 bg-card py-8 md:py-10">
        <Container className="flex flex-col gap-6 pb-20 text-sm text-muted-foreground md:flex-row md:items-end md:justify-between md:pb-0">
          <div className="space-y-2">
            <p className="font-display text-base font-semibold tracking-tight text-foreground">{logoText}</p>
            <p>{publicSite ? `${logoText} resident portal` : "Resident portal"}</p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {publicSite ? (
              <>
                <Link to={homeHref} className="transition-colors hover:text-foreground">Home</Link>
                <Link to={browsePath} className="transition-colors hover:text-foreground">
                  {publicSite.type === "hostel_microsite" ? "Rooms" : "Properties"}
                </Link>
                {pageLinks.slice(0, 2).map((page) => (
                  <Link
                    key={page.id}
                    to={buildPublicPath(page.slug ? `/${page.slug}` : "/")}
                    className="transition-colors hover:text-foreground"
                  >
                    {page.navLabel}
                  </Link>
                ))}
                <Link to={loginHref} className="transition-colors hover:text-foreground">Resident portal</Link>
              </>
            ) : null}
          </div>
        </Container>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
