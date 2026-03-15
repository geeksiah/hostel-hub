import type { AppDatabase, DashboardMetrics } from "@/types";

export function getAdminMetrics(database: AppDatabase, hostelId: string): DashboardMetrics {
  const rooms = database.rooms.filter((room) => room.hostelId === hostelId);
  const bookings = database.bookings.filter((booking) => booking.hostelId === hostelId);
  const openTickets = database.tickets.filter((ticket) => ticket.hostelId === hostelId && ticket.status !== "closed").length;
  const payments = database.payments.filter((payment) => {
    if (!payment.bookingId) return false;
    const booking = database.bookings.find((item) => item.id === payment.bookingId);
    return booking?.hostelId === hostelId;
  });

  const totalBeds = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupiedBeds = rooms.reduce((total, room) => total + room.occupancy, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
  const pendingPayments = payments.filter((payment) => payment.status === "pending").length;
  const revenue = payments
    .filter((payment) => payment.status === "completed" || payment.status === "verified")
    .reduce((total, payment) => total + payment.amount, 0);

  return { totalBeds, occupiedBeds, availableBeds, pendingBookings, pendingPayments, openTickets, revenue };
}

export function getTenantAdminWorkspace(database: AppDatabase, hostelId: string) {
  const hostel = database.hostels.find((item) => item.id === hostelId);
  const blocks = database.blocks.filter((block) => block.hostelId === hostelId);
  const rooms = database.rooms.filter((room) => room.hostelId === hostelId);
  const residents = database.users.filter((user) => user.role === "resident" && user.hostelId === hostelId);
  const bookings = database.bookings.filter((booking) => booking.hostelId === hostelId);
  const payments = database.payments.filter((payment) => {
    if (!payment.bookingId) return Boolean(payment.groupBookingId);
    const booking = database.bookings.find((item) => item.id === payment.bookingId);
    return booking?.hostelId === hostelId;
  });
  const tickets = database.tickets.filter((ticket) => ticket.hostelId === hostelId);
  const waitingList = database.waitingList.filter((entry) => entry.hostelId === hostelId);
  const periods = database.periods.filter((period) => period.hostelId === hostelId);
  const pricingRules = database.pricingRules.filter((rule) => rule.hostelId === hostelId);
  const discountCodes = database.discountCodes.filter((code) => code.hostelId === hostelId);
  const groupRequests = database.groupBookings.filter((request) => request.hostelId === hostelId);
  const metrics = getAdminMetrics(database, hostelId);

  return {
    hostel,
    blocks,
    rooms,
    residents,
    bookings,
    payments,
    tickets,
    waitingList,
    periods,
    pricingRules,
    discountCodes,
    groupRequests,
    metrics,
  };
}
