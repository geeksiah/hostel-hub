import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, CalendarPlus, CheckCircle2, Pencil, RefreshCcw, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { BookingService } from "@/services";

const emptyManualBooking = {
  residentId: "",
  roomId: "",
  bedId: "",
  periodId: "",
};

const emptyGroupRequest = {
  organizerId: "",
  groupName: "",
  bedsRequired: 2,
  periodId: "",
  contactPhone: "",
  notes: "",
};

export default function AdminBookings() {
  const { database, session, refreshData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [manualOverlayOpen, setManualOverlayOpen] = useState(false);
  const [allocationOverlayOpen, setAllocationOverlayOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"resident" | "group">("resident");
  const [manualBooking, setManualBooking] = useState(emptyManualBooking);
  const [groupRequestForm, setGroupRequestForm] = useState(emptyGroupRequest);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupNotes, setGroupNotes] = useState("Beds allocated after admin review.");

  const residents = useMemo(
    () => database?.users.filter((user) => user.role === "resident" && user.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const rooms = useMemo(
    () => database?.rooms.filter((room) => room.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const bookings = useMemo(
    () => database?.bookings.filter((booking) => booking.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const groupRequests = useMemo(
    () => database?.groupBookings.filter((request) => request.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const waitlistEntries = useMemo(
    () => database?.waitingList.filter((entry) => entry.hostelId === session.currentHostelId) ?? [],
    [database, session.currentHostelId],
  );
  const groupOrganizers = useMemo(
    () => database?.users.filter((user) => user.role === "group_organizer") ?? [],
    [database],
  );

  if (!database) return <div className="py-10">Loading bookings...</div>;
  const currency = getHostelCurrency(database, session.currentHostelId);

  const availableBeds = database.beds.filter((bed) => {
    const room = database.rooms.find((item) => item.id === bed.roomId);
    return room?.hostelId === session.currentHostelId && bed.status === "available";
  });

  const manualBeds = availableBeds.filter((bed) => bed.roomId === manualBooking.roomId);
  const hostelPeriods = database.periods.filter((period) => period.hostelId === session.currentHostelId);
  const selectedGroup = groupRequests.find((request) => request.id === selectedGroupId);
  const highlightedBookingId = searchParams.get("booking");
  const highlightedGroupId = searchParams.get("group");
  const highlightedWaitlistId = searchParams.get("waitlist");
  const activeTab = searchParams.get("tab") ?? (highlightedWaitlistId ? "waitlist" : highlightedGroupId ? "group" : "individuals");

  const setActiveTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };

  const createManualBooking = async () => {
    if (bookingMode === "resident") {
      if (!manualBooking.residentId || !manualBooking.roomId || !manualBooking.bedId || !manualBooking.periodId) return;
      const period = database.periods.find((item) => item.id === manualBooking.periodId);
      await BookingService.createBooking({
        residentId: manualBooking.residentId,
        hostelId: session.currentHostelId,
        roomId: manualBooking.roomId,
        bedId: manualBooking.bedId,
        periodId: manualBooking.periodId,
        durationLabel: period?.name ?? "Manual booking",
      });
      toast.success("Manual booking created.");
    } else {
      if (!groupRequestForm.organizerId || !groupRequestForm.groupName.trim() || !groupRequestForm.periodId || !groupRequestForm.contactPhone.trim()) return;
      await BookingService.createGroupRequest({
        organizerId: groupRequestForm.organizerId,
        hostelId: session.currentHostelId,
        groupName: groupRequestForm.groupName.trim(),
        bedsRequired: Math.max(1, groupRequestForm.bedsRequired),
        periodId: groupRequestForm.periodId,
        contactPhone: groupRequestForm.contactPhone.trim(),
        notes: groupRequestForm.notes.trim(),
      });
      setGroupRequestForm(emptyGroupRequest);
      toast.success("Group request created.");
    }
    await refreshData();
    setManualBooking(emptyManualBooking);
    setManualOverlayOpen(false);
  };

  const openAllocation = (groupId: string) => {
    const request = groupRequests.find((item) => item.id === groupId);
    setSelectedGroupId(groupId);
    setGroupSelection(request?.allocatedBedIds ?? []);
    setAllocationOverlayOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Individuals, groups, and wait list from one workspace."
        actions={
          <Button variant="emerald" size="sm" onClick={() => setManualOverlayOpen(true)}>
            <CalendarPlus className="h-4 w-4" />
            New booking
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="individuals">Individuals</TabsTrigger>
          <TabsTrigger value="group">Group</TabsTrigger>
          <TabsTrigger value="waitlist">Wait list</TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="space-y-4">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Individual bookings</h2>
              <p className="text-sm text-muted-foreground">Bookings awaiting payment, confirmation, or move-in.</p>
            </div>
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const resident = residents.find((item) => item.id === booking.residentId);
                  const room = database.rooms.find((item) => item.id === booking.roomId);
                  const period = database.periods.find((item) => item.id === booking.periodId);
                  return (
                    <TableRow key={booking.id} className={highlightedBookingId === booking.id ? "bg-emerald-light/30" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{resident?.name}</p>
                          <p className="text-xs text-muted-foreground">{period?.name ?? booking.durationLabel}</p>
                        </div>
                      </TableCell>
                      <TableCell>Room {room?.name}</TableCell>
                      <TableCell>{formatCurrency(booking.amount, currency)}</TableCell>
                      <TableCell><StatusBadge status={booking.status} type="booking" /></TableCell>
                      <TableCell className="text-right">
                        <ActionMenuSheet
                          title={`Booking ${booking.id}`}
                          description="Booking actions"
                          details={
                            <>
                              <p><span className="text-muted-foreground">Resident:</span> {resident?.name ?? "-"}</p>
                              <p><span className="text-muted-foreground">Created:</span> {booking.createdAt.slice(0, 10)}</p>
                            </>
                          }
                          actions={[
                            {
                              label: "Mark reserved",
                              icon: <Pencil className="h-4 w-4" />,
                              onSelect: async () => {
                                await BookingService.updateBookingStatus(booking.id, "reserved");
                                await refreshData();
                                toast.success("Booking marked reserved.");
                              },
                            },
                            {
                              label: "Confirm booking",
                              icon: <CheckCircle2 className="h-4 w-4" />,
                              onSelect: async () => {
                                await BookingService.updateBookingStatus(booking.id, "confirmed");
                                await refreshData();
                                toast.success("Booking confirmed.");
                              },
                            },
                            {
                              label: "Cancel booking",
                              onSelect: async () => {
                                await BookingService.cancelBooking(booking.id);
                                await refreshData();
                                toast.success("Booking cancelled.");
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
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Group requests</h2>
              <p className="text-sm text-muted-foreground">Allocate beds, keep requests under review, and track total value.</p>
            </div>
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Group</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupRequests.map((request) => (
                  <TableRow key={request.id} className={highlightedGroupId === request.id ? "bg-emerald-light/30" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.groupName}</p>
                        <p className="text-xs text-muted-foreground">{request.contactPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{request.bedsAllocated}/{request.bedsRequired}</TableCell>
                    <TableCell>{formatCurrency(request.amount, currency)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={request.status}
                        variant={request.status === "confirmed" ? "success" : request.status === "allocated" ? "info" : "warning"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionMenuSheet
                        title={request.groupName}
                        description="Group booking actions"
                        details={
                          <>
                            <p><span className="text-muted-foreground">Beds required:</span> {request.bedsRequired}</p>
                            <p><span className="text-muted-foreground">Organizer:</span> {request.organizerId}</p>
                          </>
                        }
                        actions={[
                          {
                            label: "Allocate beds",
                            icon: <Users className="h-4 w-4" />,
                            onSelect: () => openAllocation(request.id),
                          },
                          {
                            label: "Keep reviewing",
                            onSelect: async () => {
                              await BookingService.updateGroupRequest(request.id, { status: "reviewing" });
                              await refreshData();
                              toast.success("Request kept under review.");
                            },
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Wait list</h2>
              <p className="text-sm text-muted-foreground">Approve, reject, notify, or convert entries into bookings.</p>
            </div>
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
                {waitlistEntries.map((entry) => {
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
        </TabsContent>
      </Tabs>

      <ResponsiveOverlay
        open={manualOverlayOpen}
        onOpenChange={setManualOverlayOpen}
        title="Create booking"
        description="Create an individual booking or group request."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={bookingMode === "resident" ? "emerald" : "outline"} size="sm" onClick={() => setBookingMode("resident")}>
              Individual booking
            </Button>
            <Button variant={bookingMode === "group" ? "emerald" : "outline"} size="sm" onClick={() => setBookingMode("group")}>
              Group request
            </Button>
          </div>

          {bookingMode === "resident" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Resident</Label>
                <select
                  value={manualBooking.residentId}
                  onChange={(event) => setManualBooking({ ...manualBooking, residentId: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select resident</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>{resident.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <select
                  value={manualBooking.roomId}
                  onChange={(event) => setManualBooking({ ...manualBooking, roomId: event.target.value, bedId: "" })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>Room {room.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Bed</Label>
                <select
                  value={manualBooking.bedId}
                  onChange={(event) => setManualBooking({ ...manualBooking, bedId: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select bed</option>
                  {manualBeds.map((bed) => (
                    <option key={bed.id} value={bed.id}>{bed.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <select
                  value={manualBooking.periodId}
                  onChange={(event) => setManualBooking({ ...manualBooking, periodId: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select period</option>
                  {hostelPeriods.map((period) => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organizer</Label>
                <select
                  value={groupRequestForm.organizerId}
                  onChange={(event) => {
                    const organizer = groupOrganizers.find((item) => item.id === event.target.value);
                    setGroupRequestForm({ ...groupRequestForm, organizerId: event.target.value, contactPhone: organizer?.phone ?? groupRequestForm.contactPhone });
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select organizer</option>
                  {groupOrganizers.map((organizer) => (
                    <option key={organizer.id} value={organizer.id}>{organizer.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Group name</Label>
                <input
                  value={groupRequestForm.groupName}
                  onChange={(event) => setGroupRequestForm({ ...groupRequestForm, groupName: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Beds required</Label>
                <input
                  type="number"
                  min={1}
                  value={groupRequestForm.bedsRequired}
                  onChange={(event) => setGroupRequestForm({ ...groupRequestForm, bedsRequired: Number(event.target.value || 1) })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <select
                  value={groupRequestForm.periodId}
                  onChange={(event) => setGroupRequestForm({ ...groupRequestForm, periodId: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select period</option>
                  {hostelPeriods.map((period) => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <input
                  value={groupRequestForm.contactPhone}
                  onChange={(event) => setGroupRequestForm({ ...groupRequestForm, contactPhone: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Internal notes</Label>
                <Textarea rows={4} value={groupRequestForm.notes} onChange={(event) => setGroupRequestForm({ ...groupRequestForm, notes: event.target.value })} />
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setManualOverlayOpen(false)}>Cancel</Button>
          <Button variant="emerald" onClick={() => void createManualBooking()}>
            {bookingMode === "resident" ? "Create booking" : "Create group request"}
          </Button>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={allocationOverlayOpen}
        onOpenChange={setAllocationOverlayOpen}
        title={selectedGroup ? `Allocate beds for ${selectedGroup.groupName}` : "Allocate beds"}
        description="Reserve beds for this group request."
      >
        {selectedGroup ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Available beds</Label>
                <select
                  multiple
                  value={groupSelection}
                  onChange={(event) => setGroupSelection(Array.from(event.target.selectedOptions).map((option) => option.value))}
                  className="min-h-48 w-full rounded-md border bg-background p-3 text-sm"
                >
                  {availableBeds.map((bed) => {
                    const room = database.rooms.find((item) => item.id === bed.roomId);
                    return (
                      <option key={bed.id} value={bed.id}>
                        {bed.label} / Room {room?.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
                <div>
                  <p className="font-medium">{selectedGroup.groupName}</p>
                  <p className="text-sm text-muted-foreground">{selectedGroup.bedsRequired} beds required</p>
                </div>
                <div className="space-y-2">
                  <Label>Internal notes</Label>
                  <Textarea value={groupNotes} onChange={(event) => setGroupNotes(event.target.value)} rows={5} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await BookingService.updateGroupRequest(selectedGroup.id, { status: "reviewing", notes: groupNotes });
                  await refreshData();
                  setAllocationOverlayOpen(false);
                  toast.success("Group request updated.");
                }}
              >
                Save as reviewing
              </Button>
              <Button
                variant="emerald"
                onClick={async () => {
                  await BookingService.allocateGroupBeds(selectedGroup.id, groupSelection);
                  await BookingService.updateGroupRequest(selectedGroup.id, { notes: groupNotes });
                  await refreshData();
                  setAllocationOverlayOpen(false);
                  toast.success("Group allocation saved.");
                }}
              >
                Allocate beds
              </Button>
            </div>
          </div>
        ) : null}
      </ResponsiveOverlay>
    </div>
  );
}
