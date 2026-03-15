import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoredFileName } from "@/lib/files";
import { TicketService } from "@/services";
import { useApp } from "@/contexts/AppContext";

export default function ResidentTickets() {
  const { database, currentUser, refreshData } = useApp();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    category: "maintenance",
    subject: "Need repair in my room",
    description: "Please fix the window latch before the weekend.",
    images: [] as string[],
  });

  if (!database || !currentUser) return <div className="container py-10">Loading tickets...</div>;

  const tickets = database.tickets.filter((ticket) => ticket.residentId === currentUser.id);
  const highlightedTicketId = searchParams.get("ticket");
  const hostelId = currentUser.hostelId ?? tickets[0]?.hostelId ?? database.hostels[0]?.id;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <PageHeader title="Support tickets" description="Report and track issues." />

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">New ticket</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="maintenance">Maintenance</option>
              <option value="room_change">Room change request</option>
              <option value="general">General inquiry</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} />
          </div>
          <FileUploader
            label="Attachments"
            description="Photos or supporting files."
            accept=".pdf,image/*"
            multiple
            values={form.images}
            onChangeMany={(nextValues) => setForm({ ...form, images: nextValues })}
          />
          <Button
            variant="emerald"
            className="w-full sm:w-auto"
            onClick={async () => {
              if (!hostelId) return;
              await TicketService.createTicket({
                residentId: currentUser.id,
                hostelId,
                category: form.category as "maintenance" | "room_change" | "general",
                subject: form.subject,
                description: form.description,
                images: form.images,
              });
              await refreshData();
              toast.success("Ticket submitted.");
              setForm({
                category: "maintenance",
                subject: "",
                description: "",
                images: [],
              });
            }}
          >
            Submit ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {tickets.map((ticket) => (
          <div key={ticket.id} className={`rounded-lg border bg-card p-4 ${highlightedTicketId === ticket.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">{ticket.subject}</h2>
                <p className="text-sm capitalize text-muted-foreground">{ticket.category.replace("_", " ")} / {ticket.priority} priority</p>
              </div>
              <StatusBadge status={ticket.status} type="ticket" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{ticket.description}</p>
            {ticket.images?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.images.map((image, index) => (
                  <span key={`${ticket.id}-attachment-${index}`} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {getStoredFileName(image)}
                  </span>
                ))}
              </div>
            ) : null}
            {ticket.resolutionNote && (
              <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
                <p className="font-medium">Resolution</p>
                <p className="text-muted-foreground">{ticket.resolutionNote}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
