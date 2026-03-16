import { createSeedDatabase } from "@/services/mock-data";
import type { AcademicPeriod, AppDatabase, BedStatus, BookingStatus, GroupBookingStatus, PaymentStatus, Room, RoomPeriodRate } from "@/types";
import { createDefaultTenantPaymentMethods, mergeTenantPaymentMethods } from "@/modules/payment/config";
import { createDefaultTenantEmailConfig, createDefaultTenantSmsConfig } from "@/modules/integrations/config";
import { createDefaultTenantNotificationConfig } from "@/modules/notification/config";

const STORAGE_KEY = "hostelhub-demo-db";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mergeById<T extends { id: string }>(seedItems: T[], persistedItems: T[] | undefined) {
  const map = new Map(seedItems.map((item) => [item.id, clone(item)]));
  (persistedItems ?? []).forEach((item) => {
    map.set(item.id, clone(item));
  });
  return Array.from(map.values());
}

function getCurrencyForHostel(database: AppDatabase, hostelId: string) {
  const hostel = database.hostels.find((item) => item.id === hostelId);
  const tenant = hostel ? database.tenants.find((item) => item.id === hostel.tenantId) : undefined;
  return tenant?.currency ?? database.marketConfig.currency;
}

function periodRateKey(roomId: string, periodId: string) {
  return `${roomId}:${periodId}`;
}

function syncRoomPeriodRates(database: AppDatabase) {
  const validRoomIds = new Set(database.rooms.map((room) => room.id));
  const validPeriodIds = new Set(database.periods.map((period) => period.id));

  database.roomPeriodRates = (database.roomPeriodRates ?? [])
    .filter((rate) => validRoomIds.has(rate.roomId) && validPeriodIds.has(rate.periodId))
    .map((rate) => {
      const room = database.rooms.find((item) => item.id === rate.roomId);
      return {
        ...rate,
        currency: rate.currency || (room ? getCurrencyForHostel(database, room.hostelId) : database.marketConfig.currency),
      };
    });

  const existingKeys = new Set(database.roomPeriodRates.map((rate) => periodRateKey(rate.roomId, rate.periodId)));

  database.rooms.forEach((room) => {
    const hostelPeriods = database.periods.filter((period) => period.hostelId === room.hostelId);
    const currency = getCurrencyForHostel(database, room.hostelId);

    hostelPeriods.forEach((period) => {
      const key = periodRateKey(room.id, period.id);
      if (existingKeys.has(key)) return;

      database.roomPeriodRates.push({
        id: createId("rate"),
        roomId: room.id,
        periodId: period.id,
        price: roomPrice(room, period.type),
        currency,
        active: true,
      });
      existingKeys.add(key);
    });
  });
}

function syncRoomMetrics(database: AppDatabase, roomId: string) {
  const room = database.rooms.find((item) => item.id === roomId);
  if (!room) return;

  const roomBeds = database.beds.filter((bed) => bed.roomId === roomId);
  room.capacity = roomBeds.length || room.capacity;
  room.occupancy = roomBeds.filter((bed) => bed.status === "occupied").length;
  room.status = room.occupancy >= room.capacity ? "full" : roomBeds.some((bed) => bed.status === "maintenance") ? "maintenance" : "available";
}

function syncHostelMetrics(database: AppDatabase, hostelId: string) {
  const hostel = database.hostels.find((item) => item.id === hostelId);
  if (!hostel) return;

  const hostelRooms = database.rooms.filter((room) => room.hostelId === hostelId);
  hostel.totalBeds = hostelRooms.reduce((total, room) => total + room.capacity, 0);
  hostel.availableBeds = hostelRooms.reduce((total, room) => {
    const available = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
    return total + available;
  }, 0);
}

function resolveBedStatusForBooking(status: BookingStatus): BedStatus {
  if (status === "pending" || status === "reserved") return "reserved";
  if (status === "confirmed" || status === "checked_in") return "occupied";
  return "available";
}

