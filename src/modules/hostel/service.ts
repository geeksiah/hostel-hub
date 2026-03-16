import type {
  AcademicPeriod,
  Bed,
  Block,
  DiscountCode,
  Hostel,
  PricingRule,
  Room,
  RoomPeriodRate,
  ServiceResult,
} from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { delay, getHostelRooms, nowIso, ok } from "@/modules/core/service-helpers";

type RoomRateInput = Pick<RoomPeriodRate, "periodId" | "price" | "active">;

function deriveLegacyRoomPricing(
  database: ReturnType<typeof readDatabase>,
  hostelId: string,
  rates: RoomRateInput[] | undefined,
  fallback?: Partial<Room>,
) {
  const getPrices = (type: AcademicPeriod["type"]) =>
    (rates ?? [])
      .filter((rate) => {
        const period = database.periods.find((item) => item.id === rate.periodId);
        return rate.active && period?.type === type;
      })
      .map((rate) => rate.price)
      .filter((price) => price > 0);

  const semesterPrices = getPrices("semester");
  const yearPrices = getPrices("year");
  const vacationPrices = getPrices("vacation");

  return {
    pricePerSemester:
      semesterPrices.length ? Math.min(...semesterPrices) : fallback?.pricePerSemester ?? 0,
    pricePerYear:
      yearPrices.length
        ? Math.min(...yearPrices)
        : fallback?.pricePerYear ?? semesterPrices[0] ?? fallback?.pricePerSemester ?? 0,
    pricePerNight:
      vacationPrices.length
        ? Math.max(40, Math.round(Math.min(...vacationPrices) / 45))
        : fallback?.pricePerNight ?? Math.max(40, Math.round(((fallback?.pricePerSemester ?? 1000) || 1000) / 30)),
  };
}

function replaceRoomPeriodRates(
  database: ReturnType<typeof readDatabase>,
  roomId: string,
  hostelId: string,
  rates: RoomRateInput[],
) {
  const hostel = database.hostels.find((item) => item.id === hostelId);
  const tenant = hostel ? database.tenants.find((item) => item.id === hostel.tenantId) : undefined;
  const currency = tenant?.currency ?? database.marketConfig.currency;

  database.roomPeriodRates = database.roomPeriodRates.filter((rate) => rate.roomId !== roomId);
  database.roomPeriodRates.push(
    ...rates.map((rate) => ({
      id: createId("rate"),
      roomId,
      periodId: rate.periodId,
      price: rate.price,
      active: rate.active,
      currency,
    })),
  );
}

