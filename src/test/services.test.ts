import { beforeEach, describe, expect, it } from "vitest";
import { BookingService, DataService, PaymentService, PeriodPricingService, SiteService, TenantService, TicketService } from "@/services";

describe("persistent mock services", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await DataService.resetDemo();
  });

  it("creates a booking and reserves the selected bed", async () => {
    const bookingResult = await BookingService.createBooking({
      residentId: "u3",
      hostelId: "h1",
      roomId: "r1",
      bedId: "bed1",
      periodId: "p2",
      durationLabel: "Semester 2 2025/2026",
    });

    const snapshot = await DataService.getSnapshot();
    const bed = snapshot.data.beds.find((item) => item.id === "bed1");

    expect(bookingResult.data.status).toBe("pending");
    expect(bed?.status).toBe("reserved");
    expect(snapshot.data.bookings.some((booking) => booking.id === bookingResult.data.id)).toBe(true);
  });

  it("verifies a pending payment and confirms the linked booking", async () => {
    const paymentResult = await PaymentService.createPayment({
      bookingId: "bk3",
      residentId: "u3",
      amount: 3500,
      method: "bank_transfer",
      receiptName: "manual-proof.pdf",
    });

    await PaymentService.verifyPayment(paymentResult.data.id, "u2");
    const snapshot = await DataService.getSnapshot();
    const verifiedPayment = snapshot.data.payments.find((item) => item.id === paymentResult.data.id);
    const booking = snapshot.data.bookings.find((item) => item.id === "bk3");

    expect(verifiedPayment?.status).toBe("verified");
    expect(booking?.status).toBe("confirmed");
  });

  it("adds residents to the waiting list with incrementing positions", async () => {
    const first = await BookingService.joinWaitingList({
      residentId: "u4",
      hostelId: "h1",
      roomType: "single",
      periodId: "p2",
    });
    const second = await BookingService.joinWaitingList({
      residentId: "u6",
      hostelId: "h1",
      roomType: "single",
      periodId: "p2",
    });

    expect(first.data.position).toBeGreaterThan(0);
    expect(second.data.position).toBe(first.data.position + 1);
  });

  it("converts an approved waitlist entry into a reserved booking", async () => {
    const entry = await BookingService.joinWaitingList({
      residentId: "u4",
      hostelId: "h2",
      roomType: "double",
      periodId: "p1",
    });

    const bookingResult = await BookingService.convertWaitingListEntry(entry.data.id);
    const snapshot = await DataService.getSnapshot();
    const updatedEntry = snapshot.data.waitingList.find((item) => item.id === entry.data.id);

    expect(bookingResult.data?.status).toBe("reserved");
    expect(updatedEntry?.status).toBe("converted");
  });

  it("updates pricing and period records in place", async () => {
    const period = await PeriodPricingService.createPeriod({
      hostelId: "h1",
      name: "Vacation 2027",
      type: "vacation",
      startDate: "2027-06-01",
      endDate: "2027-08-01",
      isActive: true,
    });
    const rule = await PeriodPricingService.savePricingRule({
      hostelId: "h1",
      roomType: "single",
      periodType: "vacation",
      durationLabel: "Vacation",
      price: 1800,
      currency: "GHS",
    });

    await PeriodPricingService.updatePeriod(period.data.id, { name: "Vacation 2027 Updated" });
    await PeriodPricingService.savePricingRule({
      id: rule.data.id,
      hostelId: "h1",
      roomType: "single",
      periodType: "vacation",
      durationLabel: "Vacation",
      price: 1950,
      currency: "GHS",
    });

    const snapshot = await DataService.getSnapshot();
    expect(snapshot.data.periods.find((item) => item.id === period.data.id)?.name).toBe("Vacation 2027 Updated");
    expect(snapshot.data.pricingRules.find((item) => item.id === rule.data.id)?.price).toBe(1950);
  });

  it("moves tickets through assigned, resolved, and closed states", async () => {
    const created = await TicketService.createTicket({
      residentId: "u3",
      hostelId: "h1",
      category: "maintenance",
      subject: "Fan issue",
      description: "The ceiling fan is noisy.",
    });

    await TicketService.assignTicket(created.data.id, "u2");
    await TicketService.resolveTicket(created.data.id, "Fan tightened.");
    await TicketService.closeTicket(created.data.id);

    const snapshot = await DataService.getSnapshot();
    const ticket = snapshot.data.tickets.find((item) => item.id === created.data.id);
    expect(ticket?.status).toBe("closed");
    expect(ticket?.resolutionNote).toBe("Fan tightened.");
  });

  it("estimates group requests and totals allocations per assigned bed", async () => {
    const request = await BookingService.createGroupRequest({
      organizerId: "u5",
      hostelId: "h1",
      groupName: "Debate Camp",
      bedsRequired: 2,
      periodId: "p1",
      contactPhone: "+233200000000",
    });

    await BookingService.allocateGroupBeds(request.data.id, ["bed9", "bed10"]);
    const snapshot = await DataService.getSnapshot();
    const updatedRequest = snapshot.data.groupBookings.find((item) => item.id === request.data.id);

    expect(request.data.amount).toBeGreaterThan(0);
    expect(updatedRequest?.amount).toBe(4200);
    expect(updatedRequest?.bedsAllocated).toBe(2);
  });

  it("assigns and removes resident room allocations through admin actions", async () => {
    await BookingService.assignResidentToBed({
      residentId: "u3",
      hostelId: "h1",
      roomId: "r4",
      bedId: "bed9",
      periodId: "p2",
      bookingId: "bk3",
    });

    let snapshot = await DataService.getSnapshot();
    let booking = snapshot.data.bookings.find((item) => item.id === "bk3");
    let bed = snapshot.data.beds.find((item) => item.id === "bed9");

    expect(booking?.roomId).toBe("r4");
    expect(booking?.status).toBe("confirmed");
    expect(bed?.status).toBe("occupied");

    await BookingService.removeResidentAssignment("u3", "bk3");
    snapshot = await DataService.getSnapshot();
    booking = snapshot.data.bookings.find((item) => item.id === "bk3");
    bed = snapshot.data.beds.find((item) => item.id === "bed9");

    expect(booking?.status).toBe("cancelled");
    expect(bed?.status).toBe("available");
  });

  it("bootstraps a new tenant with theme, site, domain, and payment config", async () => {
    const created = await TenantService.createTenant({
      name: "North Campus Homes",
      ownerId: "u1",
      status: "active",
    });

    const snapshot = await DataService.getSnapshot();
    const tenant = snapshot.data.tenants.find((item) => item.id === created.data.id);
    const site = snapshot.data.sites.find((item) => item.tenantId === created.data.id);
    const domain = snapshot.data.domains.find((item) => item.siteId === site?.id);
    const theme = snapshot.data.brandThemes.find((item) => item.tenantId === created.data.id);
    const paymentConfig = snapshot.data.tenantPaymentConfigs.find((item) => item.tenantId === created.data.id);

    expect(tenant?.primarySiteId).toBe(site?.id);
    expect(site?.type).toBe("tenant_brand");
    expect(domain?.hostname).toContain(".stay.hostelhub.app");
    expect(theme?.logoText).toBe("North Campus Homes");
    expect(paymentConfig?.supportedMethods.some((item) => item.method === "bank_transfer" && item.enabled)).toBe(true);
  });

  it("creates a hostel microsite and links it back to the hostel record", async () => {
    const created = await SiteService.createSite({
      tenantId: "t1",
      hostelId: "h2",
      name: "Dreamland Annex Site",
      slug: "dreamland-annex",
      type: "hostel_microsite",
    });

    const snapshot = await DataService.getSnapshot();
    const site = snapshot.data.sites.find((item) => item.id === created.data.id);
    const hostel = snapshot.data.hostels.find((item) => item.id === "h2");
    const domain = snapshot.data.domains.find((item) => item.siteId === created.data.id && item.isManagedFallback);

    expect(site?.hostelId).toBe("h2");
    expect(hostel?.siteId).toBe(created.data.id);
    expect(domain?.hostname).toBe("dreamland-annex.stay.hostelhub.app");
  });

  it("fails payments for tenant methods that are disabled", async () => {
    await TenantService.updatePaymentConfig("t1", {
      provider: "paystack",
      providerDisplayName: "Paystack",
      supportedMethods: [
        { method: "momo", enabled: false, channel: "online", displayLabel: "Mobile money" },
        { method: "card", enabled: false, channel: "online", displayLabel: "Card" },
        { method: "bank_transfer", enabled: true, channel: "offline", displayLabel: "Bank transfer" },
        { method: "cash", enabled: false, channel: "offline", displayLabel: "Cash" },
      ],
    });

    const paymentResult = await PaymentService.createPayment({
      bookingId: "bk3",
      residentId: "u3",
      amount: 3500,
      method: "momo",
    });

    expect(paymentResult.data.status).toBe("failed");
    expect(paymentResult.data.failureReason).toContain("disabled");
  });
});
