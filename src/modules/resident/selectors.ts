import type { AccountProfileView, AppDatabase, DashboardMetrics } from "@/types";

export function getResidentWorkspace(database: AppDatabase, userId: string) {
  const user = database.users.find((item) => item.id === userId);
  const bookings = database.bookings.filter((booking) => booking.residentId === userId);
  const activeBooking =
    bookings.find((booking) => booking.status === "checked_in") ??
    bookings.find((booking) => booking.status === "confirmed") ??
    bookings.find((booking) => booking.status === "reserved");
  const room = activeBooking ? database.rooms.find((item) => item.id === activeBooking.roomId) : undefined;
  const hostel = activeBooking ? database.hostels.find((item) => item.id === activeBooking.hostelId) : undefined;
  const payments = database.payments.filter((payment) => payment.residentId === userId);
  const tickets = database.tickets.filter((ticket) => ticket.residentId === userId);
  const notifications = database.notifications.filter((notification) => notification.userId === userId);
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const waitingList = database.waitingList.filter((entry) => entry.residentId === userId);
  const metrics: DashboardMetrics = {
    totalBeds: bookings.length,
    occupiedBeds: activeBooking ? 1 : 0,
    availableBeds: waitingList.length,
    pendingBookings: bookings.filter((booking) => booking.status === "pending" || booking.status === "reserved").length,
    pendingPayments: payments.filter((payment) => payment.status === "pending").length,
    openTickets: tickets.filter((ticket) => ticket.status !== "closed").length,
    revenue: payments
      .filter((payment) => payment.status === "completed" || payment.status === "verified")
      .reduce((total, payment) => total + payment.amount, 0),
  };
  return {
    user,
    bookings,
    activeBooking,
    room,
    hostel,
    payments,
    tickets,
    notifications,
    unreadNotifications,
    waitingList,
    metrics,
  };
}

export function getAccountProfileView(database: AppDatabase, userId: string): AccountProfileView | undefined {
  const user = database.users.find((item) => item.id === userId);
  if (!user) return undefined;
  return {
    user,
    residentProfile: database.residentProfiles.find((profile) => profile.userId === userId),
    tenant: user.tenantId ? database.tenants.find((tenant) => tenant.id === user.tenantId) : undefined,
    hostels: database.hostels.filter((hostel) => hostel.tenantId === user.tenantId || hostel.id === user.hostelId),
  };
}
