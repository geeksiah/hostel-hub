import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CreditCard, Home, Search, Ticket, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { isAppRouteActive } from "@/lib/navigation";
import { getBrowsePath } from "@/lib/app-shell";

export function MobileBottomNav() {
  const { currentUser } = useApp();
  const { buildPublicPath } = useSiteContext();
  const location = useLocation();

  if (!currentUser || !["resident", "group_organizer"].includes(currentUser.role)) return null;
  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const residentTabs = [
    { label: "Home", path: "/resident", icon: Home },
    { label: "Rooms", path: browsePath, icon: Search },
    { label: "Bookings", path: "/resident/bookings", icon: CalendarDays },
    { label: "Tickets", path: "/resident/tickets", icon: Ticket },
  ];
  const organizerTabs = [
    { label: "Home", path: "/group-booking", icon: Users },
    { label: "Rooms", path: browsePath, icon: Search },
    { label: "Payments", path: "/payment", icon: CreditCard },
  ];
  const tabs = currentUser.role === "group_organizer" ? organizerTabs : residentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = isAppRouteActive(tab.path, location.pathname);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-emerald" : "text-muted-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
