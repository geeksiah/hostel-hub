import type { Booking, GroupBooking, Room, ServiceResult, User } from "@/types";
import { readDatabase } from "@/services/store";
import { delay, ok } from "@/modules/core/service-helpers";

export const QrService = {
  async generateResidentQr(userId: string): Promise<ServiceResult<string>> {
    await delay(90);
    const database = readDatabase();
    const user = database.users.find((item) => item.id === userId);
    const booking = database.bookings.find(
      (item) => item.residentId === userId && ["confirmed", "checked_in", "reserved"].includes(item.status),
    );
    const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
    return ok(
      JSON.stringify({
        userId,
        role: "resident",
        resident: user?.name,
        hostelId: booking?.hostelId,
        room: room?.name,
        bookingId: booking?.id,
      }),
    );
  },

  async generateGroupQr(groupBookingId: string): Promise<ServiceResult<string>> {
    await delay(90);
    const database = readDatabase();
    const groupBooking = database.groupBookings.find((item) => item.id === groupBookingId);
    const organizer = groupBooking ? database.users.find((item) => item.id === groupBooking.organizerId) : undefined;
    return ok(
      JSON.stringify({
        role: "group_organizer",
        groupBookingId,
        userId: organizer?.id,
        hostelId: groupBooking?.hostelId,
      }),
    );
  },

  async verifyResidentToken(token: string): Promise<ServiceResult<{ user?: User; booking?: Booking; room?: Room; groupBooking?: GroupBooking }>> {
    await delay(90);
    const database = readDatabase();
    try {
      const decoded = JSON.parse(token) as { userId?: string; bookingId?: string; groupBookingId?: string };
      const user = database.users.find((item) => item.id === decoded.userId);
      const groupBooking = database.groupBookings.find(
        (item) => item.id === decoded.groupBookingId || item.organizerId === decoded.userId,
      );
      const booking = database.bookings.find((item) => item.id === decoded.bookingId || item.residentId === decoded.userId);
      const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
      return ok({ user, booking, room, groupBooking });
    } catch {
      const user = database.users.find((item) => item.id === token || item.email === token);
      const groupBooking = user ? database.groupBookings.find((item) => item.organizerId === user.id) : undefined;
      const booking = user ? database.bookings.find((item) => item.residentId === user.id) : undefined;
      const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
      return ok({ user, booking, room, groupBooking });
    }
  },
};
