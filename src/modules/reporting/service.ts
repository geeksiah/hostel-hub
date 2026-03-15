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
    const rows = database.payments
      .filter((payment) => {
        if (!hostelId || !payment.bookingId) return true;
        const booking = database.bookings.find((item) => item.id === payment.bookingId);
        return booking?.hostelId === hostelId;
      })
      .map((payment) => ({
        reference: payment.reference,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt.slice(0, 10),
      }));
    return ok(buildDataset("revenue", "Revenue Report", ["reference", "amount", "method", "status", "createdAt"], rows));
  },

  async getPaymentReport(hostelId?: string): Promise<ServiceResult<ReportDataset>> {
    return this.getRevenueReport(hostelId);
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
