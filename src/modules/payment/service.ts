import type { Payment, PaymentMethod, ServiceResult } from "@/types";
import {
  createId,
  createReference,
  readDatabase,
  updateBookingAndPaymentStatus,
  updateGroupBookingStatus,
  writeDatabase,
} from "@/services/store";
import { delay, makeDownloadPayload, nowIso, ok } from "@/modules/core/service-helpers";
import { getTenantAdminRecipients, queueNotificationEvent } from "@/modules/notification/service";

export const PaymentService = {
  async listPayments(hostelId?: string): Promise<ServiceResult<Payment[]>> {
    await delay();
    const database = readDatabase();
    if (!hostelId) return ok(database.payments);
    const bookingsForHostel = new Set(database.bookings.filter((booking) => booking.hostelId === hostelId).map((booking) => booking.id));
    return ok(database.payments.filter((payment) => !payment.bookingId || bookingsForHostel.has(payment.bookingId)));
  },

  async listResidentPayments(residentId: string): Promise<ServiceResult<Payment[]>> {
    await delay();
    return ok(readDatabase().payments.filter((payment) => payment.residentId === residentId));
  },

  async createPayment(payload: {
    bookingId?: string;
    groupBookingId?: string;
    residentId?: string;
    amount: number;
    method: PaymentMethod;
    receiptName?: string;
  }): Promise<ServiceResult<Payment>> {
    await delay();
    const database = readDatabase();
    const booking = payload.bookingId ? database.bookings.find((item) => item.id === payload.bookingId) : undefined;
    const groupBooking = payload.groupBookingId ? database.groupBookings.find((item) => item.id === payload.groupBookingId) : undefined;
    const hostelId = booking?.hostelId ?? groupBooking?.hostelId ?? database.users.find((user) => user.id === payload.residentId)?.hostelId;
    const tenantId = hostelId ? database.hostels.find((hostel) => hostel.id === hostelId)?.tenantId : undefined;
    const config = database.tenantPaymentConfigs.find((item) => item.tenantId === tenantId);
    const methodConfig = config?.supportedMethods.find((item) => item.method === payload.method);
    const methodEnabled = config ? Boolean(methodConfig?.enabled) : true;
    const channel = methodConfig?.channel ?? (payload.method === "cash" || payload.method === "bank_transfer" ? "offline" : "online");
    const onlineReady = methodEnabled && channel === "online" && Boolean(config?.provider);
    const needsManualReview = methodEnabled && channel === "offline";
    const failureReason =
      !methodEnabled
        ? "This payment method is disabled for the selected tenant."
        : !onlineReady && !needsManualReview
          ? "This payment method is not enabled for the selected tenant."
          : undefined;
    const submitAudience = payload.groupBookingId ? "group_organizer" as const : "resident" as const;
    const submitLink = payload.groupBookingId ? `/group-booking?group=${payload.groupBookingId}` : `/resident/payments?payment=pending`;
    const payment: Payment = {
      id: createId("payment"),
      bookingId: payload.bookingId,
      groupBookingId: payload.groupBookingId,
      residentId: payload.residentId,
      tenantId,
      amount: payload.amount,
      method: payload.method,
      provider: onlineReady ? config?.provider : undefined,
      providerReference: onlineReady ? createReference(config?.provider?.toUpperCase() ?? "GATEWAY") : undefined,
      channel,
      failureReason,
      externalStatus: onlineReady ? "captured" : needsManualReview ? "verification_required" : "failed",
      status: onlineReady ? "completed" : needsManualReview ? "pending" : "failed",
      reference: createReference(payload.method.toUpperCase()),
      receiptName: payload.receiptName,
      createdAt: nowIso(),
    };
    database.payments.unshift(payment);

    if (tenantId) {
      if (payment.status === "failed" && payload.residentId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "payment.failed",
          type: "payment",
          title: "Payment failed",
          message: failureReason ?? `Payment ${payment.reference} could not be processed.`,
          link: payload.groupBookingId ? `/group-booking?group=${payload.groupBookingId}` : `/resident/payments?payment=${payment.id}`,
          targetType: "payment",
          targetId: payment.id,
          recipients: [{ userId: payload.residentId, audience: submitAudience }],
        });
      }

      if (payment.status === "completed" || payment.status === "pending") {
        const label =
          payload.groupBookingId
            ? `A group payment ${payment.reference} was submitted via ${payload.method.replace("_", " ")}.`
            : `A resident payment ${payment.reference} was submitted via ${payload.method.replace("_", " ")}.`;
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "payment.submitted",
          type: "payment",
          title: "Payment submitted",
          message: label,
          link: `/admin/payments?payment=${payment.id}`,
          targetType: "payment",
          targetId: payment.id,
          recipients: getTenantAdminRecipients(database, tenantId),
        });
        if (payload.residentId) {
          queueNotificationEvent(database, {
            tenantId,
            eventKey: "payment.submitted",
            type: "payment",
            title: "Payment submitted",
            message: `Payment ${payment.reference} was submitted via ${payload.method.replace("_", " ")}.`,
            link: payload.groupBookingId ? `/group-booking?group=${payload.groupBookingId}` : `/resident/payments?payment=${payment.id}`,
            targetType: payload.groupBookingId ? "group_booking" : "payment",
            targetId: payload.groupBookingId ?? payment.id,
            recipients: [{ userId: payload.residentId, audience: submitAudience }],
          });
        }
      }
    }

    if (payload.bookingId) {
      updateBookingAndPaymentStatus(database, payload.bookingId, payment.status === "completed" ? "confirmed" : "reserved");
    }

    if (payload.groupBookingId) {
      updateGroupBookingStatus(database, payload.groupBookingId, payment.status === "completed" ? "confirmed" : "allocated");
    }

    writeDatabase(database);
    return ok(payment);
  },

  async verifyPayment(id: string, verifiedBy: string): Promise<ServiceResult<Payment | undefined>> {
    await delay();
    const database = readDatabase();
    const payment = database.payments.find((item) => item.id === id);
    if (payment) {
      payment.status = "verified";
      payment.verifiedBy = verifiedBy;
      payment.externalStatus = "captured";
      if (payment.bookingId) updateBookingAndPaymentStatus(database, payment.bookingId, "confirmed", "verified");
      if (payment.groupBookingId) updateGroupBookingStatus(database, payment.groupBookingId, "confirmed");
      const tenantId = payment.tenantId ?? (payment.bookingId ? database.hostels.find((hostel) => hostel.id === database.bookings.find((item) => item.id === payment.bookingId)?.hostelId)?.tenantId : undefined);
      const groupOrganizerId = payment.groupBookingId ? database.groupBookings.find((item) => item.id === payment.groupBookingId)?.organizerId : undefined;
      const recipients = [
        ...(payment.residentId && !payment.groupBookingId ? [{ userId: payment.residentId, audience: "resident" as const }] : []),
        ...(groupOrganizerId ? [{ userId: groupOrganizerId, audience: "group_organizer" as const }] : []),
      ];
      if (tenantId && recipients.length) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "payment.verified",
          type: "payment",
          title: "Payment verified",
          message: `Payment ${payment.reference} has been verified by hostel admin.`,
          link: payment.groupBookingId ? `/group-booking?group=${payment.groupBookingId}` : `/resident/payments?payment=${payment.id}`,
          targetType: payment.groupBookingId ? "group_booking" : "payment",
          targetId: payment.groupBookingId ?? payment.id,
          recipients,
        });
      }
    }
    writeDatabase(database);
    return ok(payment);
  },

  async uploadOfflineReceipt(id: string, receiptName: string): Promise<ServiceResult<Payment | undefined>> {
    await delay();
    const database = readDatabase();
    const payment = database.payments.find((item) => item.id === id);
    if (payment) payment.receiptName = receiptName;
    writeDatabase(database);
    return ok(payment);
  },

  async downloadReceiptPdf(id: string): Promise<ServiceResult<{ filename: string; content: string; mimeType: string }>> {
    await delay(90);
    const database = readDatabase();
    const payment = database.payments.find((item) => item.id === id);
    return ok(
      makeDownloadPayload(
        `${payment?.reference ?? "receipt"}.pdf`,
        `Receipt for ${payment?.reference ?? id}\nAmount: ${payment?.amount ?? 0}\nStatus: ${payment?.status ?? "pending"}`,
        "application/pdf",
      ),
    );
  },
};