export function normalizeDatabase(database: AppDatabase): AppDatabase {
  const seed = createSeedDatabase();
  const next = clone({
    ...seed,
    ...database,
    marketConfig: {
      ...seed.marketConfig,
      ...database.marketConfig,
      supportedCurrencies: database.marketConfig?.supportedCurrencies ?? seed.marketConfig.supportedCurrencies,
      universities: database.marketConfig?.universities ?? seed.marketConfig.universities,
      locations: database.marketConfig?.locations ?? seed.marketConfig.locations,
      paymentMethods: database.marketConfig?.paymentMethods ?? seed.marketConfig.paymentMethods,
    },
    featureFlags: database.featureFlags ?? seed.featureFlags,
    users: database.users ?? seed.users,
    residentProfiles: database.residentProfiles ?? seed.residentProfiles,
    tenants: database.tenants ?? seed.tenants,
    brandThemes: database.brandThemes ?? seed.brandThemes,
    sites: database.sites ?? seed.sites,
    domains: database.domains ?? seed.domains,
    siteVersions: database.siteVersions ?? seed.siteVersions,
    siteAssets: database.siteAssets ?? seed.siteAssets,
    tenantPaymentConfigs: database.tenantPaymentConfigs ?? seed.tenantPaymentConfigs,
    tenantEmailConfigs: database.tenantEmailConfigs ?? seed.tenantEmailConfigs,
    tenantSmsConfigs: database.tenantSmsConfigs ?? seed.tenantSmsConfigs,
    tenantNotificationConfigs: database.tenantNotificationConfigs ?? seed.tenantNotificationConfigs,
    notificationDispatches: database.notificationDispatches ?? seed.notificationDispatches,
    hostels: database.hostels ?? seed.hostels,
    blocks: database.blocks ?? seed.blocks,
    rooms: mergeById(seed.rooms, database.rooms),
    roomPeriodRates: mergeById(seed.roomPeriodRates, database.roomPeriodRates),
    beds: mergeById(seed.beds, database.beds),
    periods: database.periods ?? seed.periods,
    bookings: database.bookings ?? seed.bookings,
    groupBookings: database.groupBookings ?? seed.groupBookings,
    payments: database.payments ?? seed.payments,
    tickets: database.tickets ?? seed.tickets,
    notifications: database.notifications ?? seed.notifications,
    waitingList: database.waitingList ?? seed.waitingList,
    pricingRules: database.pricingRules ?? seed.pricingRules,
    discountCodes: database.discountCodes ?? seed.discountCodes,
  });

  next.beds.forEach((bed) => {
    const linkedBooking = next.bookings.find((booking) => booking.bedId === bed.id && booking.status !== "cancelled" && booking.status !== "checked_out");
    if (!linkedBooking && bed.status !== "maintenance") {
      bed.bookingId = undefined;
      bed.residentId = undefined;
      bed.status = "available";
      return;
    }

    if (linkedBooking) {
      bed.bookingId = linkedBooking.id;
      bed.residentId = linkedBooking.residentId;
      bed.status = resolveBedStatusForBooking(linkedBooking.status);
    }
  });

  next.rooms.forEach((room) => syncRoomMetrics(next, room.id));
  next.hostels.forEach((hostel) => syncHostelMetrics(next, hostel.id));
  next.hostels = next.hostels.map((hostel) => ({
    ...hostel,
    allowedSchools: hostel.allowedSchools?.length ? hostel.allowedSchools : hostel.university ? [hostel.university] : [],
  }));
  syncRoomPeriodRates(next);

  next.waitingList = next.waitingList
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  next.groupBookings = next.groupBookings.map((request) => {
    if (request.amount > 0) return request;
    const period = next.periods.find((item) => item.id === request.periodId);
    const roomPrices = next.rooms
      .filter((room) => room.hostelId === request.hostelId)
      .map((room) => getRoomPriceForPeriod(next, room, period))
      .filter((price) => price > 0);
    const estimate = roomPrices.length ? Math.min(...roomPrices) * request.bedsRequired : 0;
    return { ...request, amount: estimate };
  });

  const paymentConfigTenantIds = new Set(next.tenantPaymentConfigs.map((config) => config.tenantId));
  const emailConfigTenantIds = new Set(next.tenantEmailConfigs.map((config) => config.tenantId));
  const smsConfigTenantIds = new Set(next.tenantSmsConfigs.map((config) => config.tenantId));
  const notificationConfigTenantIds = new Set(next.tenantNotificationConfigs.map((config) => config.tenantId));
  next.tenants.forEach((tenant) => {
    tenant.accountType = tenant.accountType ?? "single";
    tenant.hostelLimit = tenant.accountType === "fleet" ? Math.max(2, tenant.hostelLimit ?? tenant.hostels.length ?? 2) : 1;
    tenant.currency = tenant.currency ?? next.marketConfig.currency;

    if (!paymentConfigTenantIds.has(tenant.id)) {
      const paymentConfigId = tenant.paymentConfigId ?? createId("paycfg");
      tenant.paymentConfigId = paymentConfigId;
      next.tenantPaymentConfigs.push({
        id: paymentConfigId,
        tenantId: tenant.id,
        providerDisplayName: "Select provider",
        merchantLabel: tenant.name,
        providerFields: {},
        generatedFields: {},
        status: "draft",
        supportedMethods: createDefaultTenantPaymentMethods(next.marketConfig),
      });
    }

    if (!emailConfigTenantIds.has(tenant.id)) {
      const emailConfig = createDefaultTenantEmailConfig(tenant.id, tenant.name);
      emailConfig.id = tenant.emailConfigId ?? emailConfig.id;
      tenant.emailConfigId = emailConfig.id;
      next.tenantEmailConfigs.push(emailConfig);
    }

    if (!smsConfigTenantIds.has(tenant.id)) {
      const smsConfig = createDefaultTenantSmsConfig(tenant.id);
      smsConfig.id = tenant.smsConfigId ?? smsConfig.id;
      tenant.smsConfigId = smsConfig.id;
      next.tenantSmsConfigs.push(smsConfig);
    }

    if (!notificationConfigTenantIds.has(tenant.id)) {
      const notificationConfig = createDefaultTenantNotificationConfig(tenant.id);
      notificationConfig.id = tenant.notificationConfigId ?? notificationConfig.id;
      tenant.notificationConfigId = notificationConfig.id;
      next.tenantNotificationConfigs.push(notificationConfig);
    }
  });

  next.users = next.users.map((user) => {
    if (user.role === "tenant_admin") {
      const tenant = user.tenantId ? next.tenants.find((item) => item.id === user.tenantId) : undefined;
      return {
        ...user,
        adminAccountType: user.adminAccountType ?? "manager",
        accountStatus:
          user.accountStatus ??
          (tenant?.status === "active" ? "active" : tenant?.status === "suspended" ? "suspended" : "pending"),
        isTenantOwner: user.isTenantOwner ?? (tenant?.ownerId === user.id),
      };
    }

    const residentTenantId =
      user.role === "resident" && !user.tenantId && user.hostelId
        ? next.hostels.find((hostel) => hostel.id === user.hostelId)?.tenantId
        : user.tenantId;

    return {
      ...user,
      tenantId: residentTenantId,
      accountStatus: user.accountStatus ?? "active",
    };
  });

  next.tenantPaymentConfigs = next.tenantPaymentConfigs.map((config) => ({
    ...config,
    providerFields: config.providerFields ?? {},
    generatedFields: config.generatedFields ?? {},
    supportedMethods: mergeTenantPaymentMethods(next.marketConfig, config.supportedMethods),
  }));

  next.tenantEmailConfigs = next.tenantEmailConfigs.map((config) => ({
    ...config,
    providerFields: config.providerFields ?? {},
    generatedFields: config.generatedFields ?? {},
  }));

  next.tenantSmsConfigs = next.tenantSmsConfigs.map((config) => ({
    ...config,
    providerFields: config.providerFields ?? {},
    generatedFields: config.generatedFields ?? {},
  }));

  next.tenantNotificationConfigs = next.tenantNotificationConfigs.map((config) => {
    const fallback = createDefaultTenantNotificationConfig(config.tenantId);
    return {
      ...fallback,
      ...config,
      triggers: fallback.triggers.map((trigger) => {
        const existing = config.triggers.find((item) => item.eventKey === trigger.eventKey);
        return existing ? { ...trigger, ...existing } : trigger;
      }),
    };
  });

  next.payments = next.payments.map((payment) => {
    const booking = payment.bookingId ? next.bookings.find((item) => item.id === payment.bookingId) : undefined;
    const tenantId = payment.tenantId ?? (booking ? next.hostels.find((hostel) => hostel.id === booking.hostelId)?.tenantId : undefined);
    return {
      ...payment,
      tenantId,
      channel: payment.channel ?? (payment.method === "cash" || payment.method === "bank_transfer" ? "offline" : "online"),
      externalStatus:
        payment.externalStatus ??
        (payment.status === "pending"
          ? "verification_required"
        : payment.status === "failed"
          ? "failed"
          : "captured"),
    };
  });

  next.pricingRules = next.pricingRules.map((rule) => ({
    ...rule,
    currency:
      rule.currency ??
      next.tenants.find((tenant) => tenant.id === next.hostels.find((hostel) => hostel.id === rule.hostelId)?.tenantId)?.currency ??
      next.marketConfig.currency,
  }));

  return next;
}

