import type {
  AppDatabase,
  Booking,
  Hostel,
  Notification,
  ReportDataset,
  Room,
  ServiceResult,
} from "@/types";
import { createId } from "@/services/store";

export const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export function ok<T>(data: T, meta?: ServiceResult<T>["meta"]): ServiceResult<T> {
  return { data, meta: meta ?? { generatedAt: new Date().toISOString() } };
}

export function nowIso() {
  return new Date().toISOString();
}

export function findCurrentHostel(database: AppDatabase, hostelId?: string) {
  return database.hostels.find((hostel) => hostel.id === hostelId) ?? database.hostels[0];
}

export function pushNotification(
  database: AppDatabase,
  notification: Omit<Notification, "id" | "createdAt" | "read"> & { read?: boolean },
) {
  database.notifications.unshift({
    id: createId("ntf"),
    createdAt: nowIso(),
    read: notification.read ?? false,
    ...notification,
  });
}

export function nextWaitingPosition(database: AppDatabase, hostelId: string) {
  return database.waitingList.filter((entry) => entry.hostelId === hostelId).length + 1;
}

export function getResidentBookings(database: AppDatabase, residentId: string) {
  return database.bookings.filter((booking) => booking.residentId === residentId);
}

export function getHostelRooms(database: AppDatabase, hostelId: string) {
  return database.rooms.filter((room) => room.hostelId === hostelId);
}

export function buildDataset(
  kind: ReportDataset["kind"],
  title: string,
  columns: string[],
  rows: Array<Record<string, string | number>>,
): ReportDataset {
  return {
    id: createId("report"),
    kind,
    title,
    columns,
    rows,
    generatedAt: nowIso(),
  };
}

export function makeDownloadPayload(filename: string, content: string, mimeType: string) {
  return { filename, content, mimeType };
}

export function getBookingRoom(database: AppDatabase, booking?: Booking | null): Room | undefined {
  if (!booking) return undefined;
  return database.rooms.find((room) => room.id === booking.roomId);
}

export function getHostelById(database: AppDatabase, hostelId?: string): Hostel | undefined {
  if (!hostelId) return undefined;
  return database.hostels.find((hostel) => hostel.id === hostelId);
}
