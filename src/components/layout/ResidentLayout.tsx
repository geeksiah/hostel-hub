import { Link, Outlet, useLocation } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { isAppRouteActive } from "@/lib/navigation";
import { getAppHomePath, getBrowsePath } from "@/lib/app-shell";
import { NotificationTray } from "@/components/notifications/NotificationTray";

export function getResidentLinks(browsePath: string) {
  return [
    { label: "Home", path: "/resident" },
    { label: "Browse", path: browsePath },
    { label: "Bookings", path: "/resident/bookings" },
    { label: "Payments", path: "/resident/payments" },
    { label: "Tickets", path: "/resident/tickets" },
    { label: "Notifications", path: "/resident/notifications" },
    { label: "QR ID", path: "/resident/qr" },
    { label: "Profile", path: "/resident/profile" },
  ];
}

export function getGroupLinks(browsePath: string) {
  return [
    { label: "Home", path: "/group-booking" },
    { label: "Browse", path: browsePath },
    { label: "Payments", path: "/payment" },
    { label: "Notifications", path: "/group/notifications" },
    { label: "Profile", path: "/group/profile" },
  ];
}

export function ResidentLayout() {
  const location = useLocation();
  const { currentUser, logout, database } = useApp();
  const { buildPublicPath, activeTheme } = useSiteContext();
  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const links = currentUser?.role === "group_organizer" ? getGroupLinks(browsePath) : getResidentLinks(browsePath);
  const homeRoute = getAppHomePath(currentUser);
  const notifications = database && currentUser
    ? database.notifications.filter((item) => item.userId === currentUser.id).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    : [];
  const notificationBasePath = currentUser?.role === "group_organizer" ? "/group/notifications" : "/resident/notifications";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur md:block">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link to={homeRoute} className="inline-flex items-center gap-2 font-display text-lg font-bold">
              <Building2 className="h-5 w-5 text-secondary" />
              {activeTheme?.logoText ?? "HostelHub"}
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={
                    cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isAppRouteActive(link.path, location.pathname) ? "bg-emerald-light text-emerald" : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <NotificationTray basePath={notificationBasePath} notifications={notifications} />
              <div className="text-right text-sm">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{currentUser.role.replace(/_/g, " ")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}
