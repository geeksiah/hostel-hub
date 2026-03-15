import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/contexts/AppContext";
import { NotificationService } from "@/services";
import type { Notification } from "@/types";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface NotificationTrayProps {
  basePath: string;
  notifications: Notification[];
}

export function NotificationTray({ basePath, notifications }: NotificationTrayProps) {
  const navigate = useNavigate();
  const { currentUser, refreshData } = useApp();

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const preview = notifications.slice(0, 7);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-semibold text-white">
              {Math.min(unreadCount, 9)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 sm:w-[400px]">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!unreadCount || !currentUser}
                onClick={async () => {
                  if (!currentUser) return;
                  await NotificationService.markAllAsRead(currentUser.id);
                  await refreshData();
                }}
              >
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(basePath)}>
                View all
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {preview.length ? (
            preview.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/50 ${!notification.read ? "bg-emerald-light/30" : ""}`}
                onClick={async () => {
                  if (!notification.read) {
                    await NotificationService.markAsRead(notification.id);
                    await refreshData();
                  }
                  navigate(`${basePath}/${notification.id}`);
                }}
              >
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? "bg-border" : "bg-emerald"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium">{notification.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatTimestamp(notification.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
