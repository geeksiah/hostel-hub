import type { ReportDataset, ServiceResult } from "@/types";
import { readDatabase } from "@/services/store";
import {
  buildDataset,
  delay,
  findCurrentHostel,
  getResidentBookings,
  makeDownloadPayload,
  ok,
} from "@/modules/core/service-helpers";

function filterPaymentsByHostel(database: ReturnType<typeof readDatabase>, hostelId?: string) {
  return database.payments.filter((payment) => {
    if (!hostelId) return true;
    if (payment.bookingId) {
      const booking = database.bookings.find((item) => item.id === payment.bookingId);
      return booking?.hostelId === hostelId;
    }
    if (payment.groupBookingId) {
      const booking = database.groupBookings.find((item) => item.id === payment.groupBookingId);
      return booking?.hostelId === hostelId;
    }
    return payment.tenantId === database.hostels.find((hostel) => hostel.id === hostelId)?.tenantId;
  });
}

function getGrossAmount(database: ReturnType<typeof readDatabase>, paymentId: string, amount: number) {
  const payment = database.payments.find((item) => item.id === paymentId);
  if (!payment?.bookingId) return amount;
  const booking = database.bookings.find((item) => item.id === payment.bookingId);
  if (!booking?.discountCode) return amount;
  const discount = database.discountCodes.find(
    (item) => item.hostelId === booking.hostelId && item.code === booking.discountCode?.toUpperCase(),
  );
  if (!discount?.percentage) return amount;
  return Math.round(amount / ((100 - discount.percentage) / 100));
}

export const ReportService = {
  async getOccupancyReport(hostelId?: string): Promise<ServiceResult<ReportDataset>> {
    await delay();
    const database = readDatabase();
    const rooms = hostelId ? database.rooms.filter((room) => room.hostelId === hostelId) : database.rooms;
    const rows = rooms.map((room) => ({
      room: room.name,
      hostel: findCurrentHostel(database, room.hostelId).name,
      type: room.type,
      capacity: room.capacity,
      occupied: room.occupancy,
      status: room.status,
    }));
    return ok(buildDataset("occupancy", "Occupancy Report", ["room", "hostel", "type", "capacity", "occupied", "status"], rows));
  },

  async getRevenueReport(hostelId?: string): Promise<ServiceResult<ReportDataset>> {
    await delay();
    const database = readDatabase();
    const buckets = new Map<string, { month: string; grossBilled: number; discounts: number; collected: number; outstanding: number; failed: number }>();

    filterPaymentsByHostel(database, hostelId).forEach((payment) => {
      const month = payment.createdAt.slice(0, 7);
      const current = buckets.get(month) ?? { month, grossBilled: 0, discounts: 0, collected: 0, outstanding: 0, failed: 0 };
      const grossAmount = getGrossAmount(database, payment.id, payment.amount);

      current.grossBilled += grossAmount;
      current.discounts += Math.max(grossAmount - payment.amount, 0);

      if (payment.status === "completed" || payment.status === "verified") {
        current.collected += payment.amount;
      } else if (payment.status === "pending") {
        current.outstanding += payment.amount;
      } else if (payment.status === "failed") {
        current.failed += payment.amount;
      }

      buckets.set(month, current);
    });

    const rows = Array.from(buckets.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((row) => ({
        month: row.month,
        grossBilled: row.grossBilled,
        discounts: row.discounts,
        collected: row.collected,
        outstanding: row.outstanding,
        failed: row.failed,
      }));

    return ok(
      buildDataset(
        "revenue",
        "Revenue Report",
        ["month", "grossBilled", "discounts", "collected", "outstanding", "failed"],
        rows,
      ),
    );
  },

  async getPaymentReport(hostelId?: string): Promise<ServiceResult<ReportDataset>> {
    await delay();
    const database = readDatabase();
    const rows = filterPaymentsByHostel(database, hostelId).map((payment) => ({
      reference: payment.reference,
      resident:
        (payment.residentId ? database.users.find((user) => user.id === payment.residentId)?.name : undefined) ??
        "Group booking",
      amount: payment.amount,
      method: payment.method,
      channel: payment.channel ?? (payment.method === "cash" || payment.method === "bank_transfer" ? "offline" : "online"),
      status: payment.status,
      createdAt: payment.createdAt.slice(0, 10),
    }));

    return ok(
      buildDataset(
        "payments",
        "Payment Report",
        ["reference", "resident", "amount", "method", "channel", "status", "createdAt"],
        rows,
      ),
    );
  },

  async getResidentReport(hostelId?: string): Promise<ServiceResult<ReportDataset>> {
    await delay();
    const database = readDatabase();
    const rows = database.users
      .filter((user) => user.role === "resident" && (!hostelId || user.hostelId === hostelId))
      .map((user) => {
        const profile = database.residentProfiles.find((item) => item.userId === user.id);
        const booking = getResidentBookings(database, user.id).find((item) => item.status !== "cancelled");
        const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
        return {
          resident: user.name,
          email: user.email,
          type: profile?.residentType ?? "student",
          institution: profile?.institution ?? "",
          room: room?.name ?? "-",
          bookingStatus: booking?.status ?? "none",
        };
      });
    return ok(buildDataset("residents", "Resident Report", ["resident", "email", "type", "institution", "room", "bookingStatus"], rows));
  },

  async exportCsv(dataset: ReportDataset): Promise<ServiceResult<{ filename: string; content: string; mimeType: string }>> {
    await delay(90);
    const content = [
      dataset.columns.join(","),
      ...dataset.rows.map((row) => dataset.columns.map((column) => JSON.stringify(row[column] ?? "")).join(",")),
    ].join("\n");
    return ok(makeDownloadPayload(`${dataset.kind}-report.csv`, content, "text/csv"));
  },

  async exportPdf(dataset: ReportDataset): Promise<ServiceResult<{ filename: string; content: string; mimeType: string }>> {
    await delay(90);
    const content = `${dataset.title}\nGenerated: ${dataset.generatedAt}\n\n${dataset.rows
      .map((row) => dataset.columns.map((column) => `${column}: ${row[column] ?? ""}`).join(" | "))
      .join("\n")}`;
    return ok(makeDownloadPayload(`${dataset.kind}-report.pdf`, content, "application/pdf"));
  },
};
