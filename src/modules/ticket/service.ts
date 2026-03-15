import type { ServiceResult, Ticket, TicketCategory, TicketStatus } from "@/types";
import { createId, readDatabase, writeDatabase } from "@/services/store";
import { delay, nowIso, ok } from "@/modules/core/service-helpers";
import { getTenantAdminRecipients, queueNotificationEvent } from "@/modules/notification/service";

export const TicketService = {
  async listTickets(hostelId?: string): Promise<ServiceResult<Ticket[]>> {
    await delay();
    const database = readDatabase();
    return ok(hostelId ? database.tickets.filter((ticket) => ticket.hostelId === hostelId) : database.tickets);
  },

  async createTicket(payload: {
    residentId: string;
    hostelId: string;
    category: TicketCategory;
    subject: string;
    description: string;
    priority?: Ticket["priority"];
    images?: string[];
  }): Promise<ServiceResult<Ticket>> {
    await delay();
    const database = readDatabase();
    const ticket: Ticket = {
      id: createId("ticket"),
      residentId: payload.residentId,
      hostelId: payload.hostelId,
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      status: "open",
      priority: payload.priority ?? "medium",
      images: payload.images ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    database.tickets.unshift(ticket);
    const tenantId = database.hostels.find((hostel) => hostel.id === payload.hostelId)?.tenantId;
    if (tenantId) {
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "ticket.created",
        type: "ticket",
        title: "New ticket submitted",
        message: `${payload.category.replace("_", " ")} ticket "${payload.subject}" is waiting for review.`,
        link: `/admin/tickets?ticket=${ticket.id}`,
        targetType: "ticket",
        targetId: ticket.id,
        recipients: getTenantAdminRecipients(database, tenantId),
      });
      queueNotificationEvent(database, {
        tenantId,
        eventKey: "ticket.created",
        type: "ticket",
        title: "Ticket submitted",
        message: `Your ${payload.category.replace("_", " ")} ticket has been received.`,
        link: `/resident/tickets?ticket=${ticket.id}`,
        targetType: "ticket",
        targetId: ticket.id,
        recipients: [{ userId: payload.residentId, audience: "resident" }],
      });
    }
    writeDatabase(database);
    return ok(ticket);
  },

  async assignTicket(id: string, assignedTo: string): Promise<ServiceResult<Ticket | undefined>> {
    await delay();
    const database = readDatabase();
    const ticket = database.tickets.find((item) => item.id === id);
    if (ticket) {
      ticket.status = "assigned";
      ticket.assignedTo = assignedTo;
      ticket.updatedAt = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === ticket.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "ticket.assigned",
          type: "ticket",
          title: "Ticket assigned",
          message: `Your ticket "${ticket.subject}" is now assigned to the operations team.`,
          link: `/resident/tickets?ticket=${ticket.id}`,
          targetType: "ticket",
          targetId: ticket.id,
          recipients: [{ userId: ticket.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(ticket);
  },

  async resolveTicket(id: string, resolutionNote: string): Promise<ServiceResult<Ticket | undefined>> {
    await delay();
    const database = readDatabase();
    const ticket = database.tickets.find((item) => item.id === id);
    if (ticket) {
      ticket.status = "resolved";
      ticket.resolutionNote = resolutionNote;
      ticket.updatedAt = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === ticket.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "ticket.resolved",
          type: "ticket",
          title: "Ticket resolved",
          message: `Your ticket "${ticket.subject}" has been resolved.`,
          link: `/resident/tickets?ticket=${ticket.id}`,
          targetType: "ticket",
          targetId: ticket.id,
          recipients: [{ userId: ticket.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(ticket);
  },

  async closeTicket(id: string): Promise<ServiceResult<Ticket | undefined>> {
    await delay();
    const database = readDatabase();
    const ticket = database.tickets.find((item) => item.id === id);
    if (ticket) {
      ticket.status = "closed";
      ticket.updatedAt = nowIso();
      const tenantId = database.hostels.find((hostel) => hostel.id === ticket.hostelId)?.tenantId;
      if (tenantId) {
        queueNotificationEvent(database, {
          tenantId,
          eventKey: "ticket.closed",
          type: "ticket",
          title: "Ticket closed",
          message: `Your ticket "${ticket.subject}" has been closed.`,
          link: `/resident/tickets?ticket=${ticket.id}`,
          targetType: "ticket",
          targetId: ticket.id,
          recipients: [{ userId: ticket.residentId, audience: "resident" }],
        });
      }
    }
    writeDatabase(database);
    return ok(ticket);
  },

  async updateTicketStatus(id: string, status: TicketStatus): Promise<ServiceResult<Ticket | undefined>> {
    await delay();
    const database = readDatabase();
    const ticket = database.tickets.find((item) => item.id === id);
    if (ticket) {
      ticket.status = status;
      ticket.updatedAt = nowIso();
    }
    writeDatabase(database);
    return ok(ticket);
  },
};
