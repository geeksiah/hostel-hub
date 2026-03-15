import type { Booking, ServiceResult } from "@/types";
import { readDatabase, writeDatabase } from "@/services/store";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";
import { queueNotificationEvent } from "@/modules/notification/service";

export const CheckInService = {
  async checkInResident(bookingId: string, inspectionNotes?: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (booking) {
      booking.status = "checked_in";
      booking.checkInDate = nowIso();
      booking.inspectionNotes = inspectionNotes ?? booking.inspectionNotes;
      booking.updatedAt = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "checkin.completed",
          type: "booking",
          title: "Checked in",
          message: "Your check-in has been completed.",
          link: `/resident/bookings?booking=${booking.id}`,
          targetType: "booking",
          targetId: booking.id,
          recipients: [{ userId: booking.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(booking);
  },

  async checkOutResident(bookingId: string, inspectionNotes?: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (booking) {
      booking.status = "checked_out";
      booking.checkOutDate = nowIso();
      booking.inspectionNotes = inspectionNotes ?? booking.inspectionNotes;
      booking.updatedAt = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "checkout.completed",
          type: "booking",
          title: "Checked out",
          message: "Your check-out has been completed.",
          link: `/resident/bookings?booking=${booking.id}`,
          targetType: "booking",
          targetId: booking.id,
          recipients: [{ userId: booking.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(booking);
  },

  async saveInspectionNotes(bookingId: string, notes: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (booking) {
      booking.inspectionNotes = notes;
      booking.updatedAt = nowIso();
    }
    writeDatabase(database);
    return ok(booking);
  },
};