export function readDatabase(): AppDatabase {
  if (!canUseStorage()) return normalizeDatabase(createSeedDatabase());
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = normalizeDatabase(createSeedDatabase());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return normalizeDatabase(JSON.parse(raw) as AppDatabase);
  } catch {
    const seeded = normalizeDatabase(createSeedDatabase());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeDatabase(database: AppDatabase): AppDatabase {
  const normalized = normalizeDatabase(database);
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function resetDatabase(): AppDatabase {
  const seeded = normalizeDatabase(createSeedDatabase());
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }
  return seeded;
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function createReference(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function updateBookingAndPaymentStatus(
  database: AppDatabase,
  bookingId: string,
  bookingStatus: BookingStatus,
  paymentStatus?: PaymentStatus,
) {
  const booking = database.bookings.find((item) => item.id === bookingId);
  if (!booking) return;

  booking.status = bookingStatus;
  booking.updatedAt = new Date().toISOString();

  if (paymentStatus) {
    database.payments
      .filter((payment) => payment.bookingId === bookingId)
      .forEach((payment) => {
        payment.status = paymentStatus;
      });
  }
}

export function updateGroupBookingStatus(database: AppDatabase, groupBookingId: string, status: GroupBookingStatus) {
  const request = database.groupBookings.find((item) => item.id === groupBookingId);
  if (!request) return;
  request.status = status;
}

export function roomPrice(room: Room, duration: "semester" | "year" | "vacation") {
  if (duration === "year") return room.pricePerYear;
  if (duration === "vacation") return room.pricePerNight * 45;
  return room.pricePerSemester;
}

export function getRoomPeriodRates(database: AppDatabase, roomId: string, options: { activeOnly?: boolean } = {}) {
  const rates = database.roomPeriodRates.filter((rate) => rate.roomId === roomId && (!options.activeOnly || rate.active));
  return rates.sort((left, right) => {
    const leftPeriod = database.periods.find((period) => period.id === left.periodId);
    const rightPeriod = database.periods.find((period) => period.id === right.periodId);
    return (leftPeriod?.startDate ?? "").localeCompare(rightPeriod?.startDate ?? "");
  });
}

export function getRoomPeriodRate(database: AppDatabase, roomId: string, periodId: string) {
  return database.roomPeriodRates.find((rate) => rate.roomId === roomId && rate.periodId === periodId);
}

export function roomHasActiveRateForPeriod(database: AppDatabase, roomId: string, periodId: string) {
  const rate = getRoomPeriodRate(database, roomId, periodId);
  return rate ? rate.active : true;
}

export function getRoomAvailablePeriods(database: AppDatabase, room: Room) {
  return database.periods.filter((period) => period.hostelId === room.hostelId && roomHasActiveRateForPeriod(database, room.id, period.id));
}

export function getRoomPriceForDuration(database: AppDatabase, room: Room, duration: AcademicPeriod["type"]) {
  const durationPrices = getRoomPeriodRates(database, room.id, { activeOnly: true })
    .map((rate) => {
      const period = database.periods.find((item) => item.id === rate.periodId);
      return period?.type === duration ? rate.price : null;
    })
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (durationPrices.length) return Math.min(...durationPrices);
  return roomPrice(room, duration);
}

export function getRoomPriceForPeriod(database: AppDatabase, room: Room, period?: AcademicPeriod | null) {
  if (!period) return getRoomPriceForDuration(database, room, "semester");
  const rate = getRoomPeriodRate(database, room.id, period.id);
  if (rate) return rate.price;
  return roomPrice(room, period.type);
}

export function getRoomStartingPrice(database: AppDatabase, room: Room) {
  const activePrices = getRoomPeriodRates(database, room.id, { activeOnly: true })
    .map((rate) => rate.price)
    .filter((price) => price > 0);

  if (activePrices.length) return Math.min(...activePrices);

  return Math.min(
    roomPrice(room, "semester"),
    roomPrice(room, "year"),
    roomPrice(room, "vacation"),
  );
}
