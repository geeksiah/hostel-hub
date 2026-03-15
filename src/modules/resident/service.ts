import type { ResidentProfile, ServiceResult, Ticket, User } from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { delay, ok } from "@/modules/core/service-helpers";
import { TicketService } from "@/modules/ticket/service";

export const ResidentService = {
  async getProfile(userId: string): Promise<ServiceResult<ResidentProfile | undefined>> {
    await delay();
    return ok(readDatabase().residentProfiles.find((profile) => profile.userId === userId));
  },

  async updateProfile(userId: string, payload: Partial<ResidentProfile> & Partial<User>): Promise<ServiceResult<ResidentProfile | undefined>> {
    await delay();
    const database = readDatabase();
    const user = database.users.find((item) => item.id === userId);
    if (user) {
      user.name = payload.name ?? user.name;
      user.email = payload.email ?? user.email;
      user.phone = payload.phone ?? user.phone;
      user.avatar = payload.avatar ?? payload.passportPhoto ?? user.avatar;
    }

    let profile = database.residentProfiles.find((item) => item.userId === userId);
    if (!profile) {
      profile = {
        id: createId("resident"),
        userId,
        residentType: "student",
        institution: "",
        emergencyContact: "",
        gender: "other",
      };
      database.residentProfiles.push(profile);
    }

    Object.assign(profile, payload);
    writeDatabase(database);
    return ok(profile);
  },

  async listResidents(hostelId?: string): Promise<ServiceResult<Array<User & { profile?: ResidentProfile }>>> {
    await delay();
    const database = readDatabase();
    const users = database.users.filter((item) => item.role === "resident" && (!hostelId || item.hostelId === hostelId));
    return ok(
      users.map((user) => ({
        ...user,
        profile: database.residentProfiles.find((profile) => profile.userId === user.id),
      })),
    );
  },

  async createResident(payload: {
    name: string;
    email: string;
    phone: string;
    hostelId: string;
    institution: string;
    residentType: ResidentProfile["residentType"];
  }): Promise<ServiceResult<User>> {
    await delay();
    const database = readDatabase();
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    const user: User = {
      id: createId("user"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "resident",
      tenantId,
      hostelId: payload.hostelId,
      createdAt: new Date().toISOString(),
    };

    database.users.push(user);
    database.residentProfiles.push({
      id: createId("resident"),
      userId: user.id,
      residentType: payload.residentType,
      institution: payload.institution,
      emergencyContact: "",
      gender: "other",
    });
    writeDatabase(database);
    return ok(user);
  },

  async deleteResident(userId: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const residentBookingIds = database.bookings.filter((booking) => booking.residentId === userId).map((booking) => booking.id);
    database.users = database.users.filter((user) => user.id !== userId);
    database.residentProfiles = database.residentProfiles.filter((profile) => profile.userId !== userId);
    database.bookings = database.bookings.filter((booking) => booking.residentId !== userId);
    database.beds.forEach((bed) => {
      if (bed.residentId === userId || (bed.bookingId && residentBookingIds.includes(bed.bookingId))) {
        bed.status = "available";
        bed.residentId = undefined;
        bed.bookingId = undefined;
      }
    });
    database.tickets = database.tickets.filter((ticket) => ticket.residentId !== userId);
    database.waitingList = database.waitingList.filter((entry) => entry.residentId !== userId);
    database.notifications = database.notifications.filter((notification) => notification.userId !== userId);
    database.payments = database.payments.filter(
      (payment) => payment.residentId !== userId && (!payment.bookingId || !residentBookingIds.includes(payment.bookingId)),
    );
    writeDatabase(database);
    return ok(true);
  },

  async requestRoomChange(userId: string, subject: string, description: string, hostelId: string): Promise<ServiceResult<Ticket>> {
    return TicketService.createTicket({
      residentId: userId,
      hostelId,
      category: "room_change",
      subject,
      description,
      priority: "medium",
    });
  },
};