export const HostelService = {
  async listHostels(): Promise<ServiceResult<Hostel[]>> {
    await delay();
    return ok(readDatabase().hostels);
  },

  async getHostel(id: string): Promise<ServiceResult<Hostel | undefined>> {
    await delay();
    return ok(readDatabase().hostels.find((hostel) => hostel.id === id));
  },

  async createHostelProfile(payload: Partial<Hostel> & { tenantId: string; name: string }): Promise<ServiceResult<Hostel>> {
    await delay();
    const database = readDatabase();
    const hostel: Hostel = {
      id: createId("hostel"),
      tenantId: payload.tenantId,
      name: payload.name,
      location: payload.location ?? "",
      university: payload.university ?? "",
      allowedSchools: payload.allowedSchools ?? (payload.university ? [payload.university] : []),
      description: payload.description ?? "",
      image: payload.image ?? "",
      coverImages: payload.coverImages ?? [],
      rules: payload.rules ?? [],
      amenities: payload.amenities ?? [],
      contact: payload.contact ?? { phone: "", email: "" },
      rating: payload.rating ?? 4,
      totalBeds: 0,
      availableBeds: 0,
      genderPolicy: payload.genderPolicy ?? "mixed",
      checkInTime: payload.checkInTime ?? "09:00",
      checkOutTime: payload.checkOutTime ?? "12:00",
    };
    database.hostels.push(hostel);
    const tenant = database.tenants.find((item) => item.id === payload.tenantId);
    if (tenant) tenant.hostels.push(hostel.id);
    writeDatabase(database);
    return ok(hostel);
  },

  async updateHostelProfile(id: string, payload: Partial<Hostel>): Promise<ServiceResult<Hostel | undefined>> {
    await delay();
    const database = readDatabase();
    const hostel = database.hostels.find((item) => item.id === id);
    if (hostel) Object.assign(hostel, payload);
    writeDatabase(database);
    return ok(hostel);
  },

  async updateRules(id: string, rules: string[]): Promise<ServiceResult<Hostel | undefined>> {
    return this.updateHostelProfile(id, { rules });
  },

  async updateLocation(id: string, location: string, contact?: Hostel["contact"]): Promise<ServiceResult<Hostel | undefined>> {
    return this.updateHostelProfile(id, { location, contact });
  },

  async createBlock(payload: Partial<Block> & { hostelId: string; name: string }): Promise<ServiceResult<Block>> {
    await delay();
    const database = readDatabase();
    const block: Block = {
      id: createId("block"),
      hostelId: payload.hostelId,
      name: payload.name,
      floors: payload.floors ?? 1,
    };
    database.blocks.push(block);
    writeDatabase(database);
    return ok(block);
  },

  async updateBlock(id: string, payload: Partial<Block>): Promise<ServiceResult<Block | undefined>> {
    await delay();
    const database = readDatabase();
    const block = database.blocks.find((item) => item.id === id);
    if (block) Object.assign(block, payload);
    writeDatabase(database);
    return ok(block);
  },

  async deleteBlock(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const roomIds = database.rooms.filter((room) => room.blockId === id).map((room) => room.id);
    const hasActiveBookings = database.bookings.some(
      (booking) => roomIds.includes(booking.roomId) && booking.status !== "cancelled" && booking.status !== "checked_out",
    );
    if (hasActiveBookings) return ok(false);
    database.blocks = database.blocks.filter((item) => item.id !== id);
    database.rooms = database.rooms.filter((room) => room.blockId !== id);
    database.roomPeriodRates = database.roomPeriodRates.filter((rate) => !roomIds.includes(rate.roomId));
    database.beds = database.beds.filter((bed) => database.rooms.some((room) => room.id === bed.roomId));
    writeDatabase(database);
    return ok(true);
  },

  async createRoom(
    payload: Partial<Room> & { hostelId: string; blockId: string; name: string; periodRates?: RoomRateInput[] },
  ): Promise<ServiceResult<Room>> {
    await delay();
    const database = readDatabase();
    const legacyPricing = deriveLegacyRoomPricing(database, payload.hostelId, payload.periodRates, payload);
    const room: Room = {
      id: createId("room"),
      hostelId: payload.hostelId,
      blockId: payload.blockId,
      name: payload.name,
      type: payload.type ?? "single",
      capacity: payload.capacity ?? 1,
      occupancy: 0,
      floor: payload.floor ?? 1,
      amenities: payload.amenities ?? [],
      images: payload.images ?? [],
      pricePerSemester: legacyPricing.pricePerSemester,
      pricePerYear: legacyPricing.pricePerYear,
      pricePerNight: legacyPricing.pricePerNight,
      status: payload.status ?? "available",
      genderPolicy: payload.genderPolicy ?? "mixed",
    };

    database.rooms.push(room);
    if (payload.periodRates?.length) {
      replaceRoomPeriodRates(database, room.id, payload.hostelId, payload.periodRates);
    }

    for (let index = 0; index < (payload.capacity ?? 1); index += 1) {
      database.beds.push({
        id: createId("bed"),
        roomId: room.id,
        label: `Bed ${String.fromCharCode(65 + index)}`,
        status: "available",
      });
    }

    writeDatabase(database);
    return ok(room);
  },

  async updateRoom(
    id: string,
    payload: Partial<Room> & { periodRates?: RoomRateInput[] },
  ): Promise<ServiceResult<Room | undefined>> {
    await delay();
    const database = readDatabase();
    const room = database.rooms.find((item) => item.id === id);
    if (room) {
      const { periodRates, ...roomPayload } = payload;
      Object.assign(room, roomPayload);

      if (periodRates) {
        const legacyPricing = deriveLegacyRoomPricing(database, room.hostelId, periodRates, room);
        room.pricePerSemester = legacyPricing.pricePerSemester;
        room.pricePerYear = legacyPricing.pricePerYear;
        room.pricePerNight = legacyPricing.pricePerNight;
        replaceRoomPeriodRates(database, room.id, room.hostelId, periodRates);
      }

      if (typeof roomPayload.capacity === "number") {
        const roomBeds = database.beds.filter((bed) => bed.roomId === id);
        const activeBeds = roomBeds.filter((bed) => bed.status === "occupied" || bed.status === "reserved");

        if (roomPayload.capacity > roomBeds.length) {
          for (let index = roomBeds.length; index < roomPayload.capacity; index += 1) {
            database.beds.push({
              id: createId("bed"),
              roomId: room.id,
              label: `Bed ${String.fromCharCode(65 + index)}`,
              status: "available",
            });
          }
        }

        if (roomPayload.capacity < roomBeds.length) {
          const removableBeds = roomBeds
            .filter((bed) => bed.status === "available" || bed.status === "maintenance")
            .slice()
            .reverse();
          const targetRemoveCount = Math.min(roomBeds.length - roomPayload.capacity, removableBeds.length);

          for (let index = 0; index < targetRemoveCount; index += 1) {
            database.beds = database.beds.filter((bed) => bed.id !== removableBeds[index].id);
          }
        }

        room.capacity = Math.max(activeBeds.length, database.beds.filter((bed) => bed.roomId === room.id).length);
      }
    }
    writeDatabase(database);
    return ok(room);
  },

  async deleteRoom(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const hasActiveBookings = database.bookings.some(
      (booking) => booking.roomId === id && booking.status !== "cancelled" && booking.status !== "checked_out",
    );
    if (hasActiveBookings) return ok(false);
    database.rooms = database.rooms.filter((room) => room.id !== id);
    database.roomPeriodRates = database.roomPeriodRates.filter((rate) => rate.roomId !== id);
    database.beds = database.beds.filter((bed) => bed.roomId !== id);
    writeDatabase(database);
    return ok(true);
  },

  async createBeds(roomId: string, count: number): Promise<ServiceResult<Bed[]>> {
    await delay();
    const database = readDatabase();
    const room = database.rooms.find((item) => item.id === roomId);
    if (!room) return ok([]);
    const current = database.beds.filter((bed) => bed.roomId === roomId).length;
    const beds: Bed[] = [];
    for (let index = 0; index < count; index += 1) {
      const bed: Bed = {
        id: createId("bed"),
        roomId,
        label: `Bed ${String.fromCharCode(65 + current + index)}`,
        status: "available",
      };
      database.beds.push(bed);
      beds.push(bed);
    }
    room.capacity += count;
    writeDatabase(database);
    return ok(beds);
  },
};

