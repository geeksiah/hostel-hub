import type { NotificationAudience, NotificationEventKey, TenantNotificationConfig } from "@/types";

const audienceByEvent: Record<NotificationEventKey, NotificationAudience> = {
  "booking.created": "tenant_admin",
  "booking.cancelled": "tenant_admin",
  "booking.status_updated": "resident",
  "group.request_created": "tenant_admin",
  "group.allocated": "group_organizer",
  "waitlist.joined": "tenant_admin",
  "waitlist.updated": "resident",
  "waitlist.converted": "resident",
  "assignment.updated": "resident",
  "payment.submitted": "tenant_admin",
  "payment.verified": "resident",
  "payment.failed": "resident",
  "ticket.created": "tenant_admin",
  "ticket.assigned": "resident",
  "ticket.resolved": "resident",
  "ticket.closed": "resident",
  "checkin.completed": "resident",
  "checkout.completed": "resident",
};

const labelByEvent: Record<NotificationEventKey, string> = {
  "booking.created": "New resident booking",
  "booking.cancelled": "Booking cancelled",
  "booking.status_updated": "Booking status changed",
  "group.request_created": "New group request",
  "group.allocated": "Group beds allocated",
  "waitlist.joined": "Waitlist joined",
  "waitlist.updated": "Waitlist updated",
  "waitlist.converted": "Waitlist converted to booking",
  "assignment.updated": "Room assignment updated",
  "payment.submitted": "Payment submitted",
  "payment.verified": "Payment verified",
  "payment.failed": "Payment failed",
  "ticket.created": "Ticket created",
  "ticket.assigned": "Ticket assigned",
  "ticket.resolved": "Ticket resolved",
  "ticket.closed": "Ticket closed",
  "checkin.completed": "Resident checked in",
  "checkout.completed": "Resident checked out",
};

export function createDefaultNotificationTriggers() {
  return Object.keys(labelByEvent).map((eventKey) => ({
    eventKey: eventKey as NotificationEventKey,
    label: labelByEvent[eventKey as NotificationEventKey],
    audience: audienceByEvent[eventKey as NotificationEventKey],
    inAppEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
  }));
}

export function createDefaultTenantNotificationConfig(tenantId: string): TenantNotificationConfig {
  return {
    id: `notifcfg-${tenantId}`,
    tenantId,
    internalNotificationsEnabled: true,
    triggers: createDefaultNotificationTriggers(),
  };
}
