import type {
  AppDatabase,
  Notification,
  NotificationAudience,
  NotificationChannel,
  NotificationEventKey,
  NotificationType,
  ServiceResult,
  User,
} from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";

interface NotificationRecipient {
  userId: string;
  audience: NotificationAudience;
}

interface QueueNotificationEventPayload {
  tenantId: string;
  eventKey: NotificationEventKey;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actionLabel?: string;
  targetType?: Notification["targetType"];
  targetId?: string;
  recipients: NotificationRecipient[];
}

function ensureTenantNotificationConfig(database: AppDatabase, tenantId: string) {
  let config = database.tenantNotificationConfigs.find((item) => item.tenantId === tenantId);
  if (!config) {
    config = createDefaultTenantNotificationConfig(tenantId);
    database.tenantNotificationConfigs.push(config);
  }
  return config;
}

function createInAppNotification(
  database: AppDatabase,
  payload: Omit<Notification, "id" | "createdAt" | "read" | "channel"> & { read?: boolean },
) {
  const notification: Notification = {
    id: createId("ntf"),
    createdAt: nowIso(),
    channel: "in_app",
    read: payload.read ?? false,
    ...payload,
  };
  database.notifications.unshift(notification);
  return notification;
}

function queueDispatch(
  database: AppDatabase,
  payload: {
    tenantId: string;
    user: User;
    notificationId?: string;
    eventKey: NotificationEventKey;
    channel: Exclude<NotificationChannel, "in_app">;
  },
) {
  const providerConfig =
    payload.channel === "email"
      ? database.tenantEmailConfigs.find((item) => item.tenantId === payload.tenantId)
      : database.tenantSmsConfigs.find((item) => item.tenantId === payload.tenantId);
  const provider = providerConfig?.provider;
  const target = payload.channel === "email" ? payload.user.email : payload.user.phone;
  const canQueue = Boolean(provider && target && providerConfig?.status !== "draft");
  database.notificationDispatches.unshift({
    id: createId("dispatch"),
    tenantId: payload.tenantId,
    userId: payload.user.id,
    notificationId: payload.notificationId,
    eventKey: payload.eventKey,
    channel: payload.channel,
    status: canQueue ? "queued" : "skipped",
    provider,
    target,
    reason: canQueue ? undefined : provider ? "Provider is still in draft mode." : "Provider is not configured yet.",
    createdAt: nowIso(),
  });
}

export function getTenantAdminRecipients(database: AppDatabase, tenantId: string): NotificationRecipient[] {
  return database.users
    .filter((user) => user.role === "tenant_admin" && user.tenantId === tenantId)
    .map((user) => ({ userId: user.id, audience: "tenant_admin" as const }));
}

export function queueNotificationEvent(database: AppDatabase, payload: QueueNotificationEventPayload) {
  const config = ensureTenantNotificationConfig(database, payload.tenantId);
  const trigger = config.triggers.find((item) => item.eventKey === payload.eventKey);
  if (!trigger) return;

  const uniqueRecipients = payload.recipients.filter(
    (recipient, index, items) => items.findIndex((item) => item.userId === recipient.userId) === index,
  );

  uniqueRecipients.forEach((recipient) => {
    const user = database.users.find((item) => item.id === recipient.userId);
    if (!user) return;

    const notification =
      config.internalNotificationsEnabled && trigger.inAppEnabled
        ? createInAppNotification(database, {
            userId: user.id,
            tenantId: payload.tenantId,
            audience: recipient.audience,
            eventKey: payload.eventKey,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            link: payload.link,
            actionLabel: payload.actionLabel,
            targetType: payload.targetType,
            targetId: payload.targetId,
          })
        : undefined;

    if (trigger.emailEnabled) {
      queueDispatch(database, {
        tenantId: payload.tenantId,
        user,
        notificationId: notification?.id,
        eventKey: payload.eventKey,
        channel: "email",
      });
    }

    if (trigger.smsEnabled) {
      queueDispatch(database, {
        tenantId: payload.tenantId,
        user,
        notificationId: notification?.id,
        eventKey: payload.eventKey,
        channel: "sms",
      });
    }
  });
}

export const NotificationService = {
  async listNotifications(userId: string): Promise<ServiceResult<Notification[]>> {
    await delay();
    return ok(readDatabase().notifications.filter((item) => item.userId === userId));
  },

  async listTenantNotifications(tenantId: string): Promise<ServiceResult<Notification[]>> {
    await delay();
    return ok(readDatabase().notifications.filter((item) => item.tenantId === tenantId));
  },

  async markAsRead(id: string): Promise<ServiceResult<Notification | undefined>> {
    await delay();
    const database = readDatabase();
    const notification = database.notifications.find((item) => item.id === id);
    if (notification) notification.read = true;
    writeDatabase(database);
    return ok(notification);
  },

  async markAsUnread(id: string): Promise<ServiceResult<Notification | undefined>> {
    await delay();
    const database = readDatabase();
    const notification = database.notifications.find((item) => item.id === id);
    if (notification) notification.read = false;
    writeDatabase(database);
    return ok(notification);
  },

  async markAllAsRead(userId: string): Promise<ServiceResult<number>> {
    await delay();
    const database = readDatabase();
    const unread = database.notifications.filter((item) => item.userId === userId && !item.read);
    unread.forEach((item) => {
      item.read = true;
    });
    writeDatabase(database);
    return ok(unread.length);
  },

  async enqueueMockEvent(payload: Omit<Notification, "id" | "createdAt" | "read"> & { read?: boolean }): Promise<ServiceResult<Notification>> {
    await delay();
    const database = readDatabase();
    const notification = createInAppNotification(database, payload);
    writeDatabase(database);
    return ok(notification);
  },

  async createNotification(payload: Omit<Notification, "id" | "createdAt" | "channel" | "read"> & { read?: boolean }): Promise<ServiceResult<Notification>> {
    await delay();
    const database = readDatabase();
    const notification = createInAppNotification(database, payload);
    writeDatabase(database);
    return ok(notification);
  },

  async updateNotification(
    id: string,
    payload: Partial<Omit<Notification, "id" | "userId" | "tenantId" | "createdAt" | "channel">>,
  ): Promise<ServiceResult<Notification | undefined>> {
    await delay();
    const database = readDatabase();
    const notification = database.notifications.find((item) => item.id === id);
    if (notification) Object.assign(notification, payload);
    writeDatabase(database);
    return ok(notification);
  },

  async deleteNotification(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const currentLength = database.notifications.length;
    database.notifications = database.notifications.filter((item) => item.id !== id);
    database.notificationDispatches = database.notificationDispatches.filter((item) => item.notificationId !== id);
    writeDatabase(database);
    return ok(database.notifications.length < currentLength);
  },
};
