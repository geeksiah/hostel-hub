import { Link, Outlet, useLocation } from "react-router-dom";
import { Building2, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Container } from "@/components/shared/Container";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { isAppRouteActive } from "@/lib/navigation";
import { getAppHomePath, getBrowsePath } from "@/lib/app-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function getResidentLinks(browsePath: string) {
  return [
    { label: "Home", path: "/resident" },
    { label: "Rooms", path: browsePath },
    { label: "Bookings", path: "/resident/bookings" },
    { label: "Tickets", path: "/resident/tickets" },
  ];
}

export function getGroupLinks(browsePath: string) {
  return [
    { label: "Home", path: "/group-booking" },
    { label: "Rooms", path: browsePath },
    { label: "Payments", path: "/payment" },
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
  const accountLinks =
    currentUser?.role === "group_organizer"
      ? [
          { label: "Payments", path: "/payment" },
          { label: `Notifications${notifications.length ? ` (${notifications.length})` : ""}`, path: "/group/notifications" },
          { label: "Profile", path: "/group/profile" },
        ]
      : [
          { label: "Payments", path: "/resident/payments" },
          { label: `Notifications${notifications.length ? ` (${notifications.length})` : ""}`, path: "/resident/notifications" },
          { label: "QR ID", path: "/resident/qr" },
          { label: "Profile", path: "/resident/profile" },
        ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <Container className="flex min-h-[72px] items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to={homeRoute} className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <Building2 className="h-5 w-5 text-secondary" />
              {activeTheme?.logoText ?? "HostelHub"}
            </Link>
            <nav className="hidden flex-wrap items-center gap-2 md:flex">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={
                    cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      isAppRouteActive(link.path, location.pathname) ? "bg-secondary/10 text-secondary" : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full px-4">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentUser.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs font-normal text-muted-foreground capitalize">{currentUser.role.replace(/_/g, " ")}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accountLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link to={link.path}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout(buildPublicPath("/"))}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </Container>
      </header>

      <main className="pb-24 md:pb-10">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}
