import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Building2, LogOut, Menu, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
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
  const logoText = activeTheme?.logoText ?? publicSite?.name ?? "HostelHub";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to={homeHref} className="flex items-center gap-2 font-display text-lg font-bold">
            <Building2 className="h-5 w-5 text-secondary" />
            {logoText}
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
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
                <Link to={browsePath} className="text-sm font-medium text-muted-foreground hover:text-foreground">
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
                <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="outline" size="sm">Log in</Button></Link>
                <Link to="/register"><Button variant="emerald" size="sm">Sign up</Button></Link>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <div className="border-t bg-card p-4 sm:hidden">
            <div className="space-y-2">
              {publicSite ? (
                <>
                  {pageLinks.map((page) => (
                    <Link key={page.id} to={buildPublicPath(page.slug ? `/${page.slug}` : "/")} className="block py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>
                      {page.navLabel}
                    </Link>
                  ))}
                  <Link to={browsePath} className="block py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>
                    {publicSite.type === "hostel_microsite" ? "Rooms" : "Properties"}
                  </Link>
                </>
              ) : null}
              {currentUser ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
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
                  <Button variant="ghost" className="w-full" onClick={() => { logout(); setMenuOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Log in</Button></Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}><Button variant="emerald" className="w-full">Sign up</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="min-h-[calc(100vh-8rem)] pb-20 md:pb-0">
        <Outlet />
      </main>

      <footer className="hidden border-t bg-card py-8 md:block">
        <div className="container text-center text-sm text-muted-foreground">
          {publicSite ? "Powered by HostelHub" : "HostelHub for tenant-run accommodation."}
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
