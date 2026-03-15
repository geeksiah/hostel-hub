import { Bell, CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { BookingService } from "@/services";

export default function AdminWaitingList() {
  const { database, session, refreshData } = useApp();
  const [searchParams] = useSearchParams();

  if (!database) return <div className="py-10">Loading waiting list...</div>;

  const entries = database.waitingList.filter((entry) => entry.hostelId === session.currentHostelId);
  const highlightedWaitlistId = searchParams.get("waitlist");

  return (
    <div className="space-y-6">
      <PageHeader title="Waiting list" description="Approve, reject, and convert entries." />

      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead>Position</TableHead>
              <TableHead>Resident</TableHead>
              <TableHead>Room type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const resident = database.users.find((user) => user.id === entry.residentId);
              return (
                <TableRow key={entry.id} className={highlightedWaitlistId === entry.id ? "bg-emerald-light/30" : ""}>
                  <TableCell>{entry.position}</TableCell>
                  <TableCell>{resident?.name}</TableCell>
                  <TableCell className="capitalize">{entry.roomType}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={entry.status}
                      variant={
                        entry.status === "waiting"
                          ? "warning"
                          : entry.status === "converted" || entry.status === "approved"
                            ? "success"
                            : entry.status === "rejected"
                              ? "error"
                              : "info"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenuSheet
                      title={resident?.name ?? "Waiting list entry"}
                      description="Waiting list actions"
                      details={
                        <>
                          <p><span className="text-muted-foreground">Position:</span> {entry.position}</p>
                          <p><span className="text-muted-foreground">Period:</span> {entry.periodId}</p>
                        </>
                      }
                      actions={[
                        {
                          label: "Notify resident",
                          icon: <Bell className="h-4 w-4" />,
                          onSelect: async () => {
                            await BookingService.updateWaitingListStatus(entry.id, "notified");
                            await refreshData();
                            toast.success("Resident notified.");
                          },
                        },
                        {
                          label: "Approve entry",
                          icon: <CheckCircle2 className="h-4 w-4" />,
                          onSelect: async () => {
                            await BookingService.updateWaitingListStatus(entry.id, "approved");
                            await refreshData();
                            toast.success("Entry approved.");
                          },
                        },
                        {
                          label: "Reject entry",
                          icon: <XCircle className="h-4 w-4" />,
                          destructive: true,
                          onSelect: async () => {
                            await BookingService.updateWaitingListStatus(entry.id, "rejected");
                            await refreshData();
                            toast.success("Entry rejected.");
                          },
                        },
                        {
                          label: "Convert to booking",
                          icon: <RefreshCcw className="h-4 w-4" />,
                          onSelect: async () => {
                            const result = await BookingService.convertWaitingListEntry(entry.id);
                            await refreshData();
                            if (result.data) {
                              toast.success("Waiting list entry converted to booking.");
                            } else {
                              toast.error("No matching bed is currently available.");
                            }
                          },
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