export const RoomService = {
  async getAll(): Promise<ServiceResult<Room[]>> {
    await delay();
    return ok(readDatabase().rooms);
  },

  async getByHostel(hostelId: string): Promise<ServiceResult<Room[]>> {
    await delay();
    return ok(getHostelRooms(readDatabase(), hostelId));
  },

  async getById(id: string): Promise<ServiceResult<Room | undefined>> {
    await delay();
    return ok(readDatabase().rooms.find((room) => room.id === id));
  },
};

export const BedService = {
  async getByRoom(roomId: string): Promise<ServiceResult<Bed[]>> {
    await delay();
    return ok(readDatabase().beds.filter((bed) => bed.roomId === roomId));
  },

  async updateStatus(id: string, status: Bed["status"]): Promise<ServiceResult<Bed | undefined>> {
    await delay();
    const database = readDatabase();
    const bed = database.beds.find((item) => item.id === id);
    if (bed) bed.status = status;
    writeDatabase(database);
    return ok(bed);
  },

  async updateBed(id: string, payload: Partial<Bed>): Promise<ServiceResult<Bed | undefined>> {
    await delay();
    const database = readDatabase();
    const bed = database.beds.find((item) => item.id === id);
    if (bed) {
      Object.assign(bed, payload);
      if ((bed.status === "reserved" || bed.status === "occupied") && !bed.bookingId) {
        bed.status = "available";
      }
    }
    writeDatabase(database);
    return ok(bed);
  },

  async deleteBed(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    const bed = database.beds.find((item) => item.id === id);
    if (!bed) return ok(false);
    const linkedBooking = database.bookings.find(
      (booking) => booking.bedId === id && booking.status !== "cancelled" && booking.status !== "checked_out",
    );
    if (linkedBooking) return ok(false);
    database.beds = database.beds.filter((item) => item.id !== id);
    const room = database.rooms.find((item) => item.id === bed.roomId);
    if (room) {
      room.capacity = Math.max(1, database.beds.filter((item) => item.roomId === room.id).length);
    }
    writeDatabase(database);
    return ok(true);
  },
};

