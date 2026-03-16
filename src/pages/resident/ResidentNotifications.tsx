import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { NotificationService } from "@/services";
import type { Notification, NotificationTargetType, NotificationType } from "@/types";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const emptyNotificationForm = {
  id: "",
  userId: "",
  title: "",
  message: "",
  type: "system" as NotificationType,
  link: "",
  actionLabel: "",
  targetType: "" as NotificationTargetType | "",
  targetId: "",
};

export default function ResidentNotifications() {
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const { database, currentUser, refreshData } = useApp();
  const [scope, setScope] = useState<"mine" | "tenant">("mine");
  const [selectedId, setSelectedId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyNotificationForm);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const title =
    currentUser?.role === "tenant_admin"
      ? "Notifications"
      : currentUser?.role === "group_organizer"
        ? "Group notifications"
        : "Notifications";
  const description =
    currentUser?.role === "tenant_admin"
      ? "Open updates and manage internal notices."
      : "Updates for bookings, payments, and support.";
  const basePath =
    currentUser?.role === "tenant_admin"
      ? "/admin/notifications"
      : currentUser?.role === "group_organizer"
        ? "/group/notifications"
        : "/resident/notifications";

  const tenantUserIds = useMemo(() => {
    if (!database || !currentUser?.tenantId) return new Set<string>();
    const hostelIds = database.hostels.filter((hostel) => hostel.tenantId === currentUser.tenantId).map((hostel) => hostel.id);
    const groupOrganizerIds = database.groupBookings
      .filter((booking) => hostelIds.includes(booking.hostelId))
      .map((booking) => booking.organizerId);
    return new Set(
      database.users
        .filter((user) => user.tenantId === currentUser.tenantId || (user.hostelId && hostelIds.includes(user.hostelId)) || groupOrganizerIds.includes(user.id))
        .map((user) => user.id),
    );
  }, [currentUser?.tenantId, database]);

  const notifications = useMemo(() => {
    if (!database || !currentUser) return [];
    const source =
      currentUser.role === "tenant_admin" && scope === "tenant"
        ? database.notifications.filter((notification) => notification.tenantId === currentUser.tenantId)
        : database.notifications.filter((notification) => notification.userId === currentUser.id);
    return [...source].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [currentUser, database, scope]);

  const selectedNotification = notifications.find((notification) => notification.id === selectedId) ?? notifications[0];
  const relatedUser = selectedNotification ? database?.users.find((user) => user.id === selectedNotification.userId) : undefined;

  useEffect(() => {
    if (currentUser?.role !== "tenant_admin" && scope !== "mine") {
      setScope("mine");
    }
  }, [currentUser?.role, scope]);

  useEffect(() => {
    if (!notifications.length) {
      setSelectedId("");
      return;
    }
    const nextId = notificationId && notifications.some((notification) => notification.id === notificationId)
      ? notificationId
      : selectedId && notifications.some((notification) => notification.id === selectedId)
        ? selectedId
        : notifications[0].id;
    setSelectedId(nextId);
  }, [notificationId, notifications, selectedId]);

  useEffect(() => {
    if (!selectedNotification) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1279px)").matches) return;

    const frame = window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedNotification?.id]);

  if (!database || !currentUser) return <div className="container py-10">Loading notifications...</div>;

  const recipientOptions = database.users.filter((user) => tenantUserIds.has(user.id));

  const openComposer = (notification?: Notification) => {
    if (notification) {
      setForm({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link ?? "",
        actionLabel: notification.actionLabel ?? "",
        targetType: notification.targetType ?? "",
        targetId: notification.targetId ?? "",
      });
    } else {
      setForm({
        ...emptyNotificationForm,
        userId: recipientOptions[0]?.id ?? "",
      });
    }
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-6 pb-28 md:space-y-10 md:pb-10">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {currentUser.role === "tenant_admin" ? (
              <>
                <Button
                  variant={scope === "mine" ? "emerald" : "outline"}
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setScope("mine")}
                >
                  My inbox
                </Button>
                <Button
                  variant={scope === "tenant" ? "emerald" : "outline"}
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setScope("tenant")}
                >
                  Tenant stream
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => openComposer()}>
                  <Plus className="h-4 w-4" />
                  New notification
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={async () => {
                await NotificationService.markAllAsRead(currentUser.id);
                await refreshData();
                toast.success("All notifications marked as read.");
              }}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <p className="font-medium">{scope === "tenant" ? "Tenant notifications" : "Inbox"}</p>
            <p className="text-xs text-muted-foreground">{notifications.length} notification records</p>
          </div>
          <div className="max-h-[52vh] overflow-y-auto md:max-h-[70vh]">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/40 ${selectedNotification?.id === notification.id ? "bg-muted/60" : ""}`}
                  onClick={async () => {
                    setSelectedId(notification.id);
                    navigate(`${basePath}/${notification.id}`, { replace: true });
                    if (!notification.read && notification.userId === currentUser.id) {
                      await NotificationService.markAsRead(notification.id);
                      await refreshData();
                    }
                  }}
                >
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? "bg-border" : "bg-emerald"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatTimestamp(notification.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                    {scope === "tenant" ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {database.users.find((user) => user.id === notification.userId)?.name ?? "Unknown recipient"}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
          </div>
        </div>

        <div ref={detailRef} className="rounded-2xl border bg-card p-5 sm:p-6">
          {selectedNotification ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{selectedNotification.type}</p>
                  <h2 className="font-display text-2xl font-semibold">{selectedNotification.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedNotification.message}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  {currentUser.role === "tenant_admin" && scope === "tenant" ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => openComposer(selectedNotification)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          await NotificationService.deleteNotification(selectedNotification.id);
                          await refreshData();
                          navigate(basePath, { replace: true });
                          toast.success("Notification deleted.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      if (selectedNotification.read) {
                        await NotificationService.markAsUnread(selectedNotification.id);
                      } else {
                        await NotificationService.markAsRead(selectedNotification.id);
                      }
                      await refreshData();
                    }}
                  >
                    {selectedNotification.read ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Recipient</p>
                  <p className="mt-1 font-medium">{relatedUser?.name ?? "Unknown recipient"}</p>
                  <p className="text-xs text-muted-foreground">{relatedUser?.email ?? relatedUser?.phone ?? "No contact"}</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="mt-1 font-medium">{formatTimestamp(selectedNotification.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{selectedNotification.read ? "Read" : "Unread"}</p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Related record</p>
                <p className="mt-1 font-medium">
                  {selectedNotification.targetType ? `${selectedNotification.targetType.replace(/_/g, " ")} ${selectedNotification.targetId ?? ""}` : "No direct target attached"}
                </p>
                {selectedNotification.link ? (
                  <div className="mt-4">
                    <Link to={selectedNotification.link} className="inline-flex items-center text-sm font-medium text-emerald">
                      {selectedNotification.actionLabel ?? "Open related page"}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Select a notification to inspect its details.
            </div>
          )}
        </div>
      </div>

      <ResponsiveOverlay
        open={formOpen}
        onOpenChange={setFormOpen}
        title={form.id ? "Edit notification" : "Create notification"}
        description="Send an in-app notice with an optional deep link."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <select
              value={form.userId}
              onChange={(event) => setForm({ ...form, userId: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select recipient</option>
              {recipientOptions.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as NotificationType })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="system">System</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="ticket">Ticket</option>
              <option value="waitlist">Waitlist</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Message</Label>
            <Textarea rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Deep link</Label>
            <Input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="/admin/payments?payment=pay1" />
          </div>
          <div className="space-y-2">
            <Label>Action label</Label>
            <Input value={form.actionLabel} onChange={(event) => setForm({ ...form, actionLabel: event.target.value })} placeholder="Open payment" />
          </div>
          <div className="space-y-2">
            <Label>Target type</Label>
            <select
              value={form.targetType}
              onChange={(event) => setForm({ ...form, targetType: event.target.value as NotificationTargetType | "" })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">No direct target</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="ticket">Ticket</option>
              <option value="waitlist">Waitlist</option>
              <option value="group_booking">Group booking</option>
              <option value="resident">Resident</option>
              <option value="site">Site</option>
              <option value="hostel">Hostel</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Target id</Label>
            <Input value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button
            variant="emerald"
            className="w-full sm:w-auto"
            onClick={async () => {
              if (!form.userId || !form.title.trim() || !form.message.trim()) return;
              const recipient = database.users.find((user) => user.id === form.userId);
              if (!recipient) return;

              if (form.id) {
                await NotificationService.updateNotification(form.id, {
                  title: form.title.trim(),
                  message: form.message.trim(),
                  type: form.type,
                  link: form.link.trim() || undefined,
                  actionLabel: form.actionLabel.trim() || undefined,
                  targetType: form.targetType || undefined,
                  targetId: form.targetId.trim() || undefined,
                });
                toast.success("Notification updated.");
              } else {
                await NotificationService.createNotification({
                  userId: recipient.id,
                  tenantId: recipient.tenantId ?? currentUser.tenantId,
                  audience:
                    recipient.role === "tenant_admin"
                      ? "tenant_admin"
                      : recipient.role === "group_organizer"
                        ? "group_organizer"
                        : recipient.role === "platform_owner"
                          ? "platform_owner"
                          : "resident",
                  title: form.title.trim(),
                  message: form.message.trim(),
                  type: form.type,
                  link: form.link.trim() || undefined,
                  actionLabel: form.actionLabel.trim() || undefined,
                  targetType: form.targetType || undefined,
                  targetId: form.targetId.trim() || undefined,
                });
                toast.success("Notification created.");
              }

              await refreshData();
              setFormOpen(false);
              setForm(emptyNotificationForm);
            }}
          >
            {form.id ? "Save changes" : "Create notification"}
          </Button>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
