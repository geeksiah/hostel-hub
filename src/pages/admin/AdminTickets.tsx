import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StoredFileList } from "@/components/shared/StoredFileList";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { TicketService } from "@/services";
import { useApp } from "@/contexts/AppContext";

export default function AdminTickets() {
  const { database, currentUser, session, refreshData } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [resolutionNote, setResolutionNote] = useState("Resolved during maintenance round.");
  const highlightedTicketId = searchParams.get("ticket");

  useEffect(() => {
    if (highlightedTicketId) {
      setSelectedTicketId(highlightedTicketId);
    }
  }, [highlightedTicketId]);

  const tickets = useMemo(
    () => database?.tickets.filter((ticket) => ticket.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];

  if (!database) return <div className="py-10">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" description="Assign, resolve, and close issues." />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Ticket</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const resident = database.users.find((user) => user.id === ticket.residentId);
                return (
                  <TableRow
                    key={ticket.id}
                    className={selectedTicket?.id === ticket.id || highlightedTicketId === ticket.id ? "bg-muted/30" : ""}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">{ticket.category.replace("_", " ")}</p>
                      </div>
                    </TableCell>
                    <TableCell>{resident?.name}</TableCell>
                    <TableCell className="capitalize">{ticket.priority}</TableCell>
                    <TableCell><StatusBadge status={ticket.status} type="ticket" /></TableCell>
                    <TableCell className="text-right">
                      <ActionMenuSheet
                        title={ticket.subject}
                        description="Ticket actions"
                        onViewDetails={() => {
                          setSelectedTicketId(ticket.id);
                          setResolutionNote(ticket.resolutionNote || "Resolved during maintenance round.");
                        }}
                        details={
                          <>
                            <p><span className="text-muted-foreground">Resident:</span> {resident?.name ?? "-"}</p>
                            <p><span className="text-muted-foreground">Created:</span> {ticket.createdAt.slice(0, 10)}</p>
                          </>
                        }
                        actions={[
                          ...(ticket.status === "open"
                            ? [{
                                label: "Assign ticket",
                                icon: <ClipboardCheck className="h-4 w-4" />,
                                onSelect: async () => {
                                  await TicketService.assignTicket(ticket.id, currentUser?.id ?? "u2");
                                  await refreshData();
                                  toast.success("Ticket assigned.");
                                },
                              }]
                            : []),
                          ...(ticket.status === "assigned"
                            ? [{
                                label: "Resolve ticket",
                                icon: <CheckCircle2 className="h-4 w-4" />,
                                onSelect: async () => {
                                  await TicketService.resolveTicket(ticket.id, resolutionNote);
                                  await refreshData();
                                  toast.success("Ticket resolved.");
                                },
                              }]
                            : []),
                          ...(ticket.status === "resolved"
                            ? [{
                                label: "Close ticket",
                                icon: <XCircle className="h-4 w-4" />,
                                onSelect: async () => {
                                  await TicketService.closeTicket(ticket.id);
                                  await refreshData();
                                  toast.success("Ticket closed.");
                                },
                              }]
                            : []),
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{selectedTicket.subject}</h2>
                  <p className="text-sm text-muted-foreground">{selectedTicket.category.replace("_", " ")} / {selectedTicket.priority} priority</p>
                </div>
                <StatusBadge status={selectedTicket.status} type="ticket" />
              </div>

              <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>

              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments</p>
                <StoredFileList files={selectedTicket.images ?? []} emptyLabel="No attachments uploaded." />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Resolution notes</p>
                <Textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  rows={5}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedTicket.status === "open" ? (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={async () => {
                      await TicketService.assignTicket(selectedTicket.id, currentUser?.id ?? "u2");
                      await refreshData();
                      toast.success("Ticket assigned.");
                    }}
                  >
                    Assign ticket
                  </Button>
                ) : null}
                {selectedTicket.status === "assigned" ? (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={async () => {
                      await TicketService.resolveTicket(selectedTicket.id, resolutionNote);
                      await refreshData();
                      toast.success("Ticket resolved.");
                    }}
                  >
                    Resolve
                  </Button>
                ) : null}
                {selectedTicket.status === "resolved" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await TicketService.closeTicket(selectedTicket.id);
                      await refreshData();
                      toast.success("Ticket closed.");
                    }}
                  >
                    Close ticket
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
              Select a ticket to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