export const PeriodPricingService = {
  async listPeriods(hostelId: string): Promise<ServiceResult<AcademicPeriod[]>> {
    await delay();
    return ok(readDatabase().periods.filter((period) => period.hostelId === hostelId));
  },

  async createPeriod(payload: Partial<AcademicPeriod> & { hostelId: string; name: string }): Promise<ServiceResult<AcademicPeriod>> {
    await delay();
    const database = readDatabase();
    const period: AcademicPeriod = {
      id: createId("period"),
      hostelId: payload.hostelId,
      name: payload.name,
      type: payload.type ?? "semester",
      startDate: payload.startDate ?? nowIso(),
      endDate: payload.endDate ?? nowIso(),
      isActive: Boolean(payload.isActive),
    };

    if (period.isActive) {
      database.periods.forEach((item) => {
        if (item.hostelId === period.hostelId) item.isActive = false;
      });
    }

    database.periods.push(period);
    writeDatabase(database);
    return ok(period);
  },

  async updatePeriod(id: string, payload: Partial<AcademicPeriod>): Promise<ServiceResult<AcademicPeriod | undefined>> {
    await delay();
    const database = readDatabase();
    const period = database.periods.find((item) => item.id === id);
    if (period) {
      if (payload.isActive) {
        database.periods.forEach((item) => {
          if (item.hostelId === period.hostelId) item.isActive = false;
        });
      }
      Object.assign(period, payload);
    }
    writeDatabase(database);
    return ok(period);
  },

  async deletePeriod(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    database.periods = database.periods.filter((period) => period.id !== id);
    database.roomPeriodRates = database.roomPeriodRates.filter((rate) => rate.periodId !== id);
    writeDatabase(database);
    return ok(true);
  },

  async listPricingRules(hostelId: string): Promise<ServiceResult<PricingRule[]>> {
    await delay();
    return ok(readDatabase().pricingRules.filter((rule) => rule.hostelId === hostelId));
  },

  async savePricingRule(payload: Partial<PricingRule> & { hostelId: string; roomType: PricingRule["roomType"] }): Promise<ServiceResult<PricingRule>> {
    await delay();
    const database = readDatabase();
    const existing = payload.id ? database.pricingRules.find((item) => item.id === payload.id) : undefined;
    if (existing) {
      Object.assign(existing, payload);
      writeDatabase(database);
      return ok(existing);
    }

    const rule: PricingRule = {
      id: createId("price"),
      hostelId: payload.hostelId,
      roomType: payload.roomType,
      periodType: payload.periodType ?? "semester",
      durationLabel: payload.durationLabel ?? "Semester",
      price: payload.price ?? 0,
      currency:
        payload.currency ??
        database.tenants.find((tenant) => tenant.id === database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId)?.currency ??
        database.marketConfig.currency,
      active: payload.active ?? true,
    };
    database.pricingRules.push(rule);
    writeDatabase(database);
    return ok(rule);
  },

  async deletePricingRule(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    database.pricingRules = database.pricingRules.filter((rule) => rule.id !== id);
    writeDatabase(database);
    return ok(true);
  },

  async createDiscountCode(payload: Partial<DiscountCode> & { hostelId: string; code: string }): Promise<ServiceResult<DiscountCode>> {
    await delay();
    const database = readDatabase();
    const code: DiscountCode = {
      id: createId("discount"),
      hostelId: payload.hostelId,
      code: payload.code.toUpperCase(),
      percentage: payload.percentage ?? 0,
      validUntil: payload.validUntil ?? nowIso(),
      usageLimit: payload.usageLimit ?? 10,
      usedCount: payload.usedCount ?? 0,
      active: payload.active ?? true,
    };
    database.discountCodes.push(code);
    writeDatabase(database);
    return ok(code);
  },

  async updateDiscountCode(id: string, payload: Partial<DiscountCode>): Promise<ServiceResult<DiscountCode | undefined>> {
    await delay();
    const database = readDatabase();
    const code = database.discountCodes.find((item) => item.id === id);
    if (code) Object.assign(code, payload);
    writeDatabase(database);
    return ok(code);
  },

  async deleteDiscountCode(id: string): Promise<ServiceResult<boolean>> {
    await delay();
    const database = readDatabase();
    database.discountCodes = database.discountCodes.filter((code) => code.id !== id);
    writeDatabase(database);
    return ok(true);
  },
};
