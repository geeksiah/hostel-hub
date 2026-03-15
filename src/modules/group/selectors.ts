import type { AppDatabase } from "@/types";

export function getGroupWorkspace(database: AppDatabase, organizerId: string) {
  const requests = database.groupBookings.filter((request) => request.organizerId === organizerId);
  const notifications = database.notifications.filter((notification) => notification.userId === organizerId);
  const payments = database.payments.filter((payment) => payment.residentId === organizerId || requests.some((request) => request.id === payment.groupBookingId));
  return {
    requests,
    notifications,
    unreadNotifications: notifications.filter((notification) => !notification.read),
    payments,
    activeRequest:
      requests.find((request) => request.status === "allocated") ??
      requests.find((request) => request.status === "reviewing") ??
      requests[0],
  };
}
