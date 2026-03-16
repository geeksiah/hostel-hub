import type { Booking, BookingStatus, ExploreFilters, GroupBooking, Room, ServiceResult, WaitingListEntry } from "@/types";
import { defaultExploreFilters } from "@/services/mock-data";
import {
  createId,
  getRoomPriceForDuration,
  getRoomPriceForPeriod,
  readDatabase,
  roomHasActiveRateForPeriod,
  roomPrice,
  writeDatabase,
} from "@/services/store";
import { delay, findCurrentHostel, getHostelRooms, nextWaitingPosition, nowIso, ok } from "@/modules/core/service-helpers";
import { getTenantAdminRecipients, queueNotificationEvent } from "@/modules/notification/service";

export const BookingService = {
  async getAvailability(hostelId: string, filters: Partial<ExploreFilters> = {}): Promise<ServiceResult<Room[]>> {
    await delay();
    const database = readDatabase();
    const merged = { ...defaultExploreFilters, ...filters };
    const rooms = getHostelRooms(database, hostelId).filter((room) => {
      const hostel = findCurrentHostel(database, room.hostelId);
      const hasAvailableBed = database.beds.some((bed) => bed.roomId === room.id && bed.status === "available");
      const matchesSearch =
        merged.search.trim().length === 0 ||
        room.name.toLowerCase().includes(merged.search.toLowerCase()) ||
        hostel.name.toLowerCase().includes(merged.search.toLowerCase()) ||
        hostel.location.toLowerCase().includes(merged.search.toLowerCase());
      const matchesType = merged.roomType === "all" || room.type === merged.roomType;
      const matchesUni = merged.university === "All Universities" || hostel.university === merged.university;
      const matchesGender = merged.genderPolicy === "all" || room.genderPolicy === merged.genderPolicy || hostel.genderPolicy === merged.genderPolicy;
      const price = getRoomPriceForDuration(database, room, merged.duration === "all" ? "semester" : merged.duration);
      const withinPrice = price >= merged.priceRange[0] && price <= merged.priceRange[1];
      const availability = merged.availabilityOnly ? hasAvailableBed : true;
      return matchesSearch && matchesType && matchesUni && matchesGender && withinPrice && availability;
    });

    const sorted = [...rooms].sort((left, right) => {
      if (merged.sort === "price_asc") {
        return getRoomPriceForDuration(database, left, merged.duration === "all" ? "semester" : merged.duration)
          - getRoomPriceForDuration(database, right, merged.duration === "all" ? "semester" : merged.duration);
      }
      if (merged.sort === "price_desc") {
        return getRoomPriceForDuration(database, right, merged.duration === "all" ? "semester" : merged.duration)
          - getRoomPriceForDuration(database, left, merged.duration === "all" ? "semester" : merged.duration);
      }
      if (merged.sort === "beds_desc") {
        const leftBeds = database.beds.filter((bed) => bed.roomId === left.id && bed.status === "available").length;
        const rightBeds = database.beds.filter((bed) => bed.roomId === right.id && bed.status === "available").length;
        return rightBeds - leftBeds;
      }
      return findCurrentHostel(database, right.hostelId).rating - findCurrentHostel(database, left.hostelId).rating;
    });

    return ok(sorted);
  },

  async createBooking(payload: {
    residentId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    periodId: string;
    durationLabel: string;
    discountCode?: string;
  }): Promise<ServiceResult<Booking>> {
    await delay();
    const database = readDatabase();
    const room = database.rooms.find((item) => item.id === payload.roomId);
    const bed = database.beds.find((item) => item.id === payload.bedId);
    const period = database.periods.find((item) => item.id === payload.periodId);
    if (!room || !bed || !period) {
      throw new Error("Invalid booking payload");
    }

    let amount = getRoomPriceForPeriod(database, room, period);
    if (payload.discountCode) {
      const discount = database.discountCodes.find(
        (item) => item.hostelId === payload.hostelId && item.code === payload.discountCode.toUpperCase() && item.active,
      );
      if (discount) {
        amount = Math.round(amount * ((100 - discount.percentage) / 100));
        discount.usedCount += 1;
      }
    }

    const booking: Booking = {
      id: createId("booking"),
      residentId: payload.residentId,
      hostelId: payload.hostelId,
      roomId: payload.roomId,
      bedId: payload.bedId,
      periodId: payload.periodId,
      status: "pending",
      amount,
      durationLabel: payload.durationLabel,
      discountCode: payload.discountCode,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    database.bookings.unshift(booking);
    bed.status = "reserved";
    bed.residentId = payload.residentId;
    bed.bookingId = booking.id;
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "booking.created",
        type: "booking",
        title: "New booking created",
        message: `A resident started booking Room ${room.name} and is awaiting payment.`,
        link: `/admin/bookings?booking=${booking.id}`,
        actionLabel: "Open booking",
        targetType: "booking",
        targetId: booking.id,
        recipients: getTenantAdminRecipients(database, tenantId),
      });
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "booking.status_updated",
        type: "booking",
        title: "Booking created",
        message: `Your booking for Room ${room.name} is pending payment.`,
        link: `/resident/bookings?booking=${booking.id}`,
        actionLabel: "Open booking",
        targetType: "booking",
        targetId: booking.id,
        recipients: [{ userId: payload.residentId, audience: "resident" }],
      });
    }

    writeDatabase(database);
    return ok(booking);
  },

  async cancelBooking(id: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === id);
    if (booking) {
      booking.status = "cancelled";
      booking.updatedAt = nowIso();
      const bed = database.beds.find((item) => item.id === booking.bedId);
      if (bed && bed.status !== "maintenance") {
        bed.status = "available";
        bed.residentId = undefined;
        bed.bookingId = undefined;
      }
      const tenantId = database.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "booking.cancelled",
          type: "booking",
          title: "Booking cancelled",
          message: `Booking ${booking.id} was cancelled before move-in.`,
          link: `/admin/bookings?booking=${booking.id}`,
          targetType: "booking",
          targetId: booking.id,
          recipients: getTenantAdminRecipients(database, tenantId),
        });
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "booking.status_updated",
          type: "booking",
          title: "Booking cancelled",
          message: `Booking ${booking.id} was cancelled.`,
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

  async updateBookingStatus(id: string, status: BookingStatus): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = nowIso();
      if (status === "checked_in") booking.checkInDate = nowIso();
      if (status === "checked_out") booking.checkOutDate = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "booking.status_updated",
          type: "booking",
          title: "Booking status updated",
          message: `Your booking is now ${status.replace(/_/g, " ")}.`,
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

  async createGroupRequest(payload: {
    organizerId: string;
    hostelId: string;
    groupName: string;
    bedsRequired: number;
    periodId: string;
    contactPhone: string;
    notes?: string;
  }): Promise<ServiceResult<GroupBooking>> {
    await delay();
    const database = readDatabase();
    const period = database.periods.find((item) => item.id === payload.periodId);
    const roomPrices = database.rooms
      .filter((room) => room.hostelId === payload.hostelId)
      .filter((room) => !period || roomHasActiveRateForPeriod(database, room.id, payload.periodId))
      .map((room) => getRoomPriceForPeriod(database, room, period));
    const estimateSource = roomPrices.filter((price) => price > 0);
    const estimatedBedPrice = estimateSource.length ? Math.min(...estimateSource) : 0;
    const request: GroupBooking = {
      id: createId("group"),
      organizerId: payload.organizerId,
      hostelId: payload.hostelId,
      groupName: payload.groupName,
      bedsRequired: payload.bedsRequired,
      bedsAllocated: 0,
      allocatedBedIds: [],
      periodId: payload.periodId,
      status: "requested",
      amount: estimatedBedPrice * payload.bedsRequired,
      contactPhone: payload.contactPhone,
      notes: payload.notes,
      createdAt: nowIso(),
    };

    database.groupBookings.unshift(request);
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "group.request_created",
        type: "booking",
        title: "New group booking request",
        message: `${payload.groupName} requested ${payload.bedsRequired} beds.`,
        link: `/admin/bookings?group=${request.id}`,
        targetType: "group_booking",
        targetId: request.id,
        recipients: getTenantAdminRecipients(database, tenantId),
      });
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "group.request_created",
        type: "booking",
        title: "Group request submitted",
        message: `Your request for ${payload.bedsRequired} beds was submitted.`,
        link: `/group-booking?group=${request.id}`,
        targetType: "group_booking",
        targetId: request.id,
        recipients: [{ userId: payload.organizerId, audience: "group_organizer" }],
      });
    }
    writeDatabase(database);
    return ok(request);
  },

  async allocateGroupBeds(groupBookingId: string, bedIds: string[]): Promise<ServiceResult<GroupBooking | undefined>> {
    await delay();
    const database = readDatabase();
    const request = database.groupBookings.find((item) => item.id === groupBookingId);
    if (!request) return ok(undefined);
    const period = database.periods.find((item) => item.id === request.periodId);
    let total = 0;

    request.allocatedBedIds = bedIds;
    request.bedsAllocated = bedIds.length;
    request.status = bedIds.length >= request.bedsRequired ? "allocated" : "reviewing";

    bedIds.forEach((bedId) => {
      const bed = database.beds.find((item) => item.id === bedId);
      if (!bed) return;
      bed.status = "reserved";
      const room = database.rooms.find((item) => item.id === bed.roomId);
      if (room) total += getRoomPriceForPeriod(database, room, period);
    });
    request.amount = total;

    const tenantId = database.hostels.find((hostel) => hostel.id === request.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "group.allocated",
        type: "booking",
        title: "Beds allocated",
        message: `${request.bedsAllocated} beds have been allocated to your group request.`,
        link: `/group-booking?group=${request.id}`,
        targetType: "group_booking",
        targetId: request.id,
        recipients: [{ userId: request.organizerId, audience: "group_organizer" }],
      });
    }
    writeDatabase(database);
    return ok(request);
  },

  async updateGroupRequest(groupBookingId: string, payload: Partial<GroupBooking>): Promise<ServiceResult<GroupBooking | undefined>> {
    await delay();
    const database = readDatabase();
    const request = database.groupBookings.find((item) => item.id === groupBookingId);
    if (request) Object.assign(request, payload);
    writeDatabase(database);
    return ok(request);
  },

  async joinWaitingList(payload: {
    residentId: string;
    hostelId: string;
    roomType: WaitingListEntry["roomType"];
    periodId: string;
  }): Promise<ServiceResult<WaitingListEntry>> {
    await delay();
    const database = readDatabase();
    const entry: WaitingListEntry = {
      id: createId("wait"),
      residentId: payload.residentId,
      hostelId: payload.hostelId,
      roomType: payload.roomType,
      periodId: payload.periodId,
      position: nextWaitingPosition(database, payload.hostelId),
      status: "waiting",
      createdAt: nowIso(),
    };
    database.waitingList.push(entry);
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "waitlist.joined",
        type: "waitlist",
        title: "Resident joined the waiting list",
        message: `A resident joined the ${payload.roomType} waitlist.`,
        link: `/admin/bookings?tab=waitlist&waitlist=${entry.id}`,
        targetType: "waitlist",
        targetId: entry.id,
        recipients: getTenantAdminRecipients(database, tenantId),
      });
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "waitlist.updated",
        type: "waitlist",
        title: "Joined waiting list",
        message: `You have been added to the ${payload.roomType} room waiting list.`,
        link: `/resident/bookings?waitlist=${entry.id}`,
        targetType: "waitlist",
        targetId: entry.id,
        recipients: [{ userId: payload.residentId, audience: "resident" }],
      });
    }
    writeDatabase(database);
    return ok(entry);
  },

  async updateWaitingListStatus(id: string, status: WaitingListEntry["status"]): Promise<ServiceResult<WaitingListEntry | undefined>> {
    await delay();
    const database = readDatabase();
    const entry = database.waitingList.find((item) => item.id === id);
    if (entry) {
      entry.status = status;
      const tenantId = database.hostels.find((hostel) => hostel.id === entry.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "waitlist.updated",
          type: "waitlist",
          title: "Waiting list updated",
          message: `Your waiting list request is now ${status}.`,
          link: `/resident/bookings?waitlist=${entry.id}`,
          targetType: "waitlist",
          targetId: entry.id,
          recipients: [{ userId: entry.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(entry);
  },

  async convertWaitingListEntry(id: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const entry = database.waitingList.find((item) => item.id === id);
    if (!entry) return ok(undefined);

    const room = database.rooms.find(
      (item) =>
        item.hostelId === entry.hostelId &&
        item.type === entry.roomType &&
        database.beds.some((bed) => bed.roomId === item.id && bed.status === "available"),
    );
    const bed = room ? database.beds.find((item) => item.roomId === room.id && item.status === "available") : undefined;
    const period = database.periods.find((item) => item.id === entry.periodId);
    if (!room || !bed || !period) return ok(undefined);

    const booking: Booking = {
      id: createId("booking"),
      residentId: entry.residentId,
      hostelId: entry.hostelId,
      roomId: room.id,
      bedId: bed.id,
      periodId: entry.periodId,
      status: "reserved",
      amount: getRoomPriceForPeriod(database, room, period),
      durationLabel: period.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    database.bookings.unshift(booking);
    bed.status = "reserved";
    bed.residentId = entry.residentId;
    bed.bookingId = booking.id;
    entry.status = "converted";
    const tenantId = database.hostels.find((hostel) => hostel.id === entry.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "waitlist.converted",
        type: "waitlist",
        title: "Waitlist converted",
        message: `A ${room.type} room is now reserved for you.`,
        link: `/resident/bookings?booking=${booking.id}`,
        targetType: "booking",
        targetId: booking.id,
        recipients: [{ userId: entry.residentId, audience: "resident" }],
      });
    }
    writeDatabase(database);
    return ok(booking);
  },

  async assignResidentToBed(payload: {
    residentId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    periodId: string;
    bookingId?: string;
  }): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const room = database.rooms.find((item) => item.id === payload.roomId);
    const bed = database.beds.find((item) => item.id === payload.bedId);
    const period = database.periods.find((item) => item.id === payload.periodId);
    if (!room || !bed || !period) return ok(undefined);

    let booking =
      (payload.bookingId ? database.bookings.find((item) => item.id === payload.bookingId) : undefined) ??
      database.bookings
        .filter((item) => item.residentId === payload.residentId && item.status !== "cancelled" && item.status !== "checked_out")
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

    if (booking) {
      const previousBed = database.beds.find((item) => item.id === booking?.bedId);
      if (previousBed && previousBed.id !== bed.id && previousBed.status !== "maintenance") {
        previousBed.status = "available";
        previousBed.residentId = undefined;
        previousBed.bookingId = undefined;
      }

      booking.hostelId = payload.hostelId;
      booking.roomId = payload.roomId;
      booking.bedId = payload.bedId;
      booking.periodId = payload.periodId;
      booking.durationLabel = period.name;
      booking.amount = getRoomPriceForPeriod(database, room, period);
      booking.status = booking.status === "checked_in" ? "checked_in" : "confirmed";
      booking.updatedAt = nowIso();
    } else {
      booking = {
        id: createId("booking"),
        residentId: payload.residentId,
        hostelId: payload.hostelId,
        roomId: payload.roomId,
        bedId: payload.bedId,
        periodId: payload.periodId,
        status: "confirmed",
        amount: getRoomPriceForPeriod(database, room, period),
        durationLabel: period.name,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      database.bookings.unshift(booking);
    }

    bed.status = booking.status === "checked_in" ? "occupied" : "occupied";
    bed.residentId = payload.residentId;
    bed.bookingId = booking.id;
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "assignment.updated",
        type: "booking",
        title: "Room assignment updated",
        message: `You have been assigned to Room ${room.name}.`,
        link: `/resident/bookings?booking=${booking.id}`,
        targetType: "booking",
        targetId: booking.id,
        recipients: [{ userId: payload.residentId, audience: "resident" }],
      });
    }
    writeDatabase(database);
    return ok(booking);
  },

  async removeResidentAssignment(residentId: string, bookingId?: string): Promise<ServiceResult<Booking | undefined>> {
    await delay();
    const database = readDatabase();
    const booking =
      (bookingId ? database.bookings.find((item) => item.id === bookingId) : undefined) ??
      database.bookings
        .filter((item) => item.residentId === residentId && item.status !== "cancelled" && item.status !== "checked_out")
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    if (!booking) return ok(undefined);

    const bed = database.beds.find((item) => item.id === booking.bedId);
    if (bed && bed.status !== "maintenance") {
      bed.status = "available";
      bed.residentId = undefined;
      bed.bookingId = undefined;
    }

    booking.status = booking.status === "checked_in" ? "checked_out" : "cancelled";
    booking.updatedAt = nowIso();
    if (booking.status === "checked_out") booking.checkOutDate = nowIso();

    const tenantId = database.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "assignment.updated",
        type: "booking",
        title: "Room assignment updated",
        message: "Your room assignment has been cleared by hostel admin.",
        link: `/resident/bookings?booking=${booking.id}`,
        targetType: "booking",
        targetId: booking.id,
        recipients: [{ userId: residentId, audience: "resident" }],
      });
    }
    writeDatabase(database);
    return ok(booking);
  },
};
